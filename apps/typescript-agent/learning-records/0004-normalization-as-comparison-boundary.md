# Learning Record 0004: Normalization As Comparison Boundary

## Date

2026-07-10

## What The Learner Understood

The learner recognizes that normalization helps remove unhelpful raw details and surface the fields that matter.

## Correction And Sharpening

The deeper point is that normalization creates a shared comparison boundary. It translates different source payloads into the same opportunity shape so one ranker can compare OSS and job opportunities with common signals.

## Why It Matters

Without normalization:

- ranking logic gets duplicated
- source-specific edge cases leak everywhere
- explanations become inconsistent

With normalization:

- ranking stays source-agnostic
- explanations can use shared fields
- new sources can be added with isolated adapters

## Next Step

Teach the two normalization functions:

- `normalizeOss(...)`
- `normalizeJob(...)`
