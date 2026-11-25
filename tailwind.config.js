/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAFC',
        surface: '#FFFFFF',
        ink: '#0F172A',
        muted: '#64748B',
        line: '#E2E8F0',
        brand: {
          DEFAULT: '#B45309',
          dark: '#78350F',
          light: '#F59E0B',
          soft: '#FEF3C7',
        },
        success: '#15803D',
        'success-soft': '#DCFCE7',
        warning: '#B45309',
        'warning-soft': '#FEF3C7',
        danger: '#B91C1C',
        'danger-soft': '#FEE2E2',
        info: '#1D4ED8',
        'info-soft': '#DBEAFE',
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
};
