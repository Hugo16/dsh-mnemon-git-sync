// dsh-mnemon-git-sync — DSH 插件入口
//
// 负责三件事：
//   1. 注册设置命名空间 `mnemon-git-sync`（写入 settings.yaml）
//   2. 提供设置页 bridge（/api/dsh-mnemon-git-sync-settings）：读配置 / 写配置 / 查状态 / 手动同步
//   3. 按配置的间隔定时执行自动同步
//
// 真正的同步逻辑在 ./sync.js（与 git 交互，纯 Node，无 DSH 依赖）。

import { SettingsConflictError } from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'
import os from 'node:os'
import path from 'node:path'
import { inspectEnvironment, restoreRemoteSides, runSync } from './sync.js'

export const name = 'mnemon-git-sync'
export const inject = ['settings']

const NS = 'mnemon-git-sync'
const BRIDGE_PREFIX = '/api/dsh-mnemon-git-sync-settings'
const MAX_JSON_BODY_BYTES = 256 * 1024
const MAX_CONFLICT_REPORT = 200

function expandHome(input) {
  const value = String(input ?? '').trim()
  if (value === '') return ''
  if (value === '~') return os.homedir()
  if (value.startsWith('~/') || value.startsWith('~\\')) return path.join(os.homedir(), value.slice(2))
  return path.resolve(value)
}

function defaultDataDir() {
  // 保留 ~ 形式而非展开成绝对路径：这样 settings.yaml 里的默认值可跨系统复用
  // （WSL 的 /home/x/.mnemon 在 Windows 上并不存在，展开后写死会直接失效）。
  const env = process.env.MNEMON_DATA_DIR?.trim()
  return env ? expandHome(env) : '~/.mnemon'
}

function defaultWorkDir() {
  return '~/.dsh/mnemon-git-sync/repo'
}

/**
 * 判断一个路径是否"显然不属于当前平台"。
 * 典型场景：在 WSL 里配好插件（dataDir=/home/hugo/.mnemon），把配置带到 Windows 使用。
 */
function isForeignPath(value) {
  const text = String(value ?? '').trim()
  if (text === '') return false
  if (process.platform === 'win32') {
    // Windows 上不接受 POSIX 绝对路径；盘符路径与 ~/ 都算正常
    return text.startsWith('/') && !/^\/[A-Za-z]:/.test(text)
  }
  // 非 Windows 上不接受 Windows 盘符路径
  return /^[A-Za-z]:[\\/]/.test(text)
}

// 设置项。带 default 的字段在设置页可留空；路径类字段在运行时展开 ~。
const Config = z.object({
  remoteUrl: z.string().default(''),
  branch: z.string().default('main'),
  dataDir: z.string().default(defaultDataDir()),
  workDir: z.string().default(defaultWorkDir()),
  autoSync: z.boolean().default(false),
  intervalMinutes: z.number().default(10),
  syncBack: z.boolean().default(true),
  conflictStrategy: z.string().default('local'),
  commitMessage: z.string().default('chore: sync mnemon memory'),
  excludes: z.array(z.string()).default(['**/.DS_Store', '**/*.tmp', '**/*.lock']),
})

/** 把设置值规整成同步引擎需要的绝对路径配置。 */
function resolveConfig(values) {
  const raw = values ?? {}
  const interval = Number(raw.intervalMinutes)
  // 带过来的旧配置可能固化了别的平台的路径（如 WSL 的 /home/x/.mnemon），此时回退到本机默认值。
  const dataDirRaw = isForeignPath(raw.dataDir) ? '' : raw.dataDir
  const workDirRaw = isForeignPath(raw.workDir) ? '' : raw.workDir
  return {
    remoteUrl: String(raw.remoteUrl ?? '').trim(),
    branch: String(raw.branch ?? '').trim() || 'main',
    dataDir: expandHome(dataDirRaw) || expandHome(defaultDataDir()),
    workDir: expandHome(workDirRaw) || expandHome(defaultWorkDir()),
    autoSync: raw.autoSync === true,
    intervalMinutes: Number.isFinite(interval) ? Math.min(Math.max(Math.trunc(interval), 1), 1440) : 10,
    syncBack: raw.syncBack !== false,
    conflictStrategy: raw.conflictStrategy === 'remote' ? 'remote' : 'local',
    commitMessage: String(raw.commitMessage ?? '').trim() || 'chore: sync mnemon memory',
    excludes: Array.isArray(raw.excludes) ? raw.excludes.map((item) => String(item)) : [],
  }
}

