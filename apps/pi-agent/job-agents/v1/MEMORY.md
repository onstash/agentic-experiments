# MEMORY

Date: 2026-08-14

## Mistake
I wrote changes into `apps/pi-agent/v1` instead of the requested `apps/pi-agent/job-agent/v1`.

## RCA
- I used the only `pi-agent` tree I found in the repo.
- I did not confirm the exact target path before editing.
- I missed that the requested path was different from the existing tree.

## High-confidence fixes
1. Confirm the exact target path before any edit. Confidence: 0.99
2. Stop and ask when the path is ambiguous or does not exist. Confidence: 0.98
3. Use the user-named folder only, even if a similar folder already exists. Confidence: 0.99
4. Keep all work inside the named app tree and do not infer a sibling path. Confidence: 0.97

## Picked solution
Always verify the exact user-requested path first, then edit only that path.
