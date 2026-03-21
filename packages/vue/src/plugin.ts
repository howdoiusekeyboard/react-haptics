import type { App, InjectionKey } from "vue";
import {
	PRESETS,
	isIOS,
	schedulePattern,
} from "@haptics/core";
import type { HapticPattern } from "@haptics/core";
import { _setConfig, _setPrefersReducedMotion } from "./shared";

export interface HapticsPluginOptions {
	/** Custom patterns merged with built-in presets. Same-name customs override. */
	patterns?: Record<string, HapticPattern>;
	/** Suppress haptics when prefers-reduced-motion is active. Default: true */
	respectReducedMotion?: boolean;
}

export interface HapticsContext {
	patterns: Record<string, HapticPattern>;
	respectReducedMotion: boolean;
}

export const HAPTICS_INJECTION_KEY: InjectionKey<HapticsContext> =
	Symbol("haptics");

export const HapticsPlugin = {
	install(app: App, options: HapticsPluginOptions = {}) {
		const patterns: Record<string, HapticPattern> = {
			...PRESETS,
			...options.patterns,
		};
		const respectReducedMotion = options.respectReducedMotion ?? true;

		app.provide(HAPTICS_INJECTION_KEY, { patterns, respectReducedMotion });
		_setConfig(patterns, respectReducedMotion);

		if (typeof document !== "undefined" && isIOS()) {
			let prefersReducedMotion = false;

			if (typeof window !== "undefined" && window.matchMedia) {
				const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
				prefersReducedMotion = mql.matches;
				_setPrefersReducedMotion(prefersReducedMotion);

				mql.addEventListener("change", (e) => {
					prefersReducedMotion = e.matches;
					_setPrefersReducedMotion(e.matches);
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
	},
};
