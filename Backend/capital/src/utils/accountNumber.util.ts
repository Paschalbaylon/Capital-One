import { randomBytes } from 'crypto';

export function generateNumericCode(length = 10): string {
  const digits = '0123456789';
  const bytes = randomBytes(length);
  let result = '';

  for (let i = 0; i < length; i++) {
    result += digits[bytes[i] % digits.length];
  }

  return result;
}
