import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.messenger',
  appName: 'My Messenger',
  webDir: 'dist',
  server: {
    url: 'https://my-messenger-sand.vercel.app',
    cleartext: false
  }
};

export default config;