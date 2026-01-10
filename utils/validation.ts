/**
 * Validation utilities for form inputs and data
 */

export const ValidationError = class extends Error {
  field?: string;
  
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
};

export const validators = {
  email: (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
  },

  phone: (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    // Allow international format with +, spaces, dashes, parentheses
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(value.trim().replace(/\s/g, ''));
  },

  required: (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },

  minLength: (value: string, min: number): boolean => {
    if (!value || typeof value !== 'string') return false;
    return value.trim().length >= min;
  },

  maxLength: (value: string, max: number): boolean => {
    if (!value || typeof value !== 'string') return true;
    return value.trim().length <= max;
  },

  number: (value: any): boolean => {
    if (value === null || value === undefined || value === '') return false;
    const num = typeof value === 'number' ? value : parseFloat(value);
    return !isNaN(num) && isFinite(num);
  },

  positiveNumber: (value: any): boolean => {
    if (!validators.number(value)) return false;
    const num = typeof value === 'number' ? value : parseFloat(value);
    return num > 0;
  },

  url: (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  date: (value: string | Date): boolean => {
    if (!value) return false;
    const date = value instanceof Date ? value : new Date(value);
    return !isNaN(date.getTime());
  },

  currency: (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    const validCurrencies = ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'QAR', 'INR', 'JPY', 'CAD'];
    return validCurrencies.includes(value.toUpperCase());
  },
};

export function validateField(
  value: any,
  rules: Array<{ validator: keyof typeof validators; params?: any[]; message: string }>
): string | null {
  for (const rule of rules) {
    const { validator, params = [], message } = rule;
    const validatorFn = validators[validator];
    
    if (!validatorFn) {
      console.warn(`Unknown validator: ${validator}`);
      continue;
    }

    const result = (validatorFn as any)(value, ...params);
    if (!result) {
      return message;
    }
  }
  
  return null;
}
