var fs = require("fs")

function bumpManifest(file, version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error("invalid version: " + version)
  }
  var manifest = JSON.parse(fs.readFileSync(file, "utf8"))
  manifest.version = version
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n")
}

if (require.main === module) {
  bumpManifest("manifest.json", process.argv[2])
}

module.exports = { bumpManifest: bumpManifest }
