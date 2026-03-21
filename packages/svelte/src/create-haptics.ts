import {
	PRESETS,
	isVibrationSupported,
	isIOS,
	toVibrateSequence,
	schedulePattern,
} from "@haptics/core";
import type { PresetName } from "@haptics/core";
import { getHapticsConfig } from "./context";

/**
 * Create an imperative haptics controller.
 *
 * Can be called inside a Svelte component's <script> block (will use
 * setupHaptics context if available) or outside components (falls back
 * to built-in presets).
 *
 * @example
 * ```svelte
 * <script>
 *   import { createHaptics } from '@haptics/svelte';
 *   const haptics = createHaptics();
 *   function handleSave() { haptics.trigger('success'); }
 * </script>
 * ```
 */
export function createHaptics() {
	const config = getHapticsConfig();
	const patterns = config?.patterns ?? PRESETS;
	const respectReducedMotion = config?.respectReducedMotion ?? true;

	let prefersReducedMotion = false;
	if (typeof window !== "undefined" && window.matchMedia) {
		const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
		prefersReducedMotion = mql.matches;
		mql.addEventListener("change", (e) => {
			prefersReducedMotion = e.matches;
		});
	}

	const trigger = (action: PresetName | (string & {})) => {
		if (respectReducedMotion && prefersReducedMotion) return;

		const pattern = patterns[action as keyof typeof patterns];
		if (!pattern) return;

		if (isVibrationSupported()) {
			navigator.vibrate(toVibrateSequence(pattern));
		} else if (isIOS()) {
			schedulePattern(pattern);
		}
	};

	const cancel = () => {
		if (isVibrationSupported()) navigator.vibrate(0);
	};

	return {
		trigger,
		cancel,
		isSupported: isVibrationSupported(),
		isIOSSupported: isIOS(),
	};
}
