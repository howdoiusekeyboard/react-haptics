import { PRESETS } from "@haptics/core";
import type { HapticPattern } from "@haptics/core";

let _patterns: Record<string, HapticPattern> = { ...PRESETS };
let _respectReducedMotion = true;
let _prefersReducedMotion = false;

export function _setConfig(
	patterns: Record<string, HapticPattern>,
	respectReducedMotion: boolean,
): void {
	_patterns = patterns;
	_respectReducedMotion = respectReducedMotion;
}

export function _getPatterns(): Record<string, HapticPattern> {
	return _patterns;
}

export function _shouldSuppress(): boolean {
	return _respectReducedMotion && _prefersReducedMotion;
}

export function _setPrefersReducedMotion(value: boolean): void {
	_prefersReducedMotion = value;
}
