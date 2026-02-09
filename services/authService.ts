import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { getAuthInstanceAsync, getDb } from '../firebase.config';
import { User, ProfessionalType } from '../types';

const USERS_COLLECTION = 'users';

/**
 * Registra um novo usuário
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  professionalType: ProfessionalType
): Promise<User> {
  try {
    console.log('registerUser iniciado');
    console.log('Obtendo instâncias do Firebase...');
    
    const auth = await getAuthInstanceAsync();
    const db = getDb();
    
    console.log('Firebase inicializado, criando usuário no Auth...');
    
    // Criar usuário no Firebase Auth - isso disparará onAuthStateChanged automaticamente
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    console.log('Usuário criado no Auth:', firebaseUser.uid);

    // Criar documento do usuário no Firestore
    const userData: Omit<User, 'id'> = {
      email,
      name,
      professionalType,
      createdAt: new Date(),
    };

    console.log('Criando documento no Firestore...');
    await setDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), {
      ...userData,
      createdAt: Timestamp.fromDate(userData.createdAt),
    });
    
    console.log('Documento criado no Firestore com sucesso!');

    // O onAuthStateChanged será disparado automaticamente pelo Firebase Auth
    // e atualizará o estado no App.tsx, causando o redirecionamento
    return {
      id: firebaseUser.uid,
      ...userData,
    };
  } catch (error: any) {
    console.error('Erro detalhado ao registrar usuário:', error);
    console.error('Código do erro:', error?.code);
    console.error('Mensagem do erro:', error?.message);
    
    // Melhorar mensagens de erro comuns
    let errorMessage = error?.message || 'Não foi possível criar a conta';
    
    if (error?.code === 'auth/configuration-not-found' || error?.code === 'auth/operation-not-allowed') {
      errorMessage = 'Login por email/senha não está habilitado. No Firebase Console: Authentication > Sign-in method > ative "Email/Password" e salve.';
    } else if (error?.code === 'auth/email-already-in-use') {
      errorMessage = 'Este email já está cadastrado';
    } else if (error?.code === 'auth/weak-password') {
      errorMessage = 'A senha deve ter pelo menos 6 caracteres';
    } else if (error?.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
    } else if (error?.code === 'auth/network-request-failed') {
      errorMessage = 'Erro de conexão. Verifique sua internet';
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Faz login do usuário
 */
export async function loginUser(email: string, password: string): Promise<User> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/26847d95-3415-4a85-aad4-90ff0b4cdba1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:loginUser:entry',message:'loginUser called',data:{emailLen:email?.length,emailType:typeof email,passwordLen:password?.length,passwordType:typeof password,emailEmpty:!email,passwordEmpty:!password},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  try {
    console.log('loginUser iniciado');
    const auth = await getAuthInstanceAsync();
    const db = getDb();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/26847d95-3415-4a85-aad4-90ff0b4cdba1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:before signIn',message:'before signInWithEmailAndPassword',data:{hasAuth:!!auth,authAppName:auth?.app?.name,emailLen:email?.length,passwordLen:password?.length},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    console.log('Fazendo login com Firebase Auth...');
    // Autenticar com Firebase Auth - isso disparará onAuthStateChanged automaticamente
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    console.log('Login bem-sucedido no Firebase Auth, buscando dados do usuário:', firebaseUser.uid);

    // Buscar dados do usuário no Firestore
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, firebaseUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('Dados do usuário não encontrados');
    }

    const data = userDoc.data();
    console.log('Dados do usuário encontrados');
    
    // O onAuthStateChanged será disparado automaticamente pelo Firebase Auth
    // e atualizará o estado no App.tsx, causando o redirecionamento
    return {
      id: firebaseUser.uid,
      email: data.email,
      name: data.name,
      professionalType: data.professionalType,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  } catch (error: any) {
    // #region agent log
    const errPayload: Record<string, unknown> = { code: error?.code, message: error?.message };
    if (error?.customData) errPayload.customData = error.customData;
    if (error?.response) errPayload.response = error.response;
    fetch('http://127.0.0.1:7242/ingest/26847d95-3415-4a85-aad4-90ff0b4cdba1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:loginUser:catch',message:'login error',data:errPayload,timestamp:Date.now(),hypothesisId:'H2,H3,H4'})}).catch(()=>{});
    // #endregion
    console.error('Erro ao fazer login:', error);
    console.error('Código do erro:', error?.code);
    console.error('Mensagem do erro:', error?.message);
    
    // Melhorar mensagens de erro comuns
    let errorMessage = error?.message || 'Credenciais inválidas';
    
    if (error?.code === 'auth/configuration-not-found' || error?.code === 'auth/operation-not-allowed') {
      errorMessage = 'Login por email/senha não está habilitado. No Firebase Console: Authentication > Sign-in method > ative "Email/Password" e salve.';
    } else if (error?.code === 'auth/user-not-found') {
      errorMessage = 'Usuário não encontrado';
    } else if (error?.code === 'auth/wrong-password') {
      errorMessage = 'Senha incorreta';
    } else if (error?.code === 'auth/invalid-credential') {
      errorMessage = 'Email ou senha incorretos';
    } else if (error?.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
    } else if (error?.code === 'auth/network-request-failed') {
      errorMessage = 'Erro de conexão. Verifique sua internet';
    } else if (error?.code === 'auth/too-many-requests') {
      errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Faz logout do usuário
 */
export async function logoutUser(): Promise<void> {
  try {
    const auth = await getAuthInstanceAsync();
    await signOut(auth);
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
}

/**
 * Busca o usuário atual
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const auth = await getAuthInstanceAsync();
    const db = getDb();
    
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return null;
    }

    const userDoc = await getDoc(doc(db, USERS_COLLECTION, firebaseUser.uid));
    
    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      id: firebaseUser.uid,
      email: data.email,
      name: data.name,
      professionalType: data.professionalType,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Erro ao buscar usuário atual:', error);
    return null;
  }
}

/**
 * Observa mudanças no estado de autenticação
 */
export async function onAuthStateChange(callback: (user: User | null) => void): Promise<() => void> {
  // Usar versão assíncrona para garantir que o Auth está pronto
  const auth = await getAuthInstanceAsync();
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        const user = await getCurrentUser();
        callback(user);
      } catch (error) {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}
