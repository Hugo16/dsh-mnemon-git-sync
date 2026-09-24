# dsh-mnemon-git-sync

把 [Mnemon](https://github.com/omdsh-dev/dsh-mnemon) 的本地记忆目录**双向同步**到指定的 Git 仓库，并在 DSH 插件设置页提供配置与手动同步按钮。

## 功能

* **双向同步**：先拉取远端、三方合并（基线/本地/远端）、再推送，最后按需把远端变更回写本地记忆目录
* **冲突可配**：同一文件两边都改过时，按设置选择「本地为准」或「远端为准」
* **自动同步**：可开关，按配置的间隔轮询（默认 10 分钟）
* **手动同步**：设置页 / 插件行配置页的「立即同步」按钮
* **隔离安全**：git 只在镜像工作副本里操作，记忆目录不会被 git 元数据污染；单次失败不破坏本地记忆文件

## 安装

```bash
pnpm dsh plugin --profile web add "https://github.com/Hugo16/dhs-mnemon-git-sync.git"
```

安装后重启 DSH。

## 使用

设置入口（保存后写入 `settings.yaml` 的 `mnemon-git-sync` 段）：

* DSH 0.1.6-alpha.2+：侧栏 **插件 → 已安装 → mnemon-git-sync → 行配置**
* DSH 0.1.5 及更早：**设置 → 插件 → 可配置 → Mnemon Git Sync**

填好 **仓库地址**，点「保存」，再点「立即同步」。开启「自动同步」后按间隔后台运行。

也可以直接手写配置：

```yaml
mnemon-git-sync:
  remoteUrl: git@github.com:you/mnemon-memory.git
  branch: main
  dataDir: ~/.mnemon
  workDir: ~/.dsh/mnemon-git-sync/repo
  autoSync: true
  intervalMinutes: 10
  syncBack: true
  conflictStrategy: local   # local | remote
  commitMessage: chore: sync mnemon memory
  excludes:
    - "**/.DS_Store"
    - "**/*.tmp"
    - "**/*.lock"
```

## 设置项

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `remoteUrl` | 空 | Git 仓库地址（HTTPS 或 SSH） |
| `branch` | `main` | 目标分支 |
| `dataDir` | `MNEMON_DATA_DIR` 或 `~/.mnemon` | Mnemon 记忆目录 |
| `workDir` | `~/.dsh/mnemon-git-sync/repo` | 镜像工作副本（git 只在这里操作） |
| `autoSync` | `false` | 自动同步开关 |
| `intervalMinutes` | `10` | 自动同步间隔（1–1440） |
| `syncBack` | `true` | 是否把远端变更写回记忆目录 |
| `conflictStrategy` | `local` | 冲突策略：`local`（本地为准）/ `remote`（远端为准） |
| `commitMessage` | `chore: sync mnemon memory` | 提交信息前缀（自动附加时间戳） |
| `excludes` | `.DS_Store` / `*.tmp` / `*.lock` | 排除的 glob 规则 |

## 同步流程

1. 在 `workDir` 里 `git init`（首次）并 `git fetch origin <branch>`
2. 读三份快照：**base** = 工作副本上次同步结果、**local** = 记忆目录、**remote** = 远端分支
3. 三方合并：本地未变取远端、远端未变取本地、两边都变则按冲突策略取一侧并记录冲突文件
4. 合并结果写入工作副本 → `git add -A` → 无变更则跳过提交 → `commit` → `push`
5. `syncBack` 开启时把合并结果回写记忆目录（内容相同的文件不重写）

推送失败时同步会报错，但不会破坏本地记忆目录。

## 界面提示

设置卡片在**折叠状态下**也会用角标显示异常（失败优先，其次冲突），不必展开即可看到。

以下情况会弹窗：

* **手动点「立即同步」**：同步结束弹结果窗（成功含统计与耗时，失败含原因）。**失败窗带「重试」按钮**，修好凭据或远端后可直接重跑，不用关窗口再点一次同步。自动同步只在卡片内提示，不弹窗打扰。
* **发现冲突**：列出冲突文件、当前生效的冲突策略，并说明本地记忆目录未被修改。同一批冲突只弹一次。每一项会附上 `基准/本地/远端` 三个 blob 的短哈希（各 7 位），方便回 git 里定位版本。
* **危险设置**：保存前二次确认 —— 更换 `dataDir`、关闭 `syncBack`、把冲突策略改为 `remote`。

## 冲突改判

冲突是按策略自动选一侧的，选错会静默覆盖。为此插件做了两件事：

1. **留档**：每次同步若产生冲突，两侧的原始字节会存进镜像副本的 `.git/mnemon-git-sync-conflicts/<批次>/`（含 `manifest.json`）。存在 `.git` 下，不进提交、不污染记忆目录；只保留最近 10 批，自动清理更早的。
2. **改判**：冲突弹窗上的**「改用远端那一份并同步」**会把这批冲突的远端内容写回记忆目录，并立刻再同步一次把它推上去。远端删除的那一侧也会相应删掉本地文件。

  注意远端此刻并没有新提交，所以**光写回是不够的**——只有再跑一次三方比较（base=本地旧内容、local=远端内容、remote=远端内容）才会把「本地向远端看齐」这个变化推上去。

改判之后如果又出现新冲突，说明确实存在需要人工定夺的内容，此时应以 git 仓库的历史为准。

## 热插拔

插件支持**免重启**安装与卸载。`cordis.patch.yml` 只含纯 insert 行，因此可走 DSH 插件市场的热挂载（`hotMount`）；
在「插件」页安装/卸载或启停后立即生效，无需重启 DSH。

注意「免重启」指的是**挂载与卸载**：改动插件源码后重新安装，运行中的进程仍可能命中 Node 的 ESM 模块缓存而继续跑旧代码（实测：卸载后路由立即 401、恢复后立即 200，但旧模块实例未换）。要加载新代码，重启 `dsh web` 即可。

## 跨系统使用（WSL ↔ Windows）

记忆目录与镜像副本的默认值都写成 `~/...` 形式，**不固化绝对路径**，因此同一份配置在两边都能用。

* 在 WSL 里配好、再到 Windows 上使用：插件检测到 `dataDir` 是 POSIX 绝对路径（`/home/...`）时会自动回退到本机默认值 `C:\Users\<你>\.mnemon`；反向亦然。也可以直接把路径框**留空**，效果相同。
* **先确认路径框下方「环境检查」里记忆目录是有效的**，再点同步。路径指向不存在的目录时同步会直接中止，不会动远端。
* `core.autocrlf` 已在镜像副本里强制关闭，并写入 `.git/info/attributes` 的 `* -text`，保证 git 存的就是记忆文件的原始字节。否则 Windows 上的 CRLF 归一化会让插件把「本地没改」误判成「本地改了」，造成假冲突并静默丢弃远端更新。

## 安全保护

* **记忆目录不存在 → 中止同步**：`readLocalTree` 对不存在的目录返回空树，若继续执行会被三方合并理解为「本地删光了所有文件」，进而推送一个清空远端的提交。换系统后路径失效正是这种情形，故在此硬失败并提示检查路径。
* **推送失败 → 不推进基线、不回写记忆目录**：否则下一轮会把本地未上传的改动误判成「远端已删除」而回滚。
* 镜像工作副本只删除「合并结果里不该存在的文件」并按需清理空目录；**副本本身永不删除**（它是下次同步的基线 `refs/mnemon-git-sync/base`）。

## 已知限制

* `mnemon.db` 是 SQLite 二进制文件，按字节同步；**两端同时写入**会形成冲突，由冲突策略决定保留哪一份
* 无远端时的首次同步会创建分支并推送初始提交
* HTTPS 私有仓库需要本机 git 凭据助手已配置可用的凭据

## 许可证

MIT
