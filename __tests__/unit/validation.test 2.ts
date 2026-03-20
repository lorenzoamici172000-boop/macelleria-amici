import { describe, it, expect } from 'vitest';
import {
  usernameSchema,
  registrationSchema,
  loginSchema,
  zipCodeSchema,
  generateSlug,
  validateImageFile,
} from '@/utils/validation';

describe('Validation Utilities', () => {
  describe('usernameSchema', () => {
    it('accepts valid usernames', () => {
      expect(usernameSchema.safeParse('mario1').success).toBe(true);
      expect(usernameSchema.safeParse('user_name').success).toBe(true);
      expect(usernameSchema.safeParse('AbCdEf').success).toBe(true);
      expect(usernameSchema.safeParse('user12').success).toBe(true);
      expect(usernameSchema.safeParse('a_b_c_d_e_f_g').success).toBe(true); // 13 chars
    });

    it('rejects too short', () => {
      expect(usernameSchema.safeParse('abc').success).toBe(false);
      expect(usernameSchema.safeParse('12345').success).toBe(false);
    });

    it('rejects too long', () => {
      expect(usernameSchema.safeParse('abcdefghijklmn').success).toBe(false); // 14 chars
    });

    it('rejects invalid characters', () => {
      expect(usernameSchema.safeParse('mario rossi').success).toBe(false);
      expect(usernameSchema.safeParse('mario@rossi').success).toBe(false);
      expect(usernameSchema.safeParse('mario.rossi').success).toBe(false);
    });

    it('rejects leading underscore', () => {
      expect(usernameSchema.safeParse('_mario1').success).toBe(false);
    });

    it('rejects trailing underscore', () => {
      expect(usernameSchema.safeParse('mario1_').success).toBe(false);
    });
  });

  describe('registrationSchema', () => {
    const validData = {
      firstName: 'Mario',
      lastName: 'Rossi',
      username: 'mario1',
      email: 'mario@test.it',
      password: 'Password1!',
      confirmPassword: 'Password1!',
      acceptPrivacy: true as const,
    };

    it('accepts valid registration', () => {
      expect(registrationSchema.safeParse(validData).success).toBe(true);
    });

    it('rejects missing first name', () => {
      expect(registrationSchema.safeParse({ ...validData, firstName: '' }).success).toBe(false);
    });

    it('rejects missing last name', () => {
      expect(registrationSchema.safeParse({ ...validData, lastName: '' }).success).toBe(false);
    });

    it('rejects invalid email', () => {
      expect(registrationSchema.safeParse({ ...validData, email: 'notanemail' }).success).toBe(false);
    });

    it('rejects short password', () => {
      expect(registrationSchema.safeParse({ ...validData, password: '123', confirmPassword: '123' }).success).toBe(false);
    });

    it('rejects mismatched passwords', () => {
      expect(registrationSchema.safeParse({ ...validData, confirmPassword: 'different' }).success).toBe(false);
    });

    it('rejects unaccepted privacy', () => {
      expect(registrationSchema.safeParse({ ...validData, acceptPrivacy: false }).success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid login', () => {
      expect(loginSchema.safeParse({ email: 'test@test.it', password: 'pass123' }).success).toBe(true);
    });

    it('rejects empty password', () => {
      expect(loginSchema.safeParse({ email: 'test@test.it', password: '' }).success).toBe(false);
    });
  });

  describe('zipCodeSchema', () => {
    it('accepts valid Italian ZIP', () => {
      expect(zipCodeSchema.safeParse('00137').success).toBe(true);
      expect(zipCodeSchema.safeParse('20100').success).toBe(true);
    });

    it('rejects invalid ZIP', () => {
      expect(zipCodeSchema.safeParse('0013').success).toBe(false);
      expect(zipCodeSchema.safeParse('001370').success).toBe(false);
      expect(zipCodeSchema.safeParse('ABCDE').success).toBe(false);
      expect(zipCodeSchema.safeParse('').success).toBe(false);
    });
  });

  describe('generateSlug', () => {
    it('generates slug from Italian text', () => {
      expect(generateSlug('Bistecca di Manzo')).toBe('bistecca-di-manzo');
      expect(generateSlug('Pollo à la griglia')).toBe('pollo-a-la-griglia');
      expect(generateSlug('Würstel   Special!')).toBe('wurstel-special');
    });

    it('handles edge cases', () => {
      expect(generateSlug('')).toBe('');
      expect(generateSlug('---')).toBe('');
      expect(generateSlug('ABC 123')).toBe('abc-123');
    });
  });
});
