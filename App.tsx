import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { getProfessionalTypeLabel } from './utils/professionalType';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './screens/LoginScreen';
import PatientListScreen from './screens/PatientListScreen';
import PatientDetailScreen from './screens/PatientDetailScreen';
import RecipeRequestsScreen from './screens/RecipeRequestsScreen';
import ReferralsScreen from './screens/ReferralsScreen';
import HamburgerButton from './components/HamburgerButton';
import Sidebar from './components/Sidebar';
import BottomBar from './components/BottomBar';

const MOBILE_BREAKPOINT = 768;
import { onAuthStateChange } from './services/authService';
import { getApp } from './firebase.config';
import { User } from './types';
import { AuthContextProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';

const Stack = createNativeStackNavigator();

export default function App() {
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRouteName, setCurrentRouteName] = useState<string>('PatientList');
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;
    let authTimer: NodeJS.Timeout | null = null;
    
    const timer = setTimeout(() => {
      try {
        getApp();
        console.log('Firebase App verificado');
      } catch (err) {
        console.warn('Erro ao verificar Firebase App:', err);
      }

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
      }, 1000);
    }, 2000);

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
        <SidebarProvider>
          <NavigationContainer
            ref={navigationRef}
            onStateChange={(state) => {
              if (!state) return;
              const route = state.routes[state.index];
              if (route?.name) setCurrentRouteName(route.name);
            }}
          >
            <StatusBar style="auto" />
            {user ? (
              <View style={[styles.mainLayout, isMobile && styles.mainLayoutMobile]}>
                {!isMobile && (
                  <Sidebar
                    currentScreen={currentRouteName}
                    onNavigate={(name) => navigationRef.current?.navigate(name as never)}
                  />
                )}
                <View style={styles.content}>
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
                    <Stack.Screen
                      name="PatientList"
                      component={PatientListScreen}
                      options={{
                        headerTitle: '',
                        headerLeft: () => (
                          <View style={[styles.headerLeft, isMobile && styles.headerLeftMobile]}>
                            {!isMobile && <HamburgerButton />}
                            <Text style={[styles.headerGreeting, isMobile && styles.headerGreetingMobile]} numberOfLines={1}>
                              Olá, {user?.name ?? ''} ({user ? getProfessionalTypeLabel(user.professionalType) : ''})
                            </Text>
                          </View>
                        ),
                      }}
                    />
                    <Stack.Screen
                      name="RecipeRequests"
                      component={RecipeRequestsScreen}
                      options={{
                        headerTitle: '',
                        headerLeft: () => (
                          <View style={[styles.headerLeft, isMobile && styles.headerLeftMobile]}>
                            {!isMobile && <HamburgerButton />}
                            <Text style={[styles.headerGreeting, isMobile && styles.headerGreetingMobile]} numberOfLines={1}>
                              Olá, {user?.name ?? ''} ({user ? getProfessionalTypeLabel(user.professionalType) : ''})
                            </Text>
                          </View>
                        ),
                      }}
                    />
                    <Stack.Screen
                      name="Referrals"
                      component={ReferralsScreen}
                      options={{
                        headerTitle: 'Encaminhamentos',
                        headerLeft: () => (
                          <View style={[styles.headerLeft, isMobile && styles.headerLeftMobile]}>
                            {!isMobile && <HamburgerButton />}
                            <Text style={[styles.headerGreeting, isMobile && styles.headerGreetingMobile]} numberOfLines={1}>
                              Olá, {user?.name ?? ''} ({user ? getProfessionalTypeLabel(user.professionalType) : ''})
                            </Text>
                          </View>
                        ),
                      }}
                    />
                    <Stack.Screen
                      name="PatientDetail"
                      component={PatientDetailScreen}
                      options={{ title: 'Detalhes do Paciente' }}
                    />
                  </Stack.Navigator>
                </View>
                {isMobile && (
                  <BottomBar
                    currentScreen={currentRouteName}
                    onNavigate={(name) => navigationRef.current?.navigate(name as never)}
                  />
                )}
              </View>
            ) : (
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
              </Stack.Navigator>
            )}
          </NavigationContainer>
        </SidebarProvider>
      </AuthContextProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  mainLayoutMobile: {
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  headerLeftMobile: {
    paddingHorizontal: 20,
  },
  headerGreeting: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  headerGreetingMobile: {
    marginLeft: 0,
  },
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
