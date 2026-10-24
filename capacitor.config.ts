import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cbef.messenger',
  appName: 'CBEF',
  webDir: 'dist',
  server: {
    url: 'https://cbef.vercel.app',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, // показывать минимум 3 секунды
      launchAutoHide: true,     // автоматически скрыть после загрузки
      backgroundColor: '#1F2A3E', // тёмно-синий фон (как на экране входа)
      androidSplashResourceName: 'splash',
      showSpinner: true,
      spinnerColor: '#ffffff',
    },
  },
};

export default config;