/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
        },
        brand: {
          blue: '#2563EB', // Muted clean academic blue
          'blue-hover': '#1D4ED8',
          'blue-subtle': '#EFF6FF',
        },
        sage: {
          DEFAULT: '#64748B',
          light: '#F1F5F9',
          dark: '#334155',
        },
        surface: {
          page: '#FFFFFF', // Plain white page background
          subtle: '#F9FAFB',
          card: '#FFFFFF', // Clean white card background
          neutral: '#F3F4F6',
          border: '#E5E7EB', // Standard light-gray border
        },
        content: {
          primary: '#111827', // Standard readable dark text
          secondary: '#4B5563', // Readable secondary text
          muted: '#9CA3AF',
        },
        status: {
          warning: '#D97706',
          critical: '#DC2626',
          success: '#16A34A',
          info: '#2563EB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card-hover': '0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'subtle': 'none',
      },
      borderRadius: {
        'card': '8px',
      }
    },
  },
  plugins: [],
}
