import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Stanford Cardinal Design System
        primary: '#8C1515', // Stanford Cardinal Red
        'text-dark': '#333333', // Primary text color
        'text-medium': '#555555', // Secondary text color
        'background-light': '#f8f9fa', // Light gray backgrounds

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
        // Clarity OS Typography - Single font family (Inter)
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        heading: ['Inter', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      fontSize: {
        // Stanford Cardinal Design System Typography
        'main-headline': ['5rem', { lineHeight: '1', fontWeight: '800', letterSpacing: '-0.025em' }], // text-5xl font-extrabold tracking-tighter
        'main-headline-lg': ['7rem', { lineHeight: '1', fontWeight: '800', letterSpacing: '-0.025em' }], // md:text-7xl
        'section-headline': ['3rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.025em' }], // text-3xl font-bold tracking-tight
        'section-headline-lg': ['4rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.025em' }], // md:text-4xl
        'card-title': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '700' }], // text-xl font-bold
        'paragraph': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }], // text-lg
        'accent-text': ['1rem', { lineHeight: '1.5rem', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase' }], // text-base font-semibold tracking-wider uppercase

        // Legacy sizes for backward compatibility
        'h1': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'h2': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'h3': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'caption': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'button': ['16px', { lineHeight: 'normal', fontWeight: '600' }]
      },
      spacing: {
        // Clarity OS 8-Point Grid System
        '0': '0px',
        '1': '8px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '5': '40px',
        '6': '48px',
        '7': '56px',
        '8': '64px',
        '9': '72px',
        '10': '80px',
        '12': '96px',
        '16': '128px',
        '20': '160px',
        '24': '192px',
        '32': '256px'
      },
      borderRadius: {
        // Clarity OS Corner Radius (consistent 8px for modern feel)
        'none': '0',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        'full': '9999px'
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
        // Clarity OS Shadow System
        'clarity-sm': '0 2px 4px rgba(0, 0, 0, 0.06)',
        'clarity-md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'clarity-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'clarity-xl': '0 16px 48px rgba(0, 0, 0, 0.16)',
        'clarity-glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'clarity-button': '0 4px 12px rgba(0, 123, 255, 0.24)',
        'clarity-button-hover': '0 8px 24px rgba(0, 123, 255, 0.32)'
      }
    }
  },
  plugins: []
}
export default config
