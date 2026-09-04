function hyprRequest(dispatch) {
  return "hl.dsp.focus({ workspace = \"" + dispatch + "\" })"
}

function osdPayload(name) {
  return {
    icon: "touch",
    message: "workspace " + String(name || ""),
    duration: "800"
  }
}

function osdEnabled(settings) {
  return !settings || settings.osd !== false
}

function overlayEnabled(settings) {
  return !settings || settings.overlay !== false
}

function edgeWidth(screenW, edgeRatio) {
  var ratio = edgeRatio
  if (ratio === undefined || ratio === null)
    ratio = 0.04
  return Number(screenW) * Number(ratio)
}

function swipeMin(screenW, swipeRatio) {
  var ratio = swipeRatio
  if (ratio === undefined || ratio === null)
    ratio = 0.08
  return Number(screenW) * Number(ratio)
}

function classifyEdgeSwipe(side, startX, endX, startY, endY, screenW, screenH) {
  var dx = Number(endX) - Number(startX)
  var dy = Number(endY) - Number(startY)
  var w = Number(screenW)
  var h = Number(screenH)
  if (!isFinite(dx) || !isFinite(dy) || !isFinite(w) || !isFinite(h) || w <= 0 || h <= 0)
    return null
  if (Math.abs(dx) < swipeMin(w))
    return null
  if (Math.abs(dx) / w <= Math.abs(dy) / h)
    return null
  if (side === "left" && dx > 0)
    return { gesture: "swipe-right", dispatch: "e-1" }
  if (side === "right" && dx < 0)
    return { gesture: "swipe-left", dispatch: "e+1" }
  return null
}

function osdAfterSwipe(settings) {
  return osdEnabled(settings) && !overlayEnabled(settings)
}

function overlayPayload(name) {
  return {
    workspace: String(name || ""),
    duration: "1500"
  }
}

function parseOverlayPayload(payloadJson) {
  var duration = 1500
  if (!payloadJson)
    return { duration: duration }
  try {
    var payload = JSON.parse(String(payloadJson))
    if (payload && payload.duration !== undefined && payload.duration !== null && payload.duration !== "") {
      var n = parseInt(String(payload.duration), 10)
      if (isFinite(n) && n >= 0)
        duration = n
    }
  } catch (e) {}
  return { duration: duration }
}

function workspaceIds(values) {
  var ids = [1, 2, 3, 4, 5]
  var list = values
  if (list && typeof list.length !== "number" && list.values)
    list = list.values
  if (!list || typeof list.length !== "number")
    return ids
  for (var i = 0; i < list.length; i++) {
    var id = list[i] && list[i].id
    if (typeof id === "number" && id > 0 && id <= 10 && ids.indexOf(id) === -1)
      ids.push(id)
  }
  ids.sort(function(left, right) { return left - right })
  return ids
}

function asPair(value) {
  if (!value || value.length < 2)
    return null
  var x = Number(value[0])
  var y = Number(value[1])
  if (!isFinite(x) || !isFinite(y))
    return null
  return [x, y]
}

function layoutSize(width, height, scale) {
  var s = Number(scale)
  if (!isFinite(s) || s <= 0)
    s = 1
  return {
    width: width / s,
    height: height / s
  }
}

function edgeInset(value) {
  var n = Number(value)
  if (!isFinite(n) || n < 0)
    return 0
  return Math.floor(n)
}

function edgeInsets(reserved, scale) {
  var left = 0
  var top = 0
  var right = 0
  var bottom = 0
  if (reserved && typeof reserved.length === "number" && reserved.length >= 4) {
    left = reserved[0]
    top = reserved[1]
    right = reserved[2]
    bottom = reserved[3]
  } else if (reserved && typeof reserved === "object") {
    left = reserved.left
    top = reserved.top
    right = reserved.right
    bottom = reserved.bottom
  }
  return {
    left: edgeInset(left),
    top: edgeInset(top),
    right: edgeInset(right),
    bottom: edgeInset(bottom)
  }
}

function windowRect(at, size, monX, monY, monW, monH, cardW, cardH) {
  var pos = asPair(at)
  var dim = asPair(size)
  if (!pos || !dim || !monW || !monH || !cardW || !cardH)
    return null
  var sx = cardW / monW
  var sy = cardH / monH
  return {
    x: (pos[0] - monX) * sx,
    y: (pos[1] - monY) * sy,
    width: Math.max(1, dim[0] * sx),
    height: Math.max(1, dim[1] * sy)
  }
}

function cardSize(panelW, panelH, count, monW, monH, gap, pad) {
  var n = Math.max(count || 0, 1)
  var availW = panelW - pad * 2
  var availH = panelH * 0.5
  if (!monW) monW = 16
  if (!monH) monH = 9
  var w = Math.floor((availW - gap * (n - 1)) / n)
  if (w < 1) w = 1
  var h = Math.round(w * monH / monW)
  if (availH > 0 && h > availH) {
    h = Math.floor(availH)
    if (h < 1) h = 1
    w = Math.round(h * monW / monH)
    if (w < 1) w = 1
  }
  return { width: w, height: h }
}

function pluginSettings(shellConfig, pluginId) {
  var plugins = shellConfig && shellConfig.plugins
  var id = String(pluginId || "")
  if (!plugins || !id) return ({})
  for (var i = 0; i < plugins.length; i++) {
    if (plugins[i] && String(plugins[i].id) === id) return plugins[i]
  }
  return ({})
}

if (typeof module !== "undefined") {
  module.exports = {
    hyprRequest: hyprRequest,
    osdPayload: osdPayload,
    osdEnabled: osdEnabled,
    overlayEnabled: overlayEnabled,
    edgeWidth: edgeWidth,
    swipeMin: swipeMin,
    classifyEdgeSwipe: classifyEdgeSwipe,
    osdAfterSwipe: osdAfterSwipe,
    overlayPayload: overlayPayload,
    parseOverlayPayload: parseOverlayPayload,
    workspaceIds: workspaceIds,
    layoutSize: layoutSize,
    edgeInsets: edgeInsets,
    windowRect: windowRect,
    cardSize: cardSize,
    pluginSettings: pluginSettings
  }
}
