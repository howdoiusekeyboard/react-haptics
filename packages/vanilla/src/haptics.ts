import {
	PRESETS,
	isVibrationSupported,
	isIOS,
	toVibrateSequence,
	schedulePattern,
} from "@haptics/core";
import type { HapticPattern, PresetName } from "@haptics/core";

export interface HapticsOptions {
	/**
	 * Element to delegate click events from. The capture-phase listener
	 * is registered on this element. Default: document.
	 */
	delegateFrom?: Element | Document;
	/**
	 * CSS selector for elements that trigger haptics on click.
	 * Default: "[data-haptic]"
	 */
	selector?: string;
	/** Custom patterns merged with built-in presets. */
	patterns?: Record<string, HapticPattern>;
	/** Suppress haptics when prefers-reduced-motion is active. Default: true */
	respectReducedMotion?: boolean;
}

/**
 * Zero-framework haptic feedback controller.
 *
 * Registers a capture-phase click listener that intercepts clicks on
 * elements matching the selector, reads the pattern name from data-haptic,
 * and fires the appropriate haptic feedback.
 *
 * Works with HTMX, Alpine.js, Stimulus, plain HTML — anything.
 */
export class Haptics {
	private readonly patterns: Record<string, HapticPattern>;
	private readonly respectReducedMotion: boolean;
	private readonly delegateFrom: Element | Document;
	private readonly selector: string;
	private prefersReducedMotion = false;
	private destroyed = false;
	private readonly clickHandler: (e: Event) => void;
	private mqlHandler: ((e: MediaQueryListEvent) => void) | null = null;
	private mql: MediaQueryList | null = null;

	readonly isSupported: boolean;
	readonly isIOSSupported: boolean;

	constructor(options: HapticsOptions = {}) {
		this.patterns = { ...PRESETS, ...options.patterns };
		this.respectReducedMotion = options.respectReducedMotion ?? true;
		this.delegateFrom = options.delegateFrom ?? document;
		this.selector = options.selector ?? "[data-haptic]";
		this.isSupported = isVibrationSupported();
		this.isIOSSupported = isIOS();

		if (
			this.respectReducedMotion &&
			typeof window !== "undefined" &&
			window.matchMedia
		) {
			this.mql = window.matchMedia("(prefers-reduced-motion: reduce)");
			this.prefersReducedMotion = this.mql.matches;
			this.mqlHandler = (e: MediaQueryListEvent) => {
				this.prefersReducedMotion = e.matches;
			};
			this.mql.addEventListener("change", this.mqlHandler);
		}

		this.clickHandler = (e: Event) => {
			if (this.destroyed) return;
			if (this.respectReducedMotion && this.prefersReducedMotion) return;

			const target = (e.target as Element)?.closest(this.selector);
			if (!target) return;

			const action = target.getAttribute("data-haptic");
			if (!action || !(action in this.patterns)) return;

			const pattern = this.patterns[action];
			if (this.isSupported) {
				navigator.vibrate(toVibrateSequence(pattern));
			} else if (this.isIOSSupported) {
				schedulePattern(pattern);
			}
		};

		this.delegateFrom.addEventListener("click", this.clickHandler, {
			capture: true,
			passive: true,
		});
	}

	/** Trigger haptic feedback imperatively by pattern name. */
	trigger(action: PresetName | (string & {})): void {
		if (this.destroyed) return;
		if (this.respectReducedMotion && this.prefersReducedMotion) return;

		const pattern = this.patterns[action];
		if (!pattern) return;

		if (this.isSupported) {
			navigator.vibrate(toVibrateSequence(pattern));
		} else if (this.isIOSSupported) {
			schedulePattern(pattern);
		}
	}

	/** Cancel active vibration (Android only). */
	cancel(): void {
		if (this.isSupported) navigator.vibrate(0);
	}

	/** Remove all listeners and clean up. */
	destroy(): void {
		if (this.destroyed) return;
		this.destroyed = true;

		this.delegateFrom.removeEventListener("click", this.clickHandler, {
			capture: true,
		} as EventListenerOptions);

		if (this.mql && this.mqlHandler) {
			this.mql.removeEventListener("change", this.mqlHandler);
		}
	}
}
