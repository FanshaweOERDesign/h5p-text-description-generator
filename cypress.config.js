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
      on('after:run', (results) => {
        if (!results) return;

        const tests = (results.runs || []).flatMap((run) => run.tests || []);
        const rows = testCases.map(({ name }) => {
          const test = tests.find((entry) =>
            entry.title.at(-1) === `processes ${name} and matches expected output`
          );
          return { name, state: test?.state || 'not run' };
        });
        const escapeCell = (value) => String(value)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\|/g, '&#124;').replace(/[\r\n]+/g, ' ');
        const summary = [
          '## Cypress upload tests',
          '',
          `${results.totalPassed || 0} passed, ${results.totalFailed || 0} failed, ${results.totalPending || 0} pending, ${results.totalSkipped || 0} skipped.`,
          '',
          '| Content type / case | Result |',
          '| --- | --- |',
          ...rows.map(({ name, state }) => `| ${escapeCell(name)} | ${escapeCell(state)} |`),
          '',
          'See the Cypress step logs and cypress-results artifact for failure details.',
          '',
        ].join('\n');
        const resultsDir = path.join(config.projectRoot, 'cypress/results');
        fs.mkdirSync(resultsDir, { recursive: true });
        fs.writeFileSync(path.join(resultsDir, 'summary.md'), summary);
        fs.writeFileSync(path.join(resultsDir, 'tests.json'), JSON.stringify({
          cases: rows,
          tests: tests.map(({ title, state, displayError }) => ({ title, state, displayError })),
        }, null, 2));
        if (process.env.GITHUB_STEP_SUMMARY) {
          fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
        }
      });
      return config;
    },
  },
});
