# Guia de Configuração - SadEmDia

## Passo a Passo para Configurar o Projeto

### 1. Instalação das Dependências

```bash
npm install
```

### 2. Configuração do Firebase

#### 2.1. Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto" ou selecione um projeto existente
3. Siga o assistente de criação do projeto

#### 2.2. Configurar Authentication

1. No menu lateral, vá em **Authentication**
2. Clique em **Get Started**
3. Vá na aba **Sign-in method**
4. Habilite **Email/Password**
5. Clique em **Save**

#### 2.3. Configurar Firestore Database

1. No menu lateral, vá em **Firestore Database**
2. Clique em **Create database**
3. Escolha **Start in test mode** (para desenvolvimento)
4. Selecione uma localização (ex: `southamerica-east1` para Brasil)
5. Clique em **Enable**

**⚠️ IMPORTANTE**: Para produção, configure as regras de segurança do Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler/escrever apenas seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Pacientes podem ser lidos por qualquer usuário autenticado
    match /patients/{patientId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Visitas podem ser lidas/criadas por usuários autenticados
    match /visits/{visitId} {
      allow read, write: if request.auth != null;
    }
    
    // Solicitações de visita podem ser lidas/criadas por usuários autenticados
    match /visitRequests/{requestId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### 2.4. Obter Credenciais do Firebase

1. No Firebase Console, vá em **Project Settings** (ícone de engrenagem)
2. Role até a seção **Your apps**
3. Se não houver um app web, clique em **Add app** > **Web** (ícone `</>`)
4. Registre o app com um nome (ex: "SadEmDia")
5. Copie as configurações do Firebase SDK que aparecem

#### 2.5. Configurar o Arquivo firebase.config.ts

1. Abra o arquivo `firebase.config.example.ts`
2. Copie o conteúdo para `firebase.config.ts`
3. Substitua os valores `YOUR_*` pelas credenciais do seu projeto Firebase:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSy...", // Sua API Key
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 3. Executar o Aplicativo

```bash
npm start
```

Isso abrirá o Expo DevTools. Você pode:

- Pressionar `a` para abrir no Android Emulator
- Escanear o QR code com o app Expo Go no seu celular Android
- Pressionar `w` para abrir no navegador (para testes)

### 4. Criar Primeiro Usuário

1. Ao abrir o app, você verá a tela de login
2. Clique em "Não tem uma conta? Registre-se"
3. Preencha:
   - Nome completo
   - Tipo de profissional (Médico, Fisioterapeuta ou Fonoaudiólogo)
   - Email
   - Senha
4. Clique em "Registrar"

### 5. Adicionar Pacientes (via Firebase Console)

Por enquanto, você pode adicionar pacientes diretamente no Firestore:

1. Acesse o Firebase Console > Firestore Database
2. Clique em **Start collection**
3. Nome da coleção: `patients`
4. Adicione documentos com os seguintes campos:

```json
{
  "name": "João Silva",
  "age": 65,
  "comorbidities": ["Diabetes", "Hipertensão"],
  "needsPrescription": true,
  "visits": [],
  "visitRequests": [],
  "createdAt": [Timestamp],
  "updatedAt": [Timestamp]
}
```

**Nota**: Os campos `createdAt` e `updatedAt` devem ser do tipo **Timestamp**. Use o botão de data/hora no Firebase Console.

### 6. Estrutura de Dados Esperada

#### Collection: `users`
```typescript
{
  email: string;
  name: string;
  professionalType: "medico" | "fisioterapeuta" | "fonoaudiologo";
  createdAt: Timestamp;
}
```

#### Collection: `patients`
```typescript
{
  name: string;
  age: number;
  comorbidities: string[];
  needsPrescription: boolean;
  lastVisit?: Timestamp;
  lastVisitBy?: "medico" | "fisioterapeuta" | "fonoaudiologo";
  visits: string[]; // IDs das visitas
  visitRequests: string[]; // IDs das solicitações pendentes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Collection: `visits`
```typescript
{
  patientId: string;
  professionalId: string;
  professionalType: "medico" | "fisioterapeuta" | "fonoaudiologo";
  date: Timestamp;
  notes?: string;
  visitRequestId?: string;
}
```

#### Collection: `visitRequests`
```typescript
{
  patientId: string;
  requestedBy: string; // ID do profissional
  requestedByType: "medico" | "fisioterapeuta" | "fonoaudiologo";
  requestedFor: "medico" | "fisioterapeuta" | "fonoaudiologo";
  reason: string;
  status: "pending" | "completed" | "cancelled";
  createdAt: Timestamp;
  completedAt?: Timestamp;
}
```

## Troubleshooting

### Erro: "Firebase: Error (auth/network-request-failed)"
- Verifique sua conexão com a internet
- Verifique se as credenciais do Firebase estão corretas

### Erro: "Missing or insufficient permissions"
- Verifique as regras de segurança do Firestore
- Certifique-se de que o usuário está autenticado

### Erro: "Cannot read property 'toDate' of undefined"
- Verifique se os campos de data no Firestore são do tipo Timestamp
- Certifique-se de que os campos obrigatórios estão preenchidos

### App não conecta ao Firebase
- Verifique se o arquivo `firebase.config.ts` existe e está configurado corretamente
- Verifique se o projeto Firebase está ativo
- Verifique se o Authentication e Firestore estão habilitados

## Próximos Passos

- Implementar tela para adicionar pacientes diretamente no app
- Adicionar filtros na lista de pacientes
- Implementar notificações push
- Adicionar relatórios e estatísticas
- Melhorar a interface com mais recursos visuais
