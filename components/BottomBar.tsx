import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../services/authService';
import { showAlert } from '../utils/alert';

type RootStackParamList = {
  PatientList: undefined;
  RecipeRequests: undefined;
};

const MENU_OPTIONS: {
  key: keyof RootStackParamList;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'PatientList', label: 'Pacientes', icon: 'people' },
  { key: 'RecipeRequests', label: 'Receitas', icon: 'document-text' },
];

interface BottomBarProps {
  currentScreen: string;
  onNavigate: (screen: keyof RootStackParamList) => void;
}

export default function BottomBar({ currentScreen: currentScreenName, onNavigate }: BottomBarProps) {
  const insets = useSafeAreaInsets();
  const { setUser } = useAuth();
  const currentScreen = currentScreenName as keyof RootStackParamList;

  const handleLogout = () => {
    showAlert(
      'Confirmar saída',
      'Deseja realmente sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutUser();
              setUser(null);
            } catch (error) {
              showAlert('Erro', 'Não foi possível fazer logout');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {MENU_OPTIONS.map(({ key, label, icon }) => {
        const isActive = currentScreen === key;
        return (
          <TouchableOpacity
            key={key}
            style={styles.tab}
            onPress={() => currentScreen !== key && onNavigate(key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={icon}
              size={24}
              color={isActive ? '#4A90E2' : '#fff'}
            />
            <Text
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        style={styles.tab}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={24} color="#fff" />
        <Text style={styles.label} numberOfLines={1}>
          Sair
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#2C2C2E',
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  labelActive: {
    color: '#4A90E2',
    fontWeight: '600',
  },
});
