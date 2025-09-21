import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Stanford Cardinal Design System
        cardinal: '#8C1515',
        'cardinal-dark': '#7A1212',
        'text-dark': '#1F2937',
        'text-medium': '#4B5563',
        'background-light': '#F9FAFB',

        // Legacy colors for backward compatibility
        clarity: {
          background: '#F8F9FA',
          surface: '#FFFFFF',
          text: {
            primary: '#333333',
            secondary: '#555555'
          },
          accent: '#8C1515', // Updated to Stanford Cardinal
          success: '#28A745',
          error: '#DC3545',
          warning: '#FFC107'
        },
        'clarity-dark': {
          background: '#121212',
          surface: '#1E1E1E',
          text: {
            primary: '#E0E0E0',
            secondary: '#ADB5BD'
          },
          accent: '#8C1515',
          success: '#28A745',
          error: '#DC3545',
          warning: '#FFC107'
        }
      },
      fontFamily: {
        // Stanford theme uses Source Sans 3
        sans: ['"Source Sans 3"', 'ui-sans-serif', 'system-ui'],
        heading: ['"Source Sans 3"', 'ui-sans-serif', 'system-ui'],
        body: ['"Source Sans 3"', 'ui-sans-serif', 'system-ui']
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
