import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.cf7247916ff840af97d9fae13a915e36',
  appName: 'Cooc Global',
  webDir: 'dist',
  server: {
    url: 'https://cf724791-6ff8-40af-97d9-fae13a915e36.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false
    }
  }
};

export default config;