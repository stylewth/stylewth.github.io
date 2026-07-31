import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const outputDirectory = join(process.cwd(), 'dist');
const outputPath = join(outputDirectory, 'index.html');
let html = '';

beforeAll(() => {
  expect(existsSync(outputPath), 'dist/index.html must be produced by npm run build:site').toBe(true);
  html = readFileSync(outputPath, 'utf8');
});

function sectionPosition(id: string): number {
  return html.indexOf(`id="${id}"`);
}

function readOutput(path: string): string {
  const outputPath = join(outputDirectory, path);
  expect(existsSync(outputPath), `dist/${path} must be produced by npm run build:site`).toBe(true);
  return readFileSync(outputPath, 'utf8');
}

function outputHtmlFiles(directory = outputDirectory): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return outputHtmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

function outputPathForRootLink(href: string): string {
  if (href === '/') return join(outputDirectory, 'index.html');
  if (href.endsWith('.html')) return join(outputDirectory, href.slice(1));
  return join(outputDirectory, href.slice(1), 'index.html');
}

function executableScripts(page: string): string[] {
  return page.match(/<script(?![^>]*type="application\/ld\+json")[^>]*>/g) ?? [];
}

function expectDocumentShell(
  page: string,
  canonicalPath: string,
  title: string,
  executableScriptCount = 0,
): void {
  expect(page).toContain(`<title>${title}</title>`);
  expect(page).toContain(
    `<link rel="canonical" href="https://stylewth.github.io${canonicalPath}">`,
  );
  expect(page.match(/<h1(?:\s|>)/g) ?? []).toHaveLength(1);
  expect(executableScripts(page)).toHaveLength(executableScriptCount);
}

function expectNoHeadingLevelSkips(page: string): void {
  const headings = [...page.matchAll(/<h([1-6])(?:\s|>)/g)].map((match) => Number(match[1]));

  headings.slice(1).forEach((level, index) => {
    expect(level).toBeLessThanOrEqual(headings[index] + 1);
  });
}

function elementFragments(page: string, tag: 'article' | 'li', className: string): string[] {
  return page.match(new RegExp(`<${tag} class="${className}"[^>]*>[\\s\\S]*?</${tag}>`, 'g')) ?? [];
}

