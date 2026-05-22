/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0a0f1a',
          900: '#0f172a',
          800: '#111827',
          700: '#1e293b',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        accent: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.08), 0 12px 32px rgba(15, 23, 42, 0.1)',
        elevated: '0 8px 40px rgba(0, 0, 0, 0.35)',
        glow: '0 0 0 1px rgba(56, 189, 248, 0.15), 0 20px 50px rgba(0, 0, 0, 0.45)',
        'card-dark': '0 4px 24px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'hero-gradient':
          'linear-gradient(135deg, #0f172a 0%, #111827 42%, #0c3d4a 78%, #0f172a 100%)',
        'cta-gradient':
          'linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #111827 100%)',
      },
    },
  },
  plugins: [],
};
