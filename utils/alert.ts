import { Alert, Platform } from 'react-native';

type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

/**
 * Exibe um alerta que funciona na web (window.alert/confirm) e no native (Alert.alert).
 * Na web, Alert.alert do React Native não mostra nada.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  const text = [title, message].filter(Boolean).join('\n\n');

  if (Platform.OS === 'web') {
    if (!buttons || buttons.length === 0) {
      window.alert(text);
      return;
    }
    if (buttons.length === 1) {
      window.alert(text);
      buttons[0].onPress?.();
      return;
    }
    // Dois ou mais botões: usar confirm. OK = ação principal, Cancel = cancelar.
    const confirmed = window.confirm(text);
    if (confirmed) {
      const primary = buttons.find((b) => b.style !== 'cancel');
      primary?.onPress?.();
    } else {
      const cancel = buttons.find((b) => b.style === 'cancel');
      cancel?.onPress?.();
    }
    return;
  }

  Alert.alert(title, message ?? '', buttons);
}
