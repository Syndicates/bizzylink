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
        primary: "#6B46C1", // Custom purple shade
        dark: "#1A202C", // Dark mode background
      },
    },
  },
  plugins: [],
};
