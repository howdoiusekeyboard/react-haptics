import { PRESETS, isIOS, schedulePattern } from "@haptics/core";
import type { HapticPattern } from "@haptics/core";

export interface HapticsConfig {
	patterns: Record<string, HapticPattern>;
	respectReducedMotion: boolean;
}

let _config: HapticsConfig | null = null;

/**
 * Initialize haptics context in a Svelte component tree.
 * Call this in your root layout's <script> block.
 *
 * Registers a capture-phase click listener on document for iOS haptics
 * and sets up context for child components using `use:haptic` and `createHaptics`.
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
	const patterns: Record<string, HapticPattern> = {
		...PRESETS,
		...options.patterns,
	};
	const respectReducedMotion = options.respectReducedMotion ?? true;
	const config: HapticsConfig = { patterns, respectReducedMotion };
	_config = config;

	if (typeof document !== "undefined" && isIOS()) {
		let prefersReducedMotion = false;

		if (typeof window !== "undefined" && window.matchMedia) {
			const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
			prefersReducedMotion = mql.matches;
			mql.addEventListener("change", (e) => {
				prefersReducedMotion = e.matches;
			});
		}

		const handler = (e: MouseEvent) => {
			if (respectReducedMotion && prefersReducedMotion) return;
			const target = (e.target as Element)?.closest("[data-haptic]");
			if (!target) return;
			const action = target.getAttribute("data-haptic");
			if (action && action in patterns) {
				schedulePattern(patterns[action]);
			}
		};

		document.addEventListener("click", handler, {
			capture: true,
			passive: true,
		});
	}
}

export function getHapticsConfig(): HapticsConfig | null {
	return _config;
}

/** @internal Reset config for testing only. */
export function _resetConfig(): void {
	_config = null;
}
