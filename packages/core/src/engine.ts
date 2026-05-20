import type { HapticPattern } from "./types";

/** Defensive limits — guards against runaway patterns from buggy or untrusted input. */
const MAX_PATTERN_SEGMENTS = 64;
const MAX_TOTAL_OFFSET_MS = 60_000;

/** True on iOS where navigator.vibrate is absent but touch hardware exists */
let _isIOS: boolean | null = null;
export function isIOS(): boolean {
	if (_isIOS === null) {
		_isIOS =
			typeof window !== "undefined" &&
			typeof navigator !== "undefined" &&
			typeof navigator.vibrate !== "function" &&
			((/iPad|iPhone|iPod/.test(navigator.userAgent) &&
				!("MSStream" in window)) ||
				(navigator.maxTouchPoints > 1 &&
					/MacIntel/.test(navigator.platform)));
	}
	return _isIOS;
}

/** True when the Web Vibration API is available (Android/Chrome) */
let _isVibrationSupported: boolean | null = null;
export function isVibrationSupported(): boolean {
	if (_isVibrationSupported === null) {
		_isVibrationSupported =
			typeof navigator !== "undefined" &&
			typeof navigator.vibrate === "function";
	}
	return _isVibrationSupported;
}

/** @internal Reset cached detection. For testing only. */
export function resetDetection(): void {
	_isIOS = null;
	_isVibrationSupported = null;
}

/**
 * Single haptic tick on iOS via the checkbox-switch side effect.
 *
 * Safari 17.4+ fires Taptic Engine feedback when an `<input type="checkbox" switch>`
 * is toggled. We create one, click it, and remove it — producing one haptic tick.
 *
 * Falls back to document.documentElement when document.body is unavailable
 * (e.g., scripts executing in <head> before body parse, or post-unload).
 */
export function iosTick(): void {
	try {
		if (typeof document === "undefined") return;
		const host = document.body ?? document.documentElement;
		if (!host) return;
		const label = document.createElement("label");
		label.ariaHidden = "true";
		label.style.cssText = "display:none";
		const input = document.createElement("input");
		input.type = "checkbox";
		input.setAttribute("switch", "");
		label.appendChild(input);
		host.appendChild(label);
		label.click();
		host.removeChild(label);
	} catch {
		/* haptics are non-critical */
	}
}

/** Coerce a vibration value into a non-negative integer ms count. */
function clampMs(n: number | undefined): number {
	if (!Number.isFinite(n)) return 0;
	return Math.max(0, Math.floor(n as number));
}

/**
 * Play a multi-segment haptic pattern on iOS.
 * Each segment produces one tick, with delays honored via setTimeout.
 *
 * Returns a cancel function that clears any pending timers. Useful for
 * tearing down listeners on adapter cleanup so in-flight patterns don't
 * keep firing after unmount or SPA navigation.
 *
 * Defensively clamps pattern length and total scheduled offset to guard
 * against runaway patterns from buggy or untrusted input.
 */
export function schedulePattern(pattern: HapticPattern): () => void {
	const timers: ReturnType<typeof setTimeout>[] = [];
	const limit = Math.min(pattern.length, MAX_PATTERN_SEGMENTS);
	let offsetMs = 0;
	for (let i = 0; i < limit; i++) {
		const v = pattern[i];
		offsetMs += clampMs(v.delay);
		if (offsetMs > MAX_TOTAL_OFFSET_MS) break;
		if (offsetMs === 0) {
			iosTick();
		} else {
			timers.push(setTimeout(iosTick, offsetMs));
		}
		offsetMs += clampMs(v.duration);
	}
	return () => {
		for (const t of timers) clearTimeout(t);
		timers.length = 0;
	};
}

/**
 * Convert a HapticPattern to a `navigator.vibrate()` number sequence.
 * Format: [vibrate_ms, pause_ms, vibrate_ms, ...]
 *
 * The Vibration API alternates vibrate/pause starting with vibrate.
 * Leading delays need a 0ms vibration prefix. Consecutive vibration
 * segments without a delay between them need a 0ms pause inserted.
 *
 * Values are coerced to non-negative integers and the segment count
 * is capped — some Android builds throw a TypeError on negative or
 * non-integer values, breaking the click handler.
 */
export function toVibrateSequence(pattern: HapticPattern): number[] {
	const seq: number[] = [];
	const limit = Math.min(pattern.length, MAX_PATTERN_SEGMENTS);
	for (let i = 0; i < limit; i++) {
		const v = pattern[i];
		const delay = clampMs(v.delay);
		if (delay > 0) {
			if (seq.length === 0) {
				seq.push(0);
			}
			seq.push(delay);
		} else if (seq.length > 0) {
			seq.push(0);
		}
		seq.push(clampMs(v.duration));
	}
	return seq;
}
