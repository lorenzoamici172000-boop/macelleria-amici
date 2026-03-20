import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary, #1a1a1a)',
        'primary-foreground': 'var(--color-primary-foreground, #c0c0c0)',
        secondary: 'var(--color-secondary, #c0c0c0)',
        'secondary-foreground': 'var(--color-secondary-foreground, #1a1a1a)',
        accent: 'var(--color-accent, #8a8a8a)',
        background: 'var(--color-background, #ffffff)',
        foreground: 'var(--color-foreground, #1a1a1a)',
        muted: 'var(--color-muted, #f5f5f5)',
        'muted-foreground': 'var(--color-muted-foreground, #737373)',
        border: 'var(--color-border, #e5e5e5)',
        ring: 'var(--color-ring, #1a1a1a)',
        destructive: '#dc2626',
        'destructive-foreground': '#ffffff',
        success: '#16a34a',
        warning: '#f59e0b',
        'navbar-bg': 'var(--color-navbar-bg, #1a1a1a)',
        'navbar-text': 'var(--color-navbar-text, #c0c0c0)',
        'footer-bg': 'var(--color-footer-bg, #1a1a1a)',
        'footer-text': 'var(--color-footer-text, #c0c0c0)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        brushscript: ['BrushScriptMT', 'cursive'],
      },
      borderRadius: {
        DEFAULT: 'var(--border-radius, 0.5rem)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
