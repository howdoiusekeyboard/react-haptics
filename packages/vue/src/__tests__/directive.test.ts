import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, withDirectives } from "vue";
import { resetDetection } from "@haptics/core";
import { vHaptic } from "../directive";

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

describe("vHaptic directive", () => {
	it("sets data-haptic attribute on the element", () => {
		const TestComponent = defineComponent({
			setup() {
				return () =>
					withDirectives(h("button", { id: "btn" }, "Click"), [
						[vHaptic, "selection"],
					]);
			},
		});

		const wrapper = mount(TestComponent);
		expect(wrapper.find("#btn").attributes("data-haptic")).toBe("selection");
	});

	it("triggers vibration on click", async () => {
		const TestComponent = defineComponent({
			setup() {
				return () =>
					withDirectives(h("button", { id: "btn" }, "Click"), [
						[vHaptic, "selection"],
					]);
			},
		});

		const wrapper = mount(TestComponent);
		await wrapper.find("#btn").trigger("click");

		expect(vibrateMock).toHaveBeenCalledWith([15]);
	});

	it("removes data-haptic on unmount", () => {
		const TestComponent = defineComponent({
			setup() {
				return () =>
					withDirectives(h("button", { id: "btn" }, "Click"), [
						[vHaptic, "selection"],
					]);
			},
		});

		const wrapper = mount(TestComponent);
		const el = wrapper.find("#btn").element;
		wrapper.unmount();

		expect(el.hasAttribute("data-haptic")).toBe(false);
	});
});
