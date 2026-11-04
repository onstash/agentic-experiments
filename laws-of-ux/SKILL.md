---
name: laws-of-ux
description: Apply named UX psychology principles to interface decisions, audits, and product reviews.
---

# Laws of UX

Use this skill when a user asks whether an interface or product decision is easy to understand, cognitively light, familiar, discoverable, or psychologically well-founded.

## Method

1. Describe the observed user goal and the concrete interaction under review.
2. Identify the smallest set of relevant Laws of UX. Do not name a law merely because it sounds applicable.
3. Separate observation from interpretation. Explain the mechanism: choice count, target size, grouping, memory burden, feedback delay, or mismatch with a familiar pattern.
4. Rank issues by user impact and reversibility. Prioritize broken actions, misleading labels, lost work, and blocked recovery over visual polish.
5. Recommend the simplest change that improves the user outcome. Preserve user control and avoid adding a new workflow when a clearer existing state or label is enough.
6. Define an observable acceptance criterion and a verification method for each recommendation: DOM/state test, accessibility assertion, responsive screenshot, interaction test, or measured timing.

## Rules

- Use human-readable names and link to the canonical law page when citing a principle.
- Do not present a law as empirical proof that a design is universally correct. Treat it as a decision lens and state relevant uncertainty.
- Prefer direct evidence from the UI, code, user report, or test over generalized UX claims.
- Consider keyboard, touch, narrow screens, reduced motion, loading, empty, error, and recovery states when they affect the interaction.
- Keep the review focused. Usually cite two to five principles, not the full catalog.
- When a UI has multiple actions, check that the primary action matches the user's actual goal and that unrelated warnings or controls are not visually grouped with it.

## Common routing

- Too many or complex choices: Hick's Law, Choice Overload.
- Unfamiliar interaction or unexpected terminology: Jakob's Law, Mental Model, Paradox of the Active User.
- Dense content or difficult review: Cognitive Load, Chunking, Working Memory, Law of Proximity.
- Poor grouping or ambiguous hierarchy: Law of Common Region, Law of Similarity, Law of Uniform Connectedness, Law of Prägnanz.
- Small controls or difficult touch targets: Fitts's Law.
- Slow or unclear feedback: Doherty Threshold, Peak-End Rule.
- Interrupted or unfinished work: Zeigarnik Effect, Goal-Gradient Effect.
- Excessive complexity: Tesler's Law, Occam's Razor.

For the complete catalog and canonical links, read [references/laws-catalog.md](references/laws-catalog.md).
