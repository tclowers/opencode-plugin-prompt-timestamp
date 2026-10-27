import assert from "node:assert/strict"
import test from "node:test"
import { PromptTimestamp } from "./index.js"

test("timestamp parts use valid OpenCode IDs and preserve message ownership", async () => {
  const hooks = await PromptTimestamp({})
  const output = { message: { id: "msg_test" }, parts: [] }
  await hooks["chat.message"]({ sessionID: "ses_test" }, output)
  assert.equal(output.parts.length, 1)
  const part = output.parts[0]
  assert.match(part.id, /^prt_[a-f0-9]{32}$/)
  assert.equal(part.sessionID, "ses_test")
  assert.equal(part.messageID, "msg_test")
  assert.equal(part.type, "text")
  assert.equal(part.synthetic, true)
  assert.match(part.text, /^Prompt received: .* \[America\/Chicago\]; UTC: .*Z$/)
  await hooks["chat.message"]({ sessionID: "ses_test" }, output)
  assert.notEqual(output.parts[0].id, output.parts[1].id)
})
