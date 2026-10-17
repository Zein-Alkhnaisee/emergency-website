/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", // ✅ إضافة
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
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
  // ✅ إضافة safelist لمنع حذف classes مهمة
  safelist: [
    'bg-primary',
    'text-primary',
    'border-primary',
    'ring-primary',
    'shadow-primary',
    'hover:bg-primary',
    'hover:text-primary',
    'dark:bg-gray-800',
    'dark:text-white',
    'dark:border-gray-700',
    'animate-fade-up',
    'animate-slide-in',
    'skeleton',
    'glass',
  ],
  plugins: [],
};