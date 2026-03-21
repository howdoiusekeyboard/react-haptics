import type { HapticPattern } from "@haptics/core";
import {
	PRESETS,
	isIOS,
	isVibrationSupported,
	toVibrateSequence,
	schedulePattern,
} from "@haptics/core";
import { getHapticsConfig } from "./context";

type HapticAction = string;

/**
 * Svelte action for declarative haptic feedback.
 *
 * @example
 * ```svelte
 * <script>
 *   import { haptic } from '@haptics/svelte';
 * </script>
 * <button use:haptic={'success'}>Save</button>
 * <button use:haptic={'impact-heavy'}>Delete</button>
 * ```
 *
 * On iOS: sets data-haptic for the capture-phase listener from setupHaptics().
 * On Android: calls navigator.vibrate() directly in the click handler.
 * Svelte actions have native event access — no gesture chain issues.
 */
export function haptic(
	node: HTMLElement,
	action: HapticAction,
): { update: (action: HapticAction) => void; destroy: () => void } {
	let currentAction = action;
	const config = getHapticsConfig();
	const patterns: Record<string, HapticPattern> = config?.patterns ?? PRESETS;
	const respectReducedMotion = config?.respectReducedMotion ?? true;

	let prefersReducedMotion = false;
	let mqlCleanup: (() => void) | null = null;

	if (typeof window !== "undefined" && window.matchMedia) {
		const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
		prefersReducedMotion = mql.matches;
		const onChange = (e: MediaQueryListEvent) => {
			prefersReducedMotion = e.matches;
		};
		mql.addEventListener("change", onChange);
		mqlCleanup = () => mql.removeEventListener("change", onChange);
	}

	node.setAttribute("data-haptic", currentAction);

	const handler = () => {
		if (respectReducedMotion && prefersReducedMotion) return;
		const pattern = patterns[currentAction];
		if (!pattern) return;

		if (isVibrationSupported()) {
			navigator.vibrate(toVibrateSequence(pattern));
		} else if (isIOS() && !config) {
			schedulePattern(pattern);
		}
	};

	node.addEventListener("click", handler);

	return {
		update(newAction: HapticAction) {
			currentAction = newAction;
			node.setAttribute("data-haptic", newAction);
		},
		destroy() {
			node.removeEventListener("click", handler);
			node.removeAttribute("data-haptic");
			mqlCleanup?.();
		},
	};
}
