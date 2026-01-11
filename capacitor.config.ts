
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pixshop.app',
  appName: 'Pixshop',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
