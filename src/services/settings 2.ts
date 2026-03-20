import type { SupabaseClient } from '@supabase/supabase-js';
import type { SiteSettings, BusinessSettings } from '@/types';

// ---- Default fallback settings ----
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: '',
  logo_url: '',
  favicon_url: '',
  hero_image_url: '',
  hero_button_text: 'Scopri i prodotti',
  hero_button_link: '/prodotti',
  reviews_section_enabled: true,
  reviews_button_text: 'Vedi di più',
  whatsapp_floating_enabled: true,
  color_primary: '#1a1a1a',
  color_primary_foreground: '#c0c0c0',
  color_secondary: '#c0c0c0',
  color_secondary_foreground: '#1a1a1a',
  color_accent: '#8a8a8a',
  color_background: '#ffffff',
  color_foreground: '#1a1a1a',
  color_navbar_bg: '#1a1a1a',
  color_navbar_text: '#c0c0c0',
  color_footer_bg: '#1a1a1a',
  color_footer_text: '#c0c0c0',
  color_muted: '#f5f5f5',
  color_border: '#e5e5e5',
  font_display: 'BrushScriptMT',
  font_body: 'system-ui',
  font_display_url: '',
  font_body_url: '',
  button_border_radius: '0.5rem',
  button_padding: '0.75rem 1.5rem',
  hero_btn_bg: '#1a1a1a',
  hero_btn_text: '#c0c0c0',
  hero_btn_hover_bg: '#333333',
  hero_btn_border: '#c0c0c0',
  hero_btn_radius: '0.5rem',
  hero_btn_font_size: '1.125rem',
  login_btn_bg: 'transparent',
  login_btn_text: '#c0c0c0',
  login_btn_border: '#c0c0c0',
  register_btn_bg: '#c0c0c0',
  register_btn_text: '#1a1a1a',
  register_btn_border: '#c0c0c0',
  created_at: '',
  updated_at: '',
};

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  id: '',
  business_name: 'Macelleria Amici',
  operational_address: 'Via Luigi Capuana 6A, Roma, 00137',
  legal_address: 'Via Nomentana 761, Roma, 00137',
  phone: '06 64505881',
  whatsapp: '3757059237',
  email: '',
  website: '',
  opening_hours: [],
  pickup_slots: [],
  extraordinary_closures: [],
  holidays: [],
  google_maps_embed_url: '',
  facebook_url: '',
  instagram_url: '',
  created_at: '',
  updated_at: '',
};

export async function getSiteSettings(supabase: SupabaseClient): Promise<SiteSettings> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) return DEFAULT_SITE_SETTINGS;
    return { ...DEFAULT_SITE_SETTINGS, ...data } as SiteSettings;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function getBusinessSettings(supabase: SupabaseClient): Promise<BusinessSettings> {
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) return DEFAULT_BUSINESS_SETTINGS;
    return { ...DEFAULT_BUSINESS_SETTINGS, ...data } as BusinessSettings;
  } catch {
    return DEFAULT_BUSINESS_SETTINGS;
  }
}

export async function updateSiteSettings(
  supabase: SupabaseClient,
  settings: Partial<SiteSettings>
): Promise<{ success: boolean; error?: string }> {
  const { data: existing } = await supabase
    .from('site_settings')
    .select('id')
    .limit(1)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('site_settings')
      .update(settings)
      .eq('id', existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase
      .from('site_settings')
      .insert(settings);
    if (error) return { success: false, error: error.message };
  }
  return { success: true };
}

export async function updateBusinessSettings(
  supabase: SupabaseClient,
  settings: Partial<BusinessSettings>
): Promise<{ success: boolean; error?: string }> {
  const { data: existing } = await supabase
    .from('business_settings')
    .select('id')
    .limit(1)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('business_settings')
      .update(settings)
      .eq('id', existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase
      .from('business_settings')
      .insert(settings);
    if (error) return { success: false, error: error.message };
  }
  return { success: true };
}
