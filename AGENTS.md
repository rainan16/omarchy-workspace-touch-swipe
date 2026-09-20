# AGENTS.md

Omarchy `service` + `overlay` plugin. One-finger edge swipes switch Hyprland workspaces and show live previews.

Plugin id: `rainan16.workspace-touch-swipe`

Gestures (`GestureModel.js` dispatch from overlay edge strips):

- one finger, left edge, swipe right → `swipe-right` → `e-1`
- one finger, right edge, swipe left → `swipe-left` → `e+1`

Layer-shell edge strips in `Overlay.qml` (`keepLoaded`). No daemon. No `input` group. No two-finger path.

Overlay: on unless `"overlay": false`. Then `shell.summon(manifest.id, JSON.stringify(GestureModel.overlayPayload(name)))`. `Overlay.qml` is a separate kind; no UI in `Service.qml`. Live previews via `ScreencopyView` on each workspace toplevel's `wayland` handle. Pass `GestureModel.layoutSize(width, height, scale)` into `windowRect`, not raw IPC pixel size. Edge strips also live here.

OSD: on unless `"osd": false`, and skipped while overlay is on. Then `shell.summon("omarchy.osd", JSON.stringify(GestureModel.osdPayload(name)))`. Name from `Hyprland.focusedWorkspace`. Icon `touch` is OSD glyph `󰝁`. Read the entry via `GestureModel.pluginSettings(shell.shellConfig, manifest.id)`.

Overlay/strips call `service.handleEvent(event)`.

Samples: `/usr/share/omarchy/shell/plugins`. Docs: https://plugins.omarchy.org/develop.html

## Setup

```bash
node --test test/gesture-model.js test/gesture-flow.js test/bump-manifest.js test/release-config.js test/plugin-contract.js
omarchy plugin validate "$PWD"
/usr/lib/qt6/bin/qmllint -I "${OMARCHY_PATH:-/usr/share/omarchy}/shell" Service.qml Overlay.qml
```

`qmllint` is not on `PATH`. `OMARCHY_PATH` is `/usr/share/omarchy`.

Install:

```bash
mkdir -p ~/.config/omarchy/plugins/rainan16.workspace-touch-swipe
cp manifest.json Service.qml Overlay.qml GestureModel.js \
  ~/.config/omarchy/plugins/rainan16.workspace-touch-swipe/
omarchy plugin enable rainan16.workspace-touch-swipe
omarchy restart shell
```

## Testing

On every important change: update `README.md` (usage, install, configure, mapping) and update tests. Then run all of them — `node --test test/gesture-model.js test/gesture-flow.js test/bump-manifest.js test/release-config.js test/plugin-contract.js`, `omarchy plugin validate "$PWD"`, and qmllint as above. Do not skip tests because a change “looks small”.

- JS: `node --test test/gesture-model.js test/gesture-flow.js test/bump-manifest.js test/release-config.js test/plugin-contract.js`.
- Live Hyprland is not in node tests; swipe on device after `omarchy restart shell`.
- QML/manifest: `omarchy plugin validate "$PWD"` then qmllint as above.
- One-finger edge swipe switches workspace. No daemon. No `input` group.
- Green validate is not “gestures work”. That only checks the plugin contract.
- After QML/JS install, `omarchy-shell shell rescanPlugins` is not enough. Restart the shell or you will debug stale code.
- `qmllint` `onExited` ExitStatus warnings match first-party services; exit 0 is accept.

Logs:

```bash
journalctl --user -f | grep touch-gestures
```

QML uses `console.warn("[touch-gestures] …")` (WARN). `console.log` is DEBUG and easy to miss.

## Code style

Copy first-party services (`idle`, `battery`, `media`), not bar widgets.

- `Service.qml` root is `Item {}`. Inject `property var shell: null` and `property var manifest: null`.
- No `Process`. No daemon. Classify edge-strip swipes in `GestureModel.js`. Keep QML as wiring. Overlay has `property var service`; strips call `service.handleEvent`.
- Workspace switch: `Hyprland.dispatch("hl.dsp.focus({ workspace = \"" + event.dispatch + "\" })")`.
- No comments unless asked.

## Gotchas

- This Hyprland is Lua (0.56). `hyprctl dispatch workspace e+1` fails with `')' expected near 'e'`. OSD will still show the current workspace. First-party bar uses `hl.dsp.focus({ workspace = "…" })`. `Hyprland.dispatch` talks IPC with that string. Do not spawn `hyprctl` for this.
- QML `import "GestureModel.js"` is cached. File copy + rescan often leaves the old mapping. `omarchy restart shell` after Service.qml or GestureModel.js changes.
- End-user README Install is only `omarchy plugin add … --enable`. Official add clones, validates, rescans, and enables. Do not put `omarchy restart shell` or the `input` group there. Restart after QML/JS is a local-dev cache issue, not first install.
- Idle strips are ~4% wide for swipe tracking, but the input region is `GestureModel.edgeHitWidth` (~0.8%) so app edge buttons stay clickable. `mask` is the hit sliver until a touch is down (`mouseEnabled: false`). They must not cover the bar: inset `PanelWindow.margins` from `GestureModel.edgeInsets(reserved)` and hide a strip when that edge is the bar. The overlay panel must handle swipes while open.
- `Hyprland.focusedMonitor.width/height` are physical pixels. Client `at`/`size` and monitor `x`/`y` are layout. `windowRect` needs `width/scale` and `height/scale`. Scale 1 hides half-size previews stuck in the card's top-left.

## Security

- Plugins run unsandboxed inside `omarchy-shell` with the user’s permissions.
- Never `EVIOCGRAB`. Never commit secrets. Do not add install hooks or a second Quickshell process. Plugin runtime must not sudo.

## Boundaries

Never:

- Clone `omarchy.clock` or any `bar-widget` as a starting point.
- Put UI (`Rectangle`, `PanelWindow`, `NotificationWindow`) in `Service.qml`. Overlay UI lives in `Overlay.qml`.
- Use `omarchy-notification-send` for workspace switches. This is overlay/OSD.
- Use `Qt.createQmlObject` for `Process`.
- Add a two-finger / evdev / `input` group path. That belongs in `omarchy-workspace-touch-switch`.
