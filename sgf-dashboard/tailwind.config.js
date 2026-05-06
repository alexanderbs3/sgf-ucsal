/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        sgf: {
          bg:      '#080C14',
          surface: '#0F1520',
          card:    '#141B27',
          border:  '#1C2840',
          accent:  '#3B82F6',
          success: '#10B981',
          warning: '#F59E0B',
          danger:  '#EF4444',
          text:    '#E8EDF5',
          subtle:  '#8B97AF',
          muted:   '#3D4F6B',
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':    'fadeIn 0.35s ease forwards',
        'slide-left': 'slideInLeft 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
        'scale-in':   'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        fadeUp:      { '0%':{ opacity:0, transform:'translateY(14px)' }, '100%':{ opacity:1, transform:'translateY(0)' } },
        fadeIn:      { '0%':{ opacity:0 }, '100%':{ opacity:1 } },
        slideInLeft: { '0%':{ opacity:0, transform:'translateX(-12px)' }, '100%':{ opacity:1, transform:'translateX(0)' } },
        scaleIn:     { '0%':{ opacity:0, transform:'scale(0.95)' }, '100%':{ opacity:1, transform:'scale(1)' } },
      },
    },
  },
  plugins: [],
}
