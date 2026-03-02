/** UUID v4 format (8-4-4-4-12 hex). */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(s: string): boolean {
  return UUID_REGEX.test(s);
}

/**
 * Returns a valid UUID for instance id: envValue if it is a non-empty UUID, otherwise defaultUuid.
 */
export function getInstanceIdUuid(
  envValue: string | undefined,
  defaultUuid: string,
): string {
  if (envValue != null && envValue !== '' && isUuid(envValue)) return envValue;
  return defaultUuid;
}
