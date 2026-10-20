# In Passing Photography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Independent asset and UI tasks may run in parallel; integration and verification are sequential.

**Goal:** Implement the approved second design as a lightweight, original-aspect-ratio portfolio of exactly 24 photographs at /photos/.

**Architecture:** Existing Astro static site, static public image derivatives, one route-local gallery custom element and native dialog. Only the Photos page uses a wide header and compact mobile navigation; other routes preserve their current layout. An isolated worktree contains a copy of existing uncommitted changes as a baseline; only photography-owned additions and explicitly listed integration files return to the main checkout.

**Tech Stack:** Existing Astro, TypeScript, sharp (already available through Astro), Vitest + happy-dom; no added client framework or animation dependencies.

Approved spec: E:/资料/个人/摄影作品集设计/设计方案.md
Approved visual: E:/资料/个人/摄影作品集设计/视觉稿.png
Selection: E:/资料/个人/摄影作品集设计/24张策展清单.csv
Source photos: D:/图片/精选作品
Worktree: E:/资料/个人/stylewth.github.io/.worktrees/photos-in-passing

## Task 1: Original photo derivatives and publishing manifest

Owner: assets agent. Only edit scripts/prepare-photography.mjs, src/data/photography.json, public/images/photography/**, docs/performance/2026-10-08-photography-images.json, and the photography image maintenance section of README if coordinated with the UI agent.

- [x] Read the 24-row CSV and source-root category/filename paths; verify all originals and exactly 24 unique stable ids.
- [x] Create a reproducible preparation script using installed sharp. Source locations are CLI inputs and never occur in the public JSON.
- [x] Auto-orient, convert color profile for web display, generate 640/1000/1600px-wide WebP variants without enlargement, a 1600px JPEG fallback and a JPEG with longest edge at most 2400px for click-to-view. Retain original composition and do not touch source files. Strip unnecessary EXIF by default.
- [x] Publish JSON as an array of records: id, order, title, category, series, width, height, alt, src, fallback, srcSet, fullSrc. width/height are auto-oriented original dimensions. src is the 1000px WebP; fallback is the 1600px JPEG; srcSet lists the three WebP variants with width descriptors; fullSrc is the 2400-edge JPEG. Public URLs use /images/photography/photo-001/... and correspond to real files.
- [x] Use factual alt descriptions grounded in the supplied selection notes/images.
- [x] Audit all output dimensions, ratios, bytes and lack of EXIF; record byte totals and hashes of originals before/after. Report actual gallery and viewer totals.
- [x] Return the final manifest interface and exact command for regeneration.

## Task 2: Gallery, accessible viewer and restrained navigation integration

Owner: UI agent. Only edit src/pages/photos/index.astro, src/components/photography/**, src/scripts/photography-gallery.ts and its tests, src/lib/photography.ts and its tests if useful, tests/photography-output.test.ts, plus src/components/layout/SiteHeader.astro, SiteFooter.astro, src/layouts/BaseLayout.astro, src/i18n/en.ts, src/pages/elsewhere/index.astro, and narrowly targeted existing tests/site-output.test.ts expectations. Preserve all existing research changes.

- [x] Write meaningful failing interaction tests for series filtering, viewer navigation within the current filtered set, start/end buttons, image-load failure/retry, focus restoration and closing; run the focused test and capture the expected failure before implementation.
- [x] Add /photos/ with canonical metadata, exactly one h1, lang=zh-CN on the gallery, 24 unique figure/caption records, real picture/source/img markup and a direct full-image link fallback.
- [x] Match approved second design: small 途中 / In Passing left rail, four plain text series links + 全部, panorama first, portrait/landscape staggered next row, varied later layouts, full original aspect ratios, titles below images. No counts/tabs/search/archive/pills or injected decorative copy.
- [x] Use one list with DOM order matching selection order. Reflow filtered visible cards without empty holes or forced crop. Below 768px use full-width single column and a native/select-like series selector hidden until enhancement; without JS all photos and fallback image links still work.
- [x] Add one native dialog with close/previous/next buttons and caption position, keyboard arrows/Escape, native modal focus containment and trigger focus restoration. Full image loads only on opening/navigation; switching/loading/error must not display stale previous artwork. Use current gallery preview as initial display and retry on failed full image.
- [x] Ensure cleanup, safe repeated initialization, normal modifier-click behavior and reduced-motion transitions. Do not require gestures.
- [x] Add Photos to existing site navigation and a short Photos entry on Elsewhere. Accept optional photography=true prop through BaseLayout to SiteHeader/SiteFooter; only photo page uses widened shell, native details mobile Menu, and restrained white footer. Preserve script-free navigation on all other routes.
- [x] Extend existing production route script whitelist by photos/index.html only. Generalize existing internal href resolver to support published image asset links as well as HTML routes; do not weaken existence validation.
- [x] Add output assertions for 24 unique photos, one priority cover and 23 lazy images, no full image eagerly loaded, valid source assets, canonical /photos/, sitemap entry and no desktop/mobile duplicate photo figures.
- [x] Run focused tests and npm run check; report all edited files and any unresolved issues.

## Task 3: Verify complete site and inspect actual page

Owner: main agent; code fixes delegated to the owning agent.

- [x] Run npm run build in the worktree; inspect errors and resolve issues introduced by this work.
- [x] Review diff against both approved visual and pre-existing baseline, not merely agent summaries.
- [x] Start local preview. Use available CUA browser to inspect desktop and mobile if supported, plus filtering, dialog navigation/close, and request behavior. If CUA unavailable, verify static output and actual image dimensions/JS integration; report the exact limitation instead of claiming browser checks.
- [x] Check generated script size and photography image budgets using build assets; ensure no added dependencies.
- [x] Request an independent code review of photography-owned files if needed and repair actionable findings.

## Task 4: Integrate only verified photography changes and clean up

Owner: integration agent, authorized after main review.

- [x] Compare the listed integration files in the original checkout against E:/资料/个人/摄影作品集设计/实施前文件校验.json before overwriting. If any changed since the snapshot, preserve those changes and apply only the photography edits.
- [x] Copy new photography-owned files and approved integration files into the original checkout. Copy plan/spec and audit docs as documentation only. Do not copy dist, .astro, .env, node_modules or unrelated baseline changes.
- [x] Run npm run build in original checkout and verify /photos/ response.
- [x] Save verified desktop/mobile screenshots if browser supports capture. Mark the plan completed with actual verification evidence.
- [x] Remove only task-owned temporary files and the disposable photography worktree after integration is verified; keep the working original site and delivered design artifacts.
- [x] Leave changes local for user review; no publication, push, PR or unrelated commits.
## 完成记录 · 2026-10-08

已将第二个设计接入本地原网站 `/photos/`，限定 24 张作品，使用四个专题和按原比例呈现的错落布局。

最终原目录 `npm run build` 退出码 0：Astro 检查 0 errors / 0 warnings / 0 hints；93 项单元测试、59 项静态产物和源码契约测试通过。

浏览器验证：1440px 桌面、768px 平板、390px 手机及 320px 窄屏；摄影专题筛选、手机导航、横幅与竖幅观看器、方向键、Esc、原点击作品焦点恢复均核对。320px 的 Photos 和 Elsewhere 页面没有横向溢出。

24 张原片前后哈希一致，120 个衍生文件哈希与审计记录一致；独立重新编码 24 个 640px WebP 后逐一匹配，无来源错误。原目录既有的 21 个非摄影改动文件哈希保持不变，138 个集成文件来源/目标哈希匹配。

WebP 单一规格合计：640px 1,355,328 B；1000px 2,969,960 B；1600px 6,779,318 B。观看器 JPEG 仅在打开时加载。Photos 路由脚本 4,610 B，gzip 1,426 B；没有增加依赖。

实际效果图保存在设计目录：`网站实际效果-桌面.jpg`、`网站实际效果-手机.jpg`。本地预览：http://127.0.0.1:4327/photos/。临时 worktree 与任务分支已清理；清理中被目录链接移除的本地依赖已通过原锁文件 `npm ci` 恢复，再次完成了上述最终构建。

改动保留在本地，未提交、推送或发布。

## 用户追加改进：专题从头浏览、单图行居中

- [x] 用户点击桌面专题或切换手机专题菜单后，立即回到页面顶部，从第一张作品开始；初始化不主动重置滚动位置，保留正常修改键点击行为。
- [x] 保留单一作品列表和现有照片宽度/组合错落，把每个只有一张照片的 flex 行统一居中；不添加布局脚本或更换照片，手机保持单列。
- [x] 回归验证桌面和手机的切换滚动、所有四个专题/全部的单图行居中、组合保留错落、原比例和观看器功能；完成整站构建。
追加改进验证完成：`npm run build` 退出码 0，Astro 检查无诊断，95 项单元测试和 59 项静态产物/源码检查通过。1440px 桌面实际从 scrollY=12391 切换专题后回到 0；全部和四个专题的所有单图行相对作品区中心误差低于 0.007px，多图组合仍保留错落。1024px 平板复核通过；390px 手机从非零滚动位置切换菜单后回到 0，无横向溢出。初始化不重置滚动位置，修饰键点击保留正常行为。更新了桌面截图，并新增 `网站实际效果-单图居中.jpg`。
