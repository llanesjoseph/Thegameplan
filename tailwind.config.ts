import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // NEW Game Plan Color System
        'cream': '#E8E6D8',
        'sky-blue': '#91A6EB',
        'orange': '#892F1A',
        'green': '#BDAF62',
        'dark': '#624A41',

        // Legacy colors (keeping plum)
        'deep-plum': '#5A2C59',
        'cardinal-red': '#8C1515',
        'vibrant-teal': '#20B2AA',
        'moss-green': '#8D9440',
        'warm-cream': '#FFFDD0',
        'charcoal': '#333333',
        'light-gray': '#F5F5F5',

        // Primary theme colors (Sky Blue based)
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d8ff',
          300: '#a5c0ff',
          400: '#91A6EB', // Sky Blue
          500: '#7b93e3',
          600: '#6882db',
          700: '#5570c7',
          800: '#475fa0',
          900: '#3d507f',
        },
        secondary: {
          50: '#fdf6f3',
          100: '#fbeae4',
          200: '#f6d0c4',
          300: '#efac95',
          400: '#e67e5e',
          500: '#df5a37',
          600: '#892F1A', // Orange
          700: '#7a2717',
          800: '#662115',
          900: '#541e15',
        },
        accent: {
          50: '#fcfdf9',
          100: '#f7f9f0',
          200: '#eef2de',
          300: '#e0e7c4',
          400: '#ced8a4',
          500: '#BDAF62', // Green
          600: '#a99954',
          700: '#8f7e45',
          800: '#76683b',
          900: '#635633',
        },
        tertiary: {
          50: '#f6f3f1',
          100: '#ebe5e0',
          200: '#d6c9be',
          300: '#bfa595',
          400: '#a48169',
          500: '#8d6b50',
          600: '#624A41', // Dark
          700: '#533d35',
          800: '#46342e',
          900: '#3d2e28',
        },

        // Updated clarity system with new Game Plan colors + Plum accents
        clarity: {
          background: '#E8E6D8', // Cream
          surface: '#FFFFFF',
          text: {
            primary: '#624A41', // Dark
            secondary: '#5A2C59' // Deep Plum (keeping)
          },
          accent: '#91A6EB', // Sky Blue as primary accent
          secondary: '#892F1A', // Orange as secondary
          success: '#BDAF62', // Green
          error: '#DC3545',
          warning: '#892F1A', // Orange
          plum: '#5A2C59' // Keep plum as special accent
        },

        // Legacy compatibility with Deep Plum emphasis
        cardinal: '#8C1515',
        'cardinal-dark': '#7A1212',
        'deep-plum-light': '#8a668d',
        'deep-plum-dark': '#4a2349',
        'text-dark': '#333333',
        'text-medium': '#5A2C59',
        'background-light': '#FFFFFF',
      },
      fontFamily: {
        // Game Plan typography system
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        heading: ['Poppins', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'ui-sans-serif', 'system-ui'],
        poppins: ['Poppins', 'ui-sans-serif', 'system-ui']
      },
      fontSize: {
        // Stanford Cardinal Design System Typography
        'main-headline': ['3.75rem', { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.02em' }], // text-5xl
        'main-headline-lg': ['4.5rem', { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.02em' }], // md:text-6xl
        'section-headline': ['2.25rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }], // text-4xl
        'section-headline-lg': ['3rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }], // md:text-5xl
        'card-title': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '700' }], // text-xl font-bold
        'paragraph': ['1.125rem', { lineHeight: '1.625', fontWeight: '400' }], // leading-relaxed
        'accent-text': ['1rem', { lineHeight: '1.5rem', fontWeight: '600', letterSpacing: '0.1em' }], // text-base font-semibold tracking-wider uppercase

        // Legacy sizes for backward compatibility
        'h1': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'h2': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'h3': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'caption': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'button': ['16px', { lineHeight: 'normal', fontWeight: '600' }]
      },
      // Default Tailwind spacing already maps to 4px units; use docs guidance
      borderRadius: {
        DEFAULT: '8px',
        md: '8px',
        lg: '8px',
      },
      animation: {
        // Clarity OS Micro-interactions
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'button-press': 'buttonPress 0.1s ease-out',
        'glass-shimmer': 'glassShimmer 2s ease-in-out infinite',
        // Legacy animations for compatibility
        'float': 'float 20s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
      },
      keyframes: {
        // Clarity OS Keyframes
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        buttonPress: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' }
        },
        glassShimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        // Legacy keyframes for compatibility
        float: {
          '0%, 100%': { transform: 'translateY(0px)', opacity: '0.6' },
          '50%': { transform: 'translateY(-8px)', opacity: '0.8' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(0, 123, 255, 0.3)',
            transform: 'scale(1)'
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(0, 123, 255, 0.6)',
            transform: 'scale(1.02)'
          }
        }
      },
      backdropBlur: {
        // Clarity OS Glassmorphism Blur Values
        'none': '0',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px'
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0,0,0,0.05)',
        'card-md': '0 4px 6px rgba(0,0,0,0.08)'
      }
    }
  },
  plugins: []
}
export default config
