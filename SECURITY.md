# Security

## Reporting a vulnerability

Use [GitHub's private vulnerability reporting](https://github.com/howdoiusekeyboard/haptics/security/advisories/new) to report security issues in any `@haptics/*` package. Do not open a public issue.

You'll receive acknowledgment within 48 hours and a follow-up with next steps.

## Scope

In scope:
- Logic flaws in `@haptics/core`, `@haptics/react`, `@haptics/vue`, `@haptics/svelte`, `@haptics/vanilla`, or `react-haptics` that lead to unintended behavior at runtime (e.g. uncaught exceptions from crafted DOM attributes, listener leaks exploitable for resource pressure, prototype-chain lookups).
- Supply-chain concerns around the published tarballs (provenance, packaging, included files).

Out of scope:
- Vulnerabilities in transitive dependencies — report those upstream unless the issue is specific to how this library *uses* the dependency.
- Behaviors unique to the `iosTick()` checkbox-switch trick that are documented limitations (best-effort iOS gesture-chain semantics, shadow DOM containment).
- Denial of service by passing pathologically large `patterns` — patterns are clamped at 64 segments / 60s total offset; this is documented behavior.
