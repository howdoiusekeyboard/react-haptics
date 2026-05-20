import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createApp, defineComponent, h } from "vue";
import { resetDetection } from "@haptics/core";
import { HapticsPlugin, _resetPlugin } from "../plugin";

beforeEach(() => {
	resetDetection();
});

afterEach(() => {
	resetDetection();
	_resetPlugin();
});

describe("HapticsPlugin", () => {
	it("installs without error", () => {
		const app = createApp(defineComponent({ setup: () => () => h("div") }));
		expect(() => app.use(HapticsPlugin)).not.toThrow();
	});

	it("accepts custom patterns", () => {
		const app = createApp(defineComponent({ setup: () => () => h("div") }));
		expect(() =>
			app.use(HapticsPlugin, {
				patterns: {
					"custom-buzz": [{ duration: 50, intensity: 1 }],
				},
			}),
		).not.toThrow();
	});

	it("accepts respectReducedMotion option", () => {
		const app = createApp(defineComponent({ setup: () => () => h("div") }));
		expect(() =>
			app.use(HapticsPlugin, { respectReducedMotion: false }),
		).not.toThrow();
	});
});

describe("HapticsPlugin idempotency (iOS path)", () => {
	let originalUA: string;
	let originalVibrate: unknown;
	let addSpy: ReturnType<typeof vi.spyOn>;
	let removeSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		originalUA = navigator.userAgent;
		originalVibrate = (navigator as { vibrate?: unknown }).vibrate;
		Object.defineProperty(navigator, "userAgent", {
			value:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15",
			writable: true,
			configurable: true,
		});
		Object.defineProperty(navigator, "vibrate", {
			value: undefined,
			writable: true,
			configurable: true,
		});
		resetDetection();
		addSpy = vi.spyOn(document, "addEventListener");
		removeSpy = vi.spyOn(document, "removeEventListener");
	});

	afterEach(() => {
		Object.defineProperty(navigator, "userAgent", {
			value: originalUA,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(navigator, "vibrate", {
			value: originalVibrate,
			writable: true,
			configurable: true,
		});
		addSpy.mockRestore();
		removeSpy.mockRestore();
	});

	it("attaches a capture-phase click listener on install", () => {
		const app = createApp(defineComponent({ setup: () => () => h("div") }));
		app.use(HapticsPlugin);
		const clickAdds = addSpy.mock.calls.filter((c) => c[0] === "click");
		expect(clickAdds.length).toBe(1);
	});

	it("removes prior listeners when reinstalled (idempotent)", () => {
		const app1 = createApp(defineComponent({ setup: () => () => h("div") }));
		app1.use(HapticsPlugin);
		const app2 = createApp(defineComponent({ setup: () => () => h("div") }));
		app2.use(HapticsPlugin);

		const clickRemoves = removeSpy.mock.calls.filter((c) => c[0] === "click");
		expect(clickRemoves.length).toBe(1);
	});

	it("_resetPlugin removes the document click listener", () => {
		const app = createApp(defineComponent({ setup: () => () => h("div") }));
		app.use(HapticsPlugin);

		_resetPlugin();

		const clickRemoves = removeSpy.mock.calls.filter((c) => c[0] === "click");
		expect(clickRemoves.length).toBe(1);
	});

	it("ignores data-haptic values that are not own properties (e.g., __proto__)", () => {
		const app = createApp(defineComponent({ setup: () => () => h("div") }));
		app.use(HapticsPlugin);

		const btn = document.createElement("button");
		btn.setAttribute("data-haptic", "__proto__");
		document.body.appendChild(btn);
		expect(() => btn.click()).not.toThrow();
		document.body.removeChild(btn);
	});
});
