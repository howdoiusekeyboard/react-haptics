import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
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

function mountComposable<T>(composable: () => T): { result: T; wrapper: ReturnType<typeof mount> } {
	let result!: T;
	const TestComponent = defineComponent({
		setup() {
			result = composable();
			return () => h("div");
		},
	});
	const wrapper = mount(TestComponent);
	return { result, wrapper };
}

describe("useHaptics", () => {
	it("returns trigger, cancel, isSupported, and isIOSSupported", () => {
		const { result } = mountComposable(() => useHaptics());

		expect(result).toHaveProperty("trigger");
		expect(result).toHaveProperty("cancel");
		expect(typeof result.isSupported).toBe("boolean");
		expect(typeof result.isIOSSupported).toBe("boolean");
	});

	it("detects vibration support", () => {
		const { result } = mountComposable(() => useHaptics());
		expect(result.isSupported).toBe(true);
	});

	it("triggers vibration for a built-in preset", () => {
		const { result } = mountComposable(() => useHaptics());
		result.trigger("selection");
		expect(vibrateMock).toHaveBeenCalledWith([15]);
	});

	it("does not call vibrate for unknown preset", () => {
		const { result } = mountComposable(() => useHaptics());
		result.trigger("nonexistent-pattern");
		expect(vibrateMock).not.toHaveBeenCalled();
	});

	it("cancel calls navigator.vibrate(0)", () => {
		const { result } = mountComposable(() => useHaptics());
		result.cancel();
		expect(vibrateMock).toHaveBeenCalledWith(0);
	});

	it("isIOSSupported is false in jsdom", () => {
		const { result } = mountComposable(() => useHaptics());
		expect(result.isIOSSupported).toBe(false);
	});
});
