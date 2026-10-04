# Reconstruct persisted session state

The learner understands that persistence requires both writing custom entries and rebuilding in-memory state. They identified `session_start` for reload and resume, `session_tree` for branch navigation, and `restoreHistory()` as the shared reconstruction path that reads the active branch with `getBranch()`.

## Evidence

After initially not knowing, the learner correctly retrieved the restoration events and shared restoration function.
