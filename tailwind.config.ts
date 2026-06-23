import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A5F',
          light: '#2E75B6',
          50: '#EBF3FB',
        },
        accent: '#F0A500',
        surface: {
          base: '#0F172A',
          raised: '#1E293B',
          border: '#334155',
        },
        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          tertiary: '#64748B',
        },
        cream: '#F8F5EF',
        gold: { DEFAULT: '#C89B5A', light: '#E7C997' },
        'teal-muted': '#4F7C82',
        'slate-deep': '#0F172A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'pulse-gold': { '0%, 100%': { boxShadow: '0 0 0 0 rgba(200,155,90,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(200,155,90,0)' } },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-in-out',
        slideUp: 'slideUp 0.4s ease-in-out',
        'pulse-gold': 'pulse-gold 2s infinite',
      },
    },
  },
  plugins: [],
}

export default config