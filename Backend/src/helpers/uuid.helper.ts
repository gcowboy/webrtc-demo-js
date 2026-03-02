import { UUID_REGEX } from '../constants/uuid.constants';

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
