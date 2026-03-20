import { describe, it, expect } from 'vitest';
import { validateImageFile, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/utils/validation';
import { generateSafeFilename } from '@/utils/helpers';

describe('Media Upload Validation', () => {
  describe('validateImageFile', () => {
    it('accepts JPEG files', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1000 });
      expect(validateImageFile(file)).toBeNull();
    });

    it('accepts PNG files', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1000 });
      expect(validateImageFile(file)).toBeNull();
    });

    it('accepts WebP files', () => {
      const file = new File([''], 'test.webp', { type: 'image/webp' });
      Object.defineProperty(file, 'size', { value: 1000 });
      expect(validateImageFile(file)).toBeNull();
    });

    it('rejects GIF files', () => {
      const file = new File([''], 'test.gif', { type: 'image/gif' });
      Object.defineProperty(file, 'size', { value: 1000 });
      expect(validateImageFile(file)).toBeTruthy();
    });

    it('rejects SVG files', () => {
      const file = new File([''], 'test.svg', { type: 'image/svg+xml' });
      Object.defineProperty(file, 'size', { value: 1000 });
      expect(validateImageFile(file)).toBeTruthy();
    });

    it('rejects PDF files', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1000 });
      expect(validateImageFile(file)).toBeTruthy();
    });

    it('rejects files over 10MB', () => {
      const file = new File([''], 'big.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
      expect(validateImageFile(file)).toContain('10MB');
    });

    it('accepts files exactly at 10MB', () => {
      const file = new File([''], 'exact.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 });
      expect(validateImageFile(file)).toBeNull();
    });
  });

  describe('ALLOWED_IMAGE_TYPES', () => {
    it('includes jpeg, jpg, png, webp', () => {
      expect(ALLOWED_IMAGE_TYPES).toContain('image/jpeg');
      expect(ALLOWED_IMAGE_TYPES).toContain('image/jpg');
      expect(ALLOWED_IMAGE_TYPES).toContain('image/png');
      expect(ALLOWED_IMAGE_TYPES).toContain('image/webp');
    });

    it('does not include dangerous types', () => {
      expect(ALLOWED_IMAGE_TYPES).not.toContain('text/html');
      expect(ALLOWED_IMAGE_TYPES).not.toContain('application/javascript');
      expect(ALLOWED_IMAGE_TYPES).not.toContain('application/pdf');
    });
  });

  describe('MAX_FILE_SIZE', () => {
    it('is 10MB', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });
  });

  describe('generateSafeFilename', () => {
    it('generates unique filenames', () => {
      const name1 = generateSafeFilename('photo.jpg');
      const name2 = generateSafeFilename('photo.jpg');
      expect(name1).not.toBe(name2); // Unique due to timestamp + random
    });

    it('preserves file extension', () => {
      expect(generateSafeFilename('image.jpg')).toMatch(/\.jpg$/);
      expect(generateSafeFilename('image.png')).toMatch(/\.png$/);
      expect(generateSafeFilename('image.webp')).toMatch(/\.webp$/);
    });

    it('sanitizes the name (no original name in output)', () => {
      const name = generateSafeFilename('dangerous file (1).jpg');
      expect(name).not.toContain(' ');
      expect(name).not.toContain('(');
      expect(name).not.toContain(')');
    });

    it('handles files without extension', () => {
      const name = generateSafeFilename('noext');
      expect(name).toBeTruthy();
    });
  });
});
