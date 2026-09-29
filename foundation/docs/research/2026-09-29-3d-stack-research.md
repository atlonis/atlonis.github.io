# Разведка 3D-стека для карты «Основания» (2026-09-29)

Три исследовательских агента: стеки, референсы, риски и библиотеки. Ниже сырые результаты без правок; решение по стеку принято отдельно в дизайн-доке.

## 1. Итог по стекам

**Рекомендация агента:** Vanilla three.js r186 (three@0.186.1) with WebGPURenderer imported from `three/webgpu` (automatic WebGL 2 fallback for pre-iOS-26 iPhones), TSL BloomNode via RenderPipeline for galaxy glow, plain TypeScript modules, a single `data/foundation.json` dataset, DOM/CSS2DRenderer overlay for the Russian-language entity cards, GSAP (free since April 2025) + CatmullRomCurve3 for the helix/tunnel timeline camera path, built with Vite 8 and deployed to GitHub Pages. Runner-up if a component model is preferred: React Three Fiber 9.8.1 + drei 10.7.9 on WebGLRenderer (not v10/drei 11 alphas), still on Vite 8.

**Обоснование:**

Ranking: 1) three.js vanilla 9/10, 2) R3F + drei 8, 3) Threlte 6.5, 4) TresJS 6, 5) Babylon.js 6, 6) PlayCanvas 5.5, 7) Three.js BLOCKS 5, 8) Needle 3.5, 9) Spline 3, 10) Wonderland 3, 11) Verge3D 2.5, 12) Godot web 2, 13) Unity web 1.5.

Why three.js wins for THIS project: (a) it is the library AI agents know best by a wide margin (~12.2M weekly downloads vs 315k Babylon / 57k PlayCanvas; official llms.txt since r183), which is the single biggest lever for a vibe-coded site; (b) 50-100 entities from JSON is a small scene, so a full engine (Babylon 1.8 MB gz, PlayCanvas 615 kB) buys nothing while costing iPhone load time — three is ~185 kB gz on WebGL or ~300 kB on the WebGPU path; (c) the two visual ideas (fly-to-planet galaxy, helix timeline the camera travels) are textbook three.js: Points/InstancedMesh for stars, CatmullRomCurve3 + GSAP for the path, CSS2DRenderer or a DOM overlay for cards, so no framework abstraction is needed; (d) HTML cards in the DOM give perfect Cyrillic typography, links, tags and accessibility for free, side-stepping the one WebGPU gap (troika text); (e) pure static ES modules with zero hosting requirements.

Why WebGPURenderer now: three.js's own guidance for new projects (2026) is to start with WebGPURenderer; Safari 26 (Sept 2025) enabled WebGPU on iOS/iPadOS/macOS, and one year on most iPhones are on iOS 26 while older ones transparently get the WebGL 2 backend. Rules to give the agent: import everything from `three/webgpu` (mixing with `three` bloats the bundle 220 -> 307 kB gz), use TSL/RenderPipeline instead of pmndrs/postprocessing or onBeforeCompile, keep a `?webgl` flag to force the WebGL2 backend when testing, clamp devicePixelRatio to 2, serve over HTTPS (GitHub Pages does).

