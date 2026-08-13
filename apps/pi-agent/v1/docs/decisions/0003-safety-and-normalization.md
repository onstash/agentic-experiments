# Safety and input normalization

The deterministic pipeline remains the source of truth. The model receives
only redacted, ranked opportunities. Streamed output must cite an exact URL
from that input. Unknown URLs cause the run to fail.

Profile and query terms use common aliases. Users can exclude terms and set a
preferred effort level. These controls change ranking only. GitHub requests
remain read-only, and Pi sessions use no tools.
