// tests/runner.js — minimal browser test runner
// No dependencies. Tests are registered with test() and executed immediately.
// Call renderResults() after all test files have been imported to display the report.

const results = [];

// Register and immediately run a named test.
// fn should throw an Error on failure; returning normally means pass.
export function test(name, fn) {
  try {
    fn();
    results.push({ name, passed: true });
  } catch (err) {
    results.push({ name, passed: false, message: err.message });
  }
}

// Assertion helpers. Each throws a descriptive Error on failure.
export const assert = {

  // Strict equality (===).
  equal(actual, expected, label) {
    if (actual !== expected) {
      const prefix = label ? label + ': ' : '';
      throw new Error(`${prefix}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },

  // Truthiness.
  ok(value, label) {
    if (!value) {
      const prefix = label ? label + ': ' : '';
      throw new Error(`${prefix}expected truthy, got ${JSON.stringify(value)}`);
    }
  },

  // Value is an Array.
  isArray(value, label) {
    if (!Array.isArray(value)) {
      const prefix = label ? label + ': ' : '';
      throw new Error(`${prefix}expected Array, got ${typeof value}`);
    }
  },

  // Set contains a value (checked by inclusion in an array or Set).
  includes(collection, item, label) {
    const found = Array.isArray(collection)
      ? collection.includes(item)
      : collection.has(item);
    if (!found) {
      const prefix = label ? label + ': ' : '';
      throw new Error(`${prefix}${JSON.stringify(item)} not found in collection`);
    }
  },
};

// Render all collected results into document.body as a readable report.
export function renderResults() {
  const passed  = results.filter(r =>  r.passed).length;
  const failed  = results.filter(r => !r.passed).length;
  const total   = results.length;

  const root = document.createElement('div');
  root.style.cssText = 'font-family: monospace; font-size: 14px; padding: 24px; max-width: 860px; line-height: 1.6;';

  const heading = document.createElement('h2');
  heading.style.cssText = `margin: 0 0 16px; color: ${failed > 0 ? '#e74c3c' : '#2ecc71'}`;
  heading.textContent = failed > 0
    ? `${failed} failing  /  ${total} total`
    : `All ${total} tests passed`;
  root.appendChild(heading);

  for (const result of results) {
    const row = document.createElement('div');
    row.style.cssText = `color: ${result.passed ? '#2ecc71' : '#e74c3c'}; padding: 2px 0;`;
    row.textContent = result.passed
      ? `  ✓  ${result.name}`
      : `  ✗  ${result.name}  —  ${result.message}`;
    root.appendChild(row);
  }

  document.body.appendChild(root);
}
