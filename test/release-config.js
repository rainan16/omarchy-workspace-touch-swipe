var test = require("node:test")
var assert = require("assert")
var fs = require("fs")

test("releaserc releases only main, bumps manifest, and does not publish npm", function () {
  var cfg = JSON.parse(fs.readFileSync(".releaserc.json", "utf8"))
  var plugins = JSON.stringify(cfg.plugins)
  assert.deepStrictEqual(cfg.branches, ["main"])
  assert.strictEqual(cfg.tagFormat, "v${version}")
  assert.ok(plugins.indexOf("@semantic-release/npm") === -1)
  assert.ok(plugins.indexOf("scripts/bump-manifest.js") !== -1)
  assert.ok(plugins.indexOf("manifest.json") !== -1)
})

test("release workflow publishes from main CI without dry-run", function () {
  var yml = fs.readFileSync(".github/workflows/release.yml", "utf8")
  assert.ok(yml.indexOf("workflow_run") !== -1)
  assert.ok(/\n        run: npx semantic-release\n/.test(yml))
})

test("CI has no C daemon build", function () {
  var yml = fs.readFileSync(".github/workflows/ci.yml", "utf8")
  assert.ok(yml.indexOf("gcc") === -1)
  assert.ok(yml.indexOf("clang") === -1)
  assert.ok(yml.indexOf("make CC=") === -1)
  assert.ok(yml.indexOf("setup-two-finger") === -1)
  assert.ok(yml.indexOf("plugin-contract.js") !== -1)
  assert.ok(yml.indexOf("node-version: \"22\"") !== -1)
})
