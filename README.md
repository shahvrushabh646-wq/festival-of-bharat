# Festival of Bharat AI Studio

A local-first reel production workspace for original Indian festival, heritage, devotional and culture videos. A concept is never labelled READY until a real H.264 MP4 has been saved and all recorded QC checks pass.

## Run locally

1. Install Node.js 20 or later.
2. Copy `.env.example` to `.env` for optional connectors. `YOUTUBE_API_KEY` enables YouTube view counts. `GOOGLE_CSE_API_KEY` plus `GOOGLE_CSE_ID` enables automatic discovery of Google-indexed Instagram Reel URLs. All keys are optional; public search links and topic-only production remain available without them.
3. Run `node server.js` from this folder.
4. Open `http://127.0.0.1:8766`.

Wikimedia Commons search needs internet access but no API key. Downloads retry up to three times with bounded backoff, then report the actual network/HTTP/decode error; an unverified or empty file is never imported. Import requires FFmpeg and FFprobe to decode and measure the local file before it is catalogued. The current build does not connect Openverse. Imported media and rendered masters are stored in `data/`. The ZIP intentionally excludes `.env`, `.git`, `node_modules`, and generated media/data. Keep `.env` private.

## Production workflow

- Search a topic. The studio checks available public YouTube metadata and searches Commons for candidate media. Missing connectors or results are reported honestly; no viral metrics are invented.
- It creates four distinct storyboards: The Moment, The Detail, The Energy, and The Meaning. These are planning documents, not reels or playable placeholders.
- Import rights-recorded Wikimedia Commons media or upload local media you own or have permission to use. Each of the eight storyboard scenes must have a distinct real file with creator, licence, source and dimensions recorded. Photos and videos are both supported; a photo-only or video-only reel is allowed and described accurately.
  - Edit text, scene order, media and template. A rendered master must be 10–20 seconds, 1080×1920, 30 fps, H.264 MP4 and music-free. The local FFmpeg worker renders queued jobs without a browser; the browser MediaRecorder path remains a manual fallback and needs the page open.
- QC reopens the encoded video in the browser and checks decoded playback, actual dimensions and duration, frame rate, aspect ratio, container/codec, source resolution, unique media, rights metadata, text overflow and frame completion. The server requires FFprobe and FFmpeg to verify H.264/yuv420p, dimensions, frame rate, 10–20 second duration, audio absence, sustained black-frame spans and full-file decode. Without these tools a render may be created in the browser but it cannot be marked READY for approval/download.
- Exported storyboard sheets are text-only planning documents. They are not previews or reel media.

## Research and rights limits

Public short-form references are for research only. The studio does not download, copy, repost or reproduce reference reels. For Instagram, topic expansions and the user-provided seed profiles build public Google Search links. Optionally, the Google Custom Search JSON API can return indexed public Reel URLs and snippets. The user still opens and inspects each Reel, then records visible creator/date/duration/counts. Instagram metrics are always labelled user-observed, not API-verified. The current account is Personal and has no official competitor-Reel metrics connection. This flow uses no Instagram scraping. Dynamic Google discovery can surface additional creators beyond the seed list.

YouTube public view counts are API-verified only when `YOUTUBE_API_KEY` is configured. Visual shot-level pattern analysis is marked pending until a person inspects a reference and records hook, opening visual, shot/story structure, pace, text, transitions, emotion, curiosity, payoff and CTA. Concepts wait for a recorded pattern or an explicit topic-only choice. Public API metadata alone does not claim video-frame analysis. Other social platforms are listed as manual research sources, not live connectors.

Commons file-page, creator and licence data are recorded when available. Missing rights metadata blocks QC. Review source pages and applicable licence terms before publishing; metadata is not a legal guarantee. Local upload rights confirmation is recorded as a user assertion, not independently verified.

## Production verification

Run `npm run verify:production` to generate one synthetic, mixed-photo/video 1080×1920 MP4 through the local FFmpeg worker and check it with FFprobe, full decode, and black-frame scan. Run `npm run verify:overnight` to queue and render four synthetic fixture reels through the persistent queue and QC them. These are renderer acceptance tests, not finished cultural reels using rights-cleared production assets. Both require local FFmpeg and FFprobe.

