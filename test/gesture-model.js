var test = require("node:test")
var assert = require("assert")
var GestureModel = require("../GestureModel.js")

test("hyprRequest", function () {
  assert.strictEqual(GestureModel.hyprRequest("e-1"), 'hl.dsp.focus({ workspace = "e-1" })')
  assert.strictEqual(GestureModel.hyprRequest("e+1"), 'hl.dsp.focus({ workspace = "e+1" })')
})

test("osdPayload", function () {
  assert.deepStrictEqual(GestureModel.osdPayload("1"), {
    icon: "touch",
    message: "workspace 1",
    duration: "800"
  })
  assert.deepStrictEqual(GestureModel.osdPayload(""), {
    icon: "touch",
    message: "workspace ",
    duration: "800"
  })
})

test("osdEnabled", function () {
  assert.strictEqual(GestureModel.osdEnabled(null), true)
  assert.strictEqual(GestureModel.osdEnabled({}), true)
  assert.strictEqual(GestureModel.osdEnabled({ osd: true }), true)
  assert.strictEqual(GestureModel.osdEnabled({ osd: false }), false)
})

test("overlayEnabled", function () {
  assert.strictEqual(GestureModel.overlayEnabled(null), true)
  assert.strictEqual(GestureModel.overlayEnabled({}), true)
  assert.strictEqual(GestureModel.overlayEnabled({ overlay: true }), true)
  assert.strictEqual(GestureModel.overlayEnabled({ overlay: false }), false)
})

test("edgeWidth and swipeMin", function () {
  assert.strictEqual(GestureModel.edgeWidth(1000), 40)
  assert.strictEqual(GestureModel.edgeWidth(1000, 0.1), 100)
  assert.strictEqual(GestureModel.swipeMin(1000), 80)
  assert.strictEqual(GestureModel.swipeMin(1000, 0.1), 100)
})

test("classifyEdgeSwipe", function () {
  assert.deepStrictEqual(
    GestureModel.classifyEdgeSwipe("left", 20, 200, 500, 500, 1000, 1000),
    { gesture: "swipe-right", dispatch: "e-1" }
  )
  assert.deepStrictEqual(
    GestureModel.classifyEdgeSwipe("right", 980, 800, 500, 500, 1000, 1000),
    { gesture: "swipe-left", dispatch: "e+1" }
  )
  assert.strictEqual(GestureModel.classifyEdgeSwipe("left", 20, 50, 500, 500, 1000, 1000), null)
  assert.strictEqual(GestureModel.classifyEdgeSwipe("left", 20, 220, 500, 900, 1000, 1000), null)
  assert.strictEqual(GestureModel.classifyEdgeSwipe("left", 200, 20, 500, 500, 1000, 1000), null)
  assert.strictEqual(GestureModel.classifyEdgeSwipe("right", 800, 980, 500, 500, 1000, 1000), null)
  assert.strictEqual(GestureModel.classifyEdgeSwipe("top", 20, 200, 500, 500, 1000, 1000), null)
  assert.strictEqual(GestureModel.classifyEdgeSwipe("left", 20, 200, 500, 500, 0, 1000), null)
})

test("osdAfterSwipe", function () {
  assert.strictEqual(GestureModel.osdAfterSwipe(null), false)
  assert.strictEqual(GestureModel.osdAfterSwipe({}), false)
  assert.strictEqual(GestureModel.osdAfterSwipe({ overlay: false }), true)
  assert.strictEqual(GestureModel.osdAfterSwipe({ overlay: false, osd: false }), false)
  assert.strictEqual(GestureModel.osdAfterSwipe({ overlay: true, osd: true }), false)
})

test("overlayPayload", function () {
  assert.deepStrictEqual(GestureModel.overlayPayload("2"), {
    workspace: "2",
    duration: "1500"
  })
  assert.deepStrictEqual(GestureModel.overlayPayload(""), {
    workspace: "",
    duration: "1500"
  })
  assert.deepStrictEqual(GestureModel.parseOverlayPayload(null), { duration: 1500 })
  assert.deepStrictEqual(GestureModel.parseOverlayPayload("{}"), { duration: 1500 })
  assert.deepStrictEqual(GestureModel.parseOverlayPayload("not-json"), { duration: 1500 })
  assert.deepStrictEqual(GestureModel.parseOverlayPayload('{"duration":"2000"}'), { duration: 2000 })
  assert.deepStrictEqual(GestureModel.parseOverlayPayload('{"duration":0}'), { duration: 0 })
})

