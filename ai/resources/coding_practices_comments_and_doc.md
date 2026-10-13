# Comments and Documentation

## Comments

Explain non-obvious constraints, assumptions, or reasons. Do not narrate obvious code. Remove obsolete comments and commented-out code rather than preserving it as informal history.

A TODO must describe a concrete missing behavior and its consequence. TODOs and suppressions are not substitutes for implementing the requested behavior.

Comment-only cleanup must not change behavior unless separately requested.

## API and Function Documentation

Follow the chosen language's documentation conventions. Document public contracts when callers need details that names and types cannot express, including units, coordinate order, side effects, permissions, expiry, and failure behavior.

Examples must match the actual implementation. Clearly label proposed interfaces and synthetic examples.

## Project Documentation

- Keep setup commands, environment-variable names, and verification instructions accurate.
- Document required providers and whether each integration is live, simulated, or unavailable.
- Explain retention, consent, sharing expiry, and revocation behavior when implemented.
- Record meaningful limitations, including browser geolocation/background restrictions when applicable.
- Update only documentation affected by a change; avoid duplicate progress narratives.
- Never include secret values, real personal journeys, or invented test results.
- Link to existing files and use consistent paths.
