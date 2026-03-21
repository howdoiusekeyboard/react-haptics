import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resetDetection } from "@haptics/core";
import { haptic } from "../action";
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

describe("haptic action", () => {
	it("sets data-haptic attribute on the element", () => {
		const node = document.createElement("button");
		haptic(node, "selection");
		expect(node.getAttribute("data-haptic")).toBe("selection");
	});

	it("triggers vibration on click", () => {
		const node = document.createElement("button");
		haptic(node, "selection");

		node.click();
		expect(vibrateMock).toHaveBeenCalledWith([15]);
	});

	it("updates data-haptic on update", () => {
		const node = document.createElement("button");
		const action = haptic(node, "selection");

		action.update("success");
		expect(node.getAttribute("data-haptic")).toBe("success");
	});

	it("removes listener and attribute on destroy", () => {
		const node = document.createElement("button");
		const action = haptic(node, "selection");

		action.destroy();
		expect(node.hasAttribute("data-haptic")).toBe(false);

		node.click();
		expect(vibrateMock).not.toHaveBeenCalled();
	});

	it("uses updated action name for vibration", () => {
		const node = document.createElement("button");
		const action = haptic(node, "selection");

		action.update("success");
		node.click();

		expect(vibrateMock).toHaveBeenCalledWith([30, 15, 40, 10, 50]);
	});
});
