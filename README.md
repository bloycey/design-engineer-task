# Bloycey's version

Hi Buildkite team. Here's my crack at this task. Let's start with some visuals.

**With one failure**

<img width="1356" height="814" alt="Screenshot 2026-04-23 at 4 25 48 pm" src="https://github.com/user-attachments/assets/718fbec3-c535-4d6f-8b74-d1516d6d9805" />

**With multiple failures**

<img width="1356" height="814" alt="Screenshot 2026-04-23 at 4 28 02 pm" src="https://github.com/user-attachments/assets/4caf5385-20e3-48e8-ba7d-891cdfc30814" />

IF there are failures the panel is expanded by default. This is on the assumption that if a build fails the dev will want to know why, so lets just have it open for them (we could do research on this if necessary but I've based this on my own experience dealing with CI/CD pipelines as a dev).

## Key changes

**Timeline Component**

I've made the timeline component more obvious and explicit. Previously it was just a thin coloured bar. This relied on colour ONLY to determine the status of the build and was missing labels for the steps. This is a concern for colour blind users. By adding labels we improve accessibility for those who need it, and make things clearer for those who don't need it. Everyone wins.

**At a glance failure cards**

I decided to prioritise the information about FAILURES only, while keeping other information minimal. Failing steps require action and attention while usually if something passes everyone is happy to move on.

I also included a brief overview of the status of non-failing jobs. This is useful for if a job passes on a particular node version but not on another (like in the mock example).

I added a human readable error message to the mock data, along with a line number. This seemed to be the main thing missing from the mock data that might help a dev when debugging.

I also included:

-   `Jump to job` link (scrolls down to the detailed section below)
-   `retry job` button (currently just a placeholder)

## Misc design decisions

-   Replaced the prominent heading text that read "Failed in 2m 22s" with text that says "Test (Node 18) failed" (or "2 tests failed") etc. It's more important to know WHAT failed rather than HOW LONG something took to fail.
-   Removed the blue hover effect (confusing to me, why have it)
-   Made an explicit "Show details / hide details" button rather than having the whole panel clickable. This is better for semantic HTML and accessibility. It also allows the error to be more easily copied without triggering the onClick open/close of the panel.
-   Did a general accessibility audit. Replaced some divs with landmark HTML (`section`, etc), added some aria tags, put aria-hidden on icons. There's probably more to do here with more time.
-   Added a copy to clipboard button on the error.
