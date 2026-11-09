// Turns the colors in business.json into CSS variables inside the main CSS bundle,
// so no inline style is needed and the Content Security Policy can stay strict.
import { readFileSync, writeFileSync } from 'node:fs';

const business = JSON.parse(readFileSync('src/data/business.json', 'utf8'));
const hex = /^#[0-9a-fA-F]{6}$/;

const lines = Object.entries(business.theme).map(([name, value]) => {
  if (!hex.test(value)) throw new Error(`theme.${name} must be a 6-digit hex color, got "${value}"`);
  return `  --brand-${name}: ${value};`;
});

writeFileSync('src/styles/theme.generated.css', `:root {\n${lines.join('\n')}\n}\n`);
