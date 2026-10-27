// opencode-plugin-prompt-timestamp
//
// Injects a one-line time context (local timezone + UTC) into every user prompt, mirroring
// the Codex/Claude Code UserPromptSubmit timestamp hook. Self-contained: the timestamp is
// computed in JS (no Python needed), and an optional `command` lets you delegate to an
// existing script for byte-identical output.

const DEFAULT_TZ = "America/Chicago"

function offsetString(tz, date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" }).formatToParts(date)
  const v = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+00:00"
  const m = /GMT([+-]\d{2}:\d{2})/.exec(v)
  return m ? m[1] : "+00:00"
}

function localIso(tz, date) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const g = (t) => f.find((p) => p.type === t)?.value ?? "00"
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}:${g("second")}${offsetString(tz, date)}`
}

function utcZ(date) {
  return date.toISOString().replace(/\.\d+Z$/, "Z")
}

/** Build the timestamp line. Exported for testing. */
export function timestampLine(tz = DEFAULT_TZ, date = new Date(), label = "Prompt received") {
  return `${label}: ${localIso(tz, date)} [${tz}]; UTC: ${utcZ(date)}`
}

export const PromptTimestamp = async ({ $ }, options = {}) => {
  const timezone = options.timezone || DEFAULT_TZ
  const label = options.label || "Prompt received"
  const command = options.command // optional: "python3 /path/to/prompt_timestamp.py --timezone America/Chicago"

  const stamp = async (date = new Date()) => {
    if (command) {
      try {
        const out = (await $`${command}`.text()).trim()
        if (out) return out
      } catch {
        // fall through to the built-in formatter
      }
    }
    try {
      return timestampLine(timezone, date, label)
    } catch {
      return `${label}: ${date.toISOString()} (fallback)`
    }
  }

  return {
    // Fires when a new user message arrives; append the timestamp as a text part.
    "chat.message": async (input, output) => {
      const messageID = output?.message?.id ?? input?.messageID
      if (!messageID) return
      output.parts.push({
        id: crypto.randomUUID(),
        sessionID: input.sessionID,
        messageID,
        type: "text",
        text: await stamp(),
        synthetic: true,
      })
    },
  }
}

export default PromptTimestamp
