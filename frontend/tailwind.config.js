/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1B3A5C',
        secondary: '#2563EB',
        accent: '#F59E0B',
        success: '#10B981',
        danger: '#EF4444',
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          500: '#1B3A5C',
          600: '#152a47',
          700: '#1B3A5C',
          900: '#0a1628',
        },
        emerald: {
          500: '#10B981',
          600: '#059669',
        },
      },
      fontFamily: {
        heading: ['Fraunces', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        'card': '8px',
        'button': '6px',
        'input': '4px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
