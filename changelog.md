# Changelog

Running log of changes made while working through the design engineer take-home. Newest at the bottom within each session.

## Session 1 — audit + header a11y/UX pass

### Context

Before touching the expanded-view design, audited the existing `BuildHeader` against the Inclusive Components "Collapsible Sections" guidance and fixed the issues that surfaced. The goal of this pass is to land the header in an accessible, less-noisy state so the expanded-view design has a solid base.

### Changes

- **`src/App.tsx`** — Wired no-op `onRetryFailedJobs`, `onRestartBuild`, `onCancelBuild` handlers so `BuildActionsComboButton` actually renders. The component returns `null` when no handlers are passed, which made the failed-build card look like it had no retry affordance.

- **`src/components/BuildHeader.tsx` — default-expanded on failure.** `useState(false)` → `useState(status === "failed")`. Assumption: if a build has failed, the developer wants the triage view open immediately.

- **`src/components/BuildHeader.tsx` — removed inaccessible hover-only chevron trigger.** The blue chevron `<button>` on the left of the row was `hidden` until mouse-hover on the card, putting it out of reach for keyboard users (a11y audit item #2). Deleted entirely.

- **`src/components/BuildHeader.tsx` — status icons stay visible.** Removed the `group-hover/pr:hidden` classes that swapped the status icon for the now-deleted chevron button on hover. Icons now render unconditionally for their status.

- **`src/components/BuildHeader.tsx` — added "View details" / "Hide details" toggle button.** Placed at the right of the progress-bar row (sketch direction; moved off the crowded top row because three pill buttons next to each other looked busy). Real `<button type="button">` with `aria-expanded`, label toggles with state, chevron icon marked `aria-hidden="true"`, visible `focus-visible:ring-2` focus ring. Chevron icons swapped from bidirectional `ChevronsUpDown`/`ChevronsDownUp` to the conventional disclosure `ChevronDown`/`ChevronUp`.

- **`src/components/BuildHeader.tsx` — progress bar no longer a click target.** Removed the wrapper's `onClick={() => setIsExpanded(true)}` (a11y audit item #3 — an inaccessible `<div onClick>` trigger) and the hover classes on individual segments. The segments are now purely a visual summary; the "View details" button handles the gesture.

- **`src/components/BuildHeader.tsx` — card no longer turns blue on hover.** Dropped the `isHeaderHovered` state, the `onMouseEnter` / `onMouseLeave` handlers, and the inline `borderColor` / `backgroundColor` hover overrides. The card now keeps its status colour consistently. Nothing in README/AGENTS asked for the blue hover state.

- **`src/components/BuildHeader.tsx` — removed card-wide click toggle.** Since default-expanded on failure makes the expand gesture rare, kept things simple: the toggle button is the sole control. Benefits: (1) removes the `cursor-pointer` div-as-implicit-control oddity; (2) prevents the text-selection gotcha where click-drag-release on the expanded view's error text would collapse the card. Also removed the now-unneeded `e.stopPropagation()` calls on the actions-combo wrapper and the toggle button.

- **`src/components/BuildHeader.tsx` — split the toggle into two context-appropriate buttons.** "View details" stays at the right of the progress-bar row (rendered only when collapsed); "Hide details" now sits at the bottom of the expanded drawer, right-aligned. Rationale: when you're done reading the expanded content your eye is at the bottom, so the collapse control belongs there rather than above the content.

- **`src/components/BuildHeader.tsx` — extracted `DetailsToggle` component.** Small inline component above `BuildHeader` that owns the button markup, `aria-expanded`, label convention ("View details" / "Hide details"), and chevron direction. Two call sites reduced to `<DetailsToggle isExpanded={...} onClick={...} />`. Kept inline rather than in its own file since it's not used elsewhere yet.

- **`src/components/BuildHeader.tsx` — progress bar now persistent.** Previously hidden when expanded (per AGENTS.md: "The progress bar hides when expanded because the detailed view supersedes it."). Flipped to stay visible in both states; only the "View details" button inside the row is conditionally rendered (collapsed state only). Rationale: showing/hiding the bar on every toggle felt janky, and a persistent mini-map is useful orientation when the expanded view zooms into a specific step. This overrides AGENTS.md guidance — a call-out in the walkthrough.

- **`src/components/BuildHeader.tsx` — scaffolded expanded-view content.** Replaced the placeholder with a `<ul>` that maps over `buildSteps` and renders each one as `JSON.stringify(step, null, 2)` in a `<pre>`. Deliberately raw — this is the first pass so we can see the data shape in place before designing the real view. The inner list is scrollable (`max-h-[500px] overflow-y-auto`); bumped the outer transition wrapper from `max-h-[600px]` to `max-h-[700px]` so the "Hide details" button stays visible under the list.

- **Failure summary heading (what happened & why).** New `<h3 role="alert">` at the top of the expanded content with a one-sentence failure summary. `role="alert"` means screen readers announce it when the expanded view lands in the DOM — which, combined with the default-expanded-on-failure behaviour, means a failed build announces itself on page load.

  Touching files:
  - `src/types/build.ts` — added optional `errorMessage?: string` to both `Job` and `BuildStep` (README permits type extension; needed to carry the "why").
  - `src/data/mockBuildSteps.ts` — populated `errorMessage` on the failing `test-node18` job with a realistic assertion-style message tied to the PR topic.
  - `src/lib/buildStatus.ts` — new `collectFailures(steps)` helper walks the pipeline and returns every failing leaf (jobs inside parallel/matrix steps, plus failed command-type steps with no jobs). New `buildFailureSummary(failures)` turns that list into a one-sentence headline: `"X failed — <errorMessage>"` for a single failure; `"N steps failed: A, B, C."` for multiples (the per-failure "why" defers to the detailed list below).
  - `src/components/BuildHeader.tsx` — imports the helpers, computes the summary at render time, and renders the `role="alert"` heading above the JSON dump when `failures.length > 0`. Styled `text-red-700` + `text-sm font-semibold` to read as a warning without competing with the card's own red backdrop.

- **`src/data/mockBuildSteps.ts` — multi-failure demo toggle.** Added a commented-out `Test (Node 22)` job inside the test matrix. Uncomment to preview the multi-failure summary wording (`"2 steps failed: Test (Node 18), Test (Node 22)."`); re-comment to return to the single-failure case. Additive so the default state is unchanged. (Currently uncommented for manual verification.)

- **`src/components/BuildHeader.tsx` — failure summary as a red banner.** Previous red-text-on-white heading didn't carry enough visual weight. Promoted to a `bg-red-700` / `text-white` banner with `text-base font-semibold`. `role="alert"` moved onto the banner wrapper so the inner `<h3>` keeps its heading role (a11y: both live-region announcement *and* heading-navigation). Rounded `rounded-md` corners and `px-5 py-3` internal padding — sits 6px inside the card's inner border rather than bleeding edge-to-edge. The grey `border-t` divider is only rendered when there's no banner — the banner itself acts as the visual break from the progress-bar row.

- **Expanded region: unified horizontal margins.** Three different indents had crept in (banner 6px, cards 14px, Hide-details button 10px). Hoisted `px-2` up onto the transition wrapper so everything inside inherits the same 14px indent from the card border. Removed `px-2` from the content container and `px-1` from the Hide-details row.

- **Whole card: single indent source of truth.** Follow-up after noticing top-row content and expanded content didn't line up with each other (top row had `pl-1` on the inner div and `.group/pr` had `px-1.5`, giving 10px left / 6px right asymmetry; expanded content was at 14px). Bumped `.group/pr` to `px-3`, removed the `pl-1` from the top-row inner div, and dropped the expanded wrapper's `px-2`. Now every descendant of `.group/pr` sits at a consistent 12px from the card's inner border — status badge, PR info, actions combo, progress bar, banner, failure cards, blocked list, Hide-details button all aligned.

- **Breadcrumb pill: top margin matched to horizontal.** `my-1` → `m-3` on the pill wrapper so the 12px horizontal indent is mirrored vertically at the top of the card.

- **Removed the inner scroll from the expanded content.** The content list was `max-h-[500px] overflow-y-auto`, which created a second scroll surface inside the card-level scroll and made the banner feel like it was overlapping the cards on page scroll. Removed the `max-h` and `overflow-y-auto`; the region now grows with its content. Bumped the outer transition wrapper from `max-h-[700px]` → `max-h-[1600px]` so the expand/collapse animation still has a realistic upper bound without clipping.

- **"View log" → "Jump to job" as a real `<a>`, smooth scroll via CSS.** Rethought the affordance: in this page, the README says the step list below the header is the deep-dive surface, so a button that implied a separate "log view" was wrong. Replaced with a plain `<a href="#pipeline-steps">` styled like the sibling Retry button. Wrapped `PageSkeleton` in App.tsx with `<section id="pipeline-steps" tabIndex={-1}>` so the anchor lands there; `tabIndex={-1}` lets browsers that move focus on hash navigation actually focus the landing target. Smooth scroll handled globally via `<html class="motion-safe:scroll-smooth">` in `index.html`, which respects `prefers-reduced-motion` for free. Removed the `onViewLog` prop from both `BuildHeader` and `App.tsx`. Walkthrough note: a real implementation would use `#step-${failure.id}` with matching id-anchors in the step list.

- **FailureCard heading: breadcrumb hierarchy.** `in Test matrix` subtitle was opaque — "matrix" is Buildkite jargon, and the phrasing didn't read as hierarchy. Replaced with a single-line breadcrumb inside the `<h4>`: parent step name in `text-zinc-500 font-medium`, a `/` separator in `text-zinc-400` with `aria-hidden="true"`, then the job name in the heading's base style. Shows the pipeline structure directly (parent → child) and falls back to just the job name when there's no parent (command-type step failures).

- **Dropped "exit N" from the UI.** For the vast majority of failed CI runs the exit code is `1` — "generic failure" — which adds no signal on top of the error message that's already shown. Removed it from the FailureCard's top-right meta (duration still shown) and from the `buildFailureSummary` fallback. `exitCode` stays in the types, mock data, and `BuildFailure` struct, so re-introducing it (e.g. only showing interesting codes like 137/124/139) would be a trivial revert.

- **Clock icon next to the duration.** Small `<Clock size={12}>` alongside the time in the FailureCard's top-right meta. `aria-hidden="true"` since the text conveys the meaning.

- **Removed the "N steps blocked by this failure" section from the expanded view.** Will be represented in the timeline graphic up top instead. `getDownstreamBlocked` stays in `src/lib/buildStatus.ts` for reuse when the timeline work lands; only the JSX and wiring inside `BuildHeader` were removed.

- **More breathing room between timeline and banner.** Banner `mt-2` → `mt-4` (8px → 16px).

- **Banner is now persistent across expand/collapse.** Moved the `role="alert"` banner out of the transition wrapper so it stays visible when the details are collapsed. Mental model shift: banner = "this build failed" summary that always shows; expand/collapse toggles only the deep-dive failure cards. Also simplified the `border-t / mt-2` conditional on the inner content container, since no-failures implies no-cards-either — always-empty in that case.

- **Banner removed; failure headline moved into the status column.** The big red banner was carrying redundant visual weight — "this build failed" was already signalled by the red X badge, the `bg-red-50` card, and the red timeline segments. Its only unique contribution was the *specific error headline*. Moved that headline into the left status column:
  - Primary (bold): short failure headline — single failure = `"X failed"`; multi = `"N steps failed: A, B"` (trimmed from the banner's version — no error text, which is already in the cards below).
  - Secondary: `Ran for 2m 22s · N blocked` (replacing the old `"N failed jobs · N blocked"` line).

  Non-failed builds keep the old `"Passed in 1m 30s / All passed"` shape. Dropped the `buildFailureSummary` call + import from `BuildHeader.tsx` — helper stays in `buildStatus.ts`. `role="alert"` re-attached to the failure headline div so screen readers announce it on page load, preserving the a11y behaviour that was on the original banner.

- **FailureCard meta row → `<dl>` key/value grid.** The `ran npm test · ubuntu-latest · default queue · started 10:46:19` prose-with-dots meta line read as fragments. Swapped for a semantic `<dl>` rendered as a two-column grid using the author's own CSS-Grid recipe (`grid-template-columns: max-content` + `dd { grid-column-start: 2 }`). Labels (`Command`, `Agent`, `Queue`, `Started`) in muted `font-medium text-zinc-500`, values in `text-zinc-800` column 2, default `dd` margin reset with `m-0`. Command stays wrapped in `<code>` for shell-syntax distinction. Semantically correct for key/value data, screen readers announce term/description pairs.

- **FailureCard: actions moved to header top-right; duration demoted into the `<dl>`.** Jump to job + Retry job relocated next to the breadcrumb heading as an object-actions bar (common pattern: GitHub issues, Linear, etc.), freeing vertical space between the error block and the meta. Removed the separate button row. Duration dropped from the top-right, now just another row in the meta `<dl>`, ordered Command → Duration → Agent → Queue → Started — Duration right after Command because "how long until it failed" is a common next question after "what ran".

- **Dropped per-step `Started` row.** The build's overall start time is already on the PR row; per-step timestamps were redundant. `startTime` stays in the types, mock, and `BuildFailure` struct in case the timeline work later wants to surface it.

- **Three small refinements.**
  - **Tighter Hide-details gap**: inner content div `py-3` → `pt-3` so the Hide-details button sits ~8px under the last card rather than the previous ~20px (bottom padding of content + top padding of the button wrapper were stacking).
  - **Vertically-centred FailureCard header**: outer header and the inner icon+heading group switched from `items-start` → `items-center`, and dropped the XCircle `mt-0.5` offset that was compensating for top-alignment. Buttons, icon, and heading text now share a centre-line.
  - **"View details" moved under the banner when collapsed**: removed from the progress-bar row entirely. Now its own right-aligned row (`mt-3 flex justify-end`) that only renders when `!isExpanded`. Rationale: when the card is collapsed the user's eye is already at the banner; the button expanding the detail sits right below it. The progress-bar row is uncluttered either way.

- **Timeline refined: from abstract bar to labelled, interactive, informative.** Change to the progress bar in `BuildHeader.tsx`:
  1. **Height** `h-1.5` → `h-6` (was briefly `h-8` but too blocky next to the banner). Real hit target for mouse and touch.
  2. **Inline content per segment**: status icon + truncated step name inside each `<a>`. Narrow segments (1-job steps) truncate with ellipsis; icon is always visible as the fallback signal.
  3. **Segments are `<a href="#pipeline-steps">`** instead of `<div>` — clickable, keyboard-focusable with `focus-visible:ring-2 ring-inset`, consistent with the `Jump to job` link pattern on failure cards. `pointer-events-none` applied to overlay divs so the anchor stays clickable across the whole segment.
  4. **Label styling**: `text-[10px] font-semibold uppercase tracking-wide` — reads like a badge/tag rather than body text.
  5. **Pill-shaped container**: `rounded-full` + `overflow-hidden` on the outer bar so the left/right-most segments get clipped into rounded ends.

  Status palette also bumped for legibility at the larger size: `green-500` → `green-600`, `red-500` → `red-600`, `amber-400/40` → `amber-500`, `zinc-300` → `zinc-200/text-zinc-700`. Icons: `Check`/`Loader2`+`animate-spin`/`X`/`Clock`, size 12, all `aria-hidden`. `title` native tooltip kept plus `sr-only` suffix for screen readers (*"Test matrix, Failed"*, *"Deploy, Blocked"*).

  **Tried and rolled back**: a distinct "blocked" visual state (`bg-red-50` with diagonal stripes) for pending steps downstream of a failure. Design-wise appealing but looked wrong in context — user preferred the plain gray. Now blocked and pending are visually identical; "Blocked" is preserved only in the accessible name and `title` tooltip. `getDownstreamBlocked` stays for the sr-only/title wording.

- **Visual hierarchy for actions: pills for actions, text-links for nav/state.** All custom buttons were the same outlined pill, with no signal of what mattered. Split into three tiers: pill buttons for real actions (`Retry failed jobs`, `Rebuild`, `Retry job`), text-links for navigation and UI-state (`Jump to job`, which is an `<a>` anyway; `View details`/`Hide details` disclosure toggle), icon-only for the minor `Copy`. `Jump to job` uses `text-zinc-700` since it sits on the white FailureCard background. `View details`/`Hide details` use `text-red-700/70` (red-700 at 70% opacity for a softer look that keeps the hue) + `hover:text-red-900` (darker, full opacity on hover) because they sit on the red card surface — zinc looked wrong against red, solid red-700 was too heavy, pure red-500 felt too bright. Focus ring for Jump to job stays blue as a standard functional a11y indicator. Tailwind utilities kept inline at the call sites per project preference — no extracted `const someClass = "..."` holders.

- **FailureCard contrast pass + copy button.**
  - Inline `<code>` chip in meta row: `bg-zinc-100 / text-zinc-700` → `bg-zinc-200 / text-zinc-800`. Surrounding meta text `text-zinc-500` → `text-zinc-600`.
  - Added a small copy button in the top-right of the error container. `Copy` icon → `Check` for 2 s after click. Copies `errorMessage\n<testFile>:<line>` via `navigator.clipboard.writeText`, falling back silently if the Clipboard API is unavailable. `aria-label` toggles between *"Copy error message"* and *"Copied to clipboard"*. Text gets `pr-7` to avoid overlap with the button on wrap.

- **FailureCard error block: dark terminal theme.** Error container flipped to `bg-zinc-900 / border-zinc-700` with `text-zinc-100` error text and `text-zinc-400` file:line. Reads as terminal/log output, which matches what it actually is. Copy button recoloured for the dark surface (`text-zinc-400`, hover `bg-zinc-800 / text-zinc-100`). The inline `npm test` chip in the meta row still light — kept separate pending user decision on whether they want it to match.

- **Triage-focused expanded content (failure cards + blocked downstream).** Replaced the JSON dump with the real design. Decisions locked with the user beforehand: per-failure "View log" + "Retry job" as stub buttons; structured data fields on `Job`/`BuildStep` rather than parsing `errorMessage`; scope this pass = Failure card + Blocked, with Matrix context deliberately deferred as a "what I'd do next" walkthrough item.

  Touching files:
  - `src/types/build.ts` — added optional `logUrl?: string`, `testFile?: string`, `line?: number` to both `Job` and `BuildStep`.
  - `src/data/mockBuildSteps.ts` — populated those fields on `test-node18` and the `test-node22` multi-failure-demo job. Tidied `errorMessage` to just the assertion/type-error text now that file:line is structured separately (e.g. `"AssertionError: expected token.expiresAt to be a Date, got null"` with `testFile: "src/auth/token.test.ts"`, `line: 42`).
  - `src/lib/buildStatus.ts` — extended `BuildFailure` with the full set of fields the UI needs (`id`, `duration`, `startTime`, `command`, `agent`, `queue`, `logUrl`, `testFile`, `line`) so `FailureCard` doesn't need to know whether a failure was a job or a command-type step. Added `getDownstreamBlocked(steps)` — returns pending steps after the first failure in pipeline order.
  - `src/components/BuildHeader.tsx` — added optional `onViewLog` and `onRetryJob` props (default to `console.log` stubs). New inline `FailureCard` component mirrors the `DetailsToggle` pattern: header with `<XCircle>` icon, job name `<h4>`, parent-step subtitle; duration/exit-code top-right; error message in a zinc-50 mono box with file:line underneath; `View log` + `Retry job` buttons; meta row with command/agent/queue/start-time. Below the failure cards, a `<section aria-labelledby>` shows the "N steps blocked by this failure" list with the `Clock` icon per blocked step. Both sections live inside the existing `max-h-[500px] overflow-y-auto` scroll container; switched the container to `flex flex-col gap-4` so the two sections have clean separation without an extra divider.
  - `src/App.tsx` — passed no-op `onViewLog` / `onRetryJob` handlers so the stubs actually fire into the console when clicked.

### Still open from the a11y audit (not addressed this pass)

- **#4** — trigger inside a heading (`<h3><button>`). Deliberately not adopted; we chose a separate right-aligned button for visibility.
- **#5** — collapsed content stays focusable / in the a11y tree. The `max-h-0` + `opacity-0` wrapper doesn't use `hidden` / `inert`, so when the expanded view contains real focusable elements they'll be tabbable while collapsed. To fix once we add interactive content.
- **#6** — decorative SVG + Lucide icons (status badge, chevrons inside the now-removed button, etc.) are missing `aria-hidden="true"`.
- **#7** — progress-bar segments convey status by colour + `title` only, which isn't reliable for assistive tech.
