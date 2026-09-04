var test = require("node:test")
var assert = require("assert")
var GestureModel = require("../GestureModel.js")

function handleEvent(event, workspaceName, settings) {
  if (!event) return null
  var out = { request: GestureModel.hyprRequest(event.dispatch) }
  if (GestureModel.overlayEnabled(settings))
    out.overlay = GestureModel.overlayPayload(workspaceName)
  else if (GestureModel.osdAfterSwipe(settings))
    out.osd = GestureModel.osdPayload(workspaceName)
  return out
}

test("edge swipe-right shows overlay", function () {
  assert.deepStrictEqual(
    handleEvent(GestureModel.classifyEdgeSwipe("left", 20, 200, 500, 500, 1000, 1000), "1"),
    {
      request: 'hl.dsp.focus({ workspace = "e-1" })',
      overlay: { workspace: "1", duration: "1500" }
    }
  )
})

test("edge swipe-left shows overlay", function () {
  assert.deepStrictEqual(
    handleEvent(GestureModel.classifyEdgeSwipe("right", 980, 800, 500, 500, 1000, 1000), "2"),
    {
      request: 'hl.dsp.focus({ workspace = "e+1" })',
      overlay: { workspace: "2", duration: "1500" }
    }
  )
})

test("overlay skips OSD", function () {
  assert.deepStrictEqual(
    handleEvent(GestureModel.classifyEdgeSwipe("left", 20, 200, 500, 500, 1000, 1000), "1", { overlay: true }),
    {
      request: 'hl.dsp.focus({ workspace = "e-1" })',
      overlay: { workspace: "1", duration: "1500" }
    }
  )
})

test("overlay false shows OSD", function () {
  assert.deepStrictEqual(
    handleEvent(GestureModel.classifyEdgeSwipe("left", 20, 200, 500, 500, 1000, 1000), "1", { overlay: false }),
    {
      request: 'hl.dsp.focus({ workspace = "e-1" })',
      osd: { icon: "touch", message: "workspace 1", duration: "800" }
    }
  )
})

test("osd false is silent", function () {
  assert.deepStrictEqual(
    handleEvent(GestureModel.classifyEdgeSwipe("left", 20, 200, 500, 500, 1000, 1000), "1", {
      overlay: false,
      osd: false
    }),
    {
      request: 'hl.dsp.focus({ workspace = "e-1" })'
    }
  )
})

test("short edge swipe is ignored", function () {
  assert.strictEqual(handleEvent(GestureModel.classifyEdgeSwipe("left", 20, 50, 500, 500, 1000, 1000), "1"), null)
})
