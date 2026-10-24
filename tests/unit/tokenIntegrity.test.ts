import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 15 — Sitewide CSS Token Integrity Test', () => {
  const srcDir = path.resolve(__dirname, '../../src');
  const tokensFile = path.join(srcDir, 'styles/design-tokens.css');

  it('verifies design-tokens.css exists and defines global tokens', () => {
    expect(fs.existsSync(tokensFile)).toBe(true);
    const content = fs.readFileSync(tokensFile, 'utf8');
    const matches = Array.from(content.matchAll(/(--[a-zA-Z0-9_-]+):/g));
    expect(matches.length).toBeGreaterThan(50);
  });

  function getSourceFiles(dir: string, extensions: string[]): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(getSourceFiles(fullPath, extensions));
      } else {
        if (extensions.some(ext => file.endsWith(ext))) {
          results.push(fullPath);
        }
      }
    }
    return results;
  }

  it('asserts zero unresolved CSS custom properties across all .astro, .css, and .tsx source files', () => {
    const tokensContent = fs.readFileSync(tokensFile, 'utf8');
    const globalTokenMatches = Array.from(tokensContent.matchAll(/(--[a-zA-Z0-9_-]+):/g));
    const globalTokens = new Set(globalTokenMatches.map(m => m[1]));

    const sourceFiles = getSourceFiles(srcDir, ['.astro', '.css', '.tsx', '.ts']);
    const unresolvedByFile: Record<string, string[]> = {};

    for (const file of sourceFiles) {
      if (file === tokensFile) continue;

      const content = fs.readFileSync(file, 'utf8');

      // Detect locally defined custom properties in this file (e.g. within :root or local selector)
      const localDefMatches = Array.from(content.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g));
      const localDefs = new Set(localDefMatches.map(m => m[1]));

      // Detect all usages: var(--token-name)
      const usageMatches = Array.from(content.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)/g));
      const usages = new Set(usageMatches.map(m => m[1]));

      const unresolved: string[] = [];
      for (const token of usages) {
        if (!globalTokens.has(token) && !localDefs.has(token)) {
          unresolved.push(token);
        }
      }

      if (unresolved.length > 0) {
        const rel = path.relative(srcDir, file).replace(/\\/g, '/');
        unresolvedByFile[rel] = unresolved;
      }
    }

    const filesWithErrors = Object.keys(unresolvedByFile);
    if (filesWithErrors.length > 0) {
      const details = filesWithErrors
        .map(f => `${f}: [${unresolvedByFile[f].join(', ')}]`)
        .join('\n');
      expect.fail(`Found unresolved CSS custom properties in ${filesWithErrors.length} file(s):\n${details}`);
    }

    expect(filesWithErrors.length).toBe(0);
  });
});
