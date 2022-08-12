const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  mode: "jit",
  darkMode: "media",
  purge: [
    "./public/**/*.{html,svg}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", ...defaultTheme.fontFamily.sans],
        serif: ["Quicksand", ...defaultTheme.fontFamily.serif],
      },
      colors: {
        theme: {
          darker: "#1C1B29",
          dark: "#222433",
          normal: "#2F3042",
          light: "#4F4D61",
          blue: "#5C7DEE",
          orange: "#EEC55C",
          white: "#F8F8F8",
          tooltip: "rgba(0, 0, 0, 0.2)",
        },
      },
      spacing: {
        7: "1.75rem",
        9: "2.25rem",
        28: "7rem",
        80: "20rem",
        96: "24rem",
      },
      height: {
        wide: "280rem",
        22: "22.5rem",
      },
      width: {
        wide: "280rem",
      },
      margin: {
        wide: "30rem",
      },
      boxShadow: {
        outline: "0 0 0 3px rgba(101, 31, 255, 0.4)",
        card:
          "0px 6.5px 15px 0px rgba(102, 111, 228, 0.14), 0px 1px 5.4px 0px rgba(0, 0, 0, 0.07)",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