The renderer snaps shot durations to 30 fps frame boundaries and normalizes both xfade inputs and output to 30 fps with a shared timebase. JPEG scenes are scaled from full range to limited video range before crop/motion processing. Video scenes use FFprobe source range/pixel-format metadata (unknown remains auto; HDR transfer metadata is not overwritten). A dedicated final H.264 encode normalizes the assembled MP4 with explicit 1080×1920 scaling/padding, limited output range, constant 30 fps, and `yuv420p`; FFprobe then checks the final file. A wrong pixel format, including `yuvj420p`, fails QC and cannot become READY. Later transition offsets account for earlier crossfade overlaps. FFmpeg encoder preset can be adjusted locally with `FFMPEG_PRESET`.
## Not configured

External AI model access, secure cloud sign-in, scheduled automatic topic research, Android cloud deployment, Canva account integration and Instagram publishing are not configured. Instagram posting remains a separate human-authorized step.

## Background rendering and integrations

The local Node service hosts the API, persistent disk queue, and FFmpeg worker. `npm run worker` (or `npm run studio`) starts that local service without opening a browser; `npm start` runs the same API/worker host directly. Once the dashboard shows all intended reels queued, the browser can close while the service and computer remain awake. Queue state is written atomically and interrupted renders restart from local scene files after service restart. Install FFmpeg and FFprobe or set `FOB_FFMPEG_PATH` and `FOB_FFPROBE_PATH` in `.env` (legacy `FFMPEG_PATH` and `FFPROBE_PATH` also work). The host checks the system PATH when no path is specified.

On Windows, `scripts/start-studio.ps1` launches the local host hidden and `scripts/register-startup-task.ps1` registers it to start at user sign-in. Register it once and keep the PC powered and awake. The optional schedule uses `FOB_SCHEDULE_ENABLED=true`, `FOB_START_TIME=02:00`, `FOB_END_TIME=06:00`, and `FOB_DAILY_REEL_COUNT=4`. It starts already prepared, rights-checked render jobs within that local-time window; topic research and Commons asset discovery still happen in the browser before jobs enter the queue. Jobs continue past 06:00 if needed and resume after restarts; the app does not promise they finish by 06:00. If the API/worker host is not running, the dashboard reports it offline and the browser renderer remains available manually.

Hosted visual analysis is implemented through the OpenAI Responses API. Set `OPENAI_API_KEY` in `.env` to enable it. The app samples selected local media, sends image frames to OpenAI for analysis, and records the provider/model, frame count and results; do not enable this unless you are comfortable sending those frames to the hosted provider. `store:false` is sent in the API request.

Instagram Insights OAuth and read-only sync for the user's own account are implemented. Set `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, and the exact callback URL in `.env`, configure that same URL and required permissions in Meta's developer console, then authorize the account in the studio. The account must be Creator or Business; the current app cannot connect Insights while the Instagram profile is Personal. Token data is encrypted at rest using the app secret. The studio does not publish posts or read competitor private Insights. Metrics stay unknown until authorization and a successful sync. Meta review/access requirements may apply to your app configuration.

For full autonomous overnight production, the machine must be awake, the local server must start, and a production topic/research/assets must already be available to the queue. This build provides background rendering/recovery, not unattended 2 AM topic selection, live research and asset collection.
# Automatic storyboard media matching

Each current storyboard has an **Auto-source remaining scenes** action. It searches Wikimedia Commons for scene-specific queries, considers photo and video results, rejects duplicate files and candidates without recorded creator, licence, licence URL, and source-page fields, then ranks the remaining matches using title/topic overlap, pixel resolution, reel crop orientation, intended photo/video fit, and cultural terms. Each imported match keeps its source/licence metadata and a query plus score explanation; unmatched scenes stay visibly unassigned for manual search or replacement.

This score is metadata ranking. When `OPENAI_API_KEY` is configured, users can also run hosted frame inspection to assess visible content and scene match. Inspect every selected asset before rendering and approval. Commons search and the local browser must remain available while automatic sourcing runs. It only fills the selected storyboard and never marks a storyboard or draft as a rendered/ready Reel.
# Scene timeline and reel covers

