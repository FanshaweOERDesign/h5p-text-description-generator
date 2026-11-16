const { defineConfig } = require('cypress');
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // Uses the GitHub Actions env variable if present, or falls back to a local sibling folder
      const assetsDir = config.env.ASSETS_DIR || path.resolve(__dirname, '../test-assets/cases');

      if (!fs.existsSync(assetsDir)) {
        throw new Error(`Test assets directory not found at: ${assetsDir}`);
      }

      // Scan each subfolder in the assets directory to build the test cases
      const testCases = fs
        .readdirSync(assetsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((dir) => {
          const caseName = dir.name;
          const casePath = path.join(assetsDir, caseName);
          const files = fs.readdirSync(casePath);

          const inputFile = files.find((f) => f.startsWith('input.'));
          const expectedFile = path.join(casePath, 'expected.json');

          if (!inputFile || !fs.existsSync(expectedFile)) {
            throw new Error(`Missing input.* or expected.json in test case: ${caseName}`);
          }

          return {
            name: caseName,
            inputPath: path.join(casePath, inputFile),
            expected: JSON.parse(fs.readFileSync(expectedFile, 'utf8')),
          };
        });

      config.expose = { ...config.expose, testCases };
      return config;
    },
  },
});
