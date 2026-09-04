import QtQuick
import Quickshell.Hyprland
import "GestureModel.js" as GestureModel

Item {
  id: root
  property var shell: null
  property var manifest: null

  readonly property var pluginSettings: GestureModel.pluginSettings(
    shell && shell.shellConfig, manifest && manifest.id)
  readonly property bool osdEnabled: GestureModel.osdEnabled(pluginSettings)
  readonly property bool overlayEnabled: GestureModel.overlayEnabled(pluginSettings)

  function log(msg) {
    console.warn("[touch-gestures] " + msg)
  }

  function handleEvent(event) {
    if (!event || !event.dispatch) return
    if (osdTimer.running) {
      root.log("busy, skip " + event.dispatch)
      return
    }
    var request = GestureModel.hyprRequest(event.dispatch)
    root.log("dispatch " + request + " usingLua=" + Hyprland.usingLua)
    Hyprland.dispatch(request)
    if (root.overlayEnabled) root.showOverlay()
    else if (root.osdEnabled) osdTimer.start()
  }

  function showOverlay() {
    if (!root.overlayEnabled) {
      root.log("overlay skipped: disabled")
      return
    }
    if (!shell) {
      root.log("overlay skipped: no shell")
      return
    }
    var id = manifest && manifest.id
    if (!id) {
      root.log("overlay skipped: no manifest")
      return
    }
    var ws = Hyprland.focusedWorkspace
    var name = ws && (ws.name || String(ws.id)) || ""
    root.log("overlay workspace=" + name)
    shell.summon(id, JSON.stringify(GestureModel.overlayPayload(name)))
  }

  function showOsd() {
    if (!root.osdEnabled) {
      root.log("osd skipped: disabled")
      return
    }
    if (!shell) {
      root.log("osd skipped: no shell")
      return
    }
    var ws = Hyprland.focusedWorkspace
    var name = ws && (ws.name || String(ws.id)) || ""
    root.log("osd workspace=" + name)
    shell.summon("omarchy.osd", JSON.stringify(GestureModel.osdPayload(name)))
  }

  Timer {
    id: osdTimer
    interval: 80
    onTriggered: root.showOsd()
  }

  Component.onCompleted: {
    root.log("loaded")
  }
}