test("workspaceIds", function () {
  assert.deepStrictEqual(GestureModel.workspaceIds(null), [1, 2, 3, 4, 5])
  assert.deepStrictEqual(GestureModel.workspaceIds([]), [1, 2, 3, 4, 5])
  assert.deepStrictEqual(GestureModel.workspaceIds([{ id: 3 }]), [1, 2, 3, 4, 5])
  assert.deepStrictEqual(GestureModel.workspaceIds([{ id: 7 }]), [1, 2, 3, 4, 5, 7])
  assert.deepStrictEqual(GestureModel.workspaceIds([{ id: 11 }]), [1, 2, 3, 4, 5])
  assert.deepStrictEqual(GestureModel.workspaceIds({ values: [{ id: 8 }] }), [1, 2, 3, 4, 5, 8])
})

test("windowRect", function () {
  assert.deepStrictEqual(
    GestureModel.windowRect([100, 200], [400, 300], 0, 0, 1000, 1000, 100, 100),
    { x: 10, y: 20, width: 40, height: 30 }
  )
  assert.deepStrictEqual(
    GestureModel.windowRect([1100, 200], [400, 300], 1000, 0, 1000, 1000, 100, 100),
    { x: 10, y: 20, width: 40, height: 30 }
  )
  assert.strictEqual(GestureModel.windowRect(null, [400, 300], 0, 0, 1000, 1000, 100, 100), null)
})

test("edgeInsets", function () {
  assert.deepStrictEqual(GestureModel.edgeInsets(null, 1), {
    left: 0, top: 0, right: 0, bottom: 0
  })
  assert.deepStrictEqual(GestureModel.edgeInsets([0, 26, 0, 0], 1), {
    left: 0, top: 26, right: 0, bottom: 0
  })
  assert.deepStrictEqual(GestureModel.edgeInsets([0, 26, 0, 0], 2), {
    left: 0, top: 26, right: 0, bottom: 0
  })
  assert.deepStrictEqual(GestureModel.edgeInsets([-4, 26, 0, 0], 1), {
    left: 0, top: 26, right: 0, bottom: 0
  })
  assert.deepStrictEqual(GestureModel.edgeInsets({ left: 80, top: 0, right: 0, bottom: 0 }, 1), {
    left: 80, top: 0, right: 0, bottom: 0
  })
})

test("edgeInsets hide-when-bar-owns-edge", function () {
  var leftBar = GestureModel.edgeInsets([80, 0, 0, 0], 1)
  assert.ok(leftBar.left > 0)
  var rightBar = GestureModel.edgeInsets([0, 0, 80, 0], 1)
  assert.ok(rightBar.right > 0)
  var topBar = GestureModel.edgeInsets([0, 26, 0, 0], 2)
  assert.strictEqual(topBar.left, 0)
  assert.strictEqual(topBar.right, 0)
  assert.ok(topBar.top > 0)
})

test("layoutSize", function () {
  assert.deepStrictEqual(GestureModel.layoutSize(1920, 1280, 2), { width: 960, height: 640 })
  assert.deepStrictEqual(GestureModel.layoutSize(1920, 1280, 1), { width: 1920, height: 1280 })
  assert.deepStrictEqual(GestureModel.layoutSize(1920, 1280, 0), { width: 1920, height: 1280 })
  assert.deepStrictEqual(
    GestureModel.windowRect(
      [12, 38], [936, 590], 0, 0,
      GestureModel.layoutSize(1920, 1280, 2).width,
      GestureModel.layoutSize(1920, 1280, 2).height,
      960, 640),
    { x: 12, y: 38, width: 936, height: 590 }
  )
})

test("cardSize", function () {
  assert.deepStrictEqual(GestureModel.cardSize(1000, 800, 5, 16, 9, 16, 20), {
    width: 179,
    height: 101
  })
  assert.deepStrictEqual(GestureModel.cardSize(2000, 100, 5, 16, 9, 16, 0), {
    width: 89,
    height: 50
  })
})

test("pluginSettings", function () {
  assert.deepStrictEqual(
    GestureModel.pluginSettings({ plugins: [{ id: "rainan16.workspace-touch-swipe", osd: false }] }, "rainan16.workspace-touch-swipe"),
    { id: "rainan16.workspace-touch-swipe", osd: false }
  )
  assert.deepStrictEqual(GestureModel.pluginSettings({ plugins: [] }, "rainan16.workspace-touch-swipe"), {})
})
