import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './screens/LoginScreen';
import PatientListScreen from './screens/PatientListScreen';
import PatientDetailScreen from './screens/PatientDetailScreen';
import { onAuthStateChange } from './services/authService';
import { getApp } from './firebase.config';
import { User } from './types';
import { AuthContextProvider } from './context/AuthContext';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;
    let authTimer: NodeJS.Timeout | null = null;
    
    // Aguardar um pouco antes de inicializar o Firebase
    // O delay garante que o runtime do Expo está completamente pronto
    const timer = setTimeout(() => {
      // Primeiro, inicializar o App do Firebase para garantir que está pronto
      try {
        getApp(); // Garantir que o App está inicializado
        console.log('Firebase App verificado');
      } catch (err) {
        console.warn('Erro ao verificar Firebase App:', err);
      }

      // Aguardar mais um pouco antes de inicializar o Auth
      authTimer = setTimeout(async () => {
        try {
          console.log('Inicializando autenticação...');
          unsubscribe = await onAuthStateChange((currentUser) => {
            if (!isMounted) return;
            console.log('Estado de autenticação mudou:', currentUser ? 'Logado' : 'Deslogado');
            setUser(currentUser);
            setLoading(false);
            setError(null);
          });
        } catch (err: any) {
          if (!isMounted) return;
          console.error('Erro ao inicializar autenticação:', err);
          console.error('Detalhes:', err?.message, err?.code);
          setError(err.message || 'Erro ao inicializar Firebase');
          setLoading(false);
        }
      }, 1000); // Delay maior para o Auth estar pronto
    }, 2000); // Delay inicial maior para garantir que o runtime está pronto

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (authTimer) {
        clearTimeout(authTimer);
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Erro: {error}</Text>
        <Text style={styles.errorSubtext}>Tente recarregar o app (pressione R duas vezes)</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthContextProvider value={{ setUser }}>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4A90E2',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          {user ? (
            <>
              <Stack.Screen
                name="PatientList"
                component={PatientListScreen}
                options={{
                  title: 'Pacientes',
                  headerRight: () => (
                    <View style={{ marginRight: 16 }}>
                      <StatusBar style="light" />
                    </View>
                  ),
                }}
              />
              <Stack.Screen
                name="PatientDetail"
                component={PatientDetailScreen}
                options={{ title: 'Detalhes do Paciente' }}
              />
            </>
          ) : (
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
          )}
        </Stack.Navigator>
        </NavigationContainer>
      </AuthContextProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});
