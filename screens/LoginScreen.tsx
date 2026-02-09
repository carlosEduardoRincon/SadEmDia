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
} from 'react-native';
import { loginUser, registerUser } from '../services/authService';
import { showAlert } from '../utils/alert';
import { ProfessionalType } from '../types';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [professionalType, setProfessionalType] = useState<ProfessionalType>('medico');
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>SadEmDia</Text>
          <Text style={styles.subtitle}>
            {isRegistering ? 'Criar Nova Conta' : 'Acesso ao Sistema'}
          </Text>

          {isRegistering && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Nome completo"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Tipo de Profissional:</Text>
                <View style={styles.pickerRow}>
                  {(['medico', 'fisioterapeuta', 'fonoaudiologo'] as ProfessionalType[]).map(
                    (type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.pickerOption,
                          professionalType === type && styles.pickerOptionSelected,
                        ]}
                        onPress={() => setProfessionalType(type)}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            professionalType === type && styles.pickerOptionTextSelected,
                          ]}
                        >
                          {type === 'medico'
                            ? 'Médico'
                            : type === 'fisioterapeuta'
                            ? 'Fisioterapeuta'
                            : 'Fonoaudiólogo'}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={isRegistering ? handleRegister : handleLogin}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Carregando...' : isRegistering ? 'Registrar' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pickerOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  pickerOptionSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#666',
  },
  pickerOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#4A90E2',
    fontSize: 14,
  },
});
