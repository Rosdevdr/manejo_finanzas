import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aureus.advisor',
  appName: 'AUREUS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
