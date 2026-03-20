import { describe, it, expect } from 'vitest';
import { DEFAULT_SITE_SETTINGS, DEFAULT_BUSINESS_SETTINGS } from '@/services/settings';

describe('Settings Service - Defaults', () => {
  describe('DEFAULT_SITE_SETTINGS', () => {
    it('has all required color properties', () => {
      expect(DEFAULT_SITE_SETTINGS.color_primary).toBe('#1a1a1a');
      expect(DEFAULT_SITE_SETTINGS.color_primary_foreground).toBe('#c0c0c0');
      expect(DEFAULT_SITE_SETTINGS.color_navbar_bg).toBe('#1a1a1a');
      expect(DEFAULT_SITE_SETTINGS.color_navbar_text).toBe('#c0c0c0');
      expect(DEFAULT_SITE_SETTINGS.color_footer_bg).toBe('#1a1a1a');
      expect(DEFAULT_SITE_SETTINGS.color_footer_text).toBe('#c0c0c0');
    });

    it('uses BrushScriptMT as default display font', () => {
      expect(DEFAULT_SITE_SETTINGS.font_display).toBe('BrushScriptMT');
    });

    it('uses system-ui as default body font', () => {
      expect(DEFAULT_SITE_SETTINGS.font_body).toBe('system-ui');
    });

    it('has hero button defaults', () => {
      expect(DEFAULT_SITE_SETTINGS.hero_button_text).toBe('Scopri i prodotti');
      expect(DEFAULT_SITE_SETTINGS.hero_button_link).toBe('/prodotti');
    });

    it('has WhatsApp floating enabled by default', () => {
      expect(DEFAULT_SITE_SETTINGS.whatsapp_floating_enabled).toBe(true);
    });

    it('has reviews section enabled by default', () => {
      expect(DEFAULT_SITE_SETTINGS.reviews_section_enabled).toBe(true);
    });

    it('has sensible button defaults', () => {
      expect(DEFAULT_SITE_SETTINGS.button_border_radius).toBe('0.5rem');
    });

    it('all color values are valid hex', () => {
      const hexRegex = /^#[0-9a-fA-F]{6}$/;
      const colorKeys = Object.keys(DEFAULT_SITE_SETTINGS).filter(k => k.startsWith('color_'));
      colorKeys.forEach(key => {
        const value = DEFAULT_SITE_SETTINGS[key as keyof typeof DEFAULT_SITE_SETTINGS];
        if (typeof value === 'string' && value) {
          expect(value).toMatch(hexRegex);
        }
      });
    });
  });

  describe('DEFAULT_BUSINESS_SETTINGS', () => {
    it('has business name', () => {
      expect(DEFAULT_BUSINESS_SETTINGS.business_name).toBe('Macelleria Amici');
    });

    it('has operational address', () => {
      expect(DEFAULT_BUSINESS_SETTINGS.operational_address).toContain('Via Luigi Capuana 6A');
    });

    it('has phone number', () => {
      expect(DEFAULT_BUSINESS_SETTINGS.phone).toBe('06 64505881');
    });

    it('has WhatsApp number', () => {
      expect(DEFAULT_BUSINESS_SETTINGS.whatsapp).toBe('3757059237');
    });

    it('has legal address', () => {
      expect(DEFAULT_BUSINESS_SETTINGS.legal_address).toContain('Via Nomentana 761');
    });

    it('has empty arrays for configurable lists', () => {
      expect(Array.isArray(DEFAULT_BUSINESS_SETTINGS.opening_hours)).toBe(true);
      expect(Array.isArray(DEFAULT_BUSINESS_SETTINGS.pickup_slots)).toBe(true);
      expect(Array.isArray(DEFAULT_BUSINESS_SETTINGS.extraordinary_closures)).toBe(true);
      expect(Array.isArray(DEFAULT_BUSINESS_SETTINGS.holidays)).toBe(true);
    });
  });
});
