/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'pitch-black': '#0D0D0D',
        'pavilion-dark': '#1A1F2E',
        'crease-line': '#252D40',
        'lime-shot': '#A3E635',
        'sky-six': '#38BDF8',
        'wicket-red': '#F87171',
        'gold-bail': '#FBBF24',
        'off-white': '#F1F5F9',
        'muted-text': '#64748B',
      },
      fontFamily: {
        barlow: ['Barlow Condensed', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'score-xl': ['72px', { lineHeight: '1', fontWeight: '900' }],
        'score-lg': ['36px', { lineHeight: '1.1', fontWeight: '700' }],
      },
      animation: {
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'flip': 'flip 1.5s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(1080deg)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(163, 230, 53, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(163, 230, 53, 0.6)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'neon-lime': '0 0 15px rgba(163, 230, 53, 0.4)',
        'neon-red': '0 0 15px rgba(248, 113, 113, 0.4)',
        'neon-gold': '0 0 15px rgba(251, 191, 36, 0.4)',
        'neon-blue': '0 0 15px rgba(56, 189, 248, 0.4)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
