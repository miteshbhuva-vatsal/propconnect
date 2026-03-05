/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // WhatsApp-inspired palette
        wp: {
          green:        '#25D366', // WhatsApp brand green
          'green-dark': '#128C7E', // Darker green
          'green-light':'#DCF8C6', // Received message bubble
          teal:         '#075E54', // Header/sidebar
          'teal-light': '#128C7E',
          chat:         '#ECE5DD', // Chat background
          sent:         '#D9FDD3', // Sent message bubble
          icon:         '#8696A0', // Secondary icons
          border:       '#E9EDEF', // Dividers
          text:         '#111B21', // Primary text
          'text-secondary': '#667781',
          unread:       '#25D366', // Unread badge
        },
        // Primary brand
        primary: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#25D366',
          600: '#16A34A',
          700: '#128C7E',
          800: '#075E54',
          900: '#14532D',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      backgroundImage: {
        'chat-pattern': "url('/images/chat-bg.png')",
        'hero-gradient': 'linear-gradient(135deg, #075E54 0%, #128C7E 50%, #25D366 100%)',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-green': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(37, 211, 102, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(37, 211, 102, 0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'pulse-green': 'pulse-green 2s infinite',
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}