export function apply(ctx, config) {
  let current = () => config ?? {}
  const logger = ctx.logger ?? console

  // 同步状态（内存态，重启重置；不写入 settings.yaml）
  const state = {
    running: false,
    lastSyncAt: null,
    lastDurationMs: null,
    lastResult: null,
    lastError: null,
    conflicts: [],
    conflictBatchId: null,
  }

  // 串行化：同一时刻只允许一次同步，避免与定时器互相踩。
  let inFlight = null

  async function performSync(trigger) {
    if (inFlight) return { started: false, reason: 'running' }
    const resolved = resolveConfig(current())
    if (resolved.remoteUrl === '') {
      state.lastError = '尚未配置 Git 仓库地址'
      state.lastResult = null
      return { started: false, reason: 'no-remote' }
    }
    state.running = true
    inFlight = (async () => {
      try {
        const report = await runSync(resolved, logger)
        state.lastSyncAt = new Date().toISOString()
        state.lastDurationMs = report.durationMs
        state.lastResult = {
          trigger,
          branch: report.branch,
          committed: report.committed,
          pushed: report.pushed,
          counts: report.counts,
          stats: report.stats,
        }
        state.conflicts = report.conflicts.slice(0, MAX_CONFLICT_REPORT)
        state.conflictBatchId = report.conflictBatchId ?? null
        state.lastError = null
        logger.info?.(
          `[${name}] sync ok (${trigger}): ${report.stats.added} added, ${report.stats.updated} updated, ` +
            `${report.stats.deleted} deleted, ${report.stats.conflictFiles} conflicts, pushed=${report.pushed}`,
        )
        return { started: true, ok: true, report }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        state.lastError = message
        state.lastSyncAt = new Date().toISOString()
        state.lastDurationMs = null
        state.lastResult = null
        logger.warn?.(`[${name}] sync failed (${trigger}): ${message}`)
        return { started: true, ok: false, error: message }
      } finally {
        state.running = false
        inFlight = null
      }
    })()
    return inFlight
  }

  // ------------------------------------------------------------ 设置注册

  ctx.inject(['settings'], (sctx) => {
    // alpha.2+ 用 SettingsProvider.installSection；rc.2 用模块级 installSettingsSection。
    if (typeof sctx.settings.installSection === 'function') {
      sctx.settings.installSection(ctx, NS, Config, config ?? {}, {
        setSource: (source) => {
          current = source
        },
        onChange: () => {
          // 间隔/开关变化后由下面的定时器自行读取，无需额外动作。
        },
      })
      return
    }
    void (async () => {
      try {
        const legacy = await import('@deepseek-ai/dsh-settings')
        if (typeof legacy.installSettingsSection !== 'function' || typeof legacy.settingsNamespace !== 'function') {
          logger.warn?.(`[${name}] dsh-settings 无可用注册 API（installSection/installSettingsSection 均缺失）`)
          return
        }
        legacy.installSettingsSection(ctx, legacy.settingsNamespace(NS), Config, config ?? {}, {
          setSource: (source) => {
            current = source
          },
          onChange: () => {},
        })
      } catch (error) {
        logger.warn?.(`[${name}] 注册设置分区失败: ${error instanceof Error ? error.message : String(error)}`)
      }
    })()
  })

  // ------------------------------------------------------------ 定时自动同步
  //
  // 用一个固定节拍（30s）的 tick 检查"距上次同步是否已超过配置间隔"，
  // 这样设置页改间隔或开关后立即生效，不需要重建定时器。

  ctx.effect(() => {
    const TICK_MS = 30_000
    let lastAutoRunAt = 0
    const timer = setInterval(() => {
      const resolved = resolveConfig(current())
      if (!resolved.autoSync) return
      if (resolved.remoteUrl === '') return
      const dueMs = resolved.intervalMinutes * 60_000
      const now = Date.now()
      if (now - lastAutoRunAt < dueMs) return
      lastAutoRunAt = now
      void performSync('auto')
    }, TICK_MS)
    if (typeof timer.unref === 'function') timer.unref()
    return () => clearInterval(timer)
  }, `${name}: auto sync timer`)

  // ------------------------------------------------------------ 设置页 bridge

  ctx.inject(['webServer', 'settings'], (sctx) => {
    const settings = sctx.settings

    const allowlisted = () =>
      settings
        .describe({ redactSecrets: true })
        .filter((descriptor) => String(descriptor.ns) === NS)
        .map((descriptor) => String(descriptor.ns))

    const toView = (descriptor) => ({
      ns: String(descriptor.ns),
      schema: descriptor.schema,
      value: descriptor.value,
      ...(descriptor.base === undefined ? {} : { base: descriptor.base }),
      ...(descriptor.user === undefined ? {} : { user: descriptor.user }),
      revision: descriptor.revision,
    })

    const handlers = {
      async describe() {
        const descriptors = settings.describe({ redactSecrets: true })
        return {
          ok: true,
          value: {
            namespaces: allowlisted()
              .map((ns) => descriptors.find((descriptor) => String(descriptor.ns) === ns))
              .filter((descriptor) => descriptor !== undefined)
              .map(toView),
            writable: settings.writable !== false,
          },
        }
      },

      async mutate(request) {
        const body = request
        if (body === null || typeof body !== 'object' || typeof body.ns !== 'string' || !Array.isArray(body.ops)) {
          return { ok: false, code: 'settings-rejected', message: 'malformed bridge settings request' }
        }
        if (!allowlisted().includes(body.ns)) {
          return { ok: false, code: 'settings-not-exposed', message: `settings namespace "${body.ns}" is not exposed` }
        }
        const expectedRevision = typeof body.expectedRevision === 'number' ? body.expectedRevision : undefined
        try {
          await settings.mutate(body.ns, body.ops, expectedRevision)
        } catch (error) {
          if (error instanceof SettingsConflictError) {
            return { ok: false, code: 'settings-conflict', message: error.message }
          }
          return { ok: false, code: 'internal', message: error instanceof Error ? error.message : String(error) }
        }
        const descriptor = settings.describe({ redactSecrets: true }).find((candidate) => String(candidate.ns) === body.ns)
        if (descriptor === undefined) {
          return { ok: false, code: 'internal', message: `settings namespace "${body.ns}" was disposed after the mutate` }
        }
        return { ok: true, value: toView(descriptor) }
      },

      async status() {
        const resolved = resolveConfig(current())
        const environment = await inspectEnvironment(resolved).catch((error) => ({
          ok: false,
          checks: [{ id: 'internal', ok: false, detail: error instanceof Error ? error.message : String(error) }],
        }))
        return {
          ok: true,
          value: {
            running: state.running,
            lastSyncAt: state.lastSyncAt,
            lastDurationMs: state.lastDurationMs,
            lastResult: state.lastResult,
            lastError: state.lastError,
            conflicts: state.conflicts,
            conflictBatchId: state.conflictBatchId,
            resolved: {
              remoteUrl: resolved.remoteUrl,
              branch: resolved.branch,
              dataDir: resolved.dataDir,
              workDir: resolved.workDir,
              autoSync: resolved.autoSync,
              intervalMinutes: resolved.intervalMinutes,
              syncBack: resolved.syncBack,
              conflictStrategy: resolved.conflictStrategy,
              excludeCount: resolved.excludes.length,
            },
            environment,
          },
        }
      },

      async sync() {
        if (state.running) return { ok: false, code: 'sync-running', message: '已有同步任务在执行' }
        const resolved = resolveConfig(current())
        if (resolved.remoteUrl === '') {
          return { ok: false, code: 'sync-no-remote', message: '请先填写 Git 仓库地址并保存' }
        }
        const outcome = await performSync('manual')
        if (!outcome.started) {
          return { ok: false, code: `sync-${outcome.reason ?? 'not-started'}`, message: '同步未开始' }
        }
        if (outcome.ok === false) {
          return { ok: false, code: 'sync-failed', message: outcome.error }
        }
        const report = outcome.report
        return {
          ok: true,
          value: {
            branch: report.branch,
            committed: report.committed,
            pushed: report.pushed,
            durationMs: report.durationMs,
            counts: report.counts,
            stats: report.stats,
            conflicts: report.conflicts.slice(0, MAX_CONFLICT_REPORT),
            conflictBatchId: report.conflictBatchId ?? null,
          },
        }
      },

      /**
       * 改判：把某批冲突里"远端那一侧"写回本地记忆目录，然后立刻再同步一次把结果推上去。
       * 单独写回是不够的——远端并没有新提交，只有再跑一次三方比较才会发现本地回退这件事。
       */
      async restore(request) {
        if (state.running) return { ok: false, code: 'sync-running', message: '已有同步任务在执行' }
        const body = request ?? {}
        const batchId = body.batchId === undefined ? state.conflictBatchId : String(body.batchId)
        if (!batchId) return { ok: false, code: 'restore-no-batch', message: '没有可改判的冲突批次' }
        const resolved = resolveConfig(current())
        if (resolved.remoteUrl === '') {
          return { ok: false, code: 'restore-no-remote', message: '请先填写 Git 仓库地址并保存' }
        }
        let restored
        try {
          restored = await restoreRemoteSides(resolved, batchId)
        } catch (error) {
          return { ok: false, code: 'restore-failed', message: error instanceof Error ? error.message : String(error) }
        }
        // 写回后立即同步，让改判结果真正生效（推送上去）
        const outcome = await performSync('restore')
        if (outcome.started === false) {
          return { ok: false, code: `sync-${outcome.reason ?? 'not-started'}`, message: '改判已写入本地，但同步未开始' }
        }
        if (outcome.ok === false) {
          return { ok: false, code: 'restore-sync-failed', message: `改判已写入本地，但同步失败: ${outcome.error}` }
        }
        return {
          ok: true,
          value: {
            batchId,
            restored: restored.restored,
            deleted: restored.deleted,
            pushed: outcome.report.pushed,
            conflicts: outcome.report.conflicts.slice(0, MAX_CONFLICT_REPORT),
          },
        }
      },
    }

    const isLoopbackRequest = (request) => {
      const address = request.socket.remoteAddress
      if (address !== '127.0.0.1' && address !== '::1' && address !== '::ffff:127.0.0.1') return false
      const host = request.headers.host
      if (typeof host !== 'string') return false
      let hostUrl
      try {
        hostUrl = new URL('http://' + host)
      } catch {
        return false
      }
      if (hostUrl.hostname !== '127.0.0.1' && hostUrl.hostname !== 'localhost' && hostUrl.hostname !== '[::1]') return false
      if (request.headers['sec-fetch-site'] === 'cross-site') return false
      const origin = request.headers.origin
      if (origin === undefined) return true
      try {
        return new URL(origin).host === hostUrl.host
      } catch {
        return false
      }
    }

    const writeJson = (res, status, body) => {
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'referrer-policy': 'no-referrer' })
      res.end(JSON.stringify(body))
    }

    const readJsonBody = async (req) => {
      const chunks = []
      let size = 0
      for await (const chunk of req) {
        size += chunk.length
        if (size > MAX_JSON_BODY_BYTES) return undefined
        chunks.push(chunk)
      }
      try {
        return JSON.parse(Buffer.concat(chunks).toString('utf8'))
      } catch {
        return undefined
      }
    }

    const guard = (req, res) => {
      if (!isLoopbackRequest(req)) {
        writeJson(res, 403, { error: 'loopback requests only' })
        return false
      }
      if (req.method !== 'POST') {
        writeJson(res, 405, { error: 'method not allowed: ' + (req.method ?? '') })
        return false
      }
      return true
    }

    const jsonRoute = (name, handler, { body = false } = {}) => ({
      kind: 'exact',
      path: `${BRIDGE_PREFIX}/${name}`,
      handler: async (req, res) => {
        if (!guard(req, res)) return
        let payload
        if (body) {
          payload = await readJsonBody(req)
          if (payload === undefined) {
            writeJson(res, 400, { ok: false, code: 'malformed-body', message: 'malformed JSON body' })
            return
          }
        }
        try {
          writeJson(res, 200, await handler(payload))
        } catch (error) {
          writeJson(res, 200, { ok: false, code: 'internal', message: error instanceof Error ? error.message : String(error) })
        }
      },
    })

    sctx.effect(() => {
      const disposers = [
        jsonRoute('describe', () => handlers.describe()),
        jsonRoute('mutate', (payload) => handlers.mutate(payload), { body: true }),
        jsonRoute('status', () => handlers.status()),
        jsonRoute('sync', () => handlers.sync()),
        jsonRoute('restore', (payload) => handlers.restore(payload), { body: true }),
      ].map((route) => sctx.webServer.register(route))
      return () => {
        for (const dispose of disposers) dispose()
      }
    }, `${name}: settings bridge`)
  })
}
