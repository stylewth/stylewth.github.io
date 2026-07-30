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
const designSourceExtensions = new Set(['.astro', '.css']);

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

  it('defines the approved editorial design system', () => {
    const tokens = readFileSync(join(projectRoot, 'src', 'styles', 'tokens.css'), 'utf8');
    const globalStyles = readFileSync(join(projectRoot, 'src', 'styles', 'global.css'), 'utf8');
    const baseLayout = readFileSync(
      join(projectRoot, 'src', 'layouts', 'BaseLayout.astro'),
      'utf8',
    );
    const desktopProfile = globalStyles.match(/\.profile\s*\{([^}]*)\}/s)?.[1] ?? '';

    expect(tokens).toMatch(/--content-width:\s*60rem/);
    expect(tokens).toMatch(/--font-display:\s*['"]Newsreader['"]/);
    expect(tokens).toMatch(/--font-body:\s*['"]DM Sans['"]/);
    expect(tokens).toMatch(/--color-text:\s*#[01][0-9a-f]{5}/i);
    expect(tokens).toMatch(/--color-rule:\s*#[0-9a-f]{6}/i);
    expect(tokens).toMatch(/--color-bone:\s*#[0-9a-f]{6}/i);
    expect(globalStyles).toContain(':focus-visible');
    expect(globalStyles).toMatch(/@media\s*\(max-width:\s*48rem\)/);
    expect(desktopProfile).toMatch(
      /grid-template-columns:\s*15\.625rem minmax\(0,\s*1fr\);/,
    );
    expect(desktopProfile).toMatch(/gap:\s*4rem;/);
    expect(baseLayout).toContain('@fontsource-variable/newsreader');
    expect(baseLayout).toContain('@fontsource-variable/dm-sans');
  });

  it('keeps visual effects restrained and requires no client framework', () => {
    const source = projectFiles(projectRoot)
      .filter((file) => designSourceExtensions.has(extname(file).toLowerCase()))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencyNames = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    });

    expect(source).not.toContain('gradient(');
    expect(source).not.toMatch(/\bfilter\s*:/);
    expect(source).not.toContain('mix-blend-mode');
    expect(source).not.toContain('h-screen');
    expect(source).not.toMatch(/client:(load|idle|visible|media|only)/);
    expect(source).not.toMatch(/scroll-snap|scroll-behavior:\s*smooth/);
    expect(dependencyNames).not.toEqual(
      expect.arrayContaining([
        'react',
        'react-dom',
        'vue',
        'svelte',
        'solid-js',
        'preact',
        'framer-motion',
        'motion',
        'gsap',
      ]),
    );
  });
});
