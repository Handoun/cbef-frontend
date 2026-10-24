import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cbef.messenger',
  appName: 'CBEF',
  webDir: 'dist',
  server: {
    url: 'https://87.120.165.116.nip.io',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#1F2A3E',
      androidSplashResourceName: 'splash',
      showSpinner: true,
      spinnerColor: '#ffffff',
    },
  },
};

export default config;