describe('homepage output', () => {
  it('publishes complete metadata without executable scripts', () => {
    expect(html).toContain('<title>Tenghao Wang | Academic Portfolio</title>');
    expect(html).toMatch(
      /<link rel="canonical" href="https:\/\/stylewth\.github\.io\/">/,
    );
    expect(html).toMatch(
      /<meta property="og:title" content="Tenghao Wang \| Academic Portfolio">/,
    );
    expect(html).toMatch(
      /<meta property="og:url" content="https:\/\/stylewth\.github\.io\/">/,
    );
    expect(html).toMatch(/<meta name="twitter:card" content="summary">/);
    expect(html).not.toMatch(/<meta property="og:image"/);
    expect(html).toMatch(/<link rel="icon"[^>]+href="\/favicon\.svg"/);
    expect(html).not.toMatch(/<script(?![^>]*type="application\/ld\+json")[^>]*>/);
  });

  it('publishes a parseable Person JSON-LD record for the public profile', () => {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match?.[1]).toBeTruthy();

    const person = JSON.parse(match![1]) as Record<string, unknown>;
    expect(person['@type']).toBe('Person');
    expect(person.name).toBe('Tenghao Wang');
    expect(person.url).toBe('https://stylewth.github.io');
    expect(person.affiliation).toEqual({
      '@type': 'CollegeOrUniversity',
      name: 'South China University of Technology',
    });
    expect(person.sameAs).toContain('https://github.com/stylewth');
    expect(person.knowsAbout).toEqual([
      'World models',
      'Multimodal learning',
      'Predictive planning',
    ]);
  });

  it('renders the no-JavaScript site shell and one homepage heading', () => {
    expect(html).toMatch(/<a[^>]+href="\/"[^>]*>Home<\/a>/);
    expect(html).toMatch(/<a[^>]+href="\/work\/"[^>]*>Work<\/a>/);
    expect(html).toMatch(/<a[^>]+href="\/updates\/"[^>]*>Updates<\/a>/);
    expect(html).toMatch(/<a[^>]+href="\/elsewhere\/"[^>]*>Elsewhere<\/a>/);
    expect(html.match(/<h1(?:\s|>)/g) ?? []).toHaveLength(1);
    expect(html).toContain('mailto:202464871049@mail.scut.edu.cn');
    expect(html).toContain('https://github.com/stylewth');
    expect(html).toContain('Guangzhou, China');
    expect(html).toContain('© 2026 Tenghao Wang');
  });

  it('keeps the four homepage sections in the approved order', () => {
    const ids = ['profile', 'research-interests', 'latest-work', 'latest-updates'];
    const positions = ids.map(sectionPosition);

    positions.forEach((position) => expect(position).toBeGreaterThan(-1));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('uses the approved public profile and research copy', () => {
    expect(html).toContain(
      'Undergraduate in Artificial Intelligence at South China University of Technology',
    );
    expect(html).toContain(
      'I am an undergraduate in Artificial Intelligence at South China University of Technology. I am interested in world models and multimodal learning, especially how models can build useful internal representations from partial observations.',
    );
    expect(html).toContain(
      'My current work explores visual prediction, action-conditioned dynamics, and the connection between learned representations and planning.',
    );
    expect(html).toContain('World representations');
    expect(html).toContain('Multimodal grounding');
    expect(html).toContain('Predictive planning');
  });

  it('renders an academic profile hierarchy with direct contact links', () => {
    const profileStart = sectionPosition('profile');
    const profileEnd = html.indexOf('</section>', profileStart);
    const profile = html.slice(profileStart, profileEnd);

    expect(profile).toMatch(/<h1[^>]*>Tenghao Wang<\/h1>/);
    expect(profile).toMatch(
      /<p class="profile__role"[^>]*>Undergraduate in Artificial Intelligence at South China University of Technology<\/p>/,
    );
    expect(profile).toMatch(/<a href="mailto:202464871049@mail\.scut\.edu\.cn"[^>]*>Email<\/a>/);
    expect(profile).toMatch(/<a href="https:\/\/github\.com\/stylewth"[^>]*>GitHub<\/a>/);
    expect(profile).not.toContain('Academic portfolio');
  });

  it('uses a compact academic profile heading and a dynamic viewport height', () => {
    const profileStyles = readFileSync(
      join(process.cwd(), 'src', 'components', 'home', 'ProfileIntro.astro'),
      'utf8',
    );
    const desktopProfile = profileStyles.match(/\.profile\s*\{([^}]*)\}/s)?.[1] ?? '';
    const profileHeading = profileStyles.match(/\.profile h1\s*\{([^}]*)\}/s)?.[1] ?? '';

    expect(profileHeading).toMatch(/font-size:\s*clamp\(40px,\s*4vw,\s*42px\);/);
    expect(desktopProfile).toMatch(/min-height:\s*min\(47rem,\s*calc\(100dvh - 4\.75rem\)\);/);
  });

  it('renders exactly two selected projects and three newest updates', () => {
    expect(html.match(/class="project-row"/g) ?? []).toHaveLength(2);
    expect(html.match(/class="update-row"/g) ?? []).toHaveLength(3);
    expect(html.indexOf('SparseNavWM')).toBeLessThan(html.indexOf('Dynamic EVRP'));
    expect(html.indexOf('Completed SparseNavWM')).toBeLessThan(
      html.indexOf('MCM Honorable Mention'),
    );
  });

  it('uses nested record headings and exposes project and update classifications', () => {
    const projectRows = elementFragments(html, 'article', 'project-row');
    const updateRows = elementFragments(html, 'li', 'update-row');
    const sparseNavwm = projectRows.find((row) => row.includes('SparseNavWM'));
    const dynamicEvrp = projectRows.find((row) => row.includes('Dynamic EVRP'));
    const sparseUpdate = updateRows.find((row) => row.includes('Completed SparseNavWM'));

    expectNoHeadingLevelSkips(html);
    expect(sparseNavwm).toContain('research');
    expect(sparseNavwm).toContain('completed');
    expect(dynamicEvrp).toContain('engineering');
    expect(dynamicEvrp).toContain('completed');
    expect(sparseUpdate).toMatch(/<time[^>]*>2026-06<\/time>[\s\S]*?<span[^>]*>project<\/span>/);
    expect(html).toMatch(/<a[^>]+href="\/work\/"[^>]*>All projects<\/a>/);
    expect(html).toMatch(/<a[^>]+href="\/updates\/"[^>]*>All updates<\/a>/);
  });

  it('emits the portrait before the rabbit field with modern image sources', () => {
    const portraitPosition = html.indexOf('alt="Portrait of Tenghao Wang"');
    const rabbitPosition = html.indexOf('data-rabbit-field');
    const portraitPictureEnd = html.indexOf('</picture>', portraitPosition);
    const portraitPicture = html.slice(
      html.lastIndexOf('<picture', portraitPosition),
      portraitPictureEnd,
    );
    const rabbitPictureEnd = html.indexOf('</picture>', rabbitPosition);
    const rabbitPicture = html.slice(rabbitPosition, rabbitPictureEnd);

    expect(portraitPosition).toBeGreaterThan(-1);
    expect(rabbitPosition).toBeGreaterThan(portraitPosition);
    expect(portraitPicture).toContain('type="image/avif"');
    expect(portraitPicture).toContain('type="image/webp"');
    expect(portraitPicture).toContain('loading="eager"');
    expect(portraitPicture).toContain('fetchpriority="high"');
    expect(rabbitPicture).toMatch(/\salt(?:=""|\s)/);
    expect(rabbitPicture).toContain('type="image/avif"');
    expect(rabbitPicture).toContain('type="image/webp"');
    expect(rabbitPicture).toContain('loading="lazy"');
  });

  it('excludes private details, prohibited effects, and dash glyphs', () => {
    expect(html).not.toContain('18138390826');
    expect(html).not.toContain('GPA');
    expect(html).not.toContain('Download CV');
    expect(html).not.toContain('gradient(');
    expect(html).not.toContain('filter:');
    expect(html).not.toContain('mix-blend-mode');
    expect(html).not.toContain('\u2013');
    expect(html).not.toContain('\u2014');
  });
});

describe('production crawl and script contracts', () => {
  it('publishes a robots policy and sitemap index for the canonical site', () => {
    const robots = readOutput('robots.txt');
    const sitemapIndex = readOutput('sitemap-index.xml');

    expect(robots).toBe(
      'User-agent: *\nAllow: /\nSitemap: https://stylewth.github.io/sitemap-index.xml\n',
    );
    expect(sitemapIndex).toContain('https://stylewth.github.io/sitemap-0.xml');
  });

  it('keeps every generated root-relative navigation link inside the published site', () => {
    const links = outputHtmlFiles().flatMap((file) => {
      const page = readFileSync(file, 'utf8');
      return [...page.matchAll(/<a[^>]+href="(\/[^"?#]*)"/g)].map((match) => match[1]);
    });

    [...new Set(links)].forEach((href) => {
      expect(existsSync(outputPathForRootLink(href)), `${href} must resolve in dist`).toBe(true);
    });
  });

  it('ships one route-local interaction script only on Elsewhere', () => {
    outputHtmlFiles().forEach((file) => {
      const page = readFileSync(file, 'utf8');
      const relativePath = relative(outputDirectory, file).replaceAll('\\', '/');
      expect(executableScripts(page), relativePath).toHaveLength(
        relativePath === 'elsewhere/index.html' ? 1 : 0,
      );
    });
  });
});

describe('content archive output', () => {
  it('publishes a complete Work archive with internal project detail links', () => {
    const work = readOutput('work/index.html');

    expectDocumentShell(work, '/work/', 'Work | Tenghao Wang');
    expect(work).toMatch(/<a[^>]+href="\/work\/sparse-navwm\/"[^>]*>SparseNavWM<\/a>/);
    expect(work).toMatch(/<a[^>]+href="\/work\/dynamic-evrp\/"[^>]*>Dynamic EVRP<\/a>/);
    expect(work).toContain(
      'https://github.com/stylewth/Looking-Around-Before-Cropping-SparseNavWM',
    );
    expect(work).toContain('https://github.com/stylewth/EVRP-datastructure');
    expect(work).not.toMatch(/>Paper<\/a>|>Demo<\/a>|>Scholar<\/a>/);
    expect(work).toMatch(/<a[^>]+href="\/work\/"[^>]+aria-current="page"[^>]*>Work<\/a>/);
    expectNoHeadingLevelSkips(work);
    expect(work.indexOf('SparseNavWM')).toBeLessThan(work.indexOf('Dynamic EVRP'));
    const projectRows = elementFragments(work, 'article', 'project-row');
    const sparseNavwm = projectRows.find((row) => row.includes('SparseNavWM'));
    const dynamicEvrp = projectRows.find((row) => row.includes('Dynamic EVRP'));
    expect(sparseNavwm).toContain('research');
    expect(sparseNavwm).toContain('completed');
    expect(dynamicEvrp).toContain('engineering');
    expect(dynamicEvrp).toContain('completed');
  });

  it('publishes dynamic project details from the full Markdown bodies', () => {
    const sparseNavwm = readOutput('work/sparse-navwm/index.html');
    const dynamicEvrp = readOutput('work/dynamic-evrp/index.html');

    expectDocumentShell(sparseNavwm, '/work/sparse-navwm/', 'SparseNavWM | Tenghao Wang');
    expectDocumentShell(dynamicEvrp, '/work/dynamic-evrp/', 'Dynamic EVRP | Tenghao Wang');
    expect(sparseNavwm).toContain('SparseNavWM studies action-conditioned prediction');
    expect(dynamicEvrp).toContain('Dynamic electric vehicle routing needs a simulation environment');
    expect(sparseNavwm).toContain('>Code</a>');
    expect(dynamicEvrp).toContain('>Code</a>');
  });

  it('publishes Updates in newest-first order and resolves archive navigation', () => {
    const updates = readOutput('updates/index.html');

    expectDocumentShell(updates, '/updates/', 'Updates | Tenghao Wang');
    expect(updates.indexOf('Completed SparseNavWM')).toBeLessThan(
      updates.indexOf('Completed Dynamic EVRP'),
    );
    expect(updates.indexOf('Completed Dynamic EVRP')).toBeLessThan(
      updates.indexOf('MCM Honorable Mention'),
    );
    expect(updates).toMatch(/<a[^>]+href="\/updates\/"[^>]+aria-current="page"[^>]*>Updates<\/a>/);
    expectNoHeadingLevelSkips(updates);
    const updateRows = elementFragments(updates, 'li', 'update-row');
    const sparseUpdate = updateRows.find((row) => row.includes('Completed SparseNavWM'));
    expect(sparseUpdate).toMatch(/<time[^>]*>2026-06<\/time>[\s\S]*?<span[^>]*>project<\/span>/);
  });

  it('publishes Top 10 collections before the existing Notes archive', () => {
    const elsewhere = readOutput('elsewhere/index.html');

    expectDocumentShell(elsewhere, '/elsewhere/', 'Elsewhere | Tenghao Wang', 1);
    expect(elsewhere).toMatch(/<script[^>]+type="module"[^>]*>/);
    expect(elsewhere).toContain('<favorites-stage');
    expect(elsewhere.match(/<ol[^>]+data-favorite-list=/g) ?? []).toHaveLength(2);
    expect(elsewhere.match(/class="favorite-card"/g) ?? []).toHaveLength(20);
    expect(elsewhere.match(/data-favorite-kind="film"/g) ?? []).toHaveLength(10);
    expect(elsewhere.match(/data-favorite-kind="album"/g) ?? []).toHaveLength(10);
    expect(elsewhere).toContain('role="tablist"');
    expect(elsewhere).toContain('aria-selected="true"');
    expect(elsewhere).toContain('Movies');
    expect(elsewhere).toContain('Albums');
    expect(elsewhere).toContain('Taxi Driver');
    expect(elsewhere).toContain('The Dark Side of the Moon');
    expect(elsewhere).toContain('1976');
    expect(elsewhere).toContain('Martin Scorsese');
    expect(
      elsewhere.match(
        /<img(?=[^>]+src="https:\/\/(?:image\.tmdb\.org|i\.scdn\.co|image-cdn-[a-z0-9-]+\.spotifycdn\.com)\/)[^>]*>/g,
      ) ?? [],
    ).toHaveLength(20);
    expect(
      elsewhere.match(/data-favorite-source="https:\/\/www\.themoviedb\.org\/movie\//g) ?? [],
    ).toHaveLength(10);
    expect(
      elsewhere.match(/data-favorite-source="https:\/\/open\.spotify\.com\/album\//g) ?? [],
    ).toHaveLength(10);
    expect(
      elsewhere.match(
        /<img(?=[^>]+src="https:\/\/image\.tmdb\.org\/t\/p\/w500\/)(?=[^>]+srcset="https:\/\/image\.tmdb\.org\/t\/p\/w342\/)[^>]*>/g,
      ) ?? [],
    ).toHaveLength(10);
    expect(elsewhere).toMatch(
      /<div class="favorite-dialog__art" data-favorite-dialog-art[^>]*><\/div>\s*<div class="favorite-dialog__caption"[^>]*>/,
    );
    expect(elsewhere).not.toContain('One-line review');
    expect(elsewhere).not.toMatch(/data-favorite-review="[^"]+"/);
    expect(elsewhere.indexOf('Top tens')).toBeLessThan(elsewhere.indexOf('>Notes<'));
    expect(elsewhere.indexOf('>Notes<')).toBeLessThan(
      elsewhere.indexOf('Pink Floyd, The Beatles, Radiohead, and The Smashing Pumpkins'),
    );
    expect(elsewhere).toMatch(
      /<a[^>]+href="\/elsewhere\/"[^>]+aria-current="page"[^>]*>Elsewhere<\/a>/,
    );
    expectNoHeadingLevelSkips(elsewhere);
  });

  it('renders provider credits after the collections without bundling favorite covers', () => {
    const elsewhere = readOutput('elsewhere/index.html');
    const favoriteImages =
      elsewhere.match(
        /<img(?=[^>]+src="https:\/\/(?:image\.tmdb\.org|i\.scdn\.co|image-cdn-[a-z0-9-]+\.spotifycdn\.com)\/)[^>]*>/g,
      ) ?? [];

    expect(elsewhere).toContain(
      'This product uses the TMDB API but is not endorsed or certified by TMDB.',
    );
    expect(elsewhere).toMatch(
      /<a[^>]+href="https:\/\/www\.themoviedb\.org"[^>]*>[\s\S]*?<img[^>]+src="\/brands\/tmdb\.svg"/,
    );
    expect(elsewhere).toMatch(
      /<a[^>]+href="https:\/\/open\.spotify\.com"[^>]*>[\s\S]*?<img[^>]+src="\/brands\/spotify\.svg"/,
    );
    expect(elsewhere.indexOf('favorites-stage__credits')).toBeLessThan(elsewhere.indexOf('>Notes<'));
    expect(favoriteImages).toHaveLength(20);
    favoriteImages.forEach((image) => expect(image).not.toContain('/_astro/'));
  });

  it('keeps every favorite readable in the unenhanced document order', () => {
    const elsewhere = readOutput('elsewhere/index.html');
    const filmRanks = [
      ...elsewhere.matchAll(
        /data-favorite-kind="film"[\s\S]*?data-favorite-rank="(\d+)"/g,
      ),
    ].map((match) => Number(match[1]));
    const albumRanks = [
      ...elsewhere.matchAll(
        /data-favorite-kind="album"[\s\S]*?data-favorite-rank="(\d+)"/g,
      ),
    ].map((match) => Number(match[1]));

    expect(filmRanks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(albumRanks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const panels =
      elsewhere.match(
        /<section[^>]+data-favorite-panel="(?:film|album)"[^>]*>/g,
      ) ?? [];
    expect(panels).toHaveLength(2);
    panels.forEach((panel) => expect(panel).not.toMatch(/\shidden(?:\s|=|>)/));
    expect(elsewhere).toMatch(/<div[^>]+data-favorite-tabs[^>]*\shidden(?:\s|=|>)/);
    expect(
      elsewhere.match(
        /<button(?=[^>]*data-favorite-trigger)(?=[^>]*\sdisabled(?:\s|=|>))[^>]*>/g,
      ) ?? [],
    ).toHaveLength(20);
    expect(elsewhere.match(/<favorites-stage\b[^>]*>/)?.[0]).not.toContain('data-enhanced');
  });

  it('places dialog captions in a separate row below unmodified artwork', () => {
    const stage = readFileSync(
      join(process.cwd(), 'src', 'components', 'elsewhere', 'FavoritesStage.astro'),
      'utf8',
    );
    const cardRule = stage.match(/\.favorite-dialog__card\s*\{([^}]*)\}/s)?.[1] ?? '';
    const artRule = stage.match(/\.favorite-dialog__art\s*\{([^}]*)\}/s)?.[1] ?? '';
    const captionRule = stage.match(/\.favorite-dialog__caption\s*\{([^}]*)\}/s)?.[1] ?? '';

    expect(cardRule).toMatch(/grid-template-rows:\s*auto auto;/);
    expect(artRule).toMatch(/grid-row:\s*1;/);
    expect(captionRule).toMatch(/grid-row:\s*2;/);
    expect(captionRule).toMatch(/background:\s*var\(--color-paper\);/);
    expect(captionRule).not.toMatch(/grid-area:\s*1\s*\/\s*1|rgb\([^)]*\/\s*0\./);
  });

  it('uses the approved Elsewhere description', () => {
    const elsewhere = readOutput('elsewhere/index.html');

    expect(elsewhere).toContain('Notes on music and other interests.');
    expect(elsewhere).not.toContain('Notes on music, film, and other interests.');
  });

  it('publishes a minimal noindex 404 page', () => {
    const notFound = readOutput('404.html');

    expectDocumentShell(notFound, '/404.html', 'Page not found | Tenghao Wang');
    expect(notFound).toMatch(/<meta name="robots" content="noindex, nofollow">/);
    expect(notFound).toMatch(/<a[^>]+href="\/">Return home<\/a>/);
  });
});
