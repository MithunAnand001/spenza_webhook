import { SpenzaErrorCode } from '../constants/ErrorCodes';

/**
 * Centralized date utility.
 * Internal new Date() calls are restricted to this file.
 */

export enum DateFormat {
  ISO = 'ISO',
  DISPLAY = 'DISPLAY', // e.g., 3/18/2026, 3:38:01 AM
  DB = 'DB',      // YYYY-MM-DD HH:mm:ss
}

export const getCurrentDate = (): Date => {
  return new Date();
};

export const formatDate = (date: Date | string | number, format: DateFormat = DateFormat.ISO): string => {
  const d = new Date(date);
  
  switch (format) {
    case DateFormat.DISPLAY:
      return d.toLocaleString();
    case DateFormat.DB:
      return d.toISOString().slice(0, 19).replace('T', ' ');
    case DateFormat.ISO:
    default:
      return d.toISOString();
  }
};

export const addMs = (date: Date, ms: number): Date => {
  return new Date(date.getTime() + ms);
};
