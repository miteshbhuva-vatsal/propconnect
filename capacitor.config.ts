import type { CapacitorConfig } from '@capacitor/cli'

const isDev = process.env.NODE_ENV !== 'production'

const config: CapacitorConfig = {
  appId: 'com.propconnect.app',
  appName: 'PropConnect',
  webDir: 'out', // used for production static builds

  // Development: load from local Next.js dev server (live reload)
  // Production: remove server block and point to deployed URL
  server: isDev
    ? {
        url: 'http://172.20.10.4:3000', // local network IP — update if it changes
        cleartext: true,
        androidScheme: 'http',
      }
    : {
        androidScheme: 'https',
      },

  android: {
    allowMixedContent: true,
  },

  ios: {
    contentInset: 'always',
    scrollEnabled: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#075E54',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#075E54',
    },
  },
}

export default config
