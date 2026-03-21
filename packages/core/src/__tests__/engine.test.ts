import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	toVibrateSequence,
	schedulePattern,
	iosTick,
	isIOS,
	isVibrationSupported,
	resetDetection,
} from "../engine";
import type { HapticPattern } from "../types";
import { PRESETS } from "../presets";

describe("toVibrateSequence", () => {
	it("converts a single-segment pattern", () => {
		const pattern: HapticPattern = [{ duration: 15 }];
		expect(toVibrateSequence(pattern)).toEqual([15]);
	});

	it("converts a pattern with delay between segments", () => {
		const pattern: HapticPattern = [
			{ duration: 20 },
			{ delay: 15, duration: 10 },
		];
		expect(toVibrateSequence(pattern)).toEqual([20, 15, 10]);
	});

	it("handles a leading delay by prepending 0ms vibration", () => {
		const pattern: HapticPattern = [{ delay: 100, duration: 30 }];
		expect(toVibrateSequence(pattern)).toEqual([0, 100, 30]);
	});

	it("inserts 0ms pause between consecutive vibrations without delays", () => {
		const pattern: HapticPattern = [
			{ duration: 30 },
			{ duration: 20 },
		];
		expect(toVibrateSequence(pattern)).toEqual([30, 0, 20]);
	});

	it("handles three consecutive segments without delays", () => {
		const pattern: HapticPattern = [
			{ duration: 10 },
			{ duration: 20 },
			{ duration: 30 },
		];
		expect(toVibrateSequence(pattern)).toEqual([10, 0, 20, 0, 30]);
	});

	it("handles mixed delay/no-delay segments", () => {
		const pattern: HapticPattern = [
			{ duration: 10 },
			{ delay: 5, duration: 20 },
			{ duration: 30 },
		];
		expect(toVibrateSequence(pattern)).toEqual([10, 5, 20, 0, 30]);
	});

	it("returns empty array for empty pattern", () => {
		expect(toVibrateSequence([])).toEqual([]);
	});

	it("converts all built-in presets without error", () => {
		for (const [name, pattern] of Object.entries(PRESETS)) {
			const seq = toVibrateSequence(pattern);
			expect(seq.length, `${name} should produce a non-empty sequence`).toBeGreaterThan(0);
			for (const n of seq) {
				expect(n, `${name}: all values must be >= 0`).toBeGreaterThanOrEqual(0);
			}
		}
	});

	it("produces correct alternating vibrate/pause pattern for presets", () => {
		expect(toVibrateSequence(PRESETS.selection)).toEqual([15]);
		expect(toVibrateSequence(PRESETS["impact-light"])).toEqual([20, 15, 10]);
		expect(toVibrateSequence(PRESETS.success)).toEqual([30, 15, 40, 10, 50]);
	});
});

describe("schedulePattern", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("fires iosTick immediately for first segment without delay", () => {
		const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

		const pattern: HapticPattern = [
			{ duration: 20 },
			{ delay: 15, duration: 10 },
		];
		schedulePattern(pattern);

		expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 35);
		setTimeoutSpy.mockRestore();
	});

	it("schedules all segments with correct offsets", () => {
		const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

		const pattern: HapticPattern = [
			{ duration: 30 },
			{ delay: 15, duration: 40 },
			{ delay: 10, duration: 50 },
		];
		schedulePattern(pattern);

		const calls = setTimeoutSpy.mock.calls;
		expect(calls).toHaveLength(2);
		expect(calls[0][1]).toBe(45);
		expect(calls[1][1]).toBe(95);

		setTimeoutSpy.mockRestore();
	});
});

describe("iosTick", () => {
	it("does not throw in jsdom environment", () => {
		expect(() => iosTick()).not.toThrow();
	});

	it("appends to document.body, not document.head", () => {
		const appendSpy = vi.spyOn(document.body, "appendChild");
		const removeSpy = vi.spyOn(document.body, "removeChild");

		iosTick();

		expect(appendSpy).toHaveBeenCalled();
		expect(removeSpy).toHaveBeenCalled();

		appendSpy.mockRestore();
		removeSpy.mockRestore();
	});
});

describe("platform detection", () => {
	afterEach(() => {
		resetDetection();
	});

	it("isIOS returns a boolean", () => {
		expect(typeof isIOS()).toBe("boolean");
	});

	it("isVibrationSupported returns a boolean", () => {
		expect(typeof isVibrationSupported()).toBe("boolean");
	});

	it("resetDetection clears cached values", () => {
		isIOS();
		isVibrationSupported();

		resetDetection();

		Object.defineProperty(navigator, "vibrate", {
			value: () => true,
			writable: true,
			configurable: true,
		});

		expect(isVibrationSupported()).toBe(true);

		Object.defineProperty(navigator, "vibrate", {
			value: undefined,
			writable: true,
			configurable: true,
		});
	});

	it("caches results after first call", () => {
		const first = isIOS();
		const second = isIOS();
		expect(first).toBe(second);

		const firstVib = isVibrationSupported();
		const secondVib = isVibrationSupported();
		expect(firstVib).toBe(secondVib);
	});
});
