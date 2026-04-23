# Rationale

Why the build header looks and behaves the way it does.

## Scope

The explicit task was to replace the "expanded region" placeholder inside `BuildHeader.tsx`. In practice that placeholder sat inside a pre-existing card whose structure, hover behaviours, and click patterns shaped what the expanded view could do — so some of the card around the placeholder changed too where it was in the way.

**Touched**: `BuildHeader.tsx`, the failure-detail UI, the progress-bar timeline, types & helpers in `src/lib/buildStatus.ts`, plus five new files (`FailureCard`, `DetailsToggle`, `Timeline/`, `FailedStatusIcon`).

**Left alone**: `BuildActionsComboButton`, `HeaderBreadcrumbStubs`, `PageSkeleton` (marked "don't modify" in AGENTS.md), and most pre-existing template code I didn't need to change.

## Key decisions

### 1. The expanded panel auto-opens on a failed build

`useState(status === "failed")` in `BuildHeader.tsx`. Any developer landing on a failed build page is there to find out what failed — making them click "View details" first costs nothing and gains nothing. For any non-failed status the card starts collapsed (quieter at-a-glance view).

The rest of the UI follows from this: collapsed state is the minority case for failed builds, so optimising for it (visual prominence of the toggle, tight animation timing, etc.) is a secondary concern.

### 2. Timeline became self-explanatory

The starter timeline was a 6px coloured bar with native `title` tooltips — green/red/grey with no labels, no interactivity, no real hit target. I changed four things:

- **Height** 6px → 24px. Real target for mouse and touch; room to hold content.
- **Labels and status icons inline in each segment.** Narrow segments truncate; the icon stays as a fallback.
- **Segments are real links** (`<a href="#{step.id}">`) — keyboard reachable, announced as links, part of a `<nav> <ol> <li>` structure so screen readers pick them up as a list of pipeline steps.
- **Proportional widths preserved** (job count → width). This was already the template's behaviour; I renamed the opaque "weight" terminology to `jobCount`, and fixed an O(n²) recomputation that was in the original.

Segment status styling lives in a single `TIMELINE_STATUS_STYLE` lookup record instead of the original parallel ternary chains — TypeScript's `Record<StepStatus, ...>` guarantees I can't add a status without handling its presentation.

### 3. Explicit disclosure button, not a row-wide click

The template had the whole PR row click-to-toggle, plus a hover-only chevron button that was `display: none` until the mouse entered the row. That's two affordances, and the "semantic" one (the button) was unreachable by keyboard.

I collapsed to a single always-visible `<DetailsToggle>` and removed the row-level `onClick`. Reasoning:

- Keyboard users get the button for free (no hover dependency).
- Prevents an accidental collapse when users try to select or copy text from the expanded drawer — otherwise any click-drag-release inside the card would bubble to the row and fire the toggle.
- Since failed builds auto-expand, the toggle is rarely used — no reason to spend extra affordance on it.

The toggle itself is styled as a text-link (not a pill), which places it visibly below pill-shaped action buttons (Retry job, Retry failed jobs) in the action hierarchy. `aria-expanded` + `aria-controls` wire it to the disclosure region via `useId`-generated stable ids.

### 4. Various accessibility improvements

Listed roughly in order of impact:

- Removed the hover-only chevron button (was `display: none` until mouse hover — unreachable by keyboard).
- `role="alert"` on the failure-summary headline so SRs announce it on page load.
- `<nav aria-label="Pipeline timeline"> <ol> <li>` wraps the timeline — real landmark, real list semantics.
- `<section aria-labelledby>` on the PR row with `useId` stable ids.
- `aria-expanded` + `aria-controls` paired on both `DetailsToggle` instances; region has the matching `id`.
- `<article>` per failure card (self-contained unit with its own heading), `<pre>` for the preformatted error, `<dl>` for the meta key/value list, `<time>` for the timestamp.
- `aria-hidden="true"` on decorative icons; `sr-only` text accompanies visual-only signals in timeline segments.
- `focus-visible:ring-*` on every interactive element.
- `motion-safe:scroll-smooth` on `<html>` — smooth anchor scrolling for the "Jump to job" link, automatically disabled if the user prefers reduced motion.

## Technical decisions worth calling out

- **`grid-template-rows: 0fr → 1fr` animation** for the expand/collapse — animates to content height without an arbitrary `max-height` ceiling. Transitions both `grid-template-rows` and `opacity` at 400ms with `cubic-bezier(0.22, 1, 0.36, 1)` (easeOutQuint). Modern CSS pattern, broadly supported.
- **Lookup records over parallel ternary chains** for status → visual. Used in `TIMELINE_STATUS_STYLE` and `BADGE_STYLE`. `Record<Status, ...>` gives exhaustiveness checking.
- **Helpers co-located with the component that owns them.** `Timeline/helpers.ts` is next to `Timeline/index.tsx`; nothing else uses it.
- **`<dl>` as a 2-col CSS Grid** for the failure-card meta (`grid-template-columns: max-content` + `dd { grid-column-start: 2 }`). Semantically correct for key/value data; `<dl>`s are announced as a list of term/definition pairs by screen readers.
- **Component extraction**: five components live in their own files (`BuildHeader.tsx` is now the orchestrator), each under ~150 lines.
