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

let _cleanup: (() => void) | null = null;

export const HapticsPlugin = {
	install(app: App, options: HapticsPluginOptions = {}) {
		// Idempotent: tear down listeners from a prior install before re-attaching.
		// Guards against HMR, repeated app.use() calls in tests, and multiple Vue apps.
		_cleanup?.();
		_cleanup = null;

		const patterns: Record<string, HapticPattern> = {
			...PRESETS,
			...options.patterns,
		};
		const respectReducedMotion = options.respectReducedMotion ?? true;

		app.provide(HAPTICS_INJECTION_KEY, { patterns, respectReducedMotion });
		_setConfig(patterns, respectReducedMotion);

		const cleanups: Array<() => void> = [];
		let lastCancel: (() => void) | null = null;

		if (typeof document !== "undefined" && isIOS()) {
			let prefersReducedMotion = false;

			if (typeof window !== "undefined" && window.matchMedia) {
				const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
				prefersReducedMotion = mql.matches;
				_setPrefersReducedMotion(prefersReducedMotion);

				const onMqlChange = (e: MediaQueryListEvent) => {
					prefersReducedMotion = e.matches;
					_setPrefersReducedMotion(e.matches);
				};
				mql.addEventListener("change", onMqlChange);
				cleanups.push(() =>
					mql.removeEventListener("change", onMqlChange),
				);
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
	},
};

/** @internal Tear down listeners and reset config. For tests and HMR. */
export function _resetPlugin(): void {
	_cleanup?.();
	_cleanup = null;
}
