import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
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
const forbiddenPathParts = new Set(['cv', 'cvs', 'resume', 'resumes']);
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
          !file.endsWith('package-lock.json') &&
          !file.endsWith('README.md'),
      )
      .find((file) => {
        const content = readFileSync(file, 'utf8');
        return forbiddenText.some((term) => content.includes(term));
      });

    expect(forbiddenFile && relative(projectRoot, forbiddenFile)).toBeUndefined();
    expect(forbiddenContent && relative(projectRoot, forbiddenContent)).toBeUndefined();
  });

  it('keeps production source free of private directories and parent asset references', () => {
    const files = projectFiles(projectRoot);
    const privatePath = files.find((file) =>
      relative(projectRoot, file)
        .split(/[\\/]/)
        .some((part) => forbiddenPathParts.has(part.toLowerCase())),
    );
    const parentAssetReference = files
      .filter((file) => sourceExtensions.has(extname(file).toLowerCase()))
      .find((file) => {
        const content = readFileSync(file, 'utf8');
        const parentReferences = [
          ...content.matchAll(/(?:from\s*|src\s*=\s*|href\s*=\s*|url\()\s*["'](\.\.\/[^"')\s]+)/g),
        ].map((match) => match[1]);

        return parentReferences.some((reference) => relative(projectRoot, resolve(dirname(file), reference)).startsWith('..'));
      });

    expect(privatePath && relative(projectRoot, privatePath)).toBeUndefined();
    expect(parentAssetReference && relative(projectRoot, parentAssetReference)).toBeUndefined();
  });

  it('ships GitHub Pages deployment metadata without an OG image dependency', () => {
    const robotsPath = join(projectRoot, 'public', 'robots.txt');
    const workflowPath = join(projectRoot, '.github', 'workflows', 'deploy.yml');
    const seoHead = readFileSync(join(projectRoot, 'src', 'components', 'layout', 'SeoHead.astro'), 'utf8');

    expect(readFileSync(robotsPath, 'utf8')).toBe(
      'User-agent: *\nAllow: /\nSitemap: https://stylewth.github.io/sitemap-index.xml\n',
    );
    expect(readFileSync(workflowPath, 'utf8')).toContain('actions/checkout@v7');
    expect(readFileSync(workflowPath, 'utf8')).toContain('withastro/action@v6');
    expect(readFileSync(workflowPath, 'utf8')).toContain('actions/deploy-pages@v5');
    expect(seoHead).not.toContain('og:image');
    expect(seoHead).toContain('name="twitter:card" content="summary"');
    expect(existsSync(join(projectRoot, 'public', 'og.png'))).toBe(false);
  });

  it('documents content maintenance, bilingual expansion, and the publication gate', () => {
    const readme = readFileSync(join(projectRoot, 'README.md'), 'utf8');

    expect(readme).toContain('npm install');
    expect(readme).toContain('npm run dev');
    expect(readme).toContain('npm run build');
    expect(readme).toContain('## Project Markdown example');
    expect(readme).toContain('## Update Markdown example');
    expect(readme).toContain('## Elsewhere Markdown example');
    expect(readme).toContain('site config');
    expect(readme).toContain('i18n');
    expect(readme).toContain('CV gate');
    expect(readme).toContain('Chinese');
    expect(readme).toContain('GitHub Pages');
    expect(readme).toContain('Settings > Pages');
    expect(readme).toContain('dynamic character particles');
  });

  it('defines the approved editorial design system', () => {
    const tokens = readFileSync(join(projectRoot, 'src', 'styles', 'tokens.css'), 'utf8');
    const globalStyles = readFileSync(join(projectRoot, 'src', 'styles', 'global.css'), 'utf8');
    const baseLayout = readFileSync(
      join(projectRoot, 'src', 'layouts', 'BaseLayout.astro'),
      'utf8',
    );
    const profile = readFileSync(
      join(projectRoot, 'src', 'components', 'home', 'ProfileIntro.astro'),
      'utf8',
    );

    expect(tokens).toMatch(/--content-width:\s*60rem/);
    expect(tokens).toMatch(/--font-display:\s*['"]Newsreader['"]/);
    expect(tokens).toMatch(/--font-body:\s*['"]DM Sans['"]/);
    expect(tokens).toMatch(/--color-text:\s*#[01][0-9a-f]{5}/i);
    expect(tokens).toMatch(/--color-rule:\s*#[0-9a-f]{6}/i);
    expect(tokens).toMatch(/--color-bone:\s*#[0-9a-f]{6}/i);
    expect(globalStyles).toContain(':focus-visible');
    expect(profile).toMatch(/@media\s*\(max-width:\s*48rem\)/);
    expect(profile).toMatch(
      /grid-template-columns:\s*15\.625rem minmax\(0,\s*1fr\);/,
    );
    expect(profile).toMatch(/gap:\s*4rem;/);
    expect(baseLayout).toContain('@fontsource-variable/newsreader');
    expect(baseLayout).toContain('@fontsource-variable/dm-sans');
  });

  it('keeps feature-owned selectors out of global CSS', () => {
    const globalStyles = readFileSync(join(projectRoot, 'src', 'styles', 'global.css'), 'utf8');

    [
      'site-header',
      'site-name',
      'site-nav',
      'site-footer',
      'profile',
      'research-field',
      'interest-list',
      'latest-section',
      'project-list',
      'project-row',
      'update-list',
      'update-row',
      'content-page',
      'elsewhere-entry',
    ].forEach((selector) => expect(globalStyles).not.toContain(`.${selector}`));
  });

  it('keeps homepage components data-free and driven by explicit props', () => {
    const homeRoot = join(projectRoot, 'src', 'components', 'home');
    const components = [
      'ProfileIntro.astro',
      'ResearchInterests.astro',
      'LatestWork.astro',
      'LatestUpdates.astro',
    ];

    components.forEach((component) => {
      const source = readFileSync(join(homeRoot, component), 'utf8');
      expect(source).not.toMatch(/from ['"][^'"]*(?:i18n\/en|config\/site)['"]/);
      expect(source).not.toMatch(/\bget(?:Collection|Entry|Entries)\s*\(/);
      expect(source).toContain('interface Props');
    });
  });

  it('connects collection uniqueness checks to every build-time query path', () => {
    const homepage = readFileSync(join(projectRoot, 'src', 'pages', 'index.astro'), 'utf8');
    const workArchive = readFileSync(
      join(projectRoot, 'src', 'pages', 'work', 'index.astro'),
      'utf8',
    );
    const workDetails = readFileSync(
      join(projectRoot, 'src', 'pages', 'work', '[slug].astro'),
      'utf8',
    );
    const updatesArchive = readFileSync(
      join(projectRoot, 'src', 'pages', 'updates', 'index.astro'),
      'utf8',
    );
    const elsewhereArchive = readFileSync(
      join(projectRoot, 'src', 'pages', 'elsewhere', 'index.astro'),
      'utf8',
    );

    expect(homepage).toMatch(/assertUniqueProjectKeys\(projects\)/);
    expect(homepage).toMatch(/assertUniqueTranslationKeys\(updates,\s*'update'\)/);
    expect(workArchive).toMatch(/assertUniqueProjectKeys\(projects\)/);
    expect(workDetails).toMatch(/assertUniqueProjectKeys\(projects\)/);
    expect(updatesArchive).toMatch(/assertUniqueTranslationKeys\(updates,\s*'update'\)/);
    expect(elsewhereArchive).toMatch(
      /assertUniqueTranslationKeys\(elsewhere,\s*'elsewhere'\)/,
    );
  });

  it('uses the strict reusable Elsewhere date schema without coercion', () => {
    const contentConfig = readFileSync(
      join(projectRoot, 'src', 'content.config.ts'),
      'utf8',
    );
    const dateSchemaPath = join(projectRoot, 'src', 'lib', 'content-schema.ts');

    expect(existsSync(dateSchemaPath)).toBe(true);
    if (!existsSync(dateSchemaPath)) return;
    const dateSchema = readFileSync(dateSchemaPath, 'utf8');
    expect(contentConfig).toContain('date: elsewhereDateSchema');
    expect(contentConfig).not.toContain('z.coerce.date()');
    expect(dateSchema).toContain('z.iso.date()');
    expect(dateSchema).toContain("new Date(`${value}T00:00:00.000Z`)");
  });

  it('keeps the latest updates section conditional and self-contained', () => {
    const indexPage = readFileSync(join(projectRoot, 'src', 'pages', 'index.astro'), 'utf8');
    const latestUpdates = readFileSync(
      join(projectRoot, 'src', 'components', 'home', 'LatestUpdates.astro'),
      'utf8',
    );

    expect(indexPage).toMatch(/latestUpdates\.length\s*>\s*0\s*&&\s*\(?\s*<LatestUpdates/);
    expect(latestUpdates).toContain('border-top: 1px solid var(--color-rule);');
    expect(latestUpdates).not.toContain('+ .latest-section');
  });

  it('gives reusable records explicit typed heading levels', () => {
    const projectRow = readFileSync(
      join(projectRoot, 'src', 'components', 'content', 'ProjectRow.astro'),
      'utf8',
    );
    const updateList = readFileSync(
      join(projectRoot, 'src', 'components', 'content', 'UpdateList.astro'),
      'utf8',
    );

    expect(projectRow).toContain("CollectionEntry<'projects'>");
    expect(projectRow).toMatch(/headingLevel:\s*2\s*\|\s*3/);
    expect(updateList).toContain("CollectionEntry<'updates'>");
    expect(updateList).toMatch(/headingLevel:\s*2\s*\|\s*3/);
  });

  it('passes all homepage record and accessibility labels explicitly', () => {
    const indexPage = readFileSync(join(projectRoot, 'src', 'pages', 'index.astro'), 'utf8');
    const latestWork = readFileSync(
      join(projectRoot, 'src', 'components', 'home', 'LatestWork.astro'),
      'utf8',
    );
    const projectRow = readFileSync(
      join(projectRoot, 'src', 'components', 'content', 'ProjectRow.astro'),
      'utf8',
    );
    const profile = readFileSync(
      join(projectRoot, 'src', 'components', 'home', 'ProfileIntro.astro'),
      'utf8',
    );
    const research = readFileSync(
      join(projectRoot, 'src', 'components', 'home', 'ResearchInterests.astro'),
      'utf8',
    );

    expect(indexPage).toMatch(
      /<ProfileIntro\s+identity=\{site\}\s+copy=\{en\.profile\}\s+portrait=\{portrait\}\s*\/>/,
    );
    expect(indexPage).toMatch(
      /<ResearchInterests\s+copy=\{en\.research\}\s+image=\{researchImage\}\s*\/>/,
    );
    expect(indexPage).toMatch(
      /<LatestWork[\s\S]*?title=\{en\.work\.title\}[\s\S]*?allProjectsLabel=\{en\.work\.allProjects\}[\s\S]*?codeLabel=\{en\.links\.code\}[\s\S]*?\/>/,
    );
    expect(indexPage).toMatch(
      /<LatestUpdates[\s\S]*?title=\{en\.updates\.title\}[\s\S]*?allUpdatesLabel=\{en\.updates\.allUpdates\}[\s\S]*?\/>/,
    );
    expect(latestWork).toContain('allProjectsLabel: string');
    expect(latestWork).toContain('codeLabel: string');
    expect(projectRow).toContain('codeLabel: string');
    expect(projectRow).not.toContain('>Code</a>');
    expect(profile).toContain('portraitAlt: string');
    expect(profile).toContain('emailLabel: string');
    expect(profile).toContain('githubLabel: string');
    expect(research).toContain('interestsLabel: string');
  });

  it('uses the content-width shell for wide archive pages and metadata config values', () => {
    const contentLayout = readFileSync(join(projectRoot, 'src', 'layouts', 'ContentLayout.astro'), 'utf8');
    const workDetail = readFileSync(join(projectRoot, 'src', 'pages', 'work', '[slug].astro'), 'utf8');
    const footer = readFileSync(join(projectRoot, 'src', 'components', 'layout', 'SiteFooter.astro'), 'utf8');

    expect(contentLayout).toContain('content-page--wide');
    expect(contentLayout).toContain('--content-width');
    expect(contentLayout).toContain('.content-page__body > :global(h2)');
    expect(contentLayout).toContain('.content-page__header > p');
    expect(contentLayout).not.toContain('.content-page__meta');
    expect(workDetail).toContain('en.metadata.year');
    expect(workDetail).toContain('en.metadata.role');
    expect(workDetail).toContain('en.metadata.topics');
    expect(workDetail).toContain('en.links.code');
    expect(workDetail).toContain('.content-page__meta');
    expect(footer).toContain('site.name');
    expect(footer).toContain('site.location');
    expect(footer).toContain('site.email');
    expect(footer).toContain('site.github');
    expect(footer).toContain('new Date().getFullYear()');
  });

  it('keeps classified record metadata visible without competing selector specificity', () => {
    const projectRow = readFileSync(
      join(projectRoot, 'src', 'components', 'content', 'ProjectRow.astro'),
      'utf8',
    );
    const updateList = readFileSync(
      join(projectRoot, 'src', 'components', 'content', 'UpdateList.astro'),
      'utf8',
    );

    expect(projectRow).toContain('.project-row__meta .project-row__classification');
    expect(projectRow).not.toContain('!important');
    expect(updateList).toContain('.update-row > .update-row__meta');
    expect(updateList).toMatch(/\.update-row\s*>\s*\.update-row__meta\s*\{[\s\S]*font-size:\s*0\.86rem;/);
  });

  it('keeps update metadata on one desktop line and preserves the single-column mobile grid', () => {
    const updateList = readFileSync(
      join(projectRoot, 'src', 'components', 'content', 'UpdateList.astro'),
      'utf8',
    );

    expect(updateList).toMatch(
      /\.update-row\s*\{[^}]*grid-template-columns:\s*9rem minmax\(0,\s*0\.7fr\) minmax\(0,\s*1fr\);[^}]*\}/,
    );
    expect(updateList).toMatch(
      /\.update-row\s*>\s*\.update-row__meta\s*\{[^}]*white-space:\s*nowrap;[^}]*\}/,
    );
    expect(updateList).toMatch(
      /@media\s*\(max-width:\s*48rem\)\s*\{[\s\S]*?\.update-row\s*\{[^}]*grid-template-columns:\s*1fr;[^}]*\}[\s\S]*?\}/,
    );
  });

  it('limits content typography rules to direct body children', () => {
    const contentLayout = readFileSync(
      join(projectRoot, 'src', 'layouts', 'ContentLayout.astro'),
      'utf8',
    );

    expect(contentLayout).toMatch(/\.content-page__body\s*>\s*:global\(h2\)\s*\{/);
    expect(contentLayout).toMatch(/\.content-page__body\s*>\s*:global\(h3\)\s*\{/);
    expect(contentLayout).toMatch(
      /\.content-page__body\s*>\s*:global\(p\),\s*\.content-page__body\s*>\s*:global\(ul\),\s*\.content-page__body\s*>\s*:global\(ol\)\s*\{/,
    );
    expect(contentLayout).not.toMatch(
      /\.content-page__body\s+(?!>)[^{]*:global\((?:h2|h3|p|ul|ol)\)/,
    );
  });

  it('centralizes the accurate Elsewhere description', () => {
    const locale = readFileSync(join(projectRoot, 'src', 'i18n', 'en.ts'), 'utf8');
    const page = readFileSync(join(projectRoot, 'src', 'pages', 'elsewhere', 'index.astro'), 'utf8');

    expect(locale).toContain("description: 'Notes on music and other interests.'");
    expect(page).toContain('en.elsewhere.description');
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
        'three',
        'rive-js',
        '@rive-app/canvas',
        'tsparticles',
        '@tsparticles/engine',
      ]),
    );
    expect(dependencyNames.some((name) => /(^three(?:-|$)|^@rive-app\/|particle)/i.test(name))).toBe(false);
  });
});
