// Re-export everything from @haptics/react
export { HapticsProvider, useHaptics } from "@haptics/react";
export type { HapticsProviderProps, HapticsContextValue } from "@haptics/react";

// Re-export core utilities
export {
	PRESETS,
	iosTick,
	schedulePattern,
	toVibrateSequence,
} from "@haptics/core";
export type { Vibration, HapticPattern, PresetName } from "@haptics/core";

// Backwards-compatible boolean re-exports (deprecated)
import {
	isIOS as _isIOS,
	isVibrationSupported as _isVibrationSupported,
} from "@haptics/core";

/** @deprecated Import from '@haptics/core' and call as isIOS() */
export const isIOS: boolean = _isIOS();

/** @deprecated Import from '@haptics/core' and call as isVibrationSupported() */
export const isVibrationSupported: boolean = _isVibrationSupported();
