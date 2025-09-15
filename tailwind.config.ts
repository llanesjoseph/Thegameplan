import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Clarity OS Light Theme Colors (60-30-10 rule)
        clarity: {
          // Background (60%) - Off-White
          background: '#F8F9FA',
          // Surface (30%) - White  
          surface: '#FFFFFF',
          // Primary Text
          text: {
            primary: '#212529',
            secondary: '#6C757D'
          },
          // Accent (10%) - Vibrant Blue
          accent: '#007BFF',
          // Semantic Colors
          success: '#28A745',
          error: '#DC3545',
          warning: '#FFC107'
        },
        // Clarity OS Dark Theme Colors
        'clarity-dark': {
          // Background (60%) - Near Black
          background: '#121212',
          // Surface (30%) - Dark Gray
          surface: '#1E1E1E',
          // Primary Text
          text: {
            primary: '#E0E0E0',
            secondary: '#ADB5BD'
          },
          // Accent (10%) - Light Blue
          accent: '#4DA3FF',
          // Semantic Colors
          success: '#28A745',
          error: '#DC3545',
          warning: '#FFC107'
        },
        // Glassmorphism Effects
        glass: {
          // Light Mode Glass
          'light-from': 'rgba(255, 255, 255, 0.7)',
          'light-to': 'rgba(255, 255, 255, 0.4)',
          'light-border': 'rgba(255, 255, 255, 0.2)',
          // Dark Mode Glass
          'dark-from': 'rgba(224, 224, 224, 0.15)',
          'dark-to': 'rgba(224, 224, 224, 0.05)',
          'dark-border': 'rgba(255, 255, 255, 0.1)'
        }
      },
      fontFamily: {
        // Clarity OS Typography - Single font family (Inter)
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        heading: ['Inter', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      fontSize: {
        // Clarity OS Typographic Scale
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
  plugins: [require('@tailwindcss/line-clamp')]
}
export default config
