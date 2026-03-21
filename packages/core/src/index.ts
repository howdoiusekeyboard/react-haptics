// Types
export type { Vibration, HapticPattern } from "./types";

// Presets
export { PRESETS } from "./presets";
export type { PresetName } from "./presets";

// Engine
export {
	isIOS,
	isVibrationSupported,
	resetDetection,
	iosTick,
	schedulePattern,
	toVibrateSequence,
} from "./engine";
