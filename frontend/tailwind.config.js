/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        agri: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backdropBlur: {
        '2xl': '40px',
        '3xl': '64px',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease both',
        'slide-up':   'slideUp 0.35s ease both',
        'shimmer':    'shimmer 2s linear infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'float':      'float 4s ease-in-out infinite',
        'gradient':   'gradientShift 6s ease infinite',
        'pulse-dot':  'pulseDot 2s infinite',
        'border-glow':'borderGlow 3s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:     { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:    { from: { transform: 'translateY(16px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        shimmer:    { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        glowPulse:  { '0%, 100%': { boxShadow: '0 0 15px var(--glow-primary, rgba(52,211,153,0.15))' }, '50%': { boxShadow: '0 0 30px var(--glow-primary, rgba(52,211,153,0.15)), 0 0 60px var(--glow-primary, rgba(52,211,153,0.15))' } },
        float:      { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        gradientShift: { '0%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' } },
        pulseDot:   { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
        borderGlow: { '0%, 100%': { borderColor: 'rgba(52, 211, 153, 0.2)' }, '50%': { borderColor: 'rgba(52, 211, 153, 0.5)' } },
      },
    },
  },
  plugins: [],
};
