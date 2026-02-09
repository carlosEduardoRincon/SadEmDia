import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { Platform } from 'react-native';

let getReactNativePersistence: ((storage: any) => any) | null = null;
let ReactNativeAsyncStorage: any = null;

if (Platform.OS !== 'web') {
  ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
  const firebaseAuth = require('firebase/auth');
  getReactNativePersistence = firebaseAuth.getReactNativePersistence as (
    storage: typeof ReactNativeAsyncStorage
  ) => any;
}

const firebaseConfig = {
  apiKey: "AIzaSyCms8QscZom-sc92ZixW8ZICFeJAMpnwIE",
  authDomain: "sademdia-141d9.firebaseapp.com",
  projectId: "sademdia-141d9",
  storageBucket: "sademdia-141d9.firebasestorage.app",
  messagingSenderId: "616355565918",
  appId: "1:616355565918:web:535f42e330b8f3916bffcf",
  measurementId: "G-TKV4TD9PDM"
}

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let authInitPromise: Promise<Auth> | null = null;

function initializeAppInstance(): FirebaseApp {
  if (appInstance) {
    return appInstance;
  }

  if (getApps().length === 0) {
    appInstance = initializeApp(firebaseConfig);
    console.log('✅ Firebase App inicializado');
  } else {
    appInstance = getApps()[0];
    console.log('✅ Firebase App já existe, reutilizando');
  }

  return appInstance;
}

function initializeFirestore(): Firestore {
  if (dbInstance) {
    return dbInstance;
  }

  const app = initializeAppInstance();
  dbInstance = getFirestore(app);
  console.log('✅ Firestore inicializado');
  return dbInstance;
}

async function initializeAuthInstanceAsync(): Promise<Auth> {
  if (authInstance) {
    return authInstance;
  }

  if (authInitPromise) {
    return authInitPromise;
  }

  const app = initializeAppInstance();
  
  authInitPromise = (async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (Platform.OS === 'web') {
      try {
        authInstance = initializeAuth(app);
        console.log('✅ Firebase Auth inicializado (Web - persistência automática)');
        return authInstance;
      } catch (error: any) {
        if (error?.code === 'auth/already-initialized' || error?.message?.includes('already-initialized')) {
          try {
            authInstance = getAuth(app);
            console.log('✅ Firebase Auth obtido após already-initialized (Web)');
            return authInstance;
          } catch (getAuthError: any) {
            console.error('❌ Erro ao obter Auth após already-initialized:', getAuthError?.message);
            throw error;
          }
        }
        console.error('❌ Erro ao inicializar Auth (Web):', error?.message);
        throw error;
      }
    }
    
    if (!getReactNativePersistence || !ReactNativeAsyncStorage) {
      throw new Error('getReactNativePersistence não está disponível nesta plataforma');
    }
    
    let maxRetries = 5;
    let retryDelay = 300;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        authInstance = initializeAuth(app, {
          persistence: getReactNativePersistence(ReactNativeAsyncStorage)
        });
        console.log('✅ Firebase Auth inicializado com AsyncStorage');
        return authInstance;
      } catch (error: any) {
        if (attempt < maxRetries) {
          console.warn(`⚠️ Tentativa ${attempt}/${maxRetries} falhou, aguardando ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay *= 1.5;
          continue;
        }
        console.error('❌ Erro ao inicializar Auth:', error?.message);
        throw error;
      }
    }
    
    throw new Error('Firebase Auth não pôde ser inicializado');
  })();

  try {
    return await authInitPromise;
  } finally {
    authInitPromise = null;
  }
}

function initializeAuthInstance(): Auth {
  if (authInstance) {
    return authInstance;
  }

  const app = initializeAppInstance();

  if (Platform.OS === 'web') {
    try {
      authInstance = initializeAuth(app);
      console.log('✅ Firebase Auth inicializado (Web)');
      return authInstance;
    } catch (error: any) {
      if (error?.code === 'auth/already-initialized' || error?.message?.includes('already-initialized')) {
        try {
          authInstance = getAuth(app);
          return authInstance;
        } catch (getAuthError: any) {
          throw error;
        }
      }
      throw error;
    }
  }

  // React Native: usar initializeAuth com AsyncStorage
  if (!getReactNativePersistence || !ReactNativeAsyncStorage) {
    throw new Error('getReactNativePersistence não está disponível. Use getAuthInstanceAsync() ou aguarde.');
  }

  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence!(ReactNativeAsyncStorage)
    });
    console.log('✅ Firebase Auth inicializado com AsyncStorage');
    return authInstance;
  } catch (error: any) {
    throw error;
  }
}

export const getApp = (): FirebaseApp => {
  return initializeAppInstance();
};

export const getDb = (): Firestore => {
  return initializeFirestore();
};

export const getAuthInstance = (): Auth => {
  try {
    return initializeAuthInstance();
  } catch (error: any) {
    if (error?.message === 'AUTH_NOT_READY') {
      throw new Error('Firebase Auth ainda não está pronto. Use getAuthInstanceAsync() ou aguarde.');
    }
    throw error;
  }
};

export const getAuthInstanceAsync = async (): Promise<Auth> => {
  return await initializeAuthInstanceAsync();
};

export const getAuthInstanceSync = (): Auth => {
  return getAuthInstance();
};
