import QtQuick
import Quickshell
import Quickshell.Wayland
import Quickshell.Hyprland
import qs.Commons
import qs.Ui
import "GestureModel.js" as GestureModel

Item {
  id: root

  property var shell: null
  property var manifest: null
  property var service: null
  property bool opened: false
  property int duration: 1500

  readonly property string pluginId: manifest && manifest.id
    ? String(manifest.id) : "rainan16.workspace-touch-swipe"
  readonly property int monitorX: Hyprland.focusedMonitor ? Hyprland.focusedMonitor.x : 0
  readonly property int monitorY: Hyprland.focusedMonitor ? Hyprland.focusedMonitor.y : 0
  readonly property int monitorW: Hyprland.focusedMonitor ? Hyprland.focusedMonitor.width : 16
  readonly property int monitorH: Hyprland.focusedMonitor ? Hyprland.focusedMonitor.height : 9
  readonly property var monitorLayout: GestureModel.layoutSize(
    root.monitorW, root.monitorH,
    Hyprland.focusedMonitor && Hyprland.focusedMonitor.scale
      ? Hyprland.focusedMonitor.scale : 1)
  readonly property var insets: GestureModel.edgeInsets(
    Hyprland.focusedMonitor && Hyprland.focusedMonitor.lastIpcObject
      ? Hyprland.focusedMonitor.lastIpcObject.reserved : null,
    Hyprland.focusedMonitor && Hyprland.focusedMonitor.scale
      ? Hyprland.focusedMonitor.scale : 1)
  readonly property var size: GestureModel.cardSize(
    panel.width, panel.height, root.workspaceIds().length,
    root.monitorW, root.monitorH, Style.space(16), Style.gapsOut * 2)
  readonly property int cardWidth: size.width
  readonly property int cardHeight: size.height
  readonly property int labelHeight: Style.font.title + Style.space(10)

  function workspaceIds() {
    return GestureModel.workspaceIds(Hyprland.workspaces.values)
  }

  function workspaceById(id) {
    var values = Hyprland.workspaces.values
    if (!values) return null
    for (var i = 0; i < values.length; i++) {
      if (values[i].id === id) return values[i]
    }
    return null
  }

  function open(payloadJson) {
    var payload = GestureModel.parseOverlayPayload(payloadJson)
    root.duration = payload.duration
    Hyprland.refreshMonitors()
    Hyprland.refreshToplevels()
    root.opened = true
    if (root.duration > 0) hideTimer.restart()
    else hideTimer.stop()
  }

  function close() {
    root.opened = false
  }

  function dismiss() {
    root.opened = false
    if (root.shell && typeof root.shell.hide === "function")
      root.shell.hide(root.pluginId)
  }

  function focusWorkspace(id) {
    Hyprland.dispatch(GestureModel.hyprRequest(String(id)))
    if (root.duration > 0) hideTimer.restart()
  }

  function handleStripRelease(side, point, screenW, screenH) {
    var event = GestureModel.classifyEdgeSwipe(
      side, point.startX, point.x, point.startY, point.y, screenW, screenH)
    if (event && root.service && root.service.handleEvent)
      root.service.handleEvent(event)
  }

  Timer {
    id: hideTimer
    interval: root.duration
    onTriggered: root.dismiss()
  }

  Component.onCompleted: Hyprland.refreshMonitors()

  PanelWindow {
    id: leftStrip
    visible: !root.opened && root.insets.left === 0
    color: "transparent"
    width: GestureModel.edgeWidth(screen ? screen.width : 0)
    anchors { top: true; bottom: true; left: true }
    margins { top: root.insets.top; bottom: root.insets.bottom }
    WlrLayershell.namespace: "touch-gestures-edge"
    WlrLayershell.layer: WlrLayer.Overlay
    WlrLayershell.keyboardFocus: WlrKeyboardFocus.None
    exclusionMode: ExclusionMode.Ignore

    MultiPointTouchArea {
      anchors.fill: parent
      maximumTouchPoints: 1
      touchPoints: [ TouchPoint { id: leftPoint } ]
      onReleased: root.handleStripRelease(
        "left", leftPoint,
        leftStrip.screen ? leftStrip.screen.width : 0,
        leftStrip.screen ? leftStrip.screen.height : 0)
    }
  }

  PanelWindow {
    id: rightStrip
    visible: !root.opened && root.insets.right === 0
    color: "transparent"
    width: GestureModel.edgeWidth(screen ? screen.width : 0)
    anchors { top: true; bottom: true; right: true }
    margins { top: root.insets.top; bottom: root.insets.bottom }
    WlrLayershell.namespace: "touch-gestures-edge"
    WlrLayershell.layer: WlrLayer.Overlay
    WlrLayershell.keyboardFocus: WlrKeyboardFocus.None
    exclusionMode: ExclusionMode.Ignore

    MultiPointTouchArea {
      anchors.fill: parent
      maximumTouchPoints: 1
      touchPoints: [ TouchPoint { id: rightPoint } ]
      onReleased: root.handleStripRelease(
        "right", rightPoint,
        rightStrip.screen ? rightStrip.screen.width : 0,
        rightStrip.screen ? rightStrip.screen.height : 0)
    }
  }

  PanelWindow {
    id: panel
    visible: root.opened
    anchors { top: true; bottom: true; left: true; right: true }
    color: "transparent"
    WlrLayershell.namespace: "touch-gestures"
    WlrLayershell.layer: WlrLayer.Overlay
    WlrLayershell.keyboardFocus: WlrKeyboardFocus.None
    exclusionMode: ExclusionMode.Ignore

    Rectangle {
      anchors.fill: parent
      color: Color.imagePicker.scrim
    }

    MouseArea {
      anchors.fill: parent
      anchors.leftMargin: GestureModel.edgeWidth(panel.screen ? panel.screen.width : 0)
      anchors.rightMargin: GestureModel.edgeWidth(panel.screen ? panel.screen.width : 0)
      onClicked: root.dismiss()
    }

    Row {
      anchors.centerIn: parent
      spacing: Style.space(16)

      Repeater {
        model: root.workspaceIds()

        Item {
          id: card
          required property int modelData
          readonly property int wsId: modelData
          readonly property var workspace: root.workspaceById(wsId)
          readonly property bool focused: Hyprland.focusedWorkspace !== null
            && Hyprland.focusedWorkspace.id === wsId
          readonly property string wsName: workspace && workspace.name
            ? String(workspace.name) : String(wsId)
          readonly property var toplevels: workspace && workspace.toplevels
            ? workspace.toplevels.values : []

          width: root.cardWidth
          height: root.cardHeight + root.labelHeight

          MouseArea {
            anchors.fill: parent
            onClicked: root.focusWorkspace(card.wsId)
          }

          BorderSurface {
            id: previewFrame
            width: root.cardWidth
            height: root.cardHeight
            radius: Style.cornerRadius
            color: Color.menu.background
            clip: true
            borderSpec: Border.surfaceSpec(
              "menu", "border",
              card.focused ? Color.imagePicker.selectedBorder : Color.imagePicker.unselectedBorder,
              card.focused ? Math.max(2, Style.space(2)) : Math.max(1, Style.space(1)))

            Item {
              id: preview
              anchors.fill: parent
              anchors.topMargin: previewFrame.borderTop
              anchors.rightMargin: previewFrame.borderRight
              anchors.bottomMargin: previewFrame.borderBottom
              anchors.leftMargin: previewFrame.borderLeft
              clip: true

              Repeater {
                model: card.toplevels

                ScreencopyView {
                  required property var modelData
                  readonly property var ipc: modelData ? modelData.lastIpcObject : null
                  readonly property var rect: GestureModel.windowRect(
                    ipc ? ipc.at : null,
                    ipc ? ipc.size : null,
                    root.monitorX, root.monitorY,
                    root.monitorLayout.width, root.monitorLayout.height,
                    preview.width, preview.height)

                  x: rect ? rect.x : 0
                  y: rect ? rect.y : 0
                  width: rect ? rect.width : 0
                  height: rect ? rect.height : 0
                  visible: captureSource && rect
                  captureSource: modelData && modelData.wayland ? modelData.wayland : null
                  live: root.opened
                  paintCursor: false
                  constraintSize: Qt.size(width, height)
                }
              }

              Text {
                visible: !card.toplevels || card.toplevels.length === 0
                anchors.centerIn: parent
                text: card.wsName
                color: Color.muted
                font.family: Style.font.menuFamily
                font.pixelSize: Style.font.display
              }
            }
          }

          Text {
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: previewFrame.bottom
            anchors.topMargin: Style.space(6)
            width: parent.width
            horizontalAlignment: Text.AlignHCenter
            text: card.wsName
            color: card.focused ? Color.accent : Color.menu.text
            font.family: Style.font.menuFamily
            font.pixelSize: Style.font.title
            font.bold: card.focused
            elide: Text.ElideRight
          }
        }
      }
    }

    MultiPointTouchArea {
      anchors { top: parent.top; bottom: parent.bottom; left: parent.left }
      width: GestureModel.edgeWidth(panel.screen ? panel.screen.width : 0)
      maximumTouchPoints: 1
      touchPoints: [ TouchPoint { id: panelLeftPoint } ]
      onReleased: root.handleStripRelease(
        "left", panelLeftPoint,
        panel.screen ? panel.screen.width : 0,
        panel.screen ? panel.screen.height : 0)
    }

    MultiPointTouchArea {
      anchors { top: parent.top; bottom: parent.bottom; right: parent.right }
      width: GestureModel.edgeWidth(panel.screen ? panel.screen.width : 0)
      maximumTouchPoints: 1
      touchPoints: [ TouchPoint { id: panelRightPoint } ]
      onReleased: root.handleStripRelease(
        "right", panelRightPoint,
        panel.screen ? panel.screen.width : 0,
        panel.screen ? panel.screen.height : 0)
    }
  }
}
