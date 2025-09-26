/**
 * PLAYBOOKD UNIFIED DESIGN SYSTEM
 * Single source of truth for all colors, typography, and design tokens
 */

// PLAYBOOKD Official Color Palette
export const playbookdColors = {
  // Primary Brand Colors
  cream: '#E8E6D8',
  skyBlue: '#91A6EB',
  orange: '#892F1A',
  green: '#BDAF62',
  dark: '#624A41',

  // Extended Palette
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

  neutral: {
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

  // Semantic Colors
  surface: '#FFFFFF',
  background: '#E8E6D8', // Cream
  text: {
    primary: '#624A41', // Dark
    secondary: '#333333',
    muted: '#666666',
    inverse: '#FFFFFF'
  },
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF'
  },
  success: '#16A34A',
  warning: '#EAB308',
  error: '#DC2626',
  info: '#0EA5E9'
}

// PLAYBOOKD Typography System
export const playbookdTypography = {
  fontFamily: {
    brand: ['Sports World', 'Impact', 'Arial Black', 'sans-serif'], // PLAYBOOKD brand font
    heading: ['Oswald', 'Impact', 'Arial Black', 'sans-serif'],     // Sports-style headings
    body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],    // Body text
    display: ['Sports World', 'Oswald', 'Impact', 'Arial Black', 'sans-serif'] // Large displays
  },

  fontSize: {
    // Brand Typography
    brand: {
      hero: ['4.5rem', { lineHeight: '1', fontWeight: '400', letterSpacing: '0.02em' }], // 72px
      large: ['3rem', { lineHeight: '1.1', fontWeight: '400', letterSpacing: '0.02em' }], // 48px
      medium: ['2.25rem', { lineHeight: '1.1', fontWeight: '400', letterSpacing: '0.02em' }], // 36px
      small: ['1.875rem', { lineHeight: '1.2', fontWeight: '400', letterSpacing: '0.02em' }] // 30px
    },

    // Content Typography
    heading: {
      h1: ['2.25rem', { lineHeight: '2.5rem', fontWeight: '400' }], // 36px
      h2: ['1.875rem', { lineHeight: '2.25rem', fontWeight: '400' }], // 30px
      h3: ['1.5rem', { lineHeight: '2rem', fontWeight: '400' }], // 24px
      h4: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '400' }], // 20px
      h5: ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }], // 18px
      h6: ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }] // 16px
    },

    body: {
      large: ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }], // 18px
      base: ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }], // 16px
      small: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }], // 14px
      tiny: ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }] // 12px
    },

    button: {
      large: ['1.125rem', { lineHeight: 'normal', fontWeight: '400' }], // 18px
      base: ['1rem', { lineHeight: 'normal', fontWeight: '400' }], // 16px
      small: ['0.875rem', { lineHeight: 'normal', fontWeight: '400' }] // 14px
    }
  }
}

// Component Styles
export const playbookdComponents = {
  button: {
    primary: {
      background: `linear-gradient(135deg, ${playbookdColors.skyBlue} 0%, ${playbookdColors.orange} 100%)`,
      color: playbookdColors.text.inverse,
      hover: {
        background: `linear-gradient(135deg, ${playbookdColors.primary[500]} 0%, ${playbookdColors.secondary[700]} 100%)`,
        transform: 'translateY(-1px)',
        boxShadow: `0 8px 24px ${playbookdColors.skyBlue}32`
      }
    },
    secondary: {
      background: 'transparent',
      color: playbookdColors.skyBlue,
      border: `1px solid ${playbookdColors.skyBlue}`,
      hover: {
        background: `${playbookdColors.skyBlue}0A`,
        borderColor: playbookdColors.primary[600]
      }
    },
    ghost: {
      background: 'transparent',
      color: playbookdColors.text.primary,
      hover: {
        background: `${playbookdColors.neutral[100]}`
      }
    }
  },

  card: {
    default: {
      background: playbookdColors.surface,
      border: `1px solid ${playbookdColors.border.light}`,
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
    }
  },

  input: {
    default: {
      background: playbookdColors.surface,
      border: `1px solid ${playbookdColors.border.medium}`,
      borderRadius: '8px',
      color: playbookdColors.text.primary,
      focus: {
        borderColor: playbookdColors.skyBlue,
        boxShadow: `0 0 0 3px ${playbookdColors.skyBlue}20`
      }
    }
  }
}

// Spacing System (8px base)
export const playbookdSpacing = {
  0: '0px',
  1: '8px',   // 8px
  2: '16px',  // 16px
  3: '24px',  // 24px
  4: '32px',  // 32px
  5: '40px',  // 40px
  6: '48px',  // 48px
  8: '64px',  // 64px
  10: '80px', // 80px
  12: '96px', // 96px
  16: '128px' // 128px
}

// Breakpoints
export const playbookdBreakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}

// CSS Custom Properties Generator
export const generateCSSVariables = () => {
  const cssVars: Record<string, string> = {}

  // Colors
  Object.entries(playbookdColors).forEach(([key, value]) => {
    if (typeof value === 'string') {
      cssVars[`--playbookd-${key}`] = value
    } else if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        if (typeof subValue === 'string') {
          cssVars[`--playbookd-${key}-${subKey}`] = subValue
        } else if (typeof subValue === 'object') {
          Object.entries(subValue).forEach(([nestedKey, nestedValue]) => {
            cssVars[`--playbookd-${key}-${subKey}-${nestedKey}`] = nestedValue as string
          })
        }
      })
    }
  })

  // Spacing
  Object.entries(playbookdSpacing).forEach(([key, value]) => {
    cssVars[`--playbookd-spacing-${key}`] = value
  })

  return cssVars
}

// Utility Functions
export const getPlaybookdColor = (path: string): string => {
  const keys = path.split('.')
  let current: any = playbookdColors

  for (const key of keys) {
    current = current?.[key]
    if (current === undefined) return '#000000'
  }

  return typeof current === 'string' ? current : '#000000'
}

export const getPlaybookdFont = (type: 'brand' | 'heading' | 'body' | 'display'): string => {
  return playbookdTypography.fontFamily[type].join(', ')
}

// Export everything as default
export default {
  colors: playbookdColors,
  typography: playbookdTypography,
  components: playbookdComponents,
  spacing: playbookdSpacing,
  breakpoints: playbookdBreakpoints,
  generateCSSVariables,
  getPlaybookdColor,
  getPlaybookdFont
}