import type { HapticPattern } from "./types";

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
 */
export function iosTick(): void {
	try {
		const label = document.createElement("label");
		label.ariaHidden = "true";
		label.style.cssText = "display:none";
		const input = document.createElement("input");
		input.type = "checkbox";
		input.setAttribute("switch", "");
		label.appendChild(input);
		document.body.appendChild(label);
		label.click();
		document.body.removeChild(label);
	} catch {
		/* haptics are non-critical */
	}
}

/**
 * Play a multi-segment haptic pattern on iOS.
 * Each segment produces one tick, with delays honored via setTimeout.
 */
export function schedulePattern(pattern: HapticPattern): void {
	let offsetMs = 0;
	for (const v of pattern) {
		offsetMs += v.delay ?? 0;
		if (offsetMs === 0) {
			iosTick();
		} else {
			const t = offsetMs;
			setTimeout(iosTick, t);
		}
		offsetMs += v.duration;
	}
}

/**
 * Convert a HapticPattern to a `navigator.vibrate()` number sequence.
 * Format: [vibrate_ms, pause_ms, vibrate_ms, ...]
 *
 * The Vibration API alternates vibrate/pause starting with vibrate.
 * Leading delays need a 0ms vibration prefix. Consecutive vibration
 * segments without a delay between them need a 0ms pause inserted.
 */
export function toVibrateSequence(pattern: HapticPattern): number[] {
	const seq: number[] = [];
	for (const v of pattern) {
		const delay = v.delay ?? 0;
		if (delay > 0) {
			if (seq.length === 0) {
				seq.push(0);
			}
			seq.push(delay);
		} else if (seq.length > 0) {
			seq.push(0);
		}
		seq.push(v.duration);
	}
	return seq;
}
