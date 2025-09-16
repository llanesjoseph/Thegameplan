/**
 * CLARITY OS DESIGN TOKENS
 * Centralized design system tokens for the Game Plan platform
 * Based on the Clarity OS minimalist design philosophy
 */

// Color Palette following 60-30-10 rule
export const colors = {
  // Light Theme (Default)
  light: {
    // Background (60%) - Off-White
    background: '#F8F9FA',
    // Surface (30%) - White
    surface: '#FFFFFF',
    // Text
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
  
  // Dark Theme
  dark: {
    // Background (60%) - Near Black
    background: '#121212',
    // Surface (30%) - Dark Gray
    surface: '#1E1E1E',
    // Text
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
  }
}

// Typography Scale (based on Inter font family)
export const typography = {
  fontFamily: {
    primary: ['Inter', 'ui-sans-serif', 'system-ui'],
  },
  fontSize: {
    h1: { size: '32px', lineHeight: '40px', weight: '700' },
    h2: { size: '24px', lineHeight: '32px', weight: '700' },
    h3: { size: '20px', lineHeight: '28px', weight: '600' },
    bodyLarge: { size: '18px', lineHeight: '28px', weight: '400' },
    body: { size: '16px', lineHeight: '24px', weight: '400' },
    caption: { size: '14px', lineHeight: '20px', weight: '400' },
    button: { size: '16px', lineHeight: 'normal', weight: '600' }
  }
}

// 8-Point Grid Spacing System
export const spacing = {
  0: '0px',
  1: '8px',   // Base unit
  2: '16px',  // 2x base
  3: '24px',  // 3x base
  4: '32px',  // 4x base
  5: '40px',  // 5x base
  6: '48px',  // 6x base
  7: '56px',  // 7x base
  8: '64px',  // 8x base
  9: '72px',  // 9x base
  10: '80px', // 10x base
  12: '96px', // 12x base
  16: '128px', // 16x base
  20: '160px', // 20x base
  24: '192px', // 24x base
  32: '256px'  // 32x base
}

// Border Radius (consistent 8px for modern feel)
export const borderRadius = {
  none: '0',
  sm: '4px',
  default: '8px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px'
}

// Shadow System
export const shadows = {
  sm: '0 2px 4px rgba(0, 0, 0, 0.06)',
  md: '0 4px 12px rgba(0, 0, 0, 0.08)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.16)',
  glass: '0 8px 32px rgba(0, 0, 0, 0.12)',
  button: '0 4px 12px rgba(0, 123, 255, 0.24)',
  buttonHover: '0 8px 24px rgba(0, 123, 255, 0.32)'
}

// Transitions
export const transitions = {
  fast: '0.15s ease-out',
  base: '0.3s ease-out',
  slow: '0.5s ease-out'
}

// Glassmorphism Effects
export const glassmorphism = {
  blur: {
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px'
  },
  light: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  dark: {
    background: 'linear-gradient(135deg, rgba(224, 224, 224, 0.15) 0%, rgba(224, 224, 224, 0.05) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  }
}

// Component Variants
export const components = {
  button: {
    primary: {
      background: colors.light.accent,
      color: '#FFFFFF',
      shadow: shadows.button,
      hoverShadow: shadows.buttonHover
    },
    secondary: {
      background: 'transparent',
      color: colors.light.accent,
      border: `1px solid ${colors.light.accent}`,
      hoverBackground: `${colors.light.accent}05`
    }
  },
  input: {
    default: {
      background: colors.light.surface,
      border: `1px solid ${colors.light.text.secondary}30`,
      focusBorder: colors.light.accent,
      placeholder: `${colors.light.text.secondary}60`
    }
  }
}

// Accessibility
export const accessibility = {
  focusRing: {
    color: `${colors.light.accent}50`,
    width: '2px',
    offset: '2px'
  },
  minTouchTarget: '44px',
  minContrast: {
    normal: '4.5:1',
    large: '3:1'
  }
}

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  glassmorphism,
  components,
  accessibility
}
