'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Menu, X, User, LogOut, Package, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { useCart } from '@/hooks/useCart';
import type { NavigationLink } from '@/types';

interface NavbarProps {
  links: NavigationLink[];
}

export function Navbar({ links }: NavbarProps) {
  const { user, profile, isLoading, signOut } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const { settings } = useTheme();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const displayName = profile?.username || t('nav.fallbackUser');
  const logoUrl = settings.logo_url;

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-border/20 shadow-sm"
      style={{ backgroundColor: settings.color_navbar_bg }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={t('nav.home')}
                width={40}
                height={40}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <span
                className="text-5xl font-display"
                style={{ color: settings.color_navbar_text, fontFamily: 'var(--font-display)' }}
              >
                Macelleria Amici
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="text-xl font-display transition-opacity hover:opacity-80"
                style={{ color: settings.color_navbar_text, fontFamily: 'var(--font-display)' }}
              >
                {locale === 'en' && link.label_en ? link.label_en : link.label_it}
              </Link>
            ))}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Language Switch */}
            <button
              onClick={() => setLocale(locale === 'it' ? 'en' : 'it')}
              className="flex items-center gap-1 text-xs transition-opacity hover:opacity-80"
              title={locale === 'it' ? 'English' : 'Italiano'}
            >
              <span className="text-lg">{locale === 'it' ? '🇮🇹' : '🇬🇧'}</span>
            </button>

            {/* Wishlist icon */}
            <Link
              href="/preferiti"
              className="p-2 transition-opacity hover:opacity-80"
              title={t('nav.wishlist')}
              style={{ color: settings.color_navbar_text }}
            >
              <Heart size={28} />
            </Link>

            {/* Cart icon */}
            <Link
              href="/carrello"
              className="p-2 transition-opacity hover:opacity-80 relative"
              title={t('nav.cart')}
              style={{ color: settings.color_navbar_text }}
            >
              <ShoppingCart size={28} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* Auth state */}
            {isLoading ? (
              <div className="w-20 h-8 animate-pulse rounded" style={{ backgroundColor: settings.color_navbar_text + '20' }} />
            ) : user && profile ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1 text-sm font-display transition-opacity hover:opacity-80"
                  style={{ color: settings.color_navbar_text }}
                >
                  {t('nav.greeting')}, {displayName}
                  <ChevronDown size={14} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-50 animate-scale-in">
                      <div className="py-1">
                        <Link
                          href="/account"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User size={16} /> {t('nav.account')}
                        </Link>
                        <Link
                          href="/i-miei-ordini"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Package size={16} /> {t('nav.orders')}
                        </Link>
                        <Link
                          href="/preferiti"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Heart size={16} /> {t('nav.wishlist')}
                        </Link>
                        <button
                          onClick={async () => {
                            setUserMenuOpen(false);
                            await signOut();
                            window.location.href = '/';
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LogOut size={16} /> {t('nav.logout')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded text-sm font-medium border transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: settings.login_btn_bg,
                    color: settings.login_btn_text,
                    borderColor: settings.login_btn_border,
                  }}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/registrazione"
                  className="px-4 py-2 rounded text-sm font-medium border transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: settings.register_btn_bg,
                    color: settings.register_btn_text,
                    borderColor: settings.register_btn_border,
                  }}
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ color: settings.color_navbar_text }}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t animate-slide-down"
          style={{ backgroundColor: settings.color_navbar_bg, borderColor: settings.color_navbar_text + '20' }}
        >
          <div className="px-4 py-4 space-y-3">
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="block text-sm font-display"
                style={{ color: settings.color_navbar_text }}
                onClick={() => setMobileOpen(false)}
              >
                {locale === 'en' && link.label_en ? link.label_en : link.label_it}
              </Link>
            ))}
            {!user && (
              <div className="flex gap-2 pt-2 border-t" style={{ borderColor: settings.color_navbar_text + '20' }}>
                <Link
                  href="/login"
                  className="flex-1 text-center px-3 py-2 rounded text-sm border"
                  style={{ color: settings.login_btn_text, borderColor: settings.login_btn_border }}
                  onClick={() => setMobileOpen(false)}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/registrazione"
                  className="flex-1 text-center px-3 py-2 rounded text-sm"
                  style={{ backgroundColor: settings.register_btn_bg, color: settings.register_btn_text }}
                  onClick={() => setMobileOpen(false)}
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
