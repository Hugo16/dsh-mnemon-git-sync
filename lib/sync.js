// dsh-mnemon-git-sync — 双向同步引擎
//
// 数据模型：三方比较
//   base   = 镜像工作副本的上次同步结果（git HEAD 树，即"上次同步基线"）
//   local  = 本地 Mnemon 记忆目录
//   remote = 远端分支
// 逐路径判定：本地/远端谁变了取谁；两边都变且不同 → 冲突，按策略取一侧。
// 合并结果先落到镜像工作副本并 push，再按需回写本地记忆目录。
//
// 镜像工作副本与源目录物理隔离：git 只在 workDir 里操作，记忆目录不会被 git 元数据污染。

import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

const MAX_BUFFER = 512 * 1024 * 1024
const SKIP_DIRS = new Set(['.git'])
// 上次同步结果的基线 ref：与 HEAD 分开保存，因为 HEAD 每次都要对齐远端才能 fast-forward 推送。
const BASE_REF = 'refs/mnemon-git-sync/base'

// ---------------------------------------------------------------- git 低层

function run(cwd, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      'git',
      args,
      {
        cwd,
        maxBuffer: MAX_BUFFER,
        encoding: 'buffer',
        // 强制英文输出：错误分支判断不依赖系统 locale
        env: { ...process.env, LC_ALL: 'C', LANG: 'C', GIT_TERMINAL_PROMPT: '0' },
        ...options,
      },
      (error, stdout, stderr) => {
        if (error) {
          const detail = Buffer.isBuffer(stderr) ? stderr.toString('utf8').trim() : String(stderr ?? '')
          const wrapped = new Error(`git ${args.join(' ')} failed: ${detail || error.message}`)
          wrapped.code = error.code
          wrapped.stderr = detail
          reject(wrapped)
          return
        }
        resolve(stdout)
      },
    )
  })
}

async function git(cwd, args, options) {
  return (await run(cwd, args, options)).toString('utf8')
}

export function gitBlobHash(content) {
  return createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex')
}

// ------------------------------------------------------- 目录 / 树快照读取

function expandBraces(pattern) {
  const match = pattern.match(/\{([^{}]*)\}/)
  if (!match) return [pattern]
  return match[1]
    .split(',')
    .flatMap((part) => expandBraces(pattern.slice(0, match.index) + part + pattern.slice(match.index + match[0].length)))
}

