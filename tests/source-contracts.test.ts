import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const contentRoot = join(projectRoot, 'src', 'content');
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', '.astro', 'tests']);
const forbiddenExtensions = new Set(['.pdf', '.docx', '.tex', '.log', '.aux', '.pptx']);
const sourceExtensions = new Set(['.astro', '.css', '.html', '.js', '.json', '.md', '.mts', '.ts']);
const forbiddenText = [
  '18138390826',
  'GPA',
  '\u62a4\u7167',
  '\u82f1\u56fd\u7b7e\u8bc1',
  'Download CV',
];

function markdownFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory)
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => join(directory, entry));
}

function projectFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) ? [] : projectFiles(join(directory, entry.name));
    }

    return [join(directory, entry.name)];
  });
}

describe('public source contracts', () => {
  it('contains exactly the approved initial content records', () => {
    expect(markdownFiles(join(contentRoot, 'projects'))).toHaveLength(2);
    expect(markdownFiles(join(contentRoot, 'updates'))).toHaveLength(3);
    expect(markdownFiles(join(contentRoot, 'elsewhere'))).toHaveLength(1);
  });

  it('retains the two verified project repositories', () => {
    const projectContent = markdownFiles(join(contentRoot, 'projects'))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');

    expect(projectContent).toContain(
      'https://github.com/stylewth/Looking-Around-Before-Cropping-SparseNavWM',
    );
    expect(projectContent).toContain('https://github.com/stylewth/EVRP-datastructure');
  });

  it('does not publish private records or unsupported file types', () => {
    const files = projectFiles(projectRoot);
    const forbiddenFile = files.find((file) => forbiddenExtensions.has(extname(file).toLowerCase()));
    const forbiddenContent = files
      .filter(
        (file) =>
          statSync(file).isFile() &&
          sourceExtensions.has(extname(file).toLowerCase()) &&
          !file.endsWith('package-lock.json'),
      )
      .find((file) => {
        const content = readFileSync(file, 'utf8');
        return forbiddenText.some((term) => content.includes(term));
      });

    expect(forbiddenFile && relative(projectRoot, forbiddenFile)).toBeUndefined();
    expect(forbiddenContent && relative(projectRoot, forbiddenContent)).toBeUndefined();
  });
});
