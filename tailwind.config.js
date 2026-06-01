module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        medical: {
          primary: "#454c92", // Violeta (branding, CTAs)
          primaryDark: "#4b6a87", // Hover / activo
          secondary: "#e8f9f8", // Fondo suave celeste agua (hovers/filas/badges)
          surface: "#F9FAFB", // Fondo general limpio
          card: "#FFFFFF", // Tarjetas y contenedores
          border: "#cbeeed", // Bordes sutiles celeste agua
          text: "#0F172A", // Titulos y texto principal (casi negro)
          mutedText: "#64748B", // Texto secundario
          accent: "#73d4cd", // Celeste 1 (acento suave)
          accentDark: "#97c1bf", // Celeste 2 (hover acento)
          success: "#16A34A", // Estados positivos
          warning: "#F59E0B", // Alertas medias
          danger: "#DC2626", // Alertas criticas
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
