import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createApp, defineComponent, h } from "vue";
import { resetDetection } from "@haptics/core";
import { HapticsPlugin } from "../plugin";

beforeEach(() => {
	resetDetection();
});

afterEach(() => {
	resetDetection();
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
