import type { Directive } from "vue";
import { isVibrationSupported, toVibrateSequence } from "@haptics/core";
import { _getPatterns, _shouldSuppress } from "./shared";

type HapticValue = string;

/**
 * v-haptic directive for declarative haptic feedback.
 *
 * Usage:
 *   <button v-haptic="'success'">Save</button>
 *   <button v-haptic="'impact-heavy'">Delete</button>
 *
 * On iOS: Sets data-haptic attribute so the plugin's capture-phase listener
 * handles it (preserving gesture chain).
 *
 * On Android: Registers a click handler that calls navigator.vibrate().
 */
export const vHaptic: Directive<HTMLElement, HapticValue> = {
	mounted(el, binding) {
		const action = binding.value;
		if (!action) return;

		el.setAttribute("data-haptic", action);

		if (isVibrationSupported()) {
			const handler = () => {
				if (_shouldSuppress()) return;
				const patterns = _getPatterns();
				const pattern = patterns[action];
				if (pattern) {
					navigator.vibrate(toVibrateSequence(pattern));
				}
			};

			el.addEventListener("click", handler);
			(el as any).__haptic_handler = handler;
		}
	},

	updated(el, binding) {
		const action = binding.value;
		if (action) {
			el.setAttribute("data-haptic", action);
		} else {
			el.removeAttribute("data-haptic");
		}
	},

	unmounted(el) {
		el.removeAttribute("data-haptic");
		const handler = (el as any).__haptic_handler;
		if (handler) {
			el.removeEventListener("click", handler);
			delete (el as any).__haptic_handler;
		}
	},
};
