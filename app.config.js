require('dotenv').config();
const fs = require('fs');
const path = require('path');

const androidApiKey = process.env.EXPO_PUBLIC_FIREBASE_ANDROID_API_KEY || '';
const templatePath = path.join(__dirname, 'google-services.template.json');
const outputPath = path.join(__dirname, 'google-services.json');
if (fs.existsSync(templatePath)) {
  const template = fs.readFileSync(templatePath, 'utf8');
  const content = template.replace('REPLACE_WITH_ANDROID_API_KEY', androidApiKey);
  fs.writeFileSync(outputPath, content);
}

module.exports = {
  expo: {
    name: 'SadEmDia',
    slug: 'sademdia',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.sademdia.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.sademdia.app',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
      },
    },
  },
};
