# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [1.0.1] - 2026-05-20

### Deprecated

- `react-haptics` on npm — superseded by `@haptics/react`. The package remains installable (re-exports from `@haptics/react` + `@haptics/core`) but now surfaces a deprecation notice on install.
- `svelte-haptics` on npm — was a placeholder; use `@haptics/svelte`.

### Infrastructure

- Publish workflow migrated to npm Trusted Publishing (OIDC). The long-lived `NPM_TOKEN` secret is no longer used; each package's publish access on npm is configured to `Require 2FA and disallow tokens`, with GitHub Actions registered as a trusted publisher.

### Fixed

- All adapters now reject `data-haptic` values that resolve to inherited object properties (`__proto__`, `constructor`, `toString`, etc.). Previously, these would resolve to `Object.prototype` and throw inside the click handler.
- `@haptics/vue` plugin and `@haptics/svelte` `setupHaptics` no longer leak `matchMedia` and `document` click listeners. Re-installation is idempotent — the prior install's listeners are torn down first.
- `@haptics/svelte` `createHaptics()` now exposes a `destroy()` method to release its `matchMedia` listener; existing callers should pair this with `onDestroy`.
- `@haptics/core` `toVibrateSequence` coerces negative, `NaN`, and fractional values to non-negative integers — guards against `TypeError` throws on some Android Vibration API implementations.
- `@haptics/core` `schedulePattern` clamps pattern length to 64 segments and total scheduled offset to 60 seconds.
- `@haptics/core` `schedulePattern` returns a cancel function; all capture-phase adapter listeners now call it on teardown so in-flight iOS patterns don't continue firing after unmount or SPA navigation.
- `@haptics/core` `iosTick` falls back to `document.documentElement` when `document.body` is unavailable (early `<head>` script execution).
- The Vue `v-haptic` directive and Svelte `use:haptic` action skip the haptic when the click was already `preventDefault`'d by an earlier handler.

## [1.0.0] - 2026-03-20

### Added

- `HapticsProvider` component with capture-phase click listener for iOS Safari haptics.
- `useHaptics` hook with `trigger`, `cancel`, `isSupported`, and `isIOSSupported`.
- 7 built-in presets: selection, impact-light, impact-medium, impact-heavy, success, warning, error.
- Custom pattern support via `patterns` prop on provider.
- Reduced-motion support (`prefers-reduced-motion` respected by default).
- Engine exports (`iosTick`, `schedulePattern`, `toVibrateSequence`, `isIOS`, `isVibrationSupported`) for custom integrations.
- Dual ESM/CJS build with `"use client"` directive.
