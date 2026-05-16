/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#F42C37",
        secondary: "#2DCC6F",
        brandYellow: "#FDC62E",
        brandGreen: "#2DCC6F",
        brandBlue: "#1376F4",
        brandWhite: "#EEEEEE"
      },
      container: {
        center: true,
        padding: { DEFAULT: "1rem", sm: "2rem", lg: "4rem" }
      }
    },
  },
  plugins: [],
}