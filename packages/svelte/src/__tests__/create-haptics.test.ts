import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resetDetection } from "@haptics/core";
import { createHaptics } from "../create-haptics";
import { _resetConfig } from "../context";

let vibrateMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vibrateMock = vi.fn(() => true);
	Object.defineProperty(navigator, "vibrate", {
		value: vibrateMock,
		writable: true,
		configurable: true,
	});
	resetDetection();
	_resetConfig();
});

afterEach(() => {
	Object.defineProperty(navigator, "vibrate", {
		value: undefined,
		writable: true,
		configurable: true,
	});
	resetDetection();
	_resetConfig();
});

describe("createHaptics", () => {
	it("returns trigger, cancel, isSupported, and isIOSSupported", () => {
		const haptics = createHaptics();

		expect(haptics).toHaveProperty("trigger");
		expect(haptics).toHaveProperty("cancel");
		expect(typeof haptics.isSupported).toBe("boolean");
		expect(typeof haptics.isIOSSupported).toBe("boolean");
	});

	it("detects vibration support", () => {
		const haptics = createHaptics();
		expect(haptics.isSupported).toBe(true);
	});

	it("triggers vibration for a built-in preset", () => {
		const haptics = createHaptics();
		haptics.trigger("selection");
		expect(vibrateMock).toHaveBeenCalledWith([15]);
	});

	it("does not call vibrate for unknown preset", () => {
		const haptics = createHaptics();
		haptics.trigger("nonexistent-pattern");
		expect(vibrateMock).not.toHaveBeenCalled();
	});

	it("cancel calls navigator.vibrate(0)", () => {
		const haptics = createHaptics();
		haptics.cancel();
		expect(vibrateMock).toHaveBeenCalledWith(0);
	});

	it("isIOSSupported is false in jsdom", () => {
		const haptics = createHaptics();
		expect(haptics.isIOSSupported).toBe(false);
	});
});
