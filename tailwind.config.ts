import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', lg: '2.5rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        // Semantic tokens — all resolve to CSS variables in globals.css
        canvas: 'hsl(var(--canvas) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        raised: 'hsl(var(--raised) / <alpha-value>)',
        line: 'hsl(var(--line) / <alpha-value>)',
        ink: 'hsl(var(--ink) / <alpha-value>)',
        muted: 'hsl(var(--muted-ink) / <alpha-value>)',
        faint: 'hsl(var(--faint-ink) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        'accent-soft': 'hsl(var(--accent-soft) / <alpha-value>)',
        'accent-ink': 'hsl(var(--accent-ink) / <alpha-value>)',
        warn: 'hsl(var(--warn) / <alpha-value>)',
        critical: 'hsl(var(--critical) / <alpha-value>)',
        info: 'hsl(var(--info) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
      },
      borderRadius: {
        xs: '3px',
        sm: '5px',
        DEFAULT: '7px',
        md: '9px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        edge: '0 1px 0 0 hsl(var(--line) / 0.9)',
        lift: '0 18px 40px -24px hsl(160 40% 3% / 0.9), 0 1px 0 0 hsl(var(--line) / 0.7)',
        focus: '0 0 0 1px hsl(var(--accent) / 0.9), 0 0 0 4px hsl(var(--accent) / 0.16)',
      },
      backgroundImage: {
        grid: 'linear-gradient(hsl(var(--line) / 0.55) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--line) / 0.55) 1px, transparent 1px)',
        'radial-accent':
          'radial-gradient(60% 60% at 50% 0%, hsl(var(--accent) / 0.14) 0%, transparent 70%)',
      },
      backgroundSize: { grid: '64px 64px' },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { opacity: '0.7', transform: 'scale(0.9)' },
          '70%': { opacity: '0', transform: 'scale(1.35)' },
          '100%': { opacity: '0', transform: 'scale(1.35)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.8s infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite',
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