The storyboard editor now provides a duration-weighted scene timeline, drag-and-drop scene reordering (with move buttons retained), per-scene display-text editing, scene duration, motion treatment, transition, and video in/out trim fields. The local renderer uses the saved clip window and supports slow push, horizontal pans, vertical rise, parallax-style crop, static framing, animated text entrance, hard/match cuts, crossfades, and wipe/whip reveals. Trims are constrained to the actual decoded video duration during render. Queued FFmpeg jobs run on the local worker; the browser fallback must remain open until its MP4 is saved and QC completes.

After a reel has a saved QC-passed MP4, **Create 3 covers from this MP4** extracts frames at three points in that exact render and exports branded PNG variants. Cover generation is unavailable for concepts/storyboards without a real master.

The browser renderer requires the page to remain open. When FFmpeg and FFprobe are installed and configured, the local disk-backed background worker can render already sourced jobs after the browser closes. Hosted frame analysis and authorized own-account Instagram Insights are available only after their credentials and account requirements are configured. Competitor Instagram metrics are not provided as an API-verified feed.

# Automatic production and recovery

Submitting a topic now runs the available research connectors, creates the four distinct storyboards without requiring a separate manual concepts click, attempts scene-by-scene Commons matching for all four reels, and renders/QCs every reel with a complete set of distinct rights-recorded assets. Human approval remains required. Each completed asset assignment/master is saved locally as the run proceeds. Search/import requests retry transient 429/5xx/network failures with backoff. If the page refreshes or closes during a run, the saved run is marked interrupted and a **Resume interrupted production** action continues unrendered/incomplete reels. Unmatched scenes and failed renders stay blocked with their error details; the app never relabels them READY.

Automatic ranking uses real Commons title/metadata matches, minimum usable frame resolution, crop orientation, intended photo/video preference, creator/licence/source completeness and duplicate avoidance. It requires actual scene-term overlap; files selected by title alone are still not visually understood. Without OPENAI_API_KEY the app has no visual-analysis provider; every assigned asset should be inspected before approval. Preferred photo/video alternation falls back to the other type only where necessary; asset availability is not guaranteed.

The editor includes editable crop X/Y, text placement, motion, transition, video in/out trim, image/video duration, drag reorder and undo/redo. The background renderer applies a different per-pillar text treatment, moves still photos, mixes photos/video, and applies restrained fades/wipes only where storyboard transitions request them; hard and match cuts stay direct. Cover choices are extracted from the final MP4 and can be selected/downloaded. When the local FFmpeg worker is configured, rendering runs in the server background. Instagram public competitor metrics still require manual observation; own-account Insights sync is available after professional account setup and authorization. No actual 4-master acceptance run is claimed unless 32 rights-complete assets render and QC successfully.

# Cinematic planning and validation update

The four concept pillars now use separate eight-scene plans with explicit shot roles, per-shot rationale, continuity notes, scene-specific photo/video preference, distinct transitions/movement, and variable pacing. The generated plans total approximately 10–14 seconds before edits. The storyboard editor displays each scene’s role, media preference and “why this shot” rationale. The asset ranker uses a shared weighted metadata model and requires source/licence/creator data; it still cannot confirm the image’s actual contents or visual quality.

`production-planning.js` is a shared planning/analysis boundary. `analyzeAsset()` reports `METADATA`, returns unknown visual attributes as empty/unknown, and explicitly says when vision is unavailable; the hosted vision route adds separately labelled frame-level analysis when configured. Production records keep missing Instagram performance fields null; learning summaries require minimum samples and describe observations without causal claims. Per-reel state history records legal transitions through asset collection, rights validation, edit, render, QC, review and human decisions.

The project now has dependency-free Node scripts: `node scripts/typecheck.js`, `node --test`, and `node scripts/build.js`. If npm is installed, the matching commands are `npm run typecheck`, `npm test`, and `npm run build`. Build output is written to the ignored `dist/` folder. The checked development machine has Node but does not expose an `npm` executable, so `npm install` could not be run here.


<!-- Vercel redeploy trigger: 2026-10-05 -->


<!-- Final clean Render deployment marker: 2026-10-05T11:17:56.106Z -->
