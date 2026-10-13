# Naming Guidelines

Use the chosen language and framework's established casing and file conventions. This project has no language-specific naming baseline yet.

- Prefer domain names such as incident, report, evidence, journey, route, and delay summary over generic item or data names.
- Distinguish an individual report from an incident assembled from reports.
- Name status fields according to what they establish; avoid an ambiguous `verified` flag for both congestion and cause.
- Make booleans read as predicates, such as `isExpired` or the language-equivalent `is_expired`.
- Include units in quantities, such as delay minutes, distance meters, and duration seconds.
- Distinguish observation time, submission time, update time, and expiry time.
- Use consistent latitude/longitude naming and document coordinate order at integration boundaries.
- Use explicit lifecycle values instead of unrelated boolean flags that permit contradictory states.
- Name tests for observable behavior and conditions rather than implementation details.
- Avoid abbreviations unless established in the language, framework, or domain.
