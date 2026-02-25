import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  PatientList: undefined;
  RecipeRequests: undefined;
};

const MENU_OPTIONS: { key: keyof RootStackParamList; label: string }[] = [
  { key: 'PatientList', label: 'Pacientes' },
  { key: 'RecipeRequests', label: 'Solicitações Receitas' },
];

interface HeaderMenuButtonProps {
  title: string;
  currentScreen: keyof RootStackParamList;
}

export default function HeaderMenuButton({
  title,
  currentScreen,
}: HeaderMenuButtonProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [visible, setVisible] = useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const onSelect = (screen: keyof RootStackParamList) => {
    closeMenu();
    if (screen !== currentScreen) {
      navigation.navigate(screen);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={openMenu}
        activeOpacity={0.7}
      >
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.overlay} onPress={closeMenu}>
          <View style={styles.dropdownWrapper}>
            <View style={styles.dropdown}>
              {MENU_OPTIONS.map(({ key, label }, index) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.option,
                    currentScreen === key && styles.optionSelected,
                    index === MENU_OPTIONS.length - 1 && styles.optionLast,
                  ]}
                  onPress={() => onSelect(key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      currentScreen === key && styles.optionTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
    maxWidth: 220,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  chevron: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingTop: 56,
    paddingLeft: 16,
    alignSelf: 'flex-start',
  },
  dropdownWrapper: {
    minWidth: 220,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionSelected: {
    backgroundColor: '#E3F2FD',
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#4A90E2',
    fontWeight: '700',
  },
});
