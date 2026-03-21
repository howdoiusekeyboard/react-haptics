import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { resetDetection } from "@haptics/core";
import { useHaptics } from "../use-haptics";

let vibrateMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vibrateMock = vi.fn(() => true);
	Object.defineProperty(navigator, "vibrate", {
		value: vibrateMock,
		writable: true,
		configurable: true,
	});
	resetDetection();
});

afterEach(() => {
	Object.defineProperty(navigator, "vibrate", {
		value: undefined,
		writable: true,
		configurable: true,
	});
	resetDetection();
});

describe("useHaptics", () => {
	it("returns trigger, cancel, isSupported, and isIOSSupported", () => {
		const { result } = renderHook(() => useHaptics());

		expect(result.current).toHaveProperty("trigger");
		expect(result.current).toHaveProperty("cancel");
		expect(typeof result.current.isSupported).toBe("boolean");
		expect(typeof result.current.isIOSSupported).toBe("boolean");
	});

	it("detects vibration support when navigator.vibrate exists", () => {
		const { result } = renderHook(() => useHaptics());
		expect(result.current.isSupported).toBe(true);
	});

	it("triggers vibration for a built-in preset", () => {
		const { result } = renderHook(() => useHaptics());

		act(() => {
			result.current.trigger("selection");
		});

		expect(vibrateMock).toHaveBeenCalledWith([15]);
	});

	it("triggers vibration for impact-light preset", () => {
		const { result } = renderHook(() => useHaptics());

		act(() => {
			result.current.trigger("impact-light");
		});

		expect(vibrateMock).toHaveBeenCalledWith([20, 15, 10]);
	});

	it("does not call vibrate for an unknown preset", () => {
		const { result } = renderHook(() => useHaptics());

		act(() => {
			result.current.trigger("nonexistent-pattern");
		});

		expect(vibrateMock).not.toHaveBeenCalled();
	});

	it("cancel calls navigator.vibrate(0)", () => {
		const { result } = renderHook(() => useHaptics());

		act(() => {
			result.current.cancel();
		});

		expect(vibrateMock).toHaveBeenCalledWith(0);
	});

	it("isIOSSupported is false in jsdom", () => {
		const { result } = renderHook(() => useHaptics());
		expect(result.current.isIOSSupported).toBe(false);
	});

	it("trigger returns void without error when no support", () => {
		Object.defineProperty(navigator, "vibrate", {
			value: undefined,
			writable: true,
			configurable: true,
		});
		resetDetection();

		const { result } = renderHook(() => useHaptics());

		expect(() => {
			act(() => {
				result.current.trigger("selection");
			});
		}).not.toThrow();
	});
});
