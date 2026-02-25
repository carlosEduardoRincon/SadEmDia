import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSidebar } from '../context/SidebarContext';

export default function HamburgerButton() {
  const { toggle } = useSidebar();

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={toggle}
      activeOpacity={0.8}
    >
      <View style={styles.bar} />
      <View style={styles.bar} />
      <View style={styles.bar} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    marginRight: 8,
  },
  bar: {
    width: 20,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
    marginVertical: 2.5,
  },
});
