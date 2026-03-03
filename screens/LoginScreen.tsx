import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { loginUser, registerUser } from '../services/authService';
import { showAlert } from '../utils/alert';
import { ProfessionalType } from '../types';
import { useAuth } from '../context/AuthContext';
import { PROFESSIONAL_TYPE_OPTIONS, getProfessionalTypeLabel } from '../utils/professionalType';

export default function LoginScreen() {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const modalPercent = isMobile ? 0.92 : 0.48;
  const modalWidth = Math.min(width * modalPercent, 520);
  const logoMaxWidth = Math.min(modalWidth - 48, 420);
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [professionalType, setProfessionalType] = useState<ProfessionalType>('Medico');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Erro', 'Por favor, insira um email válido');
      return;
    }

    setLoading(true);
    try {
      const user = await loginUser(email, password);
      setUser(user);
    } catch (error: any) {
      const errorMessage = error?.message || 'Credenciais inválidas. Verifique seu email e senha.';
      const errorCode = error?.code != null ? ` [${error.code}]` : '';
      showAlert('Credenciais inválidas', errorMessage + errorCode);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    console.log('handleRegister chamado');
    
    if (!email || !password || !name) {
      showAlert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Erro', 'Por favor, insira um email válido');
      return;
    }

    if (password.length < 6) {
      showAlert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    console.log('Iniciando registro...', { email, name, professionalType });
    setLoading(true);
    
    try {
      console.log('Chamando registerUser...');
      await registerUser(email, password, name, professionalType);
      console.log('Registro bem-sucedido!');
      showAlert('Sucesso', 'Conta criada com sucesso!');
      setIsRegistering(false);
      setEmail('');
      setPassword('');
      setName('');
    } catch (error: any) {
      console.error('Erro no registro:', error);
      console.error('Stack trace:', error?.stack);
      const errorMessage = error?.message || error?.code || 'Não foi possível criar a conta';
      showAlert('Erro ao registrar', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.scrollContentMobile,
          isMobile && { minHeight: height },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.content, { width: modalWidth, maxWidth: '100%' }, isMobile && styles.contentMobile]}>
          <Image
            source={require('../assets/logo.png')}
            style={[styles.logo, { maxWidth: logoMaxWidth }, isMobile && styles.logoMobile]}
            resizeMode="contain"
          />

          {isRegistering && (
            <>
              <TextInput
                style={[styles.input, isMobile && styles.inputMobile]}
                placeholder="Nome completo"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <View style={[styles.pickerContainer, isMobile && styles.pickerContainerMobile]}>
                <Text style={[styles.label, isMobile && styles.labelMobile]}>Tipo de Profissional:</Text>
                <View style={[styles.pickerRow, isMobile && styles.pickerRowMobile]}>
                  {PROFESSIONAL_TYPE_OPTIONS.map((type) => {
                    const isSelected = professionalType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.pickerOption,
                          isMobile && styles.pickerOptionMobile,
                          isSelected && styles.pickerOptionSelected,
                        ]}
                        onPress={() => setProfessionalType(type)}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            isSelected && styles.pickerOptionTextSelected,
                          ]}
                        >
                          {getProfessionalTypeLabel(type)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          <TextInput
            style={[styles.input, isMobile && styles.inputMobile]}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={[styles.input, isMobile && styles.inputMobile]}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, isMobile && styles.buttonMobile, loading && styles.buttonDisabled]}
            onPress={isRegistering ? handleRegister : handleLogin}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Carregando...' : isRegistering ? 'Registrar' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkButton, isMobile && styles.linkButtonMobile]}
            onPress={() => setIsRegistering(!isRegistering)}
          >
            <Text style={styles.linkText}>
              {isRegistering
                ? 'Já tem uma conta? Faça login'
                : 'Não tem uma conta? Registre-se'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
    paddingBottom: 40,
    alignItems: 'center',
  },
  scrollContentMobile: {
    padding: 16,
    paddingBottom: 24,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'center',
    minWidth: 320,
  },
  contentMobile: {
    padding: 20,
  },
  logo: {
    width: '100%',
    aspectRatio: 640 / 265,
    maxHeight: 200,
    alignSelf: 'center',
    marginBottom: 16,
  },
  logoMobile: {
    maxHeight: 140,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 18,
    fontSize: 17,
    marginBottom: 18,
    backgroundColor: '#f9f9f9',
    minWidth: 0,
  },
  inputMobile: {
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 18,
  },
  pickerContainerMobile: {
    marginBottom: 12,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  labelMobile: {
    fontSize: 15,
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pickerRowMobile: {
    gap: 8,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  pickerOptionMobile: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  pickerOptionSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  pickerOptionText: {
    fontSize: 15,
    color: '#666',
  },
  pickerOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginTop: 14,
  },
  buttonMobile: {
    padding: 14,
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkButtonMobile: {
    marginTop: 16,
  },
  linkText: {
    color: '#4A90E2',
    fontSize: 16,
  },
});
