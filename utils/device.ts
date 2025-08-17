// This file is deprecated - use utils/deviceCode.ts instead
// Keeping for backward compatibility

import { getDeviceId as getDeviceIdFromDeviceCode, clearDeviceId as clearDeviceIdFromDeviceCode } from './deviceCode';

/**
 * @deprecated Use getDeviceId from utils/deviceCode.ts instead
 */
export const getDeviceId = getDeviceIdFromDeviceCode;

/**
 * @deprecated Use clearDeviceId from utils/deviceCode.ts instead
 */
export const clearDeviceId = clearDeviceIdFromDeviceCode;