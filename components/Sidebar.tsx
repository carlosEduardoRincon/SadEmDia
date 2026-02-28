import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../services/authService';
import { showAlert } from '../utils/alert';

type RootStackParamList = {
  PatientList: undefined;
  RecipeRequests: undefined;
  Referrals: undefined;
};

const MENU_OPTIONS: {
  key: keyof RootStackParamList;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'PatientList', label: 'Pacientes', icon: 'people' },
  { key: 'RecipeRequests', label: 'Solicitações de Receitas', icon: 'document-text' },
  { key: 'Referrals', label: 'Encaminhamentos', icon: 'share-social' },
];

interface SidebarProps {
  currentScreen: string;
  onNavigate: (screen: keyof RootStackParamList) => void;
}

export default function Sidebar({ currentScreen: currentScreenName, onNavigate }: SidebarProps) {
  const { expanded, toggle } = useSidebar();
  const { setUser } = useAuth();
  const currentScreen = currentScreenName as keyof RootStackParamList;

  const onSelect = (screen: keyof RootStackParamList) => {
    if (screen !== currentScreen) {
      onNavigate(screen);
    }
    toggle();
  };

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
    <>
      {expanded && (
        <Pressable style={styles.overlay} onPress={toggle} />
      )}
      <View style={[styles.sidebar, expanded ? styles.sidebarExpanded : styles.sidebarCollapsed]}>
        <View style={[styles.logoContainer, !expanded && styles.logoContainerCollapsed]}>
          <Image
            source={require('../assets/logo-menor.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.menuList}>
          {MENU_OPTIONS.map(({ key, label, icon }) => {
            const isActive = currentScreen === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.item, isActive && styles.itemActive]}
                onPress={() => onSelect(key)}
                activeOpacity={0.7}
              >
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={icon}
                    size={24}
                    color={isActive ? '#4A90E2' : '#fff'}
                  />
                </View>
                {expanded && (
                  <Text
                    style={[styles.label, isActive && styles.labelActive]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.logoutButton, !expanded && styles.logoutButtonCollapsed]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </View>
            {expanded && (
              <Text style={styles.logoutText}>Sair</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const SIDEBAR_COLLAPSED = 56;
const SIDEBAR_EXPANDED = 280;
const HEADER_HEIGHT = 63;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: SIDEBAR_EXPANDED,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  sidebar: {
    backgroundColor: '#2C2C2E',
    zIndex: 2,
    paddingTop: 0,
    paddingBottom: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  sidebarCollapsed: {
    width: SIDEBAR_COLLAPSED,
    minWidth: SIDEBAR_COLLAPSED,
    maxWidth: SIDEBAR_COLLAPSED,
    alignItems: 'center',
  },
  sidebarExpanded: {
    width: SIDEBAR_EXPANDED,
    minWidth: SIDEBAR_EXPANDED,
    maxWidth: SIDEBAR_EXPANDED,
  },
  logoContainer: {
    height: HEADER_HEIGHT,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  logo: {
    width: 85,
    height: 85,
  },
  logoContainerCollapsed: {
    paddingHorizontal: 4,
  },
  menuList: {
    flex: 1,
    overflow: 'hidden',
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  logoutButtonCollapsed: {
    minWidth: 48,
  },
  logoutText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '500',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginHorizontal: 6,
    marginVertical: 2,
    borderRadius: 10,
  },
  itemActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  iconWrap: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '500',
    flex: 1,
  },
  labelActive: {
    color: '#4A90E2',
    fontWeight: '600',
  },
});