/** 把 glob 转成正则；支持 ** / * / ? / {a,b}，用于 excludes 匹配。 */
export function globToRegExp(glob) {
  let source = ''
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i]
    if (char === '*') {
      const isDouble = glob[i + 1] === '*'
      if (isDouble) {
        const hasSlash = glob[i + 2] === '/'
        source += hasSlash ? '(?:.*/)?' : '.*'
        i += hasSlash ? 2 : 1
      } else {
        source += '[^/]*'
      }
      continue
    }
    if (char === '?') {
      source += '[^/]'
      continue
    }
    source += char.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${source}$`)
}

export function makeMatcher(patterns) {
  const regexps = (patterns ?? []).flatMap((pattern) => expandBraces(String(pattern))).map(globToRegExp)
  if (regexps.length === 0) return () => false
  return (relativePath) => regexps.some((regexp) => regexp.test(relativePath))
}

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/')
}

/** 读取本地目录为 { path -> { hash, content } }，跳过 .git 与 excludes。 */
export async function readLocalTree(root, isExcluded = () => false) {
  const files = new Map()

  async function walk(directory, relative) {
    let entries
    try {
      entries = await fs.readdir(directory, { withFileTypes: true })
    } catch (error) {
      if (error.code === 'ENOENT') return
      throw error
    }
    for (const entry of entries) {
      const childRelative = relative === '' ? entry.name : `${relative}/${entry.name}`
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue
        if (isExcluded(childRelative)) continue
        await walk(path.join(directory, entry.name), childRelative)
        continue
      }
      if (!entry.isFile()) continue // 符号链接/设备文件一律跳过
      if (isExcluded(childRelative)) continue
      const content = await fs.readFile(path.join(directory, entry.name))
      files.set(childRelative, { hash: gitBlobHash(content), content })
    }
  }

  await walk(root, '')
  return files
}

/** 只列出目录下的文件相对路径（不读内容），用于清理工作副本。 */
async function listRelativeFiles(root, isExcluded = () => false) {
  const paths = []
  async function walk(directory, relative) {
    const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => [])
    for (const entry of entries) {
      const childRelative = relative === '' ? entry.name : `${relative}/${entry.name}`
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || isExcluded(childRelative)) continue
        await walk(path.join(directory, entry.name), childRelative)
        continue
      }
      if (entry.isFile()) paths.push(childRelative)
    }
  }
  await walk(root, '')
  return paths
}

function parseLsTree(buffer) {
  // git ls-tree -r -z <rev> → "<mode> <type> <hash>\t<path>\0"
  const files = new Map()
  for (const record of buffer.toString('utf8').split('\0')) {
    if (record === '') continue
    const tab = record.indexOf('\t')
    if (tab === -1) continue
    const [mode, type, hash] = record.slice(0, tab).split(' ')
    if (type !== 'blob') continue
    files.set(toPosix(record.slice(tab + 1)), { mode, hash })
  }
  return files
}

async function revExists(cwd, rev) {
  try {
    await run(cwd, ['rev-parse', '--verify', '--quiet', `${rev}^{commit}`])
    return true
  } catch {
    return false
  }
}

async function readGitTree(cwd, rev) {
  if (!(await revExists(cwd, rev))) return null
  const entries = parseLsTree(await run(cwd, ['ls-tree', '-r', '-z', rev]))
  const files = new Map()
  for (const [filePath, entry] of entries) {
    const content = await run(cwd, ['cat-file', 'blob', entry.hash])
    files.set(filePath, { hash: entry.hash, content })
  }
  return files
}

// ------------------------------------------------------------ 三方合并

/**
 * 纯函数：三方合并。
 * @returns {{ merged: Map<string, {hash, content}>, conflicts: object[], stats: object }}
 */
export function planMerge({ base, local, remote }, conflictStrategy = 'local') {
  const paths = new Set([...base.keys(), ...local.keys(), ...remote.keys()])
  const merged = new Map(base)
  const conflicts = []
  const stats = { added: 0, updated: 0, deleted: 0, fromRemote: 0, fromLocal: 0, conflictFiles: 0 }

  const applyWinner = (target, next, previous) => {
    if (next === undefined) {
      if (previous !== undefined) stats.deleted += 1
      merged.delete(target)
      return
    }
    if (previous === undefined) stats.added += 1
    else if (previous.hash !== next.hash) stats.updated += 1
    merged.set(target, next)
  }

  for (const filePath of [...paths].sort()) {
    const b = base.get(filePath)
    const l = local.get(filePath)
    const r = remote.get(filePath)
    const bHash = b?.hash ?? null
    const lHash = l?.hash ?? null
    const rHash = r?.hash ?? null

    // 一致（含双方都删除）→ 取本地视图即可
    if (lHash === rHash) {
      applyWinner(filePath, l, b)
      continue
    }

    let winner
    let origin
    if (lHash === bHash) {
      winner = r
      origin = 'remote' // 本地未变、远端变化
    } else if (rHash === bHash) {
      winner = l
      origin = 'local' // 远端未变、本地变化
    } else {
      // 两边都相对基线变化且不相同 → 冲突，按策略取一侧
      const strategyRemote = conflictStrategy === 'remote'
      winner = strategyRemote ? r : l
      origin = strategyRemote ? 'remote' : 'local'
      conflicts.push({
        path: filePath,
        resolution: origin,
        localHash: lHash,
        remoteHash: rHash,
        baseHash: bHash,
      })
      stats.conflictFiles += 1
    }

    if (origin === 'remote') stats.fromRemote += 1
    else stats.fromLocal += 1
    applyWinner(filePath, winner, b)
  }

  return { merged, conflicts, stats }
}

// ------------------------------------------------------------ 工作副本同步

async function ensureWorkRepo(workDir, remoteUrl, branch) {
  await fs.mkdir(workDir, { recursive: true })
  if (!(await revExists(workDir, 'HEAD'))) {
    try {
      await run(workDir, ['init', '-b', branch])
    } catch {
      await run(workDir, ['init']) // 老版本 git 无 -b
      await run(workDir, ['symbolic-ref', 'HEAD', `refs/heads/${branch}`])
    }
  }
  const existing = await git(workDir, ['remote']).catch(() => '')
  if (existing.split('\n').map((line) => line.trim()).includes('origin')) {
    await run(workDir, ['remote', 'set-url', 'origin', remoteUrl])
  } else {
    await run(workDir, ['remote', 'add', 'origin', remoteUrl])
  }
  await pinByteFidelity(workDir)
}

/**
 * 关掉一切换行符转换，保证 git 存储的就是引擎比对的原始字节。
 *
 * Windows 上 `git init` 会继承全局 core.autocrlf=true，此时 git 在 add 时把 CRLF 归一化成 LF，
 * 而引擎的 gitBlobHash 是按原始字节算的：base 永远存 LF、本地永远是 CRLF，于是每轮都判定
 * "本地改了"，远端一有更新就变成假冲突、按策略静默覆盖掉远端更新。
 * core.autocrlf 只管 git 自身的转换；仓库里若带 .gitattributes 的 text 属性仍会转换，
 * 所以再用 .git/info/attributes 的 `* -text`（优先级高于工作区 .gitattributes）兜底。
 */
async function pinByteFidelity(workDir) {
  await run(workDir, ['config', 'core.autocrlf', 'false'])
  await run(workDir, ['config', 'core.eol', 'lf'])
  // .git/info/attributes 只影响这个镜像副本，不会进提交、不会污染记忆目录
  await fs.mkdir(path.join(workDir, '.git', 'info'), { recursive: true })
  await fs.writeFile(path.join(workDir, '.git', 'info', 'attributes'), '* -text\n')
}

async function fetchRemote(workDir, branch) {
  try {
    await run(workDir, ['fetch', 'origin', branch])
  } catch (error) {
    // 远端为空仓库或分支尚不存在 → 视为"无远端内容"
    const detail = String(error.stderr ?? error.message)
    if (/couldn't find remote ref|no such ref|could not find remote ref/i.test(detail)) return
    // 首次推送前远端为空仓库：允许继续（后续 push 会创建分支）
    if (/couldn't find remote ref HEAD/i.test(detail)) return
    throw error
  }
}

/** 用合并结果的完整文件集重建工作副本（多余文件删除、内容不同的文件重写）。 */
async function applyToWorkTree(workDir, merged, isExcluded) {
  const existing = await listRelativeFiles(workDir, isExcluded)
  const wanted = new Set(merged.keys())
  for (const filePath of existing) {
    if (!wanted.has(filePath)) await fs.rm(path.join(workDir, filePath), { force: true })
  }
  for (const [filePath, entry] of merged) {
    const target = path.join(workDir, filePath)
    const current = await fs.readFile(target).catch(() => null)
    if (current !== null && current.equals(entry.content)) continue
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, entry.content)
  }
  await pruneEmptyDirs(workDir)
}

async function pruneEmptyDirs(root) {
  async function walk(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => [])
    let kept = 0
    for (const entry of entries) {
      if (entry.name === '.git') {
        kept += 1
        continue
      }
      const full = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        const remaining = await walk(full)
        if (remaining === 0) await fs.rm(full, { recursive: true, force: true })
        else kept += 1
      } else {
        kept += 1
      }
    }
    return kept
  }
  await walk(root)
}

/**
 * 对齐工作副本：让 HEAD 落在远端分支上，之后的新提交才能 fast-forward 推送。
 * 远端不存在时不动作（首次推送会创建分支）。
 */
async function alignHeadToRemote(workDir, branch) {
  if (!(await revExists(workDir, `origin/${branch}`))) return
  await run(workDir, ['reset', '--hard', `origin/${branch}`])
}

async function commitAndPush(workDir, remoteUrl, branch, message) {
  await run(workDir, ['add', '-A'])
  const status = await git(workDir, ['status', '--porcelain'])
  let committed = false
  if (status.trim() !== '') {
    await run(workDir, ['-c', 'user.name=dsh-mnemon-git-sync', '-c', 'user.email=mnemon-git-sync@localhost', 'commit', '-m', message])
    committed = true
  }
  if (!(await revExists(workDir, 'HEAD'))) return { committed, pushed: false, pushSkipped: 'empty' }
  try {
    await git(workDir, ['push', 'origin', `HEAD:refs/heads/${branch}`])
    return { committed, pushed: true }
  } catch (error) {
    return { committed, pushed: false, pushError: String(error.stderr ?? error.message) }
  }
}

// ------------------------------------------------------------ 冲突留档 / 改判

const CONFLICT_ROOT = '.git/mnemon-git-sync-conflicts'
const CONFLICT_KEEP = 10

function conflictBatchDir(workDir, batchId) {
  return path.join(workDir, CONFLICT_ROOT, batchId)
}

/**
 * 把冲突两侧的原始字节留档。
 *
 * 动机：冲突是按策略自动选一侧的，选错就会静默覆盖，且没有撤销入口。
 * 留档后用户可以事后改判（restoreRemoteSides），把远端那一份写回本地。
 * 存在 .git 下，既不会进提交、也不会污染记忆目录，也不会跟着工作区清理被删。
 */
async function archiveConflicts(workDir, batchId, conflicts, local, remote) {
  if (conflicts.length === 0) return null
  const dir = conflictBatchDir(workDir, batchId)
  await fs.mkdir(dir, { recursive: true })
  const manifest = { batchId, at: new Date().toISOString(), conflicts: [] }
  for (const [index, conflict] of conflicts.entries()) {
    const entry = { ...conflict, localSaved: false, remoteSaved: false }
    const side = local.get(conflict.path)
    if (side !== undefined) {
      await fs.writeFile(path.join(dir, `${index}.local`), side.content)
      entry.localSaved = true
    }
    const other = remote.get(conflict.path)
    if (other !== undefined) {
      await fs.writeFile(path.join(dir, `${index}.remote`), other.content)
      entry.remoteSaved = true
    }
    manifest.conflicts.push(entry)
  }
  await fs.writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest))
  // 只保留最近若干批，避免留档无限增长
  const entries = await fs.readdir(path.join(workDir, CONFLICT_ROOT), { withFileTypes: true }).catch(() => [])
  const batches = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
  for (const name of batches.slice(0, Math.max(0, batches.length - CONFLICT_KEEP))) {
    await fs.rm(path.join(workDir, CONFLICT_ROOT, name), { recursive: true, force: true })
  }
  return manifest
}

/**
 * 改判：把某批冲突中「远端那一侧」的内容写回本地记忆目录。
 *
 * 单独写回还不算完——必须再跑一次同步才会推上去。因为此时远端并没有新提交，
 * 只靠三方比较是发现不了"本地被改回远端样式"这件事的；而写回后 base=本地旧内容、
 * local=远端内容、remote=远端内容，三方比较会正确地把本地变化推上去。
 */
export async function restoreRemoteSides(rawConfig, batchId) {
  const config = normalizeConfig(rawConfig)
  if (!batchId) throw new Error('缺少冲突批次标识')
  const dir = conflictBatchDir(config.workDir, batchId)
  let manifest
  try {
    manifest = JSON.parse(await fs.readFile(path.join(dir, 'manifest.json'), 'utf8'))
  } catch {
    throw new Error('找不到该批冲突的存档，可能已被自动清理（仅保留最近若干批）')
  }
  const restored = []
  const deleted = []
  for (const [index, conflict] of manifest.conflicts.entries()) {
    const target = path.join(config.dataDir, conflict.path)
    if (conflict.remoteSaved === true) {
      const content = await fs.readFile(path.join(dir, `${index}.remote`))
      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.writeFile(target, content)
      restored.push(conflict.path)
    } else {
      // 远端本来就没有这个文件（远端删除赢了）→ 本地也删掉
      await fs.rm(target, { force: true })
      deleted.push(conflict.path)
    }
  }
  if (config.syncBack) await pruneEmptyDirs(config.dataDir)
  return { batchId, restored, deleted }
}

// ------------------------------------------------------------------ 入口

export function normalizeConfig(raw) {
  const config = raw ?? {}
  const interval = Number(config.intervalMinutes)
  const strategy = config.conflictStrategy === 'remote' ? 'remote' : 'local'
  return {
    remoteUrl: String(config.remoteUrl ?? '').trim(),
    branch: String(config.branch ?? '').trim() || 'main',
    dataDir: String(config.dataDir ?? '').trim(),
    workDir: String(config.workDir ?? '').trim(),
    autoSync: config.autoSync === true,
    intervalMinutes: Number.isFinite(interval) ? Math.min(Math.max(Math.trunc(interval), 1), 24 * 60) : 10,
    syncBack: config.syncBack !== false,
    conflictStrategy: strategy,
    commitMessage: String(config.commitMessage ?? '').trim() || 'chore: sync mnemon memory',
    excludes: Array.isArray(config.excludes) ? config.excludes.map((item) => String(item)) : [],
  }
}

/**
 * 执行一次完整同步。任何阶段失败都抛错，且不破坏本地记忆目录。
 * @returns 同步报告（写入/删除/冲突/push 结果）
 */
export async function runSync(rawConfig, logger = console) {
  const config = normalizeConfig(rawConfig)
  if (config.remoteUrl === '') throw new Error('尚未配置 Git 仓库地址')
  if (config.dataDir === '') throw new Error('尚未配置 Mnemon 记忆目录')

  const { remoteUrl, branch, dataDir, workDir } = config
  const startedAt = Date.now()
  const log = (message) => logger?.info?.(`[mnemon-git-sync] ${message}`)

  const isExcluded = makeMatcher(config.excludes)

  // 记忆目录不存在时绝不能继续：readLocalTree 对 ENOENT 返回空树，会被三方合并理解为
  // "本地把这些文件都删了"，进而提交并推送一个清空远端的 commit。跨系统换机（WSL 的
  // /home/... 路径在 Windows 上不存在）极易触发，故在此硬失败。
  const dataStat = await fs.stat(dataDir).catch(() => null)
  if (dataStat === null) {
    throw new Error(`Mnemon 记忆目录不存在: ${dataDir}。请检查路径是否正确（换系统后 ~ 与实际盘符可能不同）。已中止同步以防误删远端内容。`)
  }
  if (!dataStat.isDirectory()) {
    throw new Error(`Mnemon 记忆目录不是目录: ${dataDir}。已中止同步。`)
  }

  await ensureWorkRepo(workDir, remoteUrl, branch)
  await fetchRemote(workDir, branch)

  const base = (await readGitTree(workDir, BASE_REF)) ?? new Map()
  const remote = (await readGitTree(workDir, `origin/${branch}`)) ?? new Map()
  const local = await readLocalTree(dataDir, isExcluded)

  log(`base=${base.size} remote=${remote.size} local=${local.size} files`)

  const { merged, conflicts, stats } = planMerge({ base, local, remote }, config.conflictStrategy)

  // 先把 HEAD 对齐远端（新提交才能 fast-forward 推送），再落盘合并结果。
  await alignHeadToRemote(workDir, branch)
  await applyToWorkTree(workDir, merged, makeMatcher(config.excludes))

  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const result = await commitAndPush(workDir, remoteUrl, branch, `${config.commitMessage} (${stamp})`)

  // 推送失败必须在推进基线与回写本地之前中止：否则基线会指向一个没到远端的提交，
  // 下一轮会把本地未上传的改动误判为"远端已删除"而回滚。
  if (result.pushError) {
    throw new Error(
      `推送失败: ${result.pushError}。本地改动与记忆目录均已保留，可修正凭据或远端后重试。`,
    )
  }

  // 冲突留档：把两侧原始字节存到 .git 下，供事后改判（不会进提交，也不污染记忆目录）
  const batchId = await archiveConflicts(workDir, `${Date.now()}`, conflicts, local, remote)
  if (batchId !== null) log(`archived ${conflicts.length} conflicts as ${batchId.batchId}`)

  // 记录本次同步结果作为下次的基线（无论是否产生新提交，都要指向当前 HEAD）。
  if (await revExists(workDir, 'HEAD')) {
    await run(workDir, ['update-ref', BASE_REF, 'HEAD'])
  }

  // 回写：把合并结果落到本地记忆目录（内容一致的文件不会重复写）
  let writtenBack = 0
  let deletedBack = 0
  if (config.syncBack) {
    for (const [filePath, entry] of merged) {
      const target = path.join(dataDir, filePath)
      const current = await fs.readFile(target).catch(() => null)
      if (current !== null && current.equals(entry.content)) continue
      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.writeFile(target, entry.content)
      writtenBack += 1
    }
    const localPaths = await listRelativeFiles(dataDir, isExcluded)
    for (const filePath of localPaths) {
      if (merged.has(filePath)) continue
      await fs.rm(path.join(dataDir, filePath), { force: true })
      deletedBack += 1
    }
    await pruneEmptyDirs(dataDir)
  }

  return {
    ok: true,
    durationMs: Date.now() - startedAt,
    branch,
    committed: result.committed,
    pushed: result.pushed,
    counts: {
      base: base.size,
      remote: remote.size,
      local: local.size,
      merged: merged.size,
      writtenBack,
      deletedBack,
    },
    stats,
    conflicts,
    conflictBatchId: batchId === null ? null : batchId.batchId,
  }
}

/** 只读状态探测：仓库与 fs 是否就绪，不产生任何写入。 */
export async function inspectEnvironment(config) {
  const normalized = normalizeConfig(config)
  const checks = []
  try {
    const version = await git(process.cwd(), ['--version'])
    checks.push({ id: 'git', ok: true, detail: version.trim() })
  } catch (error) {
    checks.push({ id: 'git', ok: false, detail: String(error.message) })
  }
  try {
    const stat = await fs.stat(normalized.dataDir)
    checks.push({ id: 'dataDir', ok: stat.isDirectory(), detail: normalized.dataDir })
  } catch {
    checks.push({ id: 'dataDir', ok: false, detail: `目录不存在: ${normalized.dataDir}` })
  }
  checks.push({ id: 'remoteUrl', ok: normalized.remoteUrl !== '', detail: normalized.remoteUrl || '未配置' })
  return { checks, ok: checks.every((check) => check.ok) }
}
