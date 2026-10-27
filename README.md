# opencode-plugin-prompt-timestamp

An [opencode](https://opencode.ai) plugin that injects a one-line time context into every user
prompt — the opencode equivalent of the Codex / Claude Code `UserPromptSubmit` timestamp hook.

Each prompt gets a line like:

```
Prompt received: 2026-10-27T17:12:42-05:00 [America/Chicago]; UTC: 2026-10-27T22:12:42Z
```

Useful for correlating a conversation with machine/system events (crashes, restarts, logs) after
the fact.

## Install

### From npm

```jsonc
// opencode.json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    ["opencode-plugin-prompt-timestamp", { "timezone": "America/Chicago" }]
  ]
}
```

opencode installs npm plugins with Bun at startup; restart opencode afterwards.

### Local (from a checkout)

Point the config at the package directory's entry file, or copy `index.js` into your plugin
directory:

- Global: `~/.config/opencode/plugins/`
- Project: `.opencode/plugins/`

Files there are auto-loaded. Options can't be passed on that path, so the defaults are used
(`America/Chicago`, label `Prompt received`).

## Options

| Option     | Default              | Meaning                                                        |
|------------|----------------------|----------------------------------------------------------------|
| `timezone` | `America/Chicago`    | IANA timezone for the local time (`Intl` `timeZone`).          |
| `label`    | `Prompt received`    | Prefix text of the line.                                       |
| `command`  | _(none)_             | Optional shell command whose stdout replaces the line (e.g. to reuse an existing script). |

With `command`, the built-in JS formatter is bypassed and the command's output is used verbatim:

```jsonc
{
  "plugin": [
    ["opencode-plugin-prompt-timestamp", {
      "command": "python3 /usr/local/share/prompt_timestamp.py --timezone America/Chicago"
    }]
  ]
}
```

## How it works

A `chat.message` hook fires on each new user message and appends a `synthetic` text part with the
timestamp. No Python or other runtime dependency is required; the JS formatter produces output
identical to the companion `prompt_timestamp.py`.

## Notes

- Restart opencode after installing/enabling.
- The line is added once per user message (it does not accumulate across tool-call round-trips).
- The local-time offset is derived from the IANA zone, so DST is handled automatically.

## License

0BSD (public-domain-equivalent, no conditions) — see `LICENSE`.
