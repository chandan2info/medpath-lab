/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT:  '#3DC9A8',
          dark:     '#2EA88D',
          deeper:   '#5367FE',
          light:    '#7080FF',
          xlight:   '#E8EBFF',
        },
        secondary: {
          DEFAULT:  '#F07057',
          dark:     '#C8503A',
          light:    '#FAD5CE',
          xlight:   '#FFF0EC',
        },
        accent: {
          DEFAULT:  '#91E1CB',
          dark:     '#3DC9A8',
          light:    '#D0F4EB',
        },
        brand: {
          text:     '#1A2040',
          muted:    '#6B7399',
          subtle:   '#9099C4',
          border:   '#DDE1F5',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      animation: {
        'fade-up':  'fadeUp 0.7s ease-out forwards',
        'fade-in':  'fadeIn 0.5s ease-out forwards',
        // FIX: 'float' was defined twice — second definition silently
        // overwrote the first. Kept only one definition here.
        'float':    'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // FIX: Single canonical float definition (was duplicated before,
        // causing the animation to silently use only the last one).
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
      },
      boxShadow: {
        soft:   '0 2px 20px rgba(205, 180, 219, 0.15)',
        card:   '0 4px 24px rgba(205, 180, 219, 0.18)',
        editor: '0 24px 64px rgba(205, 180, 219, 0.28), 0 4px 16px rgba(0,0,0,0.06)',
        btn:    '0 2px 12px rgba(138, 107, 168, 0.35)',
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Enable dark mode using the 'dark' class
}