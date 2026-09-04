.PHONY: test
test:
	node --test test/gesture-model.js test/gesture-flow.js test/bump-manifest.js test/release-config.js test/plugin-contract.js
