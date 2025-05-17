/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file tailwind.config.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        minecraft: {
          green: {
            light: '#65CC65',
            DEFAULT: '#54AA54',
            dark: '#4A994A',
          },
          // Deep navy color for dark backgrounds
          navy: {
            light: '#1E293B',
            DEFAULT: '#0F172A',
            dark: '#0B1222',
          },
          // Stone/gray colors for panels
          stone: {
            light: '#E0E0E0',
            DEFAULT: '#C0C0C0',
            dark: '#A0A0A0',
          },
          // Wood colors for accents
          wood: {
            light: '#D2B48C',
            DEFAULT: '#AF8E68',
            dark: '#8B6F4E',
          },
          // Habbo-inspired colors
          habbo: {
            blue: '#17A2B8',
            red: '#FF639A',
            yellow: '#FFD700',
            purple: '#9B59B6',
            orange: '#FF9800'
          },
          // Gold colors for auction items
          gold: {
            light: '#FFD700',
            DEFAULT: '#D4AF37',
            dark: '#996515',
          }
        }
      },
      fontFamily: {
        'minecraft': ['"Press Start 2P"', 'monospace'],
        'sans': ['Poppins', 'ui-sans-serif', 'system-ui'],
        'habbo': ['VT323', 'Arial Narrow', 'monospace'],
      },
      boxShadow: {
        'minecraft': '3px 3px 0px rgba(0, 0, 0, 0.5)',
        'habbo': '0 4px 0 rgba(0, 0, 0, 0.2)',
        'habbo-intense': '0 6px 0 rgba(0, 0, 0, 0.3)',
        'card': '0 4px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 16px rgba(0, 0, 0, 0.15), 0 2px 5px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'minecraft-grid': "url('/src/assets/images/minecraft-grid.svg')",
        'minecraft-dirt': "url('/src/assets/images/minecraft/dirt-texture.svg')",
        'minecraft-stone': "url('/src/assets/images/minecraft/stone-texture.svg')",
        'minecraft-grass': "url('/src/assets/images/minecraft/grass-texture.svg')",
        'minecraft-wood': "url('/src/assets/images/minecraft/wood-texture.svg')",
        'minecraft-hero-waves': "url('/src/assets/images/minecraft-hero.svg')",
        'habbo-pattern': "url('/src/assets/images/habbo-pattern.svg')",
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'bounce-slight': 'bounce-slight 2s ease-in-out infinite',
        'wiggle': 'wiggle 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'bounce-slight': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255, 215, 0, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)' },
        }
      },
      borderRadius: {
        'habbo': '5px',
      }
    },
  },
  plugins: [],
}

