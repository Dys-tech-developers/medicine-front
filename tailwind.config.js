module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          primary: '#1e40af', // Azul médico confianza
          secondary: '#3b82f6',
          success: '#10b981', // Verde salud
          danger: '#ef4444',
          light: '#f8fafc',
          dark: '#1e293b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
