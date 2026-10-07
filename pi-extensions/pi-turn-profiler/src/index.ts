import type {
  ExtensionAPI,
  ExtensionContext,
  Theme,
} from "@earendil-works/pi-coding-agent"
import { matchesKey, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui"

type RunProfile = {
  durationMs: number
  toolCount: number
}

const HISTORY_LIMIT = 5
const ENTRY_TYPE = "turn-profiler-run"

function formatRun(run: RunProfile) {
  const seconds = (run.durationMs / 1000).toFixed(1)
  const tools = `${run.toolCount} tool${run.toolCount === 1 ? "" : "s"}`
  return `${seconds}s · ${tools}`
}

class ProfileOverlay {
  private readonly runs: RunProfile[];
  private readonly theme: Theme;
  private close: () => void;
  private ctx: ExtensionContext;

  constructor(
    opts: {
      readonly runs: RunProfile[],
      readonly theme: Theme,
      readonly close: () => void,
      readonly ctx: ExtensionContext;
    }
  ) {
    this.runs = opts.runs;
    this.theme = opts.theme;
    this.close = opts.close
    this.ctx = opts.ctx;
  }

  handleInput(data: string) {
    if (matchesKey(data, "escape") || matchesKey(data, "return") || data === "q") {
      this.close()
    }
  }

  render(width: number) {
    const panelWidth = Math.max(2, Math.min(width, 52))
    const innerWidth = panelWidth - 2
    const border = (left: string, fill: string, right: string) =>
      this.theme.fg("border", left + fill.repeat(innerWidth) + right)
    const row = (content = "") => {
      const clipped = truncateToWidth(content, innerWidth)
      const padding = " ".repeat(Math.max(0, innerWidth - visibleWidth(clipped)))
      return `${this.theme.fg("border", "│")}${clipped}${padding}${this.theme.fg("border", "│")}`
    }

    return [
      border("╭", "─", "╮"),
      row(` ${this.theme.bold(this.theme.fg("accent", "TURN PROFILER"))}`),
      row(),
      row(` ${this.theme.fg("dim", "#    DURATION    TOOLS")}`),
      ...this.runs.map((run, index) =>
        row(` ${String(index + 1).padEnd(4)} ${(run.durationMs / 1000).toFixed(1).padStart(6)}s    ${run.toolCount}`),
      ),
      row(),
      row(` ${this.theme.fg("dim", "Esc, Enter, or q to close")}`),
      border("╰", "─", "╯"),
    ]
  }

  invalidate() {}
}

export default function turnProfiler(pi: ExtensionAPI) {
  let startedAt: number | undefined
  let toolCount = 0
  const history: RunProfile[] = []

  function restoreHistory(ctx: ExtensionContext) {
    ctx.ui.notify(`restoreHistory`, 'info');
    let savedRuns = [];
    for (const entry of ctx.sessionManager.getBranch()) {
      if (entry.type === "custom" && entry.customType === ENTRY_TYPE) {
        ctx.ui.notify(JSON.stringify(entry), 'info');
        savedRuns.push(entry.data! as RunProfile);
      }
    }
    savedRuns = savedRuns.reverse();
    ctx.ui.notify(JSON.stringify(savedRuns), 'info');

    history.splice(0, history.length, ...savedRuns)
    ctx.ui.setStatus(
      "turn-profiler",
      history[0] ? `turn: ${formatRun(history[0])}` : undefined,
    )
  }

  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify(`on:agent_start session_start`, 'info');
    restoreHistory(ctx)
  })
  pi.on("session_tree", async (_event, ctx) => {
    ctx.ui.notify(`on:agent_start session_tree`, 'info');
    restoreHistory(ctx)
  })

  pi.on("agent_start", async (_event, ctx) => {
    startedAt = performance.now()
    toolCount = 0
    ctx.ui.setStatus("turn-profiler", "turn: running…")
    ctx.ui.notify(`on:agent_start startedAt: ${startedAt} & toolCount: ${toolCount}`, 'info');
  })

  pi.on("tool_execution_end", async (_event, ctx) => {
    ctx.ui.notify(`on:tool_execution_end toolCount: ${toolCount} -> ${toolCount + 1}`, 'info');
    toolCount += 1
    ctx.ui.setStatus("turn-profiler", `turn: running · ${toolCount} tools`)
  })

  pi.on("agent_settled", async (_event, ctx) => {
    if (startedAt === undefined) {
      ctx.ui.notify(`on:agent_settled startedAt undefined`, 'warning');
      return;
    }

    const run = {
      durationMs: performance.now() - startedAt,
      toolCount,
    }

    startedAt = undefined
    ctx.ui.notify(`on:agent_settled reset startedAt`, 'info');
    history.unshift(run)
    ctx.ui.notify(`on:agent_settled history unshift`, 'info');
    history.length = Math.min(history.length, HISTORY_LIMIT)
    ctx.ui.notify(`on:agent_settled history limited`, 'info');
    pi.appendEntry(ENTRY_TYPE, run)
    ctx.ui.notify(`on:agent_settled pi appendEntry`, 'info');
    ctx.ui.setStatus("turn-profiler", `turn: ${formatRun(run)}`)
  })

  pi.registerCommand("profile", {
    description: "Show metrics for recent agent runs",
    handler: async (_args, ctx) => {
      if (history.length === 0) {
        ctx.ui.notify("Complete one agent run first.", "info")
        return
      }

      if (ctx.mode !== "tui") {
        const lines = history.map((run, index) => `${index + 1}. ${formatRun(run)}`)
        ctx.ui.notify(lines.join("\n"), "info")
        return
      }

      await ctx.ui.custom(
        (_tui, theme, _keybindings, done) =>
          new ProfileOverlay({
            runs: [...history],
            theme,
            close: () => done(undefined),
            ctx,
          }),
        {
          overlay: true,
          overlayOptions: { width: 52, minWidth: 36, maxHeight: 12 },
        },
      )
    },
  })
}
