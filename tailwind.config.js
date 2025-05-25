/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",        // Scanne tes pages Vike
    "./renderer/**/*.{js,ts,jsx,tsx}",      // Scanne tes composants de rendu
    "./components/**/*.{js,ts,jsx,tsx,mdx}",  // Scanne tes composants UI
    // Ajoute d'autres chemins si nécessaire
  ],
  darkMode: 'class', // Permet le dark mode basé sur une classe sur l'élément <html>
  theme: {
    extend: {
      colors: { // Tu peux définir tes couleurs personnalisées ici (ex: teal)
        teal: { // Palette de couleurs teal pour correspondre à l'image d'inspiration
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Une bonne base pour le teal principal
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Tu peux ajouter les couleurs sky et purple ici aussi si tu les utilises beaucoup
      },
      animation: { // Tes animations
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slower': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slowest': 'pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
         pulse: {
           '0%, 100%': { opacity: 1 },
           '50%': { opacity: .5 },
         }
      },
      // Tu peux aussi ajouter tes breakpoints customs ici, bien que les breakpoints par défaut de Tailwind soient souvent suffisants.
      // screens: {
      //   'sl': '260px',
      //   'sl2': '320px',
      //   // ...
      // },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // Utile pour styler les formulaires plus facilement
    require('@tailwindcss/typography'), // Pour les classes `prose`
    // Ton plugin custom pour animation-delay
    function ({ addUtilities, theme, e }) {
      const delays = theme('transitionDelay');
      if (delays) {
        const newUtilities = Object.entries(delays).map(([key, value]) => ({
          [`.${e(`animation-delay-${key}`)}`]: { 'animation-delay': value },
        }));
        addUtilities(newUtilities);
      }
    }
  ],
}