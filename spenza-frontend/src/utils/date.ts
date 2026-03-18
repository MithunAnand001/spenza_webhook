/**
 * Centralized date utility to ensure consistent date handling across the frontend.
 * Avoid using `new Date()` directly in components or stores.
 */

export const getCurrentDate = (): Date => {
  return new Date();
};

export const formatDisplayDate = (date: Date | string): string => {
  return new Date(date).toLocaleString();
};

export const toISOString = (date: Date | string): string => {
  return new Date(date).toISOString();
};
