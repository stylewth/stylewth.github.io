import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const outputPath = join(process.cwd(), 'dist', 'index.html');
let html = '';

beforeAll(() => {
  expect(existsSync(outputPath), 'dist/index.html must be produced by npm run build:site').toBe(true);
  html = readFileSync(outputPath, 'utf8');
});

function sectionPosition(id: string): number {
  return html.indexOf(`id="${id}"`);
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
    expect(html).toMatch(/<link rel="icon"[^>]+href="\/favicon\.svg"/);
    expect(html).not.toMatch(/<script(?![^>]*type="application\/ld\+json")[^>]*>/);
  });

  it('renders the no-JavaScript site shell and one homepage heading', () => {
    expect(html).toMatch(/<a[^>]+href="\/"[^>]*>Home<\/a>/);
    expect(html).toMatch(/<a[^>]+href="\/#latest-work"[^>]*>Work<\/a>/);
    expect(html).toMatch(/<a[^>]+href="\/#latest-updates"[^>]*>Updates<\/a>/);
    expect(html).toMatch(/<a[^>]+href="\/elsewhere\/"[^>]*>Elsewhere<\/a>/);
    expect(html.match(/<h1(?:\s|>)/g) ?? []).toHaveLength(1);
    expect(html).toContain('mailto:202464871049@mail.scut.edu.cn');
    expect(html).toContain('https://github.com/stylewth');
    expect(html).toContain('Guangzhou, China');
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

  it('renders exactly two selected projects and three newest updates', () => {
    expect(html.match(/class="project-row"/g) ?? []).toHaveLength(2);
    expect(html.match(/class="update-row"/g) ?? []).toHaveLength(3);
    expect(html.indexOf('SparseNavWM')).toBeLessThan(html.indexOf('Dynamic EVRP'));
    expect(html.indexOf('Completed SparseNavWM')).toBeLessThan(
      html.indexOf('MCM Honorable Mention'),
    );
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
