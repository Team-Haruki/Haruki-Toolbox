// Visual randomness only (eye blinks, shake directions, particle spread):
// nothing here needs unpredictable numbers.
export function random(): number {
  return Math.random(); // NOSONAR: not security-sensitive
}
