/** @type {import('tailwindcss').Config} */
// tailwind.config.js
module.exports = {
  content: [
    "./public/**/*.{html,js}",  // Ensure Tailwind scans these files
    "./src/**/*.{html,js}",     // If you have a /src folder
  ],
  theme: {
    extend: {
      colors: {
        // Minecraft themed colors
        mcgreen: {
          DEFAULT: "#54AA54", // Minecraft green
          light: "#65CC65",
          dark: "#4A994A",
        },
        mcpurple: {
          DEFAULT: "#9C44DC", // Minecraft purple
          light: "#B355F7",
          dark: "#8038BA",
        },
        mcdirt: "#8B4513", // Dirt block
        mcstone: "#7F7F7F", // Stone block
        mcwater: "#3D99F5", // Water block
        mclava: "#DF4E26", // Lava block
        mcbedrock: "#252525", // Bedrock
        mcgold: "#FDDF6E", // Gold
        mcwood: "#795548", // Wood planks
        
        // Habbo-inspired colors
        habbo: {
          blue: "#49AFD7",
          red: "#FF5722",
          yellow: "#FFC107",
          green: "#66BB6A",
        },
        
        // Dark mode background
        dark: {
          DEFAULT: "#1A1C23",
          lighter: "#2D3748",
          lightest: "#4A5568",
        },
      },
      fontFamily: {
        minecraft: ["MinecraftTen", "Minecraft", "monospace"],
      },
      boxShadow: {
        'mc': '3px 3px 0px #323232',
        'mc-hover': '3px 5px 0px #323232',
        'mc-press': '1px 1px 0px #323232',
        'habbo': '0 8px 24px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pixel-pulse': 'pixelate 3s infinite ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'grass-pattern': "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAJElEQVQYlWNgIBn8ZyAFMJGkgIkUBUwMJALi/UeSgv+kKAAAObYHB7WUx9IAAAAASUVORK5CYII=')",
        'dirt-pattern': "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAH0lEQVQYlWNgQAX/GYgATCQrYCJVwX9SFJCkgGgFAESEBCE4iAJnAAAAAElFTkSuQmCC')",
      },
      borderWidth: {
        '3': '3px',
        '6': '6px',
      },
    },
  },
  plugins: [],
};
