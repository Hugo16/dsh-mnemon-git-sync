window.__ModuleLoader__.load({
  id: "dsh-mnemon-git-sync",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    let react = require("react");
    let react_jsx_runtime = require("react/jsx-runtime");

    //#region css
    const css = [
      ".dsmgs-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:8px;min-width:0;list-style:none;transition:border-color .16s,background .16s;overflow:hidden;margin-bottom:8px}",
      ".dsmgs-cardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}",
      ".dsmgs-header{width:100%;color:inherit;cursor:pointer;text-align:left;font:inherit;background:0 0;border:0;align-items:center;gap:8px;padding:10px 14px;display:flex}",
      ".dsmgs-header:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}",
      ".dsmgs-pageMode>.dsmgs-header{cursor:default}",
      ".dsmgs-pageMode>.dsmgs-header:hover{background:0 0}",
      ".dsmgs-pageMode .dsmgs-chevron{display:none}",
      ".dsmgs-headText{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex;overflow:hidden}",
      ".dsmgs-name{color:var(--dsw-alias-label-primary);white-space:nowrap;text-overflow:ellipsis;font-weight:600;overflow:hidden}",
      ".dsmgs-description{color:var(--dsw-alias-label-tertiary);white-space:nowrap;text-overflow:ellipsis;font-size:12px;overflow:hidden}",
      ".dsmgs-pending{color:var(--dsw-alias-state-warn-primary);white-space:nowrap;flex:none;font-size:12px}",
      ".dsmgs-chevron{color:var(--dsw-alias-label-tertiary);flex:none;font-size:13px;transition:transform .12s}",
      ".dsmgs-chevronOpen{transform:rotate(180deg)}",
      ".dsmgs-body{flex-direction:column;gap:14px;padding:0 14px 14px;display:flex}",
      ".dsmgs-field{flex-direction:column;gap:4px;min-width:0;display:flex}",
      ".dsmgs-row{display:flex;gap:10px;flex-wrap:wrap}",
      ".dsmgs-row>.dsmgs-field{flex:1 1 180px}",
      ".dsmgs-label{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500}",
      ".dsmgs-input,.dsmgs-select{border:1px solid var(--dsw-alias-border-l2);font:inherit;color:var(--dsw-alias-label-primary);background:var(--dsw-specific-input-major);border-radius:6px;padding:6px 8px;font-size:13px;transition:border-color .13s,box-shadow .13s;width:100%;box-sizing:border-box}",
      ".dsmgs-input:hover:not(:disabled),.dsmgs-select:hover:not(:disabled){border-color:var(--dsw-alias-label-dimmed)}",
      ".dsmgs-select{color-scheme:light dark}",
      ".dsmgs-select option{background-color:#ffffff;color:#1f2328}",
      "@media (prefers-color-scheme:dark){.dsmgs-select{color-scheme:dark}.dsmgs-select option{background-color:#1e1f24;color:#e8e8ea}}",
      ".dsmgs-hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5;margin:0}",
      ".dsmgs-check{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--dsw-alias-label-primary)}",
      ".dsmgs-check input{width:15px;height:15px;accent-color:var(--dsw-alias-brand-primary)}",
      ".dsmgs-footer{justify-content:space-between;align-items:center;gap:8px;display:flex;flex-wrap:wrap}",
      ".dsmgs-footerRight{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
      ".dsmgs-btn{border:1px solid var(--dsw-alias-border-l2);font:inherit;cursor:pointer;color:var(--dsw-alias-label-primary);background:var(--dsw-specific-input-major);border-radius:6px;padding:6px 12px;font-size:13px;transition:border-color .13s,background .13s}",
      ".dsmgs-btn:hover:not(:disabled){border-color:var(--dsw-alias-label-dimmed)}",
      ".dsmgs-btn:disabled{cursor:not-allowed;opacity:.55}",
      ".dsmgs-btnPrimary{border-color:transparent;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-inverse,#fff)}",
      ".dsmgs-status{border:1px solid var(--dsw-alias-border-l2);border-radius:6px;padding:8px 10px;display:flex;flex-direction:column;gap:6px;font-size:12px;line-height:1.6}",
      ".dsmgs-statusRow{display:flex;gap:6px;align-items:baseline;flex-wrap:wrap}",
      ".dsmgs-statusKey{color:var(--dsw-alias-label-tertiary);flex:none}",
      ".dsmgs-ok{color:#7ddb9c}",
      ".dsmgs-err{color:var(--dsw-alias-state-error-primary)}",
      ".dsmgs-warn{color:var(--dsw-alias-state-warn-primary)}",
      ".dsmgs-conflicts{margin:0;padding-left:18px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.6;max-height:140px;overflow:auto}",
      ".dsmgs-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;word-break:break-all}",
      ".dsmgs-badge{border-radius:9px;padding:1px 7px;font-size:11px;font-weight:600;flex:none;color:#fff;background:var(--dsw-alias-state-error-primary,#e5484d)}",
      ".dsmgs-badgeWarn{background:var(--dsw-alias-state-warn-primary,#d97706)}",
      ".dsmgs-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:24px}",
      ".dsmgs-modal{background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.3);width:100%;max-width:540px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden}",
      ".dsmgs-modalHead{padding:13px 16px;font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary);border-bottom:1px solid var(--dsw-alias-border-l2);display:flex;align-items:center;gap:8px}",
      ".dsmgs-modalBody{padding:14px 16px;font-size:13px;line-height:1.7;color:var(--dsw-alias-label-secondary);overflow:auto;display:flex;flex-direction:column;gap:8px}",
      ".dsmgs-modalBody p{margin:0}",
      ".dsmgs-modalList{margin:0;padding-left:18px;max-height:30vh;overflow:auto;font-size:12px;line-height:1.7}",
      ".dsmgs-modalFoot{padding:11px 16px;display:flex;justify-content:flex-end;gap:8px;border-top:1px solid var(--dsw-alias-border-l2)}",
      ".dsmgs-modalRange{padding-left:20px;margin:0;font-size:12px;line-height:1.7}",
      ".dsmgs-hash{display:block;color:var(--dsw-alias-text-l3);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;opacity:.75}",
    ];
    const styleId = "dsh-mnemon-git-sync-style";
    if (!document.getElementById(styleId)) {
      const tag = document.createElement("style");
      tag.id = styleId;
      tag.textContent = css.join("\n");
      document.head.appendChild(tag);
    }
    //#endregion

    const BRIDGE_PREFIX = "/api/dsh-mnemon-git-sync-settings";
    const NS = "mnemon-git-sync";
    const SLOT_KEY = "dsh-mnemon-git-sync#mnemon-git-sync";

    const T = {
      title: "Mnemon Git Sync",
      description: "把 Mnemon 记忆目录双向同步到 Git 仓库",
      sectionRemote: "Git 仓库",
      remoteUrl: "仓库地址",
      remoteUrlPh: "git@github.com:you/mnemon-memory.git 或 https://...",
      branch: "分支",
      paths: "路径",
      dataDir: "Mnemon 记忆目录",
      dataDirHint: "默认 ~/.mnemon（跟随 MNEMON_DATA_DIR）。留空用本机默认值；换系统后建议留空，插件会自动改用本机家目录。",
      workDir: "镜像工作副本",
      workDirHint: "git 只在镜像副本里操作，不会污染记忆目录。副本不会被删除（它是下次同步的基线）。留空用 ~/.dsh/mnemon-git-sync/repo。",
      behavior: "同步行为",
      autoSync: "开启自动同步",
      interval: "同步间隔（分钟）",
      syncBack: "把远端变更写回记忆目录",
      syncBackHint: "关闭则只上传本地到远端，不修改本地记忆文件。",
      conflict: "冲突处理",
      conflictLocal: "本地为准（保留本地，覆盖远端）",
      conflictRemote: "远端为准（用远端覆盖本地）",
      conflictHint: "仅当同一文件本地与远端都改过且内容不同时生效。",
      commitMessage: "提交信息前缀",
      excludes: "排除规则（每行一个 glob）",
      excludesHint: "默认排除 .DS_Store、*.tmp、*.lock。",
      lastSync: "上次同步",
      never: "尚未同步",
      running: "同步中…",
      lastResult: "上次结果",
      lastError: "上次错误",
      conflictsFound: "冲突文件",
      env: "环境检查",
      syncNow: "立即同步",
      syncing: "同步中…",
      save: "保存",
      saving: "保存中…",
      saved: "已保存",
      discard: "撤销",
      unsaved: "未保存",
      saveFailed: "保存失败",
      syncFailed: "同步失败",
      syncOk: (v) =>
        `完成：新增 ${v.stats.added} · 更新 ${v.stats.updated} · 删除 ${v.stats.deleted}` +
        `${v.committed ? " · 已提交" : " · 无变更"}${v.pushed ? " · 已推送" : " · 未推送"}`,
      unavailable: "设置不可用 —— bridge 未暴露。",
      duration: "耗时",
      readOnly: "当前设置不可写。",
      close: "关闭",
      cancel: "取消",
      goOn: "继续保存",
      retry: "重试",
      useRemote: "改用远端那一份并同步",
      restoring: "正在写回…",
      restoreDoneTitle: "改判完成",
      restoreIntro: (n) => `已把 ${n} 个冲突文件改为「远端那一份」并重新同步：`,
      restoreDeleted: (n) => `其中 ${n} 个文件按远端删除。`,
      restoreFailedTitle: "改判失败",
      restoreUnavailable: "该批冲突的存档已不在（仅保留最近若干批），无法改判。",
      modalOkTitle: "同步完成",
      modalErrTitle: "同步失败",
      modalConflictTitle: "发现冲突",
      modalConfirmTitle: "确认修改",
      conflictIntro: (n) => `本次同步有 ${n} 个文件在本地与远端都改过，已按下面策略处理：`,
      conflictPolicy: (p) => `当前冲突策略：${p}`,
      conflictSafe: "冲突在镜像工作副本中解决完成，本地记忆目录未受影响。",
      conflictOverwrote: "被覆盖的那一份已留档，可以点下方按钮改判。",
      conflictNoArchive: "该批冲突未留档（冲突已随同步结束写入），无法改判。",
      hashLabel: "基准/本地/远端",
      dangerIntro: "以下改动会改变同步行为，确认继续保存？",
      dangerDataDir: "更换了 Mnemon 记忆目录",
      dangerSyncBackOff: "关闭「把远端变更写回记忆目录」",
      dangerConflictRemote: "冲突处理改为「远端为准」（会用远端覆盖本地）",
      badgeFailed: "上次失败",
    };

    async function bridgePost(name, payload) {
      const response = await fetch(`${BRIDGE_PREFIX}/${name}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload ?? {}),
      });
      return response.json();
    }


    function formatTime(iso) {
      if (!iso) return null;
      try {
        return new Date(iso).toLocaleString("zh-CN", { hour12: false });
      } catch {
        return iso;
      }
    }

    /** 轻量模态：无第三方依赖，遮罩点击与 Esc 均可关闭（danger 时须显式选择）。 */
    function Modal(props) {
      const { title, tone, onClose, children, actions } = props;
      react.useEffect(() => {
        if (onClose === null || onClose === undefined) return undefined;
        const onKey = (e) => {
          if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
      }, [onClose]);
      return react_jsx_runtime.jsx("div", {
        className: "dsmgs-overlay",
        onClick: onClose === null || onClose === undefined ? void 0 : (e) => {
          if (e.target === e.currentTarget) onClose();
        },
        children: react_jsx_runtime.jsxs("div", {
          className: "dsmgs-modal",
          role: "dialog",
          "aria-modal": "true",
          children: [
            react_jsx_runtime.jsxs("div", { className: "dsmgs-modalHead", children: [
              react_jsx_runtime.jsx("span", {
                className: tone === "err" ? "dsmgs-badge" : tone === "warn" ? "dsmgs-badge dsmgs-badgeWarn" : "dsmgs-badge dsmgs-badgeWarn",
                children: tone === "err" ? "!" : "i",
              }),
              title,
            ] }),
            react_jsx_runtime.jsx("div", { className: "dsmgs-modalBody", children }),
            react_jsx_runtime.jsx("div", { className: "dsmgs-modalFoot", children: actions }),
          ],
        }),
      });
    }

    function Card(props) {
      const pageMode = props && props.page === true;
      const t = T;
      const [open, setOpen] = react.useState(Boolean(pageMode));
      const [ready, setReady] = react.useState(false);
      const [available, setAvailable] = react.useState(true);
      const [writable, setWritable] = react.useState(true);
      const [dirty, setDirty] = react.useState(false);
      const [saving, setSaving] = react.useState(false);
      const [syncing, setSyncing] = react.useState(false);
      const [restoring, setRestoring] = react.useState(false);
      const [failed, setFailed] = react.useState(false);
      const [message, setMessage] = react.useState(null);
      const [status, setStatus] = react.useState(null);
      // 弹窗：同步结果（result）、冲突（conflict）、危险设置二次确认（danger）
      const [dialog, setDialog] = react.useState(null);
      // 已弹过的冲突指纹，避免自动同步反复弹同一个冲突
      const shownConflictRef = react.useRef(null);

      // 表单字段
      const [remoteUrl, setRemoteUrl] = react.useState("");
      const [branch, setBranch] = react.useState("main");
      const [dataDir, setDataDir] = react.useState("");
      const [workDir, setWorkDir] = react.useState("");
      const [autoSync, setAutoSync] = react.useState(false);
      const [intervalMinutes, setIntervalMinutes] = react.useState(10);
      const [syncBack, setSyncBack] = react.useState(true);
      const [conflictStrategy, setConflictStrategy] = react.useState("local");
      const [commitMessage, setCommitMessage] = react.useState("chore: sync mnemon memory");
      const [excludes, setExcludes] = react.useState("");

      const applyView = react.useCallback((view) => {
        const v = (view && view.value) || {};
        setRemoteUrl(v.remoteUrl ?? "");
        setBranch(v.branch ?? "main");
        setDataDir(v.dataDir ?? "");
        setWorkDir(v.workDir ?? "");
        setAutoSync(v.autoSync === true);
        setIntervalMinutes(Number(v.intervalMinutes ?? 10));
        setSyncBack(v.syncBack !== false);
        setConflictStrategy(v.conflictStrategy === "remote" ? "remote" : "local");
        setCommitMessage(v.commitMessage ?? "chore: sync mnemon memory");
        setExcludes(Array.isArray(v.excludes) ? v.excludes.join("\n") : "");
      }, []);

      const load = react.useCallback(async () => {
        try {
          const result = await bridgePost("describe");
          if (!result || result.ok !== true) {
            setAvailable(false);
            return;
          }
          setAvailable(true);
          setWritable(result.value.writable !== false);
          const view = (result.value.namespaces || []).find((n) => n.ns === NS);
          if (view) applyView(view);
          else setAvailable(false);
        } catch {
          setAvailable(false);
        } finally {
          setReady(true);
        }
      }, [applyView]);

      const refreshStatus = react.useCallback(async () => {
        try {
          const result = await bridgePost("status");
          if (result && result.ok === true) setStatus(result.value);
        } catch {
          /* 状态查询失败不影响表单 */
        }
      }, []);

      react.useEffect(() => {
        load();
      }, [load]);

      // 面板展开时轮询状态，同步中给用户实时反馈
      react.useEffect(() => {
        if (!open) return undefined;
        refreshStatus();
        const timer = setInterval(refreshStatus, syncing ? 1200 : 5000);
        return () => clearInterval(timer);
      }, [open, syncing, refreshStatus]);

      // 新出现的冲突自动弹窗；同一批冲突只弹一次，避免自动同步反复打扰
      const conflicts = (status && status.conflicts) || [];
      const conflictKey = conflicts.length === 0 ? "" : `${status.lastSyncAt || ""}|${conflicts.map((c) => c.path).join("|")}`;
      react.useEffect(() => {
        if (conflictKey === "" || shownConflictRef.current === conflictKey) return;
        shownConflictRef.current = conflictKey;
        setDialog({ kind: "conflict", conflicts, batchId: (status && status.conflictBatchId) || null });
      }, [conflictKey]);

      const touch = (setter) => (value) => {
        setter(value);
        setDirty(true);
        setFailed(false);
        setMessage(null);
      };

      const save = async () => {
        setSaving(true);
        setFailed(false);
        setMessage(null);
        try {
          const ops = [
            { op: "set", path: ["remoteUrl"], value: remoteUrl.trim() },
            { op: "set", path: ["branch"], value: branch.trim() || "main" },
            { op: "set", path: ["dataDir"], value: dataDir.trim() },
            { op: "set", path: ["workDir"], value: workDir.trim() },
            { op: "set", path: ["autoSync"], value: autoSync },
            { op: "set", path: ["intervalMinutes"], value: Math.min(Math.max(Number(intervalMinutes) || 10, 1), 1440) },
            { op: "set", path: ["syncBack"], value: syncBack },
            { op: "set", path: ["conflictStrategy"], value: conflictStrategy === "remote" ? "remote" : "local" },
            { op: "set", path: ["commitMessage"], value: commitMessage.trim() || "chore: sync mnemon memory" },
            {
              op: "set",
              path: ["excludes"],
              value: excludes
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line !== ""),
            },
          ];
          const result = await bridgePost("mutate", { ns: NS, ops });
          if (result && result.ok === true) {
            setDirty(false);
            setMessage({ kind: "ok", text: t.saved });
            applyView(result.value);
            await refreshStatus();
          } else {
            setFailed(true);
            setMessage({ kind: "err", text: (result && result.message) || t.saveFailed });
          }
        } catch (error) {
          setFailed(true);
          setMessage({ kind: "err", text: String(error && error.message ? error.message : error) });
        } finally {
          setSaving(false);
        }
      };

      /** 哪些改动会改变同步行为、值得二次确认。 */
      const detectDangers = () => {
        const saved = (status && status.resolved) || {};
        const reasons = [];
        if (dataDir.trim() !== "" && dataDir.trim() !== (saved.dataDir || "")) reasons.push(t.dangerDataDir);
        if (syncBack === false && saved.syncBack !== false) reasons.push(t.dangerSyncBackOff);
        if (conflictStrategy === "remote" && saved.conflictStrategy !== "remote") reasons.push(t.dangerConflictRemote);
        return reasons;
      };

      const requestSave = () => {
        const reasons = detectDangers();
        if (reasons.length > 0) {
          setDialog({ kind: "danger", reasons });
          return;
        }
        save();
      };

      const discard = () => {
        setDirty(false);
        setFailed(false);
        setMessage(null);
        load();
      };

      const doSync = async () => {
        setSyncing(true);
        setFailed(false);
        setMessage(null);
        try {
          const result = await bridgePost("sync");
          if (result && result.ok === true) {
            const text = t.syncOk(result.value);
            setMessage({ kind: "ok", text });
            setDialog({ kind: "result", ok: true, text, value: result.value });
          } else {
            const text = (result && result.message) || t.syncFailed;
            setFailed(true);
            setMessage({ kind: "err", text });
            setDialog({ kind: "result", ok: false, text, retry: true });
          }
        } catch (error) {
          const text = String(error && error.message ? error.message : error);
          setFailed(true);
          setMessage({ kind: "err", text });
          setDialog({ kind: "result", ok: false, text, retry: true });
        } finally {
          setSyncing(false);
          await refreshStatus();
        }
      };

      /** 改判：把该批冲突中远端那一侧写回本地，并自动再同步一次。 */
      const restoreRemote = async (batchId) => {
        setRestoring(true);
        setMessage(null);
        try {
          const result = await bridgePost("restore", { batchId: batchId ?? null });
          if (result && result.ok === true) {
            const value = result.value || {};
            const parts = [t.restoreIntro((value.restored || []).length)];
            if ((value.deleted || []).length > 0) parts.push(t.restoreDeleted(value.deleted.length));
            const text = parts.join(" ");
            setDialog({ kind: "result", ok: true, text, value: {} });
            setMessage({ kind: "ok", text });
            setFailed(false);
          } else {
            const text = (result && result.message) || t.restoreFailedTitle;
            setDialog({
              kind: "result",
              ok: false,
              text: /存档|批次/.test(text) ? t.restoreUnavailable : text,
            });
          }
        } catch (error) {
          setDialog({ kind: "result", ok: false, text: String(error && error.message ? error.message : error) });
        } finally {
          setRestoring(false);
          await refreshStatus();
        }
      };

      const syncNow = async () => {
        // 有未保存改动时先落盘，避免用旧配置同步；危险改动同样先确认
        if (dirty) {
          const reasons = detectDangers();
          if (reasons.length > 0) {
            setDialog({ kind: "danger", reasons, thenSync: true });
            return;
          }
          setSyncing(true);
          await save();
          setSyncing(false);
        }
        await doSync();
      };

      const resolved = status && status.resolved;
      const lastResult = status && status.lastResult;
      const environment = status && status.environment;
      // 折叠态也要能看见异常：失败优先，其次冲突
      const badgeCount = conflicts.length;
      const badge = failed || status?.lastError
        ? { text: t.badgeFailed, warn: false }
        : badgeCount > 0
          ? { text: `${t.conflictsFound} ${badgeCount}`, warn: true }
          : null;

      const renderField = (label, control, hint) =>
        react_jsx_runtime.jsxs("div", {
          className: "dsmgs-field",
          children: [
            react_jsx_runtime.jsx("div", { className: "dsmgs-label", children: label }),
            control,
            hint ? react_jsx_runtime.jsx("p", { className: "dsmgs-hint", children: hint }) : null,
          ],
        });

      const input = (value, onChange, extra) =>
        react_jsx_runtime.jsx("input", {
          className: "dsmgs-input",
          type: "text",
          value,
          disabled: !ready || saving || syncing || restoring || !writable,
          onChange: (e) => onChange(e.target.value),
          ...extra,
        });

      const body = react_jsx_runtime.jsxs("div", { className: "dsmgs-body", children: [
        !available
          ? react_jsx_runtime.jsx("p", { className: "dsmgs-hint dsmgs-err", children: t.unavailable })
          : null,

        react_jsx_runtime.jsxs("div", { className: "dsmgs-row", children: [
          renderField(
            t.remoteUrl,
            input(remoteUrl, touch(setRemoteUrl), { placeholder: t.remoteUrlPh }),
            null,
          ),
          renderField(
            t.branch,
            input(branch, touch(setBranch)),
            null,
          ),
        ] }),

        renderField(t.dataDir, input(dataDir, touch(setDataDir)), t.dataDirHint),
        renderField(t.workDir, input(workDir, touch(setWorkDir)), t.workDirHint),

        react_jsx_runtime.jsx("div", { className: "dsmgs-label", children: t.behavior }),
        react_jsx_runtime.jsxs("div", { className: "dsmgs-row", children: [
          react_jsx_runtime.jsxs("label", { className: "dsmgs-check", children: [
            react_jsx_runtime.jsx("input", {
              type: "checkbox",
              checked: autoSync,
              disabled: !ready || saving || syncing || restoring || !writable,
              onChange: (e) => touch(setAutoSync)(e.target.checked),
            }),
            t.autoSync,
          ] }),
          react_jsx_runtime.jsxs("label", { className: "dsmgs-check", children: [
            react_jsx_runtime.jsx("input", {
              type: "checkbox",
              checked: syncBack,
              disabled: !ready || saving || syncing || restoring || !writable,
              onChange: (e) => touch(setSyncBack)(e.target.checked),
            }),
            t.syncBack,
          ] }),
        ] }),
        react_jsx_runtime.jsx("p", { className: "dsmgs-hint", children: t.syncBackHint }),

        react_jsx_runtime.jsxs("div", { className: "dsmgs-row", children: [
          renderField(
            t.interval,
            react_jsx_runtime.jsx("input", {
              className: "dsmgs-input",
              type: "number",
              min: 1,
              max: 1440,
              value: intervalMinutes,
              disabled: !ready || saving || syncing || restoring || !writable,
              onChange: (e) => touch(setIntervalMinutes)(e.target.value),
            }),
            null,
          ),
          renderField(
            t.conflict,
            react_jsx_runtime.jsxs("select", {
              className: "dsmgs-select",
              value: conflictStrategy,
              disabled: !ready || saving || syncing || restoring || !writable,
              onChange: (e) => touch(setConflictStrategy)(e.target.value),
              children: [
                react_jsx_runtime.jsx("option", { value: "local", children: t.conflictLocal }),
                react_jsx_runtime.jsx("option", { value: "remote", children: t.conflictRemote }),
              ],
            }),
            null,
          ),
        ] }),
        react_jsx_runtime.jsx("p", { className: "dsmgs-hint", children: t.conflictHint }),

        renderField(t.commitMessage, input(commitMessage, touch(setCommitMessage)), null),
        renderField(
          t.excludes,
          react_jsx_runtime.jsx("textarea", {
            className: "dsmgs-input",
            rows: 3,
            value: excludes,
            disabled: !ready || saving || syncing || restoring || !writable,
            onChange: (e) => touch(setExcludes)(e.target.value),
          }),
          t.excludesHint,
        ),

        status
          ? react_jsx_runtime.jsxs("div", { className: "dsmgs-status", children: [
              react_jsx_runtime.jsxs("div", { className: "dsmgs-statusRow", children: [
                react_jsx_runtime.jsx("span", { className: "dsmgs-statusKey", children: `${t.lastSync}:` }),
                react_jsx_runtime.jsx("span", {
                  className: status.running ? "dsmgs-warn" : "",
                  children: status.running ? t.running : formatTime(status.lastSyncAt) || t.never,
                }),
                status.lastDurationMs
                  ? react_jsx_runtime.jsx("span", { className: "dsmgs-statusKey", children: `(${t.duration} ${status.lastDurationMs}ms)` })
                  : null,
              ] }),
              lastResult
                ? react_jsx_runtime.jsxs("div", { className: "dsmgs-statusRow", children: [
                    react_jsx_runtime.jsx("span", { className: "dsmgs-statusKey", children: `${t.lastResult}:` }),
                    react_jsx_runtime.jsx("span", {
                      children:
                        `${lastResult.trigger} · +${lastResult.stats.added} ~${lastResult.stats.updated} -${lastResult.stats.deleted}` +
                        `${lastResult.committed ? " · commit" : ""}${lastResult.pushed ? " · push" : ""}`,
                    }),
                  ] })
                : null,
              status.lastError
                ? react_jsx_runtime.jsxs("div", { className: "dsmgs-statusRow", children: [
                    react_jsx_runtime.jsx("span", { className: "dsmgs-statusKey", children: `${t.lastError}:` }),
                    react_jsx_runtime.jsx("span", { className: "dsmgs-err dsmgs-code", children: status.lastError }),
                  ] })
                : null,
              conflicts.length > 0
                ? react_jsx_runtime.jsxs("div", { className: "dsmgs-statusRow", children: [
                    react_jsx_runtime.jsx("span", { className: "dsmgs-statusKey", children: `${t.conflictsFound} (${conflicts.length}):` }),
                    react_jsx_runtime.jsx("ul", {
                      className: "dsmgs-conflicts",
                      children: conflicts
                        .slice(0, 50)
                        .map((conflict) =>
                          react_jsx_runtime.jsxs("li", {
                            children: [
                              `${conflict.path} → ${conflict.resolution}`,
                              react_jsx_runtime.jsx("span", {
                                className: "dsmgs-hash",
                                children: `${t.hashLabel}: ${String(conflict.baseHash ?? "-").slice(0, 7)} / ${String(conflict.localHash ?? "-").slice(0, 7)} / ${String(conflict.remoteHash ?? "-").slice(0, 7)}`,
                              }),
                            ],
                          }, conflict.path)),
                    }),
                  ] })
                : null,
              environment && Array.isArray(environment.checks)
                ? react_jsx_runtime.jsx("div", { className: "dsmgs-statusRow", children: [
                    react_jsx_runtime.jsx("span", { className: "dsmgs-statusKey", children: `${t.env}:` }),
                    react_jsx_runtime.jsx("span", {
                      children: environment.checks
                        .map((check) => `${check.ok ? "✓" : "✗"} ${check.id}`)
                        .join("  "),
                    }),
                  ] })
                : null,
              resolved
                ? react_jsx_runtime.jsx("p", {
                    className: "dsmgs-hint dsmgs-code",
                    children: `${resolved.dataDir} → ${resolved.remoteUrl || "-"} (${resolved.branch}) · auto=${resolved.autoSync} · every ${resolved.intervalMinutes}m · conflict=${resolved.conflictStrategy}`,
                  })
                : null,
            ] })
          : null,

        message
          ? react_jsx_runtime.jsx("p", {
              className: message.kind === "ok" ? "dsmgs-hint dsmgs-ok" : "dsmgs-hint dsmgs-err",
              children: message.text,
            })
          : null,

        react_jsx_runtime.jsxs("div", { className: "dsmgs-footer", children: [
          react_jsx_runtime.jsx("div", { className: "dsmgs-footerRight", children: [
            react_jsx_runtime.jsx("button", {
              type: "button",
              className: "dsmgs-btn dsmgs-btnPrimary",
              disabled: !ready || !available || !writable || syncing || saving || restoring,
              onClick: syncNow,
              children: syncing ? t.syncing : t.syncNow,
            }),
          ] }),
          react_jsx_runtime.jsxs("div", { className: "dsmgs-footerRight", children: [
            failed ? react_jsx_runtime.jsx("span", { className: "dsmgs-err", children: t.saveFailed }) : null,
            react_jsx_runtime.jsx("button", {
              type: "button",
              className: "dsmgs-btn",
              disabled: !dirty || saving || syncing,
              onClick: discard,
              children: t.discard,
            }),
            react_jsx_runtime.jsx("button", {
              type: "button",
              className: "dsmgs-btn dsmgs-btnPrimary",
              disabled: !dirty || saving || syncing || !writable,
              onClick: requestSave,
              children: saving ? t.saving : t.save,
            }),
          ] }),
        ] }),
      ] });

      // 弹窗：同步结果 / 冲突 / 危险设置二次确认
      const dialogNode =
        dialog && dialog.kind === "result"
          ? react_jsx_runtime.jsxs(Modal, {
              title: dialog.ok ? t.modalOkTitle : t.modalErrTitle,
              tone: dialog.ok ? "warn" : "err",
              onClose: () => setDialog(null),
              children: [
                react_jsx_runtime.jsx("p", {
                  className: dialog.ok ? "dsmgs-ok" : "dsmgs-err",
                  children: dialog.text,
                }),
                dialog.ok && dialog.value && dialog.value.durationMs
                  ? react_jsx_runtime.jsx("p", { children: `${t.duration}: ${dialog.value.durationMs}ms` })
                  : null,
              ],
              actions: [
                dialog.retry === true
                  ? react_jsx_runtime.jsx("button", {
                      type: "button",
                      className: "dsmgs-btn",
                      disabled: restoring,
                      onClick: () => {
                        setDialog(null);
                        void doSync();
                      },
                      children: t.retry,
                    }, "retry")
                  : null,
                react_jsx_runtime.jsx("button", {
                  type: "button",
                  className: "dsmgs-btn dsmgs-btnPrimary",
                  onClick: () => setDialog(null),
                  children: t.close,
                }, "close"),
              ],
            })
          : dialog && dialog.kind === "conflict"
            ? react_jsx_runtime.jsxs(Modal, {
                title: t.modalConflictTitle,
                tone: "warn",
                onClose: restoring ? null : () => setDialog(null),
                children: [
                  react_jsx_runtime.jsx("p", { children: t.conflictIntro(dialog.conflicts.length) }),
                  react_jsx_runtime.jsx("p", { children: t.conflictPolicy(conflictStrategy === "remote" ? t.conflictRemote : t.conflictLocal) }),
                  react_jsx_runtime.jsx("ul", {
                    className: "dsmgs-modalList",
                    children: dialog.conflicts
                      .slice(0, 50)
                      .map((conflict) =>
                        react_jsx_runtime.jsxs("li", {
                          children: [
                            `${conflict.path} → ${conflict.resolution}`,
                            react_jsx_runtime.jsx("span", {
                              className: "dsmgs-hash",
                              children: `${t.hashLabel}: ${String(conflict.baseHash ?? "-").slice(0, 7)} / ${String(conflict.localHash ?? "-").slice(0, 7)} / ${String(conflict.remoteHash ?? "-").slice(0, 7)}`,
                            }),
                          ],
                        }, conflict.path)),
                  }),
                  react_jsx_runtime.jsx("p", {
                    className: "dsmgs-hint",
                    children: dialog.batchId ? t.conflictOverwrote : t.conflictNoArchive,
                  }),
                  react_jsx_runtime.jsx("p", { className: "dsmgs-hint", children: t.conflictSafe }),
                ],
                actions: [
                  react_jsx_runtime.jsx("button", {
                    type: "button",
                    className: "dsmgs-btn",
                    disabled: restoring,
                    onClick: () => setDialog(null),
                    children: t.close,
                  }, "close"),
                  dialog.batchId
                    ? react_jsx_runtime.jsx("button", {
                        type: "button",
                        className: "dsmgs-btn dsmgs-btnPrimary",
                        disabled: restoring,
                        onClick: () => {
                          const batchId = dialog.batchId;
                          setDialog(null);
                          void restoreRemote(batchId);
                        },
                        children: restoring ? t.restoring : t.useRemote,
                      }, "restore")
                    : null,
                ],
              })
            : dialog && dialog.kind === "danger"
              ? react_jsx_runtime.jsxs(Modal, {
                  title: t.modalConfirmTitle,
                  tone: "warn",
                  onClose: () => setDialog(null),
                  children: [
                    react_jsx_runtime.jsx("p", { children: t.dangerIntro }),
                    react_jsx_runtime.jsx("ul", {
                      className: "dsmgs-modalRange",
                      children: dialog.reasons.map((reason) => react_jsx_runtime.jsx("li", { children: reason }, reason)),
                    }),
                  ],
                  actions: [
                    react_jsx_runtime.jsx("button", {
                      type: "button",
                      className: "dsmgs-btn",
                      onClick: () => setDialog(null),
                      children: t.cancel,
                    }, "cancel"),
                    react_jsx_runtime.jsx("button", {
                      type: "button",
                      className: "dsmgs-btn dsmgs-btnPrimary",
                      onClick: () => {
                        const thenSync = dialog.thenSync === true;
                        setDialog(null);
                        (async () => {
                          if (thenSync) setSyncing(true);
                          await save();
                          if (thenSync) {
                            setSyncing(false);
                            await doSync();
                          }
                        })();
                      },
                      children: t.goOn,
                    }, "go"),
                  ],
                })
              : null;

      const card = react_jsx_runtime.jsxs("li", {
        className: (open ? "dsmgs-card dsmgs-cardOpen" : "dsmgs-card") + (pageMode ? " dsmgs-pageMode" : ""),
        children: [
          react_jsx_runtime.jsx("button", {
            type: "button",
            className: "dsmgs-header",
            "aria-expanded": pageMode ? void 0 : open,
            onClick: pageMode ? void 0 : () => setOpen(!open),
            children: [
              react_jsx_runtime.jsxs("span", { className: "dsmgs-headText", children: [
                react_jsx_runtime.jsx("span", { className: "dsmgs-name", children: t.title }),
                react_jsx_runtime.jsx("span", { className: "dsmgs-description", children: t.description }),
              ] }),
              dirty ? react_jsx_runtime.jsx("span", { className: "dsmgs-pending", children: t.unsaved }) : null,
              badge
                ? react_jsx_runtime.jsx("span", {
                    className: badge.warn ? "dsmgs-badge dsmgs-badgeWarn" : "dsmgs-badge",
                    children: badge.text,
                  })
                : null,
              react_jsx_runtime.jsx("span", {
                className: open ? "dsmgs-chevron dsmgs-chevronOpen" : "dsmgs-chevron",
                children: "▾",
              }),
            ],
          }),
          open ? body : null,
        ],
      });

      return react_jsx_runtime.jsxs(react_jsx_runtime.Fragment, {
        children: [card, dialogNode],
      });
    }

    const inject = ["slots"];

    function apply(ctx) {
      // 设置 → 插件 → 可配置项
      ctx.slots.inject("settings.plugin.item", () =>
        ctx.slots.register(
          {
            name: "settings.plugin.item",
            key: "mnemon-git-sync",
            id: "dsh-mnemon-git-sync",
            order: 140,
            inject: () => ({}),
          },
          Card,
        ),
      );
      // 侧栏 插件 → 已安装 → mnemon-git-sync → 行配置页（key 规则：<包名>#<patch 行 id>）
      ctx.slots.inject("plugins.row.config", () =>
        ctx.slots.register(
          { name: "plugins.row.config", key: SLOT_KEY },
          (slotProps) =>
            slotProps && slotProps.view === "summary"
              ? "Mnemon 记忆目录 ↔ Git 仓库双向同步"
              : react_jsx_runtime.jsx(Card, { page: true }),
        ),
      );
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
