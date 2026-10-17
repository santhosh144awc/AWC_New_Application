import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Educational Content Collection & Articles Integrity', () => {
  const articlesDir = path.resolve('src/content/articles');
  const reviewRegisterPath = path.resolve('../product-docs/CONTENT_REVIEW_REGISTER.csv');

  it('contains all 12 migrated article files in src/content/articles/', () => {
    expect(fs.existsSync(articlesDir)).toBe(true);
    const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
    expect(files.length).toBe(12);
  });

  it('accounts for all 12 articles in product-docs/CONTENT_REVIEW_REGISTER.csv', () => {
    expect(fs.existsSync(reviewRegisterPath)).toBe(true);
    const registerContent = fs.readFileSync(reviewRegisterPath, 'utf8');
    const lines = registerContent.split('\n').filter(Boolean);
    // Header + 12 rows = 13 lines
    expect(lines.length).toBe(13);

    for (let i = 1; i <= 12; i++) {
      const artId = `ART-${String(i).padStart(2, '0')}`;
      expect(registerContent).toContain(artId);
    }
  });

  it('strictly isolates unverified ARN from all article authorTitle and frontmatter', () => {
    const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(articlesDir, file), 'utf8');
      expect(content).not.toMatch(/authorTitle:.*ARN:\s*266896/i);
      expect(content).not.toMatch(/authorTitle:.*266896/i);
    }
  });

  it('strictly approves only vetted articles (10 Approved, 2 Withheld under Professional Review)', () => {
    const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
    let approvedCount = 0;
    let reviewCount = 0;

    const withheldFiles = [
      'how-to-start-planning-for-retirement.md',
      'should-you-repay-your-loan-or-invest.md',
    ];

    for (const file of files) {
      const content = fs.readFileSync(path.join(articlesDir, file), 'utf8');
      if (withheldFiles.includes(file)) {
        expect(content).toContain('publicationStatus: NEEDS_PROFESSIONAL_REVIEW');
        expect(content).toContain('reviewNotes:');
        reviewCount++;
      } else {
        expect(content).toContain('publicationStatus: APPROVED');
        approvedCount++;
      }
    }

    expect(approvedCount).toBe(10);
    expect(reviewCount).toBe(2);
  });

  it('ensures all article calculator CTA links target valid canonical routes', () => {
    const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(articlesDir, file), 'utf8');
      const hrefMatch = content.match(/href:\s*"([^"]+)"/);
      if (hrefMatch) {
        const href = hrefMatch[1];
        expect(href.startsWith('/')).toBe(true);
        expect(href.endsWith('/')).toBe(true);
        // Ensure no legacy query strings remain
        expect(href).not.toContain('?');
      }
    }
  });
});
