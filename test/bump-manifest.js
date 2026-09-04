var test = require("node:test")
var assert = require("assert")
var fs = require("fs")
var os = require("os")
var path = require("path")
var bumpManifest = require("../scripts/bump-manifest.js").bumpManifest

test("bumpManifest writes only version", function () {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-"))
  var file = path.join(dir, "manifest.json")
  var original = {
    schemaVersion: 1,
    id: "rainan16.workspace-touch-swipe",
    version: "1.1.0",
    kinds: ["service"]
  }
  fs.writeFileSync(file, JSON.stringify(original, null, 2) + "\n")
  bumpManifest(file, "1.2.0")
  var got = JSON.parse(fs.readFileSync(file, "utf8"))
  assert.strictEqual(got.version, "1.2.0")
  assert.strictEqual(got.id, original.id)
  assert.strictEqual(got.schemaVersion, 1)
  assert.deepStrictEqual(got.kinds, ["service"])
})

test("bumpManifest rejects non-semver and leaves the file", function () {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-"))
  var file = path.join(dir, "manifest.json")
  fs.writeFileSync(file, '{"version":"1.1.0"}\n')
  assert.throws(function () { bumpManifest(file, "v1.2.0") })
  assert.throws(function () { bumpManifest(file, "") })
  assert.strictEqual(JSON.parse(fs.readFileSync(file, "utf8")).version, "1.1.0")
})
