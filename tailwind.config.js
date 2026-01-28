/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#340247",
        "primary-hover": "#4a0360",
        secondary: "#f4ecff",
        muted: "#e6e3ed",
        "muted-fg": "#6b6b7e",
        accent: "#d4cfe6",
        "accent-purple": "#6e5fa7",
        "accent-light": "#a89fc9",
        "accent-hover": "#8b7db8",
        surface: "#eeebf4",
        warn: "#fff9f0",
        "warn-border": "rgba(255,201,125,0.2)",
        "warn-icon": "#d97706",
      },
      fontFamily: {
        body: ["Inter"],
        heading: ["PlayfairDisplay"],
      },
    },
  },
  plugins: [],
};
