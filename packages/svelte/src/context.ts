import { PRESETS, isIOS, schedulePattern } from "@haptics/core";
import type { HapticPattern } from "@haptics/core";

export interface HapticsConfig {
	patterns: Record<string, HapticPattern>;
	respectReducedMotion: boolean;
}

let _config: HapticsConfig | null = null;
let _cleanup: (() => void) | null = null;

/**
 * Initialize haptics context in a Svelte component tree.
 * Call this in your root layout's <script> block.
 *
 * Registers a capture-phase click listener on document for iOS haptics
 * and sets up context for child components using `use:haptic` and `createHaptics`.
 *
 * Idempotent: calling again tears down prior listeners before re-attaching.
 *
 * @example
 * ```svelte
 * <script>
 *   import { setupHaptics } from '@haptics/svelte';
 *   setupHaptics({ patterns: { 'my-buzz': [{ duration: 30 }] } });
 * </script>
 * <slot />
 * ```
 */
export function setupHaptics(
	options: {
		patterns?: Record<string, HapticPattern>;
		respectReducedMotion?: boolean;
	} = {},
): void {
	// Idempotent: tear down listeners from a prior call before re-attaching.
	_cleanup?.();
	_cleanup = null;

	const patterns: Record<string, HapticPattern> = {
		...PRESETS,
		...options.patterns,
	};
	const respectReducedMotion = options.respectReducedMotion ?? true;
	const config: HapticsConfig = { patterns, respectReducedMotion };
	_config = config;

	const cleanups: Array<() => void> = [];
	let lastCancel: (() => void) | null = null;

	if (typeof document !== "undefined" && isIOS()) {
		let prefersReducedMotion = false;

		if (typeof window !== "undefined" && window.matchMedia) {
			const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
			prefersReducedMotion = mql.matches;
			const onMqlChange = (e: MediaQueryListEvent) => {
				prefersReducedMotion = e.matches;
			};
			mql.addEventListener("change", onMqlChange);
			cleanups.push(() => mql.removeEventListener("change", onMqlChange));
		}

		const handler = (e: MouseEvent) => {
			if (respectReducedMotion && prefersReducedMotion) return;
			const target = (e.target as Element)?.closest("[data-haptic]");
			if (!target) return;
			const action = target.getAttribute("data-haptic");
			if (
				action &&
				Object.prototype.hasOwnProperty.call(patterns, action)
			) {
				lastCancel = schedulePattern(patterns[action]);
			}
		};

		document.addEventListener("click", handler, {
			capture: true,
			passive: true,
		});
		cleanups.push(() =>
			document.removeEventListener("click", handler, { capture: true }),
		);
	}

	_cleanup = () => {
		for (const fn of cleanups) fn();
		lastCancel?.();
		lastCancel = null;
	};
}

export function getHapticsConfig(): HapticsConfig | null {
	return _config;
}

/** @internal Reset config and tear down listeners. For tests and HMR. */
export function _resetConfig(): void {
	_cleanup?.();
	_cleanup = null;
	_config = null;
}