Why not the others: R3F is a close second and would be first if the owner wants React, but in Sept 2026 the ecosystem is split (v9 stable/WebGL vs v10 alpha.5/WebGPU; drei 10 vs 11 alpha.7; @react-three/postprocessing WebGL-only), which is exactly the kind of version drift that trips coding agents; if chosen, pin v9 + drei 10 on WebGL. Threlte/TresJS are fine but have small corpora and Svelte-5-runes/Vue-renderer gotchas; Theatre.js (Threlte's camera tooling) moved development private. Babylon and PlayCanvas are excellent engines but heavy or niche for a data map. Spline's code/self-hosted export is paywalled to the $60/mo Max plan and free exports carry a watermark, so it cannot power a free static GitHub Pages site. Needle needs Unity/Blender and a Pro license for anything commercial. Godot web has no WebGPU, ~35 MB wasm, and documented iOS Safari OOM/crash issues; Unity web is experimental on WebGPU, memory-fragile on iPhone, and fights GitHub Pages compression headers. Wonderland and Verge3D are editor-first tools with tiny communities.

**Сборка:**

Vite 8 (stable March 12, 2026, Rolldown bundler, Node 20.19+/22.12+) with vanilla TypeScript, no UI framework. Reasoning: (1) an import-map CDN page (unpkg/jsdelivr pinned to three@0.186.1 with a `three/addons/` mapping) is fine for a one-evening prototype, but three.js's own docs steer most users to npm + a build tool because addons, GSAP, JSON imports, TypeScript types and version pinning get brittle on plain static hosting, and import maps cannot tree-shake (full `three/webgpu` ~300 kB gz vs ~190 kB gz tree-shaken); (2) Vite gives instant HMR for vibe-coding, `vite build` emits a plain dist/ that GitHub Pages serves with no headers (set `base: '/<repo>/'`), and Rolldown builds are 10-30x faster than Vite 7; (3) a full framework (Next/Nuxt/SvelteKit) adds SSR/hydration problems for a WebGL/WebGPU-only page (window undefined on the server) and is unnecessary for one canvas + a side panel driven by one JSON file. Suggested layout: src/main.ts (renderer + loop), src/scene/galaxy.ts, src/scene/timeline.ts (helix curve + camera rig), src/ui/cards.ts (DOM overlay, RU text), public/data/foundation.json, .github/workflows/pages.yml running `npm ci && npm run build` and deploying dist/. If React is chosen instead: `npm create vite@latest -- --template react-ts` + @react-three/fiber@9 + @react-three/drei@10, same GitHub Pages workflow; avoid Next.js.

### Кандидаты (по убыванию fit)

#### three.js (vanilla, WebGPURenderer + TSL) — fit 9/10

Версия: r186 = three@0.186.1 on npm (r186 published Sept 2026; exports three, three/webgpu, three/tsl, three/addons/*). Releases every 8-11 weeks.

Плюсы:
- Largest ecosystem by far: ~12.2M weekly npm downloads (Sept 15-21, 2026) vs 315k Babylon, 57k PlayCanvas
- Ships llms.txt / llms-full.txt for AI agents since r183; three.js is the library LLMs have seen most
- WebGPURenderer is production and the official recommendation for new projects, with automatic WebGL 2 fallback; TSL compiles to WGSL or GLSL from one source
- Small: ~185 kB min+gz for `three`, ~300 kB for `three/webgpu` (tree-shaken minimal scenes ~120 / ~190 kB gz)
- Everything needed for this project is in core/addons: CatmullRomCurve3 for a helix camera path, Points/InstancedMesh for a galaxy, CSS2DRenderer/DOM overlay for Russian-language HTML cards, TSL BloomNode / UnrealBloomPass for glow
- Pure static ES modules: zero hosting requirements, works on GitHub Pages

Минусы:
- Imperative API: you own scene structure, state, and the loop (fine at 50-100 entities, but no component model)
- WebGPURenderer breaks shader-patching addons: ShaderMaterial/onBeforeCompile, troika-three-text, pmndrs/postprocessing do not run on it (use TSL + RenderPipeline instead)
- Mixing `three` and `three/webgpu` imports doubles the bundle (792 KB -> 1155 KB min); import consistently from `three/webgpu`
- r186 removed minified builds and PCFSoftShadowMap; renamed PostProcessing -> RenderPipeline, Clock -> Timer: older tutorials/LLM memory drift
- Cyrillic 3D text needs a font atlas or DOM labels (troika is WebGL-only)

iPhone Safari: WebGPU on iOS 26+/iPadOS 26+/macOS 26+ (Safari 26, Sept 2025); older iOS silently gets the WebGL 2 backend. Long track record of iOS-only quirks (context loss when backgrounding, frame-time variance, GPU memory limits): clamp devicePixelRatio to <=2, keep textures <=2048, test on real hardware and force the WebGL2 backend (forceWebGL) as a second test target.

WebGPU 2026: Production. WebGPURenderer + TSL recommended for new projects; r186 adds SunLight with cascaded shadows for both renderers and compileComputeAsync(). WebGPU itself is on by default in Chrome/Edge (113+), Chrome Android (121+, vendor-dependent), Safari 26, Firefox (Windows 141+, macOS 147+); Linux/Android Firefox still nightly.

Для AI-агента: Best in class: llms.txt shipped by the project, 10+ years of Stack Overflow/forum/Codrops examples, community 'threejs-skills' repos for Claude/Cursor, Context7 coverage. Only risk is agents emitting pre-r171 WebGL idioms into a WebGPU project; pin r186 and give the agent llms.txt.

Статический хостинг: Ideal. ES modules + JSON, no headers, no wasm. Works from GitHub Pages / Cloudflare Pages / Netlify as-is.

Источники:
- https://www.utsubo.com/blog/threejs-2026-what-changed
- https://github.com/mrdoob/three.js/releases
- https://registry.npmjs.org/three/latest
- https://www.utsubo.com/blog/threejs-vs-babylonjs-vs-playcanvas-comparison
- https://www.utsubo.com/blog/webgpu-threejs-migration-guide
- https://github.com/mrdoob/three.js/pull/32240
- https://github.com/mrdoob/three.js/issues/31933
- https://threejs.org/manual/en/webgpurenderer.html
- https://github.com/gpuweb/gpuweb/wiki/Implementation-Status
- https://discourse.threejs.org/t/inconsistent-performance-of-three-js-animations-in-safari-for-ios/76329

#### React Three Fiber + drei (+ @react-three/postprocessing) — fit 8/10

Версия: @react-three/fiber 9.8.1 stable (Sept 2026), 10.0.0-alpha.5 (WebGPU-first, Sept 2026). @react-three/drei 10.7.9 stable, 11.0.0-alpha.7 (WebGPU milestone closed 100% on Sept 22, 2026). @react-three/postprocessing 3.1.3 (WebGL only). drei 10 peers: react ^19, three >=0.159, fiber ^9.

Плюсы:
- Declarative JSX scene graph is extremely LLM-friendly; huge corpus of tutorials (pmndrs docs, Wawa Sensei, Codrops)
- drei gives exactly this project's primitives out of the box: <Html> for entity cards, <CameraControls>, <Stars>/<Sparkles>, <Line>, <Float>, <Billboard>, <ScrollControls>, useGLTF
- React state = natural fit for a JSON dataset of eras/planets/characters driving both the 3D scene and the HTML side panel
- v10 brings first-class WebGPU/TSL (useNodes, useUniforms, usePostProcessing), a new scheduler, multi-canvas
- Vite + React deploys as a static bundle to GitHub Pages with no server

Минусы:
- Ecosystem is mid-transition: v9 (stable, WebGL) vs v10 (alpha, WebGPU; state.gl -> state.renderer; some drei hooks moving into core). Agents mix the two APIs
- @react-three/postprocessing and drei <Text> (troika) do not work with WebGPURenderer; drei <Environment> with children broke on r183+
- React 19 + fiber + drei add runtime weight on top of three (drei is 1.75 MB unpacked; tree-shake aggressively)
- Reconciler indirection hides three.js details, so perf debugging on iPhone is harder than vanilla
- No stable release date for v10 as of Sept 2026 (alpha.5)

iPhone Safari: Same browser story as three.js. Use <Canvas dpr={[1, 2]}>, frameloop='demand' for idle scenes, keep <Html> cards outside heavy transforms. On v9 you are on WebGLRenderer by default, which is the safest iPhone path today; v10 alpha WebGPU works on iOS 26+ with WebGL2 fallback.

WebGPU 2026: v9: WebGL first (WebGPU only via custom gl prop hacks). v10 alpha: WebGPU and TSL are first-class, usePostProcessing uses three's RenderPipeline. drei 11 alpha.7 targets WebGPU. @react-three/postprocessing remains WebGL-only.

Для AI-агента: Very high volume of training data and examples; pmndrs docs are good. Main hazard is version drift between v9/v10 and drei 10/11: pin versions in package.json and tell the agent which one. No official llms.txt found for R3F docs.

Статический хостинг: Fine with Vite (`vite build` -> dist/). Avoid Next.js SSR for a 3D-only static site (window/WebGL on the server, hydration noise).

Источники:
- https://github.com/pmndrs/react-three-fiber/releases
- https://registry.npmjs.org/-/package/@react-three/fiber/dist-tags
- https://registry.npmjs.org/-/package/@react-three/drei/dist-tags
- https://registry.npmjs.org/@react-three/drei/latest
- https://registry.npmjs.org/@react-three/postprocessing/latest
- https://github.com/pmndrs/react-three-fiber/discussions/3665
- https://github.com/pmndrs/drei/milestone/2
- https://x.com/pmndrs/status/2093370902461182190
- https://www.utsubo.com/blog/webgpu-threejs-migration-guide

#### Threlte (Svelte 5) — fit 6.5/10

Версия: @threlte/core 8.6.1 (Sept 2026); @threlte/core/webgpu export since 8.6.0; @threlte/studio 0.4.4 (Sept 24, 2026); Threlte 8 released Jan 2025 on Svelte 5.

Плюсы:
- Thinnest framework overhead of the wrappers; Svelte 5 runes reactivity fits a JSON-driven scene
- Threlte 8 has an explicit WebGPU path (`@threlte/core/webgpu`) with minimal changes
- @threlte/extras ports most drei helpers (HTML, CameraControls, Text, Float); @threlte/theatre for authored camera paths; Threlte Studio (alpha) for visual tweaking
- SvelteKit static adapter produces a plain static site

Минусы:
- Small community versus R3F; far fewer examples and blog posts for agents to imitate
- LLMs still confuse Svelte 4 and Svelte 5 runes syntax, which compounds with Threlte 7 vs 8 API changes
- Theatre.js dependency: its authors moved development to a private repo pending 1.0, a maintenance risk for @threlte/theatre
- Fewer ready-made postprocessing/WebGPU recipes than pmndrs

iPhone Safari: Inherits three.js behavior; no Threlte-specific iOS issues found. Svelte's small runtime helps low-end phones.

WebGPU 2026: Supported via `@threlte/core/webgpu` (8.6.0+), riding three's WebGPURenderer with WebGL2 fallback.

Для AI-агента: Docs are good and typed, but corpus is small; no llms.txt found. Agents produce workable code but need the docs pasted in. Best if the owner already loves Svelte.

Статический хостинг: Excellent with SvelteKit adapter-static or plain Vite + Svelte.

Источники:
- https://github.com/threlte/threlte/releases
- https://threlte.xyz/blog/threlte-8/
- https://github.com/threlte/threlte/releases/tag/%40threlte/studio%400.4.4
- https://github.com/theatre-js/theatre
- https://news.ycombinator.com/item?id=42813264

#### TresJS (Vue 3) — fit 6/10

Версия: @tresjs/core 5.9.1 (peers: vue >=3.4, three >=0.133; 136 kB unpacked). WebGPU landed in v5 via a `renderer` prop (issue #883 / PR #1029).

Плюсы:
- Vue SFC + template syntax is readable for non-React people; Nuxt module exists
- Publishes docs/llms.txt for AI assistants
- Cientos add-on package covers controls, HTML labels, environment, text
- Tiny wrapper; bundle is essentially three + Vue

Минусы:
- WebGPU documented as 'experimental' in TresJS docs
- Smaller community than R3F; fewer WebGPU/postprocessing recipes
- Vue custom renderer has its own gotchas (reactivity on three objects, attach semantics) that agents sometimes fumble

iPhone Safari: Inherits three.js behavior; no TresJS-specific iOS issues found.

WebGPU 2026: Experimental: v5 lets you pass a WebGPURenderer via the renderer prop; docs still label it experimental.

Для AI-агента: Good docs with llms.txt; moderate corpus. Better than Threlte for agents only because Vue 3 syntax is more stable than Svelte 5 runes.

Статический хостинг: Fine with Vite + Vue or Nuxt generate.

Источники:
- https://registry.npmjs.org/@tresjs/core/latest
- https://docs.tresjs.org/llms.txt
- https://github.com/Tresjs/tres/issues/883
- https://docs.tresjs.org/getting-started

#### Babylon.js — fit 6/10

Версия: 9.28.0 (Sept 24, 2026); Babylon 9.0 shipped March 2026 (clustered lighting, Frame Graph v1, node particles, Gaussian splat overhaul, new Inspector). @babylonjs/core 71.6 MB unpacked.

Плюсы:
- Batteries included: GUI, animation, physics, glTF, Inspector, Playground, Node Material Editor
- WebGPU production-grade since 5.0 (2022), native WGSL shaders since 8.0, WebGL kept 'for the foreseeable future'
- Official docs page listing MCP servers for AI agents; excellent typed API docs
- Microsoft-backed, predictable release cadence

Минусы:
- Heavy: ~1.8 MB min+gz for @babylonjs/core (vs ~185-300 kB three) — painful on cellular iPhone first load
- ~39x fewer npm downloads than three.js, so far less LLM training data; agents mix legacy `BABYLON.*` UMD and ES module styles
- Engine-style API is verbose for a 100-entity data visualization; most features unused
- GUI system tempts you to build cards in-canvas instead of HTML (worse for Russian text, accessibility, SEO)

iPhone Safari: WebGPUEngine works on Safari 26/iOS 26; WebGL2 elsewhere. Historically solid on iOS but bundle weight and startup time are the real mobile cost.

WebGPU 2026: Production; `new WebGPUEngine(canvas); await engine.initAsync()`; WGSL-native core shaders; 9.x clustered/volumetric lighting exploit WebGPU compute.

Для AI-агента: Good docs + Playground + official MCP servers, but smaller example corpus; agents are competent yet less fluent than with three.js.

Статический хостинг: Fine (pure JS/wasm assets), just large.

Источники:
- https://github.com/BabylonJS/Babylon.js/releases
- https://registry.npmjs.org/@babylonjs/core/latest
- https://blogs.windows.com/windowsdeveloper/2026/03/26/announcing-babylon-js-9-0/
- https://raw.githubusercontent.com/BabylonJS/Documentation/master/content/setup/support/webGPU.md
- https://doc.babylonjs.com/toolsAndResources/mcpServers
- https://www.utsubo.com/blog/threejs-vs-babylonjs-vs-playcanvas-comparison

#### PlayCanvas (engine + @playcanvas/react) — fit 5.5/10

Версия: playcanvas 2.22.6 (Sept 28, 2026); @playcanvas/react 0.11.5; Editor 2.32 (Sept 22, 2026). SuperSplat 3.0 (Sept 9, 2026) is WebGPU-only on engine 2.22.0.

Плюсы:
- Most mature production WebGPU renderer among web engines; WebGL2 fallback
- Explicitly mobile-tuned (texture compression, GC tuning); ~615 kB min+gz
- Code-only workflow via npm is supported; @playcanvas/react offers R3F-like JSX; Web Components too
- MIT engine, static deploy

Минусы:
- Small community (~57k weekly downloads) and editor-centric culture: far fewer code snippets for agents
- ECS/component API differs from three.js idioms most LLMs default to
- @playcanvas/react is pre-1.0 (0.11.x) and churns
- Utsubo still lists WebGPU as 'beta' in the cloud editor path

iPhone Safari: Good mobile heritage; WebGPU requires Safari 26+, otherwise WebGL2. No PlayCanvas-specific iOS blockers found.

WebGPU 2026: Production in engine 2.22 (PlayCanvas ships its own WebGPU-only SuperSplat 3.0 on it); compute-based gsplat path; WebGL2 fallback.

Для AI-агента: Docs are solid but agents have far less PlayCanvas code in training; expect more hand-holding than with three.js.

Статический хостинг: Fine; engine-only builds are plain JS.

Источники:
- https://github.com/playcanvas/engine/releases
- https://registry.npmjs.org/playcanvas/latest
- https://blog.playcanvas.com/new-in-supersplat-editor-3-0-rebuilt-on-webgpu/
- https://www.npmjs.com/package/@playcanvas/react
- https://developer.playcanvas.com/user-manual/playcanvas-react/
- https://www.utsubo.com/blog/threejs-vs-babylonjs-vs-playcanvas-comparison

#### Three.js BLOCKS (2026 newcomer) — fit 5/10

Версия: 0.14.0 (pre-1.0), WebGPU-only block library on top of three/webgpu; freemium (free non-commercial, Pro per-seat for commercial).

Плюсы:
- Built specifically for AI agents: `npx skills add https://threejs-blocks.com`, SKILL.md, llms.txt + llms-full.txt
- WebGPU-first with curated 'block contracts' (ready components) that could speed up a galaxy/timeline prototype
- Sits on stock three.js, so you can drop it later

Минусы:
- Very young (0.x), tiny community, commercial license needed for anything monetized
- Adds a second abstraction layer the agent must learn; vendor-lock risk if the project stalls
- WebGPU-only path means WebGL2 fallback is whatever three provides, and troika/pmndrs addons stay off the table

iPhone Safari: Inherits three.js WebGPURenderer: iOS 26+ WebGPU, WebGL2 fallback below.

WebGPU 2026: WebGPU-native by design (imports from three/webgpu).

Для AI-агента: Designed for it (skills, llms.txt), but unproven; useful mainly as a source of patterns for your own vanilla three.js code.

Статический хостинг: Fine (JS library).

Источники:
- https://threejs-blocks.com/docs/ai
- https://www.threejs-blocks.com/llm

#### Needle Engine — fit 3.5/10

Версия: Stable 5.1.13; npm `latest` tag points to 6.0.0-alpha.3 (built on @needle-tools/three 0.185.2 fork); package 92 MB unpacked.

Плюсы:
- Unity/Blender -> web pipeline with strong glTF, lightmaps, iOS WebXR via App Clips, MaterialX
- Built on a three.js fork, so scene concepts transfer
- Host anywhere on Pro

Минусы:
- Commercial: Hobby plan is non-commercial only and must keep Needle watermark/branding; Pro from €49/user/month
- Authoring assumes Unity or Blender; a JSON-driven data map does not need that pipeline
- Confusing npm tags (`latest` = alpha); forked three lags r186
- Small community; agents have little training data

iPhone Safari: Runs on the three.js fork; iOS AR via App Clips is a niche plus, otherwise same as three.js (r185 fork).

WebGPU 2026: Inherits three r185 fork; WebGPU is not the advertised default path (not verified as production in Needle).

Для AI-агента: Docs are decent, but the toolchain (Unity/Blender exporters) is outside what a coding agent can drive.

Статический хостинг: Static output works; watermark on free tier, Pro required for commercial.

Источники:
- https://registry.npmjs.org/-/package/@needle-tools/engine/dist-tags
- https://registry.npmjs.org/@needle-tools/engine/latest
- https://needle.tools/pricing/
- https://cloud.needle.tools/eula
- https://engine.needle.tools/docs/three/

#### Spline (editor + @splinetool/runtime) — fit 3/10

Версия: @splinetool/runtime 2.0.60 (35.9 MB unpacked); Spline V2 (Aug 21, 2026): WebGPU default with WebGL fallback, MCP tools for Claude Code/Cursor, HTML/JS overlay Code tab, new Free/Hobby/Pro/Max plans.

Плюсы:
- Fastest path to a pretty hero scene without code; V2 adds PBR/IBL/SSR
- MCP integration lets Claude Code/Cursor edit scenes
- React and vanilla runtimes exist

Минусы:
- Free and Hobby web exports carry a watermark; 'Download Code Export' and 'Self-Hosted Export' are Max ($60/mo yearly) or Enterprise only — hard blocker for a free static GitHub Pages site
- Data-driven content (100 entities from JSON, tags, RU cards) is awkward: Spline is a scene editor, not a data layer
- Heavy runtime (~1.9 MB / 544 kB gz runtime historically, plus scene) and 1-2 s init even for tiny scenes; V2 claims smaller adaptive runtime but no numbers published
- Scene logic lives in a proprietary format, not in your repo

iPhone Safari: V2 renderer is WebGPU-first with WebGL fallback; community reports of slow pages on weak devices; needs lazy mounting and pausing offscreen loops.

WebGPU 2026: Default WebGPU renderer with WebGL fallback since V2 (Aug 2026).

Для AI-агента: MCP for scene editing is novel, but the agent cannot version, diff, or data-bind the scene the way it can with code.

Статический хостинг: Only with Max/Enterprise (self-hosted export); otherwise you embed from Spline's servers.

Источники:
- https://updates.spline.design/changelog/introducing-spline-v2
- https://spline.design/pricing
- https://registry.npmjs.org/@splinetool/runtime/latest
- https://webdesign.tutsplus.com/how-to-optimize-spline-3d-scenes-for-speed-and-core-web-vitals--cms-108749a
- https://docs.spline.design/exporting-your-scene/web/code-api-for-web

#### Wonderland Engine (newcomer-ish, WebXR-focused) — fit 3/10

Версия: 1.5.0 (Dec 9, 2025): WebGPU with full WebGL2 feature parity, particle API, probe volumes. Free up to $120k/yr revenue, then 10% royalty; enterprise seats remove loading screen.

Плюсы:
- Native-performance wasm runtime, WebGPU/WebGL2 parity
- MCP server plugin on the roadmap for AI agents
- Free tier generous for a hobby project

Минусы:
- Editor-centric desktop app; scripting is glue code, not the whole scene
- Branded loading screen on the free tier; royalty terms
- Tiny community; almost no LLM corpus; WebXR-oriented rather than data-viz

iPhone Safari: Targets mobile/XR; WebGPU on Safari 26+, WebGL2 otherwise. No iOS-specific data found.

WebGPU 2026: Shipped in 1.5.0 with WebGL2 parity; WebXR-on-WebGPU still on roadmap.

Для AI-агента: Low today; MCP plugin promised but not shipped.

Статический хостинг: Static deploy works.

Источники:
- https://wonderlandengine.com/news/release-1.5.0/
- https://wonderlandengine.com/pricing/
- https://wonderlandengine.com/about/roadmap/

#### Verge3D (commercial Blender/3ds Max/Maya -> web) — fit 2.5/10

Версия: 4.13 (July 15, 2026), commercial per-seat licenses; Puzzles visual logic; built on a three.js fork.

Плюсы:
- Artist-first pipeline from Blender with baked lighting; good for hero visuals
- Puzzles no-code logic; static output

Минусы:
- Paid licenses; proprietary three.js fork lags upstream
- Scene logic in Puzzles/Blender is not agent-friendly or diff-able
- Small community

iPhone Safari: Inherits three.js WebGL; no 2026 iOS-specific data found.

WebGPU 2026: Not verified; still WebGL-first as far as public docs show.

Для AI-агента: Low.

Статический хостинг: Static output works.

Источники:
- https://en.wikipedia.org/wiki/Verge3D
- https://github.com/Soft8Soft/verge3d

#### Godot 4 web export — fit 2/10

Версия: Godot 4.7 stable (docs header; 4.7.2 Aug 2026), 4.8 in dev. Web export = Compatibility renderer (WebGL 2.0) only; wasm SIMD default; wasm64 option. Community WebGPU fork in public beta (May 2026), unofficial.

Плюсы:
- Full engine with scene editor; GDScript is well known to LLMs
- Single-threaded export needs no COOP/COEP headers, so GitHub Pages works
- Free/MIT

Минусы:
- No WebGPU in official web export; Forward+/Mobile renderers unavailable on web
- Empty project = ~35 MB compressed wasm (~25 MB stripped); default 400 MB heap
- Documented iOS Safari problems: WASM out-of-memory, crashes/reloads after minutes with audio, WebGL context loss; docs literally recommend Chromium/Firefox over Safari
- HTML cards, Russian text, links, and JSON-driven UI are far easier in DOM than in Godot UI; JS bridge is clunky
- C# cannot export to web

iPhone Safari: Weakest of the bunch on iPhone: multiple open issues about OOM and crash/reload on iOS Safari; docs recommend non-Safari browsers.

WebGPU 2026: Not in official releases; community fork beta only.

Для AI-агента: Agents know GDScript, but the export/HTML integration loop is slow and not browser-native; poor fit for vibe-coding a website.

Статический хостинг: Works single-threaded on GitHub Pages, but 25-35 MB payload; multi-threaded needs headers GitHub Pages cannot set.

Источники:
- https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html
- https://github.com/godotengine/godot/issues/104422
- https://github.com/godotengine/godot/issues/70621
- https://github.com/godotengine/godot/issues/107390
- https://github.com/godotengine/godot/issues/88321
- https://godotwebgpu.com/

#### Unity 6 Web (WebGL / experimental WebGPU) — fit 1.5/10

Версия: Unity 6.3 LTS; WebGPU backend still 'experimental and not supported by all browsers and devices'; WebGL2 is the default web target; mobile browsers officially supported since Unity 6.

Плюсы:
- Mature toolchain, C# is well known to LLMs
- Brotli-compressed builds with JS decompression fallback for hosts that cannot set headers

Минусы:
- Huge builds; iOS Safari is 'the most restrictive WebGL host': keep memory <384 MB, gate audio, consider WebGL1 fallback for old iPhones
- GitHub Pages does not send Content-Encoding for .br/.gz, so you must enable Decompression Fallback or ship uncompressed
- WebGPU experimental only; no production guarantee in 2026
- HTML/DOM cards and RU typography are second-class; UI lives in-canvas
- Not vibe-codeable in a browser loop: Editor build cycles, licensing, no static-first story

iPhone Safari: Frequent crash reports on iOS Safari due to memory; requires careful memory budgeting and fallbacks.

WebGPU 2026: Experimental in Unity 6.3 LTS.

Для AI-агента: High for C# gameplay code, low for the web-deploy pipeline; the agent cannot iterate quickly on visuals in the browser.

Статический хостинг: Possible but painful (compression headers, size).

Источники:
- https://docs.unity3d.com/6000.3/Documentation/Manual/WebGPU.html
- https://bugnet.io/blog/how-to-fix-unity-webgl-build-crashing-on-safari-ios
- https://miltoncandelero.github.io/unity-webgl-compression
- https://unity.com/blog/engine-platform/web-runtime-updates-enhance-browser-experience
- https://app.cinevva.com/guides/webgpu-vs-webgl-games

## 2. Визуальный концепт и референсы

**Выбор агента:** Выбор: «Нить Первичного Излучателя» — одна 3D-галактика Foundation + светящаяся спираль эр над диском, по которой скролл ведёт камеру, с двумя режимами: «Хроника» (камера на рельсах, 6–8 остановок-эр, у каждой ныряет к планетам и персонажам эры) и «Карта» (свободный OrbitControls + слайдер эры, гасит неактуальные планеты). Почему: (1) прямая цитата сериала — план Селдона как светящаяся нить, зрителю не надо объяснять метафору; (2) не смешивает время и пространство, поэтому Трантор может быть в каждой эре; (3) жюри Awwwards 2026 стабильно выше оценивает скролл-управляемую камеру со сценами-остановками, чем свободную 3D-карту (Utsubo 2026, Digital Strategy Force); (4) паттерн уже доказан открытым кодом — curve-gallery (Codrops 07.2026), Wawa Sensei Atmos, Theatre.js fly-through, star-wars-map — то есть агент собирает из готовых кусков. Стек: three.js r186 (WebGPURenderer с автооткатом на WebGL2) через React Three Fiber 9.8 + drei 10.7 (ScrollControls, Text/troika для кириллических подписей, Html для единственной открытой карточки), GSAP Observer для унификации колеса/свайпа, Vite → статический GitHub Pages; данные — JSON «миры × эры × маршруты» по модели asimov-universe. Визуал: галактика Points ~30–50k с шейдером в духе Three.js Journey + фото-дымка на плоскости (приём 100,000 Stars), планеты — InstancedMesh-спрайты с glow-спрайтом вместо bloom; палитра сцены плавно меняется по эрам (Империя — золото, Фонд — холодный синий, Мул — красный, Второй Фонд — фиолетовый). Мобильный бюджет: DPR≤2, без EffectComposer по умолчанию (bloom только на десктопе в половинном разрешении), прекомпиляция сцен на загрузке (приём Galaxy Portfolio), obработка потери контекста. Не делать: 220 отдельных сцен, тяжёлый постпроцессинг и DOM-подписи на все планеты — три вещи, на которых спотыкаются все просмотренные форумные проекты.

### Метафоры 3D-таймлайна

#### «Нить Первичного Излучателя» (Prime Radiant thread): светящаяся спираль над диском галактики
Одна реальная 3D-галактика (частицы + процедурная дымка, ~30 именованных планет). Над диском висит светящаяся нить-спираль — уравнения Селдона. Её витки = 6–8 эр, узлы на витке = кризисы и события. Скролл/свайп ведёт камеру по нити (CatmullRomCurve3 + GSAP Observer или drei ScrollControls); у каждого узла камера «ныряет» в диск и подлетает к планетам этой эры; планеты не входящие в эру гаснут. Кнопка «свободный полёт» отдаёт OrbitControls.

Подходит ли: Лучший. Прямо цитирует сериал (Prime Radiant, план как светящаяся нить). Пространство и время не путаются: галактика = место, нить = время. Мобильно: один draw call на звёзды, камера скриптована, тяжёлого постпроцессинга нет.

Пример: https://tympanus.net/codrops/2026/07/07/building-a-scroll-driven-3d-gallery-using-a-blender-camera-path-with-three-js-and-gsap/

#### «Туннель психоистории» (probability cone)
Камера летит внутри полупрозрачного туннеля из тысяч нитей-вероятностей; радиус туннеля = отклонение от Плана (сужается у кризисов Селдона, рвётся при Муле). На стенках — окна-порталы в планеты и персонажей эры, фон меняет палитру от эры к эре по образцу depth-gallery.

Подходит ли: Очень сильный по теме и самый «вау», но абстрактный: галактика и планеты пропадают из кадра, планету нельзя «найти на карте». Хорош как второй режим или интро, не как основная навигация.

Пример: https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/

#### «Эры как кольца галактики» (Трантор в ядре → Терминус на Периферии)
Концентрические кольца диска = эры: центр (Империя, Трантор), внешние кольца — Фонд и Периферия. Камера раскручивается по спирали от ядра к краю, проходя эры. Совпадает с сюжетной географией (Терминус на краю), но требует «подгонять» позиции планет под эры.

Подходит ли: Средний. Красиво и просто объяснимо, но конфликтует с фактами: Трантор нужен во всех эрах, а Калган/Сивенна не вписываются в «свой» радиус. Годится как оформление переходов, не как модель данных.

#### «Гиперпрыжки по маршруту» (jump-route journey)
Таймлайн = светящаяся гиперлиния через галактику; станции = эры (Трантор → Терминус → Калган → …). Скролл = прыжок к следующей станции с warp-переходом (растяжение частиц), у станции камера кружит и открывает планеты и персонажей эры. Комбинирует Star Citizen-маршруты и «автопилот» из Spaceship-портфолио.

Подходит ли: Хороший, близкий родственник №1: понятнее для новичка (едем от планеты к планете), но одна эра ≠ одна планета (Империя + Терминус одновременно), придётся дублировать станции.

Пример: https://discourse.threejs.org/t/spaceship-exploration-interstellar-portfolio/92550

#### «Одна карта + слайдер времени» (Star Citizen / NASA Eyes)
Статичная 3D-галактика с fly-to по клику; ось времени — слайдер/скролл, который перекрашивает фракции, включает маршруты, зажигает/гасит планеты и показывает персонажей эры. Без скриптованной камеры.

Подходит ли: Самый дешёвый и безопасный (это то, что уже сделал 2D asimov-universe), но «крутизны» не даёт: без ведущей камеры выглядит как инструмент, а не как история. Взять как fallback-режим «Карта» внутри №1.

Пример: https://robertsspaceindustries.com/en/starmap

### Референсы

- **Google «100,000 Stars» — case study (web.dev)** (galaxy map) — https://web.dev/case-studies/100000stars  
  Стек: three.js (старый r5x) + CSS3D, vanilla JS  
  Взять: 119 617 звёзд одной системой частиц, цвет через lookup-текстуру (индекс спектрального класса в атрибуте); подписи — DOM-элементы, матрица CSS3D синхронизирована с камерой; billboarding через Gyroscope; динамический FOV: шире при отлёте на масштаб галактики, уже при подлёте к звезде — убирает клиппинг при переходе масштабов; масштаб 1 GL-юнит = 1 световой год; вращается сцена, а не камера (меньше дрожания); галактика = фото NGC 1232 на плоскости + процедурные спиральные частицы сверху  
  Зачем: Эталон «галактика с именованными объектами, к которым можно подлететь» на трёх порядках масштаба; приём FOV-перехода и сочетание фото-подложки с частицами напрямую переносится на Трантор→Периферия.
- **liewcc/star-wars-map — 3D WebGL Star Wars Galaxy Map** (galaxy map, open source) — https://github.com/liewcc/star-wars-map  
  Стек: three.js r160, ES-modules + import maps, без сборки; JSON планет и гиперлиний; GitHub Pages через Actions  
  Взять: ~45 000 частиц = 4-рукавная спираль + яркое ядро + дальний starfield; 33 канонических планеты в JSON, процедурные canvas-текстуры (нет внешних картинок); Raycaster hover/click, OrbitControls, плавный camera focus на выбранную планету; светящиеся 3D-торговые маршруты (Perlemian, Hydian Way…); поиск и фильтр по регионам галактики  
  Зачем: Самый близкий по форме проект: фан-галактика ~30 планет + маршруты + карточки, статика на GitHub Pages, без бандлера. Можно форкнуть структуру (galaxyScene / interaction / data JSON) и заменить данные на Foundation.
- **Elite Dangerous Almanac — Galaxy-Map (WebGL2)** (galaxy map, open source) — https://github.com/Elite-Dangerous-Almanac/Galaxy-Map  
  Стек: raw WebGL2 + TypeScript, pnpm, npm-пакет @elite-dangerous-almanac/galaxy-map; демо elite-dangerous-almanac.github.io/Galaxy-Map  
  Взять: галактика как плотностная модель (density-based rendering из модели звёздной массы), а не частицы; маркеры систем поверх, опциональные туманности (+2.9 МБ ассетов отдельным subpath); зум от 10 св. лет до предела галактики, WASD/QE навигация, pointer-выбор; чисто клиентский: не читает URL, не тянет данные — годится для статики  
  Зачем: Показывает «фоновую галактику как объёмную дымку» вместо точек — красивее на мобильном, чем 100k частиц. Лицензия PolyForm Noncommercial — только смотреть, не копировать код.
- **patrickrb/edGalaxyMap — Elite Dangerous map на Next.js 15 + three.js** (galaxy map, open source) — https://github.com/patrickrb/edGalaxyMap  
  Стек: Next.js 15, React 19, TypeScript, three.js, Tailwind; MIT  
  Взять: 1000+ систем, клик → панель информации о системе; цветовая кодировка систем по типу (экономика) — аналог кодировки по фракции/эре; responsive layout вокруг канвы  
  Зачем: MIT-пример «React-обёртка + three.js + карточки» для 1000 объектов; удобный шаблон, если стек будет React.
- **Star Citizen ARK Starmap (Turbulent)** (galaxy map) — https://robertsspaceindustries.com/en/comm-link/engineering/15011-Q-A-Starmap  
  Стек: TypeScript + three.js + GLSL, UI на SVG-анимациях; данные из CMS; Awwwards SOTD 2015, FWA Cutting Edge 2016  
  Взять: иерархия масштабов: галактика → система → орбиты, с плавным fly-to; маршруты между системами, поиск, панели-карточки в стиле HUD; UI отдельно от WebGL (SVG-оверлей), 3D — только сцена  
  Зачем: Золотой стандарт «космическая карта фан-вселенной» по ощущениям и UI-паттернам (карточка объекта, маршрут, fly-to). Код закрыт — брать только паттерны.
- **NASA Eyes on the Solar System (web)** (galaxy map) — https://science.nasa.gov/eyes/  
  Стек: собственный WebGL-движок JPL, работает в браузере без установки  
  Взять: скраббер времени (timeline) поверх 3D-сцены — камера и объекты следуют за временем; fly-to к аппаратам/планетам с подписями и карточками; «туры» — сценарные перелёты камеры  
  Зачем: Показывает, как совместить 3D-карту с осью времени (слайдер времени меняет сцену) — ровно наш случай «эра → состояние галактики».
- **Atlas of Space — интерактивная Солнечная система (three.js)** (galaxy map, open source) — https://github.com/gordonhart/atlasof.space  
  Стек: three.js, TypeScript; демо atlasof.space (36k визитов с HN, янв 2025)  
  Взять: орбиты как линии, fly-to к объекту, подписи объектов; скраббинг времени/симуляции; обработка гигантского разброса масштабов  
  Зачем: Открытый, современный (2025) и лёгкий пример fly-to + подписи + время в одной сцене.
- **Galaxy Portfolio — зум от Млечного Пути до стола (techinz)** (galaxy map, open source) — https://github.com/techinz/galaxy-portfolio  
  Стек: React + TypeScript + Vite, @react-three/fiber, three/examples postprocessing; лицензия personal-use-only  
  Взять: 7 сцен разного масштаба, менеджер сцен с плавными переходами вместо непрерывного лог-масштаба; прекомпиляция всех сцен в offscreen-буфер 1×1 при загрузке — шейдерный jank 600 мс → 78 мс; скролл на десктопе / свайп на мобиле, детект устройства; iOS: принудительный fullscreen как обход ограничений WebKit на HTML внутри 3D-трансформа; модели через gltfjsx + сжатие текстур  
  Зачем: Практический рецепт переходов «галактика → планета → карточка» без фризов и с рабочими обходами для iPhone Safari.
- **Galaxy Voyager — 220+ систем на R3F + postprocessing (three.js forum, 09.2025)** (galaxy map) — https://discourse.threejs.org/t/galaxy-voyager-a-procedural-galaxy-explorer-with-220-star-systems-built-with-react-three-fiber-post-processing/86659  
  Стек: three.js, React Three Fiber, @react-three/postprocessing, Zustand, React Flow для 2D-карты  
  Взять: каждая система — отдельный THREE.Scene, world-partitioning с загрузкой/выгрузкой; recentring камеры для борьбы с float-точностью на космических масштабах; bloom + chromatic aberration + noise для свечения звёзд; «червоточина» — цепочка пасс-эффектов; процедурная сеть переходов между системами  
  Зачем: Показывает потолок красоты на R3F и цену: автор целится в 50–60 FPS на десктопе, о мобиле не пишет — предостережение против тяжёлого постпроцессинга.
- **Spaceship Exploration Interstellar Portfolio (three.js forum, 06.2026)** (galaxy map) — https://discourse.threejs.org/t/spaceship-exploration-interstellar-portfolio/92550  
  Стек: three.js; демо 2005-citadel.vercel.app  
  Взять: галактическая карта в духе Mass Effect: drag-камера + scroll-zoom; клик по планете → автопилот (камера сама летит), сканирование открывает досье; планеты = разделы контента, луны = подразделы  
  Зачем: Свежий (2026) пример метафоры «планета = карточка, автопилот = fly-to»; автор жалуется на производительность на слабых машинах — снова аргумент за лёгкую сцену.
- **Three.js Journey — Galaxy Generator + Animated Galaxy (Bruno Simon)** (tutorial) — https://threejs-journey.com/lessons/galaxy-generator  
  Стек: vanilla three.js, BufferGeometry + Points, ShaderMaterial, lil-gui  
  Взять: спиральные рукава: угол ветви + радиус + случайный разброс со степенным падением; цвет по радиусу (insideColor→outsideColor), size attenuation, additive blending; вертексный шейдер вращает звёзды со скоростью, зависящей от радиуса (урок «Animated galaxy»); кастомный узор частицы вместо квадрата  
  Зачем: Каноничный рецепт красивой процедурной галактики за ~200 строк; параметры вынесены в GUI — идеально для вайб-кодинга «подкрути и сохрани». Курс платный, но приём широко воспроизведён в открытых репо (напр. BABAK0T0/Galaxy-particles).
- **Codrops — Creating a Particles Galaxy with Three.js (реплика Viverse, Akella)** (tutorial, open source) — https://tympanus.net/codrops/2022/06/21/creating-a-particles-galaxy-with-three-js/  
  Стек: vanilla three.js, GLSL; демо viversereplica.netlify.app, setup-gist Akella  
  Взять: галактика-туманность из частиц с шумом и мягкими спрайтами (стиль ohzi.io/Viverse); живой стрим-разбор: как получить «дорогой» вид без постпроцессинга  
  Зачем: Альтернативный, более «облачный» стиль галактики — ближе к вступительным титрам Foundation, чем жёсткие точки.
- **Interactive Galaxy with WebGPU Compute Shaders (Three.js Roadmap)** (tutorial, open source) — https://threejsroadmap.com/blog/galaxy-simulation-webgpu-compute-shaders  
  Стек: three.js WebGPURenderer + TSL + compute shaders (страница отдала 403 при проверке — детали только из сниппета поиска)  
  Взять: процедурные звёзды + пылевые облака для глубины; интерактивное управление тысячами частиц на GPU (compute)  
  Зачем: Показывает путь «2026-way»: TSL/compute для галактики; но для iPhone это опция, а не база — WebGPU в Safari только с 26-й версии.
- **Codrops (07.2026) — Scroll-Driven 3D Gallery по камере из Blender (gaspoorf/curve-gallery)** (scrollytelling, open source) — https://tympanus.net/codrops/2026/07/07/building-a-scroll-driven-3d-gallery-using-a-blender-camera-path-with-three-js-and-gsap/  
  Стек: three.js + GSAP (Observer, quickTo), Blender → Python → JSON точек кривой  
  Взять: траекторию камеры рисуют кривой Безье в Blender, экспорт в JSON (Z-up→Y-up); GSAP Observer унифицирует колесо/тач/pointer — одна ось «прогресс по пути» для десктопа и iPhone; targetT + gsap.quickTo — демпфированное движение камеры по CatmullRomCurve3; 500 объектов расставлены по t = i/N вдоль пути с боковыми смещениями по нормали; чувствительность нормирована на innerHeight — одинаково на всех экранах  
  Зачем: Готовый механизм «камера едет по кривой от скролла/свайпа» — основа 3D-таймлайна; расстановка карточек по t — это расстановка эр и событий.
- **Codrops (03.2026) — Scroll-Reactive Depth Gallery (houmahani/codrops-depth-gallery)** (scrollytelling, open source) — https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/  
  Стек: three.js + Vite, GLSL-фон  
  Взять: слои по оси Z (z = -index·gap) — камера едет «в туннель»; скорость скролла (lerp разницы кадров) управляет наклоном/пульсацией и яркостью фона; у каждого элемента своя палитра, фон интерполируется между текущим и следующим; GLSL-фон: мягкие blob'ы + плёночное зерно  
  Зачем: Прямой аналог «туннель эпох»: смена палитры от эры к эре (Империя — золото, Фонд — синий, Мул — красный) и реакция сцены на скорость перемотки времени.
- **Codrops (2023) — Camera Fly-through on Scroll с Theatre.js + R3F** (scrollytelling, open source) — https://tympanus.net/codrops/2023/02/14/animate-a-camera-fly-through-on-scroll-using-theatre-js-and-react-three-fiber/  
  Стек: React Three Fiber, drei ScrollControls, @theatre/r3f (Studio для ключей); GitHub AndrewPrifer/CodropsCameraFlyThroughTutorial  
  Взять: sheet.sequence.position = scroll.offset × длина — скролл двигает плейхед анимации; ключи камеры расставляются визуально в Theatre.js Studio, экспорт в JSON, в проде без Studio; ScrollControls даёт невидимый скролл-контейнер — HTML не скроллится, только сцена  
  Зачем: Apple-style пролёт камеры, который можно «нарисовать руками» без математики кривых — удобно, когда нужны кинематографичные остановки у Трантора/Терминуса.
- **Wawa Sensei — Recreating Atmos (Awwwards) с R3F, части 1–4** (tutorial, open source) — https://wawasensei.dev/tuto/recreating-atmos-3d-website-with-react-three-fiber-part-1-curved-path  
  Стек: React Three Fiber, drei (ScrollControls, Text), CatmullRomCurve3, ExtrudeGeometry по пути, gltfjsx, Lamina  
  Взять: камера следует за CatmullRomCurve3 по offset скролла, объект (самолёт) — вместе с ней; текстовые секции drei Text расставлены в 3D вдоль пути как «дорожные знаки»; сам путь визуализирован ExtrudeGeometry(extrudePath) — светящаяся нить; часть 4 — UI и responsive под мобильные  
  Зачем: Самый короткий путь к «камера летит вдоль нити времени, по бокам всплывают эры» на R3F; часть про responsive закрывает iPhone.
- **craftedbygc — «2018 in Review» 3D timeline** (3d timeline, open source) — https://github.com/craftedbygc/2018-in-review  
  Стек: three.js, WebGL; демо 2018.craftedbygc.com (2019)  
  Взять: год как пространство в глубину: события/месяцы — карточки, через которые пролетает камера; scroll и drag двигают время; медиа (видео/картинки) как текстуры карточек  
  Зачем: Один из немногих реально запущенных 3D-таймлайнов с открытым кодом; шаблон «глубина = время, карточка = событие».
- **Helical Time — 3D спиральные часы (three.js forum, 15.09.2026)** (3d timeline, open source) — https://discourse.threejs.org/t/helical-time-interactive-3d-torus-clock-visualization/94349  
  Стек: three.js + React + Tailwind; GitHub nimabeh/time-torus, демо nimabeh.github.io/helical-time  
  Взять: вложенные спирали: тор 24 ч → спираль 60 мин → микровиток 60 с — время течёт по спирали непрерывно; многоуровневый зум между макро-орбитой и микро-кольцом; трейлы частиц + bloom  
  Зачем: Живой пример «время как спираль» с зумом уровней (эра → год → событие) — визуальный прототип для метафоры helix.
- **Phhofm/LegalHistoryTimelinePrototype — 3D таймлайн на three.js (Univ. Zürich)** (3d timeline, open source) — https://github.com/Phhofm/LegalHistoryTimelinePrototype  
  Стек: three.js + TypeScript + webpack, particles.js, dat.gui; GPL-3.0; архив с 2022; демо phhofm.github.io/LegalHistoryTimelinePrototype/static/  
  Взять: учебный прототип «ось времени как 3D-пространство событий»; GUI-параметры, документация к прототипу  
  Зачем: Показывает подводные камни академических 3D-таймлайнов (мало интерактива, тяжёлая сцена) — что НЕ делать.
- **ChronoZoom — зумируемый таймлайн Big History (Microsoft Research)** (3d timeline, open source) — https://github.com/alterm4nn/ChronoZoom  
  Стек: HTML5 canvas + JavaScript (2D, не WebGL)  
  Взять: вложенные интервалы: зум от 13.8 млрд лет до дня, эры внутри эр; мультимедиа привязаны к отрезкам времени  
  Зачем: Информационная модель «эра ⊃ подэра ⊃ событие» для 500 лет Foundation; 3D-обёртка берётся из других референсов.
- **andrm101/asimov-universe — Interactive Foundation Galaxy Atlas (2D SVG)** (galaxy map, open source) — https://github.com/andrm101/asimov-universe  
  Стек: React через CDN без бандлера, рукописный SVG, данные в data.js (объект ATLAS: worlds, eras, routes); 1 коммит, лицензии нет  
  Взять: скраббинг между 4 эрами (Империя, Фонд, Мул, Второй Фонд) — та же ось, что у нас; переключаемые слои, закрепление миров для сравнения, гиперпространственные маршруты; pan/zoom в React ref без ре-рендеров  
  Зачем: Уже существующий фан-атлас Foundation с эрами: его модель данных (миры × эры × маршруты) можно взять как черновик, а визуал поднять в 3D.
- **asimovseries.com/galaxy — 3D Galaxy Map вселенной Foundation** (galaxy map) — https://asimovseries.com/galaxy  
  Стек: неизвестно (страница отдала 403 при проверке; по сниппетам — 3D-карта, 20+ миров, маршруты Трантор–Терминус, отдельная страница /timeline на 20 000 лет)  
  Взять: интерактивная 3D-галактика Foundation с Трантором, Терминусом, Землёй; маршруты между секторами, отдельный таймлайн и разделы про сериал Apple TV+  
  Зачем: Прямой конкурент/референс по контенту (книги + сериал); стоит открыть глазами и понять, чем наша версия будет круче (эры внутри 3D, карточки, русский язык).
- **Bruno Simon — folio-2025 (исходники портфолио)** (open-source repo, open source) — https://github.com/brunosimon/folio-2025  
  Стек: Vite + three.js, Blender для ассетов; MIT  
  Взять: instanced rendering, сжатие текстур ETC1S/KTX2, игровой цикл из стадий; инструкции экспорта из Blender и компрессии для веба  
  Зачем: Эталон качества vanilla three.js + Vite без React; полезен как образец организации проекта и пайплайна ассетов, не как галактика.
- **Utsubo — What's New in Three.js (2026): r186, WebGPU, TSL** (tutorial) — https://www.utsubo.com/blog/threejs-2026-what-changed  
  Стек: three.js r186 (three@0.186.0, 8 сентября 2026); релизы каждые 8–11 недель  
  Взять: WebGPURenderer по умолчанию с автоматическим откатом на WebGL2 — один код на все браузеры; WebGPU в Safari 26 (с сентября 2025) на macOS/iOS/iPadOS; TSL работает на обоих рендерерах (совместимый слой с r184); PostProcessing переименован в RenderPipeline (r183), Clock → Timer; рекомендация 2026: новые проекты начинать с WebGPURenderer  
  Зачем: Фиксирует актуальные версии и API на 29.09.2026, чтобы агент не писал устаревший код (EffectComposer/Clock).
- **Utsubo — 100 Three.js Tips (2026): мобильный и ассеты** (tutorial) — https://www.utsubo.com/blog/threejs-best-practices-100-tips  
  Стек: three.js / R3F  
  Взять: DPR cap 2 (setPixelRatio(min(dpr,2))) — главный рычаг FPS на iPhone; KTX2 текстуры (4–8× меньше VRAM), Draco/Meshopt для геометрии, Brotli + immutable cache на CDN; постпроцессинг в половинном разрешении, multisampling=0, низкий радиус bloom; alpha-to-coverage вместо сортировки прозрачных частиц; обработка потери контекста (renderer.onDeviceLost) при сворачивании Safari; InstancedMesh для повторяющихся объектов; compute-шейдеры только при 200k+ частиц  
  Зачем: Чеклист, чтобы «круто в 3D» не превратилось в 12 FPS и перезагрузку вкладки на iPhone.
- **@react-three/fiber 9.8.1 и @react-three/drei 10.7.9 (npm, конец сентября 2026)** (open-source repo, open source) — https://www.npmjs.com/package/@react-three/fiber  
  Стек: R3F v9 (React 19.0–19.3, публикация ~26.09.2026), drei 10.7.9 (ScrollControls, Html, Text, OrbitControls/CameraControls, Environment)  
  Взять: ScrollControls: невидимый скролл → offset для камеры (работает с тач-свайпом); drei Html — DOM-карточка, привязанная к 3D-точке; drei Text — SDF-текст (troika) для подписей планет; useFrame для демпфированного fly-to камеры  
  Зачем: Актуальные версии стека, который лучше всего «вайб-кодится» с ИИ-агентом: декларативные компоненты, огромный корпус примеров.
- **troika-three-text vs CSS2DRenderer — подписи в 3D** (open-source repo, open source) — https://protectwise.github.io/troika/troika-three-text/  
  Стек: troika-three-text (SDF, парсинг шрифта в web worker), three.js CSS2DRenderer  
  Взять: SDF-текст: сотни подписей без DOM, кириллица через любой TTF, кернинг и fallback-шрифты; CSS2DRenderer/drei Html — для десятков элементов; на ~300 DOM-подписях начинает лагать (тред three.js forum #66927); гибрид: имена планет — SDF, открытая карточка — единственный HTML-оверлей  
  Зачем: Решает главный UX-вопрос карты: русские названия планет прямо в сцене без падения FPS на телефоне.
- **The Boat (SBS, Awwwards SOTD) — интерактивная графическая новелла** (scrollytelling) — https://www.awwwards.com/sites/the-boat  
  Стек: HTML/CSS/JS parallax, scroll-jacking, звук; без WebGL  
  Взять: каждый элемент трансформируется от скролла (качка, наклон текста) — «среда реагирует на прокрутку»; звук и погода как слой атмосферы, единый 20-минутный сценарий  
  Зачем: Напоминание, что «круто» делает не полигональность, а ритм и атмосфера: звук, паузы, смена палитры между эрами.
- **Utsubo — Best Three.js Websites 2026 (Primland, Cartier, Shopify Editions, IVRESS…)** (scrollytelling) — https://www.utsubo.com/blog/best-threejs-websites-2026  
  Стек: three.js / WebGPU + TSL (IVRESS), GSAP, GLSL  
  Взять: Explore Primland: пролёт камеры над ландшафтом от скролла, атмосферный туман; Cartier Watches & Wonders: 6 «альковов»-сцен, скролл переводит из комнаты в комнату, Web Audio слой; IVRESS: один код на WebGPU и WebGL через TSL; Shopify Editions: последовательные скролл-раскрытия, частицы в типографике  
  Зачем: Свежий (2026) срез того, что жюри Awwwards считает «круто»: скролл-управляемая камера и сцены-остановки, а не свободный OrbitControls.

## 3. Библиотеки, риски, рецепты

### Библиотеки

- **three** r186 = three@0.186.0 (сентябрь 2026; GitHub-релиз опубликован 2026-09-24, npm ~08.09.2026 по utsubo.com) — Ядро 3D: сцена, камера, Points/InstancedMesh, FogExp2, WebGLRenderer и WebGPURenderer (three/webgpu + three/tsl), RenderPipeline для постобработки  
  https://github.com/mrdoob/three.js/releases/tag/r186  
  Поддержка 2026: Да, релиз каждый ~1–2 месяца (r183 18.02.2026, r185 25.06.2026, r186 09.2026)  
  Только ESM (require('three') deprecated, *.min.js убраны в r186). Clock deprecated с r183 -> Timer. PostProcessing переименован в RenderPipeline (r183). WebGPURenderer сам падает на WebGL2, если WebGPU нет (https://threejs.org/docs/pages/WebGPURenderer.html). Импортировать ЛИБО 'three', ЛИБО 'three/webgpu' — смешение даёт 1155 KB min / 307 KB gz вместо 792 KB / 220 KB gz (https://www.utsubo.com/blog/webgpu-threejs-migration-guide). Рекомендация для v1: WebGLRenderer (зрелая экосистема bloom/текста); WebGPU — как эксперимент позже.
- **camera-controls (yomotsu)** 3.1.2 (17.11.2025); peer three >=0.126.1; MIT — Управление камерой с плавными переходами: setLookAt / fitToSphere / fitToBox / dollyTo / rotateTo, smoothTime, границы, настраиваемые тач-жесты (touches.one/two/three)  
  https://github.com/yomotsu/camera-controls  
  Поддержка 2026: Да: последний push в репо 2026-09-09, 102 открытых issue, не архивирован  
  Требует controls.update(delta) в каждом кадре. Fly-to без GSAP: controls.setLookAt(px,py,pz, tx,ty,tz, true) при smoothTime 1.0–1.5 с (дефолт 0.25). Есть события rest/sleep — удобно для render-on-demand. Заменяет OrbitControls: у OrbitControls нет встроенных анимированных переходов, там пришлось бы твинить camera.position и controls.target GSAP-ом вручную. drei <CameraControls> оборачивает именно эту библиотеку (https://drei.docs.pmnd.rs/controls/camera-controls, в drei 10 внутри camera-controls v3).
- **@react-three/fiber** 9.8.1 (24.09.2026); peer react >=19 <19.4, three >=0.156. v10.0.0-alpha.5 (08.09.2026): WebGPU/TSL первого класса, three >=0.185 — alpha, не для продакшна — React-рендерер для three.js (если выбирать React-путь вместо vanilla)  
  https://github.com/pmndrs/react-three-fiber/releases  
  Поддержка 2026: Да, активно; 9.x стабильная ветка, 10.x альфа  
  React 19.3 ломал useTransition до 9.8.0 (issue #3915) — фиксировать версии react/fiber точно. frameloop="demand" + invalidate() даёт render-on-demand из коробки. Для вайб-кодинга AI-агентом: R3F даёт больше готовых кубиков (drei), но vanilla three + camera-controls — меньше движущихся частей и версионных конфликтов.
- **@react-three/drei** 10.7.9 (25.09.2026); peer @react-three/fiber ^9, react ^19, three >=0.159; внутри camera-controls ^3.1.0 и troika-three-text ^0.52.4. v11.0.0-alpha.7 (05.09.2026) под R3F 10 — Готовые компоненты: <CameraControls>, <Text> (troika), <Html> (оверлеи с occlude), <Stars>, <Sparkles>, <Billboard>, <Preload>  
  https://github.com/pmndrs/drei/releases  
  Поддержка 2026: Да, релизы каждую неделю  
  <Html occlude> — 'raycast' (скрывает за геометрией через рейкаст каждый кадр) или 'blending' (реальная окклюзия), transform-режим бывает мыльным на мобильных (https://drei.docs.pmnd.rs/misc/html). <Text> — обёртка troika, проп characters предзагружает глифы против FOUC (https://drei.docs.pmnd.rs/abstractions/text).
- **troika-three-text** 0.52.5; peer three >=0.125; MIT — SDF-текст в сцене (названия планет/эпох), генерирует SDF из .ttf/.otf/.woff на лету в web worker, автоподхват fallback-шрифтов Noto через unicode-font-resolver  
  https://github.com/protectwise/troika/tree/main/packages/troika-three-text  
  Поддержка 2026: Да: push в репо 2026-07-24, 93 открытых issue  
  Кириллица работает: либо основной шрифт содержит кириллицу, либо резолвер тянет Noto с CDN (самохостинг всего набора ~300 MB — не надо, лучше свой шрифт). .woff2 НЕ поддерживается — конвертировать в .woff/.ttf и хостить рядом. По умолчанию грузит Roboto с Google Fonts CDN — заменить на self-hosted сабсет Latin+Cyrillic (~60–150 KB). sdfGlyphSize 64 по умолчанию, поднимать только для крупных заголовков. gpuAccelerateSDF ускоряет генерацию. Каждый <Text> — отдельный draw call: держать ≤20 видимых.
- **three-mesh-bvh** 0.9.15 (09.09.2026); peer three >=0.159; MIT — Ускорение raycast/пространственных запросов по большим мешам (BVH)  
  https://github.com/gkjohnson/three-mesh-bvh/releases  
  Поддержка 2026: Да, релиз сентябрь 2026  
  Для этого проекта ОПЦИОНАЛЬНО: ~20 планет-сфер рейкастятся тривиально без BVH. Нужен только если появится большой меш (например, 3D-модель Трантора). Главное правило пикинга: НЕ рейкастить Points галактики (200k точек — медленно и неточно), поставить `points.raycast = () => {}` и кликать по невидимым сферам-прокси планет.
- **postprocessing (pmndrs)** 6.39.5 (09.09.2026); peer three >=0.168 <0.187; Zlib. v7.0.0-beta.x — переделка на RenderPipeline (в планах WebGPU), не стабильна — Bloom и прочие эффекты для WebGLRenderer, сливает эффекты в меньше проходов, чем three/examples EffectComposer  
  https://github.com/pmndrs/postprocessing  
  Поддержка 2026: Да, релиз под каждый three (верхняя граница peer-зависимости жёсткая — bump при каждом апдейте three)  
  Только WebGLRenderer; @react-three/postprocessing тоже WebGL-only. Для WebGPURenderer — встроенный RenderPipeline + bloom из three/addons/tsl/display/BloomNode.js (https://www.utsubo.com/blog/webgpu-threejs-migration-guide). Ключевые параметры BloomEffect: luminanceThreshold 0.8–1.0, intensity 0.5–2.0, mipmapBlur, рендер в половинном разрешении (https://www.utsubo.com/blog/threejs-best-practices-100-tips). Альтернатива без постпроцесса: аддитивные спрайты-свечение.
- **gsap** 3.15.0; лицензия Standard 'no charge' — бесплатна, включая коммерческое использование и все бывшие Club-плагины, с 3.13 (апрель 2025, после покупки Webflow) — Твины/таймлайны: fly-to камеры при OrbitControls, скраб камеры вдоль CatmullRomCurve3 (спираль/тоннель эпох), ScrollTrigger для скролл-таймлайна, анимация HTML-карточек  
  https://www.npmjs.com/package/gsap  
  Поддержка 2026: Да  
  Источник по лицензии: https://gsap.com/blog/3-13/ и https://webflow.com/blog/gsap-becomes-free. С camera-controls GSAP не обязателен для fly-to (есть setLookAt с transition), но полезен для сложных секвенций (камера + затухание лейблов + появление карточки) и для helix-таймлайна: gsap.to(progress, {value: t, onUpdate: () => curve.getPointAt(progress.value)}).
- **Theatre.js (@theatre/core, @theatre/r3f)** 0.7.2 (2024) — Визуальный редактор анимации камеры/сцены  
  https://github.com/theatre-js/theatre  
  Поддержка 2026: НЕТ фактически: последний push в публичный репо 2024-08-14, 141 открытых issue, README говорит «разработка временно перенесена в приватный репо». Более 2 лет без публичных релизов  
  Не брать в стек. Вместо него — GSAP-таймлайны + camera-controls, а ключевые позиции камеры хранить в JSON (планета -> {pos, target, smoothTime}).
- **CSS2DRenderer (three/addons/renderers/CSS2DRenderer.js)** часть three r186 — HTML-лейблы, привязанные к 3D-позициям (vanilla-аналог drei <Html>)  
  https://threejs.org/docs/pages/CSS2DRenderer.html  
  Поддержка 2026: Да (в составе three)  
  Проецирует позицию в экранные координаты и ставит CSS translate каждый кадр; окклюзии нет; деградирует при 50+ лейблах и сложной слоистости (https://www.intelligentgraphicandcode.com/development/threejs-interfaces/html-integration). Использовать максимум для 1–3 активных HTML-лейблов, остальные имена — troika SDF.
- **Vite** версия в этом ресёрче не проверялась — взять текущую мажорную при старте — Сборка статического сайта под GitHub Pages, code-splitting (динамический import 3D-чанка), анализ бандла  
  https://vite.dev/  
  Поддержка 2026: Да  
  Tree-shaking three слаб: даже импорт одного класса даёт ~295 KB несжатых из-за side-effects (https://discourse.threejs.org/t/what-is-the-state-of-tree-shaking/33168) — поэтому 3D загружать динамическим import() после первого экрана. Astro поверх Vite удобен для генерации статических страниц сущностей (SEO).

### Риски

- **[high]** iPhone Safari: нехватка памяти, потеря WebGL-контекста, перезагрузка вкладки («A problem repeatedly occurred»). Лимит кучи на вкладку ~300–450 MB на iPhone 8–14 и ~1 GB+ на iPhone 15+; jetsam убивает процесс независимо от WebKit. Сообщения о «WebGL context lost» на iOS 18.2/18.3 и о падениях GPU-процесса (MREExceptionAdvisoryLimitActive) на iOS 26.  
  Митигация: DPR cap 1.5 на телефонах / 2 на десктопе; текстуры планет ≤1024², всего GPU-текстур ≤64 MB (2048² PNG = ~21 MiB VRAM с мипмапами); KTX2/Basis; dispose() при смене эпох; никакого MSAA+постпроцесса в полном разрешении; обработчик webglcontextlost -> показать 2D-список и кнопку «перезапустить 3D»; тестировать на реальном iPhone с первой недели, а не на симуляторе.
  Источники: https://www.catchmetrics.io/blog/deep-dive-ram-internals-webkit, https://developer.apple.com/forums/thread/778735, https://github.com/home-assistant/frontend/issues/28367, https://discourse.threejs.org/t/three-js-broken-on-ios-17-with-context-lost/58025, https://www.utsubo.com/blog/threejs-best-practices-100-tips
- **[high]** Батарея и троттлинг: постоянный цикл 60 fps греет телефон даже на статичной сцене; iOS в режиме энергосбережения режет requestAnimationFrame до 30 fps; через 5–10 минут телефон троттлит GPU/CPU. Safari на iPhone Pro по умолчанию заперт на 60 Hz (120 Hz только через feature flag).  
  Митигация: Render-on-demand: рисовать кадр только при движении камеры/анимации (R3F frameloop="demand" + invalidate; в vanilla — dirty-flag + события camera-controls control/transition/rest). Паузить на document.hidden. Целиться в 60 fps, но проектировать анимации через delta-time, чтобы при 30 fps ничего не ломалось. Не обещать 120 Hz.
  Источники: https://dev.to/dheerajakula/why-a-static-threejs-scene-still-cooks-your-phone-and-the-dirty-flag-fix-3a6h, https://bugs.webkit.org/show_bug.cgi?id=168837, https://bugs.webkit.org/show_bug.cgi?id=272165, https://www.hontran.dev/blog/three-js-performance-optimization
- **[high]** Раскол экосистемы WebGL vs WebGPU: pmndrs/postprocessing и @react-three/postprocessing не работают с WebGPURenderer; для WebGPU нужен RenderPipeline + TSL-ноды (новый API, меньше примеров); часть сцен на WebGPU медленнее, чем на WebGL. Смешанный импорт three + three/webgpu раздувает бандл до 307 KB gz. WebGPU есть только на iOS 26+.  
  Митигация: Выбрать один путь в день 1. Рекомендация: WebGLRenderer + pmndrs postprocessing (или вообще без постпроцесса) для v1. WebGPU — отдельная ветка-эксперимент позже, когда drei 11 / R3F 10 выйдут из альфы. Никогда не импортировать оба входа одновременно.
  Источники: https://www.utsubo.com/blog/webgpu-threejs-migration-guide, https://www.utsubo.com/blog/threejs-2026-what-changed, https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/
- **[medium]** Bloom на мобильных — fill-rate bound: полный экран при DPR 3 (390×844 -> ~3 MP) + аддитивный оверрдро частиц + 2–3 прохода bloom легко выходят за 16 ms.  
  Митигация: Bloom в половинном разрешении (≈2× fps в fill-bound сценах), luminanceThreshold 0.8–1.0, intensity 0.5–2.0; на low/mid-тире выключать bloom и имитировать свечение аддитивными спрайтами и «мягкими» точками (gl_PointCoord falloff). Размер точек ≤8 px экрана.
  Источники: https://www.utsubo.com/blog/threejs-best-practices-100-tips, https://github.com/pmndrs/postprocessing
- **[medium]** HTML-оверлеи: CSS2DRenderer/drei Html не участвуют в depth-буфере; occlude='raycast' делает рейкаст на каждый лейбл каждый кадр; transform-режим мылит текст на мобильных; при 50+ лейблах CSS2D деградирует; на телефоне якорная карточка перекрывает половину экрана и «прыгает» при движении камеры.  
  Митигация: Имена планет/эпох — troika SDF-текст в сцене (≤20 видимых), HTML — только для 1 выбранной карточки и ≤3 hover-лейблов на десктопе. На мобильных карточка = bottom sheet (position: fixed), не привязана к объекту; камера сама подлетает так, чтобы планета оказалась в верхней трети экрана.
  Источники: https://drei.docs.pmnd.rs/misc/html, https://threejs.org/docs/pages/CSS2DRenderer.html, https://www.intelligentgraphicandcode.com/development/threejs-interfaces/html-integration
- **[medium]** Кириллица в SDF: troika не читает .woff2; дефолтный Roboto тянется с Google Fonts CDN, а недостающие глифы — с CDN через unicode-font-resolver (сеть, задержка, FOUC). Неполный сабсет = квадраты вместо букв «ё», «Ё», типографских кавычек и тире.  
  Митигация: Self-hosted .woff (Inter/Noto Sans/PT Sans) с сабсетом Latin + Cyrillic + Cyrillic-ext + пунктуация (~60–150 KB), проп font на все Text; предзагрузка через characters='АБВ…абв…0-9«»—…'; проверить в Safari, что resolver не уходит в сеть (Network tab). sdfGlyphSize 64 для лейблов, 128 только для заголовка эпохи.
  Источники: https://github.com/protectwise/troika/blob/main/packages/troika-three-text/README.md, https://drei.docs.pmnd.rs/abstractions/text
- **[medium]** Бандл и первый экран: three ~792 KB min / 220 KB gz сам по себе, tree-shaking почти не работает; canvas пустой несколько секунд -> LCP > 2.5 s, INP страдает от компиляции шейдеров (50–300 ms на шейдер).  
  Митигация: HTML-оболочка + постер (WebP) сначала; 3D-чанк грузить динамическим import() после события load или по клику «Открыть 3D-карту»; бюджет 3D-чанка ≤300 KB gz; прогрев шейдеров renderer.compileAsync() до показа; зарезервировать размер canvas (aspect-ratio) против CLS.
  Источники: https://www.utsubo.com/blog/webgpu-threejs-migration-guide, https://www.utsubo.com/blog/webgl-three-js-site-seo-rankable-guide, https://discourse.threejs.org/t/what-is-the-state-of-tree-shaking/33168
- **[medium]** SEO и доступность: canvas — чёрный ящик для краулеров и скринридеров; hash-роуты (#/planet/trantor) не индексируются; без prefers-reduced-motion часть людей закроет страницу.  
  Митигация: Статические HTML-страницы на каждую сущность из того же JSON, JSON-LD, sitemap, noscript со списком; 3D — progressive enhancement над готовым DOM-списком; переключатель «2D-список / 3D-карта»; при prefers-reduced-motion — без автовращения и плавных перелётов (enableTransition=false), без пульсации bloom.
  Источники: https://www.utsubo.com/blog/webgl-three-js-site-seo-rankable-guide, https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics, https://css-tricks.com/almanac/rules/m/media/prefers-reduced-motion/, https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/
- **[medium]** Версионная карусель React-стека: fiber 9 требует react >=19 <19.4, react 19.3 ломал useTransition до fiber 9.8.0; R3F 10 и drei 11 в альфе; pmndrs postprocessing имеет жёсткую верхнюю границу three (<0.187) — каждое обновление three может сломать сборку.  
  Митигация: Закрепить точные версии (react 19.2.x или 19.3 + fiber 9.8.x + drei 10.7.x + three 0.186) в package.json и не обновлять до конца v1; либо выбрать vanilla three + camera-controls + troika + GSAP — меньше peer-конфликтов, AI-агенту проще держать в контексте. Renovate/Dependabot — только с CI-проверкой сборки.
  Источники: https://github.com/pmndrs/react-three-fiber/releases, https://github.com/pmndrs/drei/releases, https://registry.npmjs.org/postprocessing/latest
- **[low]** Пикинг: рейкаст по 200k Points галактики медленный и даёт ложные попадания; на тач-экране палец промахивается по планете 6 px.  
  Митигация: points.raycast = () => {}; кликать по невидимым сферам-прокси с радиусом ≥ 24 px экрана (масштабировать прокси от дистанции камеры); three-mesh-bvh подключать только если появится большой меш.
  Источники: https://github.com/gkjohnson/three-mesh-bvh, https://discourse.threejs.org/t/better-performance-instanced-mesh-or-points/20293
- **[low]** Theatre.js как редактор камеры — проект публично заморожен с августа 2024 (0.7.2, 141 issue).  
  Митигация: GSAP + camera-controls; позиции камеры для каждой планеты/эпохи хранить в JSON и подбирать через dev-кнопку «сохранить текущий вид».
  Источники: https://github.com/theatre-js/theatre, https://registry.npmjs.org/@theatre/core/latest

### Рецепт галактики
СЛОИ СЦЕНЫ (всего 25–40 draw calls на мобильном):
1) Фон-звёзды: 1 Points, 15–20k точек на сфере R=400–600, size 1–1.5 px, без sizeAttenuation, статичный. 1 draw call.
2) Галактика (техника Bruno Simon, Three.js Journey «Galaxy Generator» + «Animated galaxy»: https://threejs-journey.com/lessons/galaxy-generator, https://threejs-journey.com/lessons/animated-galaxy; открытые реализации: https://github.com/BABAK0T0/Galaxy-particles, https://github.com/NzJulien/galaxy-generator): для i в 0..N: r = R * pow(random(), 1.6) (плотнее к центру); branchAngle = (i % branches) / branches * 2π, branches = 3–5; spinAngle = r * spin (spin 0.8–1.2); randomness по осям = pow(random(), 3) * (random()<0.5?1:-1) * randomness * r (randomness 0.2–0.35), по Y ×0.3 (плоский диск); position = (cos(branch+spin)*r + rx, ry, sin(branch+spin)*r + rz); color = mix(insideColor #ffb46b, outsideColor #3a5bd9, r/R); дополнительно атрибут aScale = random() для разброса размеров. Материал: ShaderMaterial (или PointsNodeMaterial в TSL), blending: AdditiveBlending, depthWrite: false, transparent: true; во фрагменте мягкий круг strength = pow(1 - 2*distance(gl_PointCoord, 0.5), 4–8) — это даёт «свечение» без bloom. В вершинном шейдере дифференциальное вращение: angle = atan(x,z) + uTime * (1/r) * uSpeed (медленно, uSpeed 0.02–0.05, и только пока сцена «живая»). N: 60–80k на телефоне, 150–200k на десктопе. 1 draw call. Вариант WebGPU: instancedArray + Fn().compute(N) на 200k частиц без загрузки с CPU (https://www.utsubo.com/blog/webgpu-threejs-migration-guide, https://threejsroadmap.com/blog/galaxy-simulation-webgpu-compute-shaders).
3) Пыль/ядро: второй Points 10–20k тёмно-фиолетовых точек с NormalBlending и alpha 0.15 вдоль рукавов (пылевые полосы) + 1–2 аддитивных Sprite-билборда 512² (радиальный градиент) в центре как ядро. 2–3 draw calls.
4) ~20 именованных планет (Трантор, Терминус, Синнакс, Сивенна, Калган…): позиции НЕ случайные — сгенерировать один раз тем же спиральным правилом (r и рукав подбираются вручную: Трантор в центре, Терминус на краю рукава) и сохранить в planets.json {id, x,y,z, radius, colorA, colorB, era[]}. Рендер: один InstancedMesh (SphereGeometry 24×16, ~700 треугольников) с per-instance color через instanceColor и MeshStandardMaterial с emissive 0.15 — 1 draw call; или 20 отдельных Mesh с процедурным шейдером (полосы/океан/город по noise) — 20 draw calls, зато у каждой свой облик. Текстуры: ≤1024² на планету (лучше атлас 2048² на все), KTX2. Кольцо-подсветка выбранной планеты: один Ring/Sprite с пульсом через uTime.
5) Подписи: troika Text (SDF) над каждой планетой, self-hosted .woff Cyrillic, anchorX center, fontSize ≈ 2–3% от расстояния до камеры с clamp; показывать только планеты активной эпохи + ближайшие 8–12 по дистанции; остальные — fade-out через material.opacity. ≤20 draw calls.
6) Глубина: FogExp2(0x02030a, 0.0018–0.003) на планетах (https://threejs.org/docs/pages/FogExp2.html) + в шейдере точек умножение альфы на smoothstep(far, near, depth) — дальние рукава бледнеют, ближние ярче; лёгкая виньетка через CSS radial-gradient поверх canvas (бесплатно). Цвет фона 0x02030a, не чистый чёрный — bloom/аддитив читаются лучше.
7) Постпроцесс (только high-tier): pmndrs postprocessing BloomEffect {mipmapBlur:true, luminanceThreshold 0.85, intensity 0.9, radius 0.6} в половинном разрешении + опционально ToneMapping ACES; на телефонах вместо bloom — п.2 мягкие точки + спрайты. WebGPU-вариант: RenderPipeline + bloom() из three/addons/tsl/display/BloomNode.js.
8) Камера и перелёты: camera-controls; обзор галактики — polarAngle 0.9–1.1 рад (взгляд под 35–45° сверху), minDistance 8, maxDistance 350; клик по планете -> controls.setLookAt(planet.x + off.x, planet.y + off.y, planet.z + off.z, planet.x, planet.y, planet.z, true) с smoothTime 1.2 и offset ≈ 6 радиусов планеты, смещённый вверх, чтобы планета села в верхнюю треть под bottom sheet; кнопка «Назад к галактике» — setLookAt на сохранённый общий вид. Таймлайн эпох: 6–8 «камер эпохи» в JSON; переключение эпохи = перелёт к центроиду её планет + фильтр видимости; 3D-таймлайн как спираль/тоннель — CatmullRomCurve3 через точки эпох, GSAP-скраб progress 0..1 -> curve.getPointAt(t) для позиции и getPointAt(t+0.02) для target (https://threejs.org/docs/pages/CatmullRomCurve3.html).
9) Render-on-demand: кадр рисуется, пока controls.update(delta) вернул true, идёт GSAP-твин или крутится uTime (ограничить «дыхание» галактики 20 fps таймером или выключать при бездействии >5 с).
10) Тиры устройств: измерить средний frame time первых 60 кадров и navigator.deviceMemory; low: 40k точек, DPR 1, без bloom; mid: 80k, DPR 1.5, без bloom; high: 200k, DPR 2, bloom. Параметры вынести в один config-объект — AI-агенту так проще крутить внешний вид (lil-gui в dev-режиме).

### HTML-оверлеи и карточки
ПРИНЦИП: имена — в 3D (troika SDF, дёшево и с окклюзией), HTML — только для ОДНОЙ открытой карточки и ≤3 hover-лейблов на десктопе. Никаких 20 плавающих div’ов.
ЯКОРЬ (vanilla): каждый кадр, когда камера двигалась (событие camera-controls 'update' или dirty-flag): v.copy(obj.position).project(camera); x = (v.x*0.5+0.5)*w; y = (-v.y*0.5+0.5)*h; скрыть если v.z > 1 (за камерой) или объект дальше порога; el.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-100%)`; div внутри position:absolute; left:0; top:0; will-change: transform; pointer-events: none (кроме кнопки). Это ровно то, что делает CSS2DRenderer (https://threejs.org/docs/pages/CSS2DRenderer.html) — его можно взять готовым для 1–3 лейблов. R3F: <Html center zIndexRange={[10,0]} occlude=\"raycast\" distanceFactor={12}> только для активного объекта; occlude на мобильных выключать (лишний рейкаст в кадр), вместо этого простая проверка v.z и дистанции (https://drei.docs.pmnd.rs/misc/html). transform-режим не использовать — мылит текст на iPhone.
МОБИЛЬНЫЙ ПАТТЕРН: карточка сущности НЕ привязана к планете. Тап по прокси-сфере -> 1) camera-controls setLookAt с offset так, чтобы планета оказалась в верхней трети экрана; 2) снизу выезжает bottom sheet: position:fixed; left:0; right:0; bottom:0; max-height: 55dvh; padding-bottom: env(safe-area-inset-bottom); border-radius 16px 16px 0 0; background rgba(8,10,20,.85) + backdrop-filter blur(12px) c solid-fallback; внутри overflow-y:auto, touch-action: pan-y; canvas — touch-action: none, чтобы жест в карточке не крутил камеру. Свайп вниз/кнопка × закрывает и возвращает камеру. Десктоп (≥900px): та же карточка как правая панель 380–420px, галактика остаётся интерактивной слева. В карточке: заголовок 20–24px, текст ≥16px, теги «Сериал S1–S3 / Книга», «в книге иначе» как отдельный блок, изображение lazy (WebP ≤100 KB) с фиксированным aspect-ratio.
ЧИТАЕМОСТЬ ЛЕЙБЛОВ: troika outlineWidth '4%' и outlineColor фона или лёгкая тёмная плашка; HTML-лейблы — text-shadow 0 1px 2px #000 и шрифт ≥14px; clamp координат в пределах viewport с отступом 8px; при перекрытии двух лейблов ближе 24px скрывать дальний (простая O(n²) проверка на 20 элементов). Под открытым bottom sheet скрывать 3D-лейблы в нижней половине экрана.
СОСТОЯНИЕ И URL: каждая карточка = реальный путь (/planets/trantor/), пушить через history.pushState при открытии в 3D; Back закрывает карточку; тот же путь как статическая страница для SEO. Фокус переводить в карточку (role=\"dialog\", aria-modal), Esc закрывает; canvas aria-hidden=\"true\".
ПРОИЗВОДИТЕЛЬНОСТЬ: обновлять позиции HTML только при изменении камеры; не читать layout (getBoundingClientRect) в цикле — размеры canvas кешировать на resize; анимации карточки CSS transform/opacity, не top/left.

### Бюджет производительности
ЦЕЛИ: 60 fps (16.7 ms) на iPhone 12/13 в Safari и в Chrome на десктопе при 1440p; при Low Power Mode iOS даёт 30 fps — сцена должна оставаться гладкой через delta-time. Внутренний бюджет кадра ≤ 11–12 ms (запас на троттлинг). Idle: 0 кадров в секунду (render-on-demand).
DRAW CALLS: мобильный ≤ 40 (фон 1 + галактика 1 + пыль/ядро 2–3 + планеты 1 инстансом или ≤20 + подписи ≤20 + подсветка 1); десктоп ≤ 100. Ориентир из практики: <100 draw calls и <100k вершин на мобильном (Don McCurdy, цит. по https://www.utsubo.com/blog/threejs-best-practices-100-tips).
ЧАСТИЦЫ: галактика 60–80k точек (mobile) / 150–200k (desktop); фон 15–20k; пыль 10–20k; размер точки ≤ 8 px экрана (аддитивный overdraw — главный убийца fill-rate).
ТРЕУГОЛЬНИКИ: 20 планет × ~700–1500 = ≤ 30k; всего в кадре < 100k.
ПИКСЕЛИ: renderer.setPixelRatio(Math.min(devicePixelRatio, isPhone ? 1.5 : 2)) — 390×844 при DPR 1.5 = 1.5 MP вместо 2.6 MP при DPR 2 и 3 MP при DPR 3 (https://www.hontran.dev/blog/three-js-performance-optimization, https://www.utsubo.com/blog/threejs-best-practices-100-tips). Антиалиасинг MSAA выключить на телефонах (мягкие точки его не требуют).
ТЕКСТУРЫ И GPU-ПАМЯТЬ: ≤ 1024² на планету или один атлас 2048²; KTX2/Basis (4–8× меньше VRAM); 2048² PNG = ~21 MiB VRAM с мипмапами — таких ≤ 2; суммарно текстур ≤ 64 MB. Считать безопасным MAX_TEXTURE_SIZE 4096 (старые iPhone столько и отдают: https://github.com/justadudewhohacks/face-api.js/issues/204).
ПАМЯТЬ ВКЛАДКИ: суммарно JS heap + GPU держать < 250 MB, потому что лимит на вкладку ~300–450 MB на iPhone 8–14 и ~1 GB+ на iPhone 15+ (https://www.catchmetrics.io/blog/deep-dive-ram-internals-webkit).
СВЕТ: 1 DirectionalLight + 1 AmbientLight/HemisphereLight, без теней (тени 0).
ПОСТПРОЦЕСС: только high-тир; bloom в половинном разрешении (≈2× fps в fill-bound сценах), ≤ 2 прохода; mid/low — без постпроцесса.
БАНДЛ И ЗАГРУЗКА: HTML+CSS+JS оболочки ≤ 50 KB gz (список эпох и сущностей — сразу в DOM); 3D-чанк (three + camera-controls + troika + gsap ± postprocessing) ≤ 300 KB gz — three один даёт ~220 KB gz, смешение three и three/webgpu = 307 KB gz, нельзя (https://www.utsubo.com/blog/webgpu-threejs-migration-guide); шрифт .woff Latin+Cyrillic ≤ 150 KB; данные JSON ≤ 100 KB; текстуры планет суммарно ≤ 1.5 MB (KTX2) или ≤ 3 MB WebP; картинки карточек lazy ≤ 100 KB каждая. Время до первого 3D-кадра ≤ 2.5 s на 4G после клика/после load; LCP страницы ≤ 2.5 s за счёт HTML-заголовка и постера, CLS < 0.1 через зарезервированный aspect-ratio canvas, INP < 200 ms (компиляция шейдеров 50–300 ms — прогревать compileAsync до показа).
ЛЕЙБЛЫ/HTML: ≤ 20 troika Text видимых; ≤ 3 HTML-лейблов; 1 карточка.
ТИРЫ: low (deviceMemory ≤ 2 GB или frame time > 20 ms в первые 60 кадров): 40k точек, DPR 1, без bloom, без «дыхания» галактики; mid: 80k, DPR 1.5, без bloom; high (десктоп/новые iPhone): 200k, DPR 2, bloom half-res.

### Фолбэк и SEO
АРХИТЕКТУРА «HTML сначала»: один источник данных (data/*.json или .md: эпохи -> планеты/персонажи/фракции/кризисы с текстом, картинкой, тегами сериал/книга, блоком «в книге иначе») генерирует И статические страницы, И 3D-сцену. Генератор — Astro (или Eleventy) поверх Vite, деплой на GitHub Pages как чистая статика. Маршруты: / (таймлайн-список всех эпох и сущностей как реальный DOM + кнопка «Открыть 3D-карту»), /eras/<slug>/, /planets/<slug>/, /characters/<slug>/, /factions/<slug>/, /crises/<slug>/ — каждая с <title>, h1, описанием, картинкой, тегами и внутренними <a>-ссылками; sitemap.xml и robots.txt; html lang=\"ru\", Open Graph картинка на сущность. Внутри 3D-приложения навигация через history.pushState на те же пути (не #hash — хэши не индексируются); для GitHub Pages сгенерировать реальную страницу на каждый путь, чтобы прямой заход работал без 404-редиректа.
JSON-LD в исходном HTML (не через JS): WebSite + BreadcrumbList на каждой странице; сущности — CreativeWork/Thing с isPartOf: TVSeries «Foundation» и Book (трилогия Азимова); списки эпох — ItemList; опционально FAQPage на главной («Чем сериал отличается от книг?» и т.п.) — по https://www.utsubo.com/blog/webgl-three-js-site-seo-rankable-guide это главный рычаг для поисковиков/AI-ответов в 2026. Проверка: Search Console -> URL Inspection -> Test Live URL -> HTML: h1, текст и ссылки должны быть там без 3D (https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
ЗАГРУЗКА 3D КАК PROGRESSIVE ENHANCEMENT: canvas с постером (WebP галактики) и зарезервированным aspect-ratio; 3D-чанк — динамический import() после window 'load' (десктоп) или по нажатию «Открыть 3D-карту» (мобильный, экономит батарею и данные); <noscript> дублирует список эпох/сущностей.
КОГДА ПОКАЗЫВАТЬ 2D-СПИСОК ВМЕСТО 3D (любой из триггеров): нет WebGL2 (canvas.getContext('webgl2') === null); matchMedia('(prefers-reduced-motion: reduce)') — по умолчанию 2D, с кнопкой «Всё равно открыть 3D» без автовращения и перелётов (enableTransition=false, мгновенные срезы камеры, без пульсации bloom); navigator.connection?.saveData; navigator.deviceMemory ≤ 1; событие webglcontextlost или ошибка загрузки чанка; ?view=2d или пользовательский переключатель «2D / 3D» с запоминанием в localStorage. 2D-вид — та же разметка списка, что видят краулеры: таймлайн эпох вертикально, внутри карточки сущностей с фильтром «сериал / книга».
ДОСТУПНОСТЬ: canvas aria-hidden=\"true\" + скрытый текстовый эквивалент «Интерактивная 3D-карта галактики; список планет ниже»; карточка — role=\"dialog\", фокус внутрь, Esc закрывает; клавиатурная навигация по списку сущностей и кнопки «предыдущая/следующая эпоха», которые работают и в 3D; контраст текста лейблов ≥ 4.5:1 (обводка/плашка).
ИСТОЧНИКИ ПО reduced-motion и фолбэкам: https://css-tricks.com/almanac/rules/m/media/prefers-reduced-motion/, https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/, https://appscale.blog/en/blog/threejs-production-3d-web-2026-webgpu-realtime-standards.
