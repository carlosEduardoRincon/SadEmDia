# SadEmDia - Sistema de Gestão de Pacientes

Aplicativo mobile (Android, iOS) e web desenvolvido com React Native (Expo) e Firebase (Firestore) para gerenciar pacientes em um programa de saúde, com sistema de priorização inteligente e marcação de visitas.

## 🚀 Funcionalidades

- **Lista de Pacientes Ordenada por Prioridade**: Os pacientes são automaticamente ordenados com base em:
  - Comorbidades
  - Necessidade de receita médica (alerta exibido apenas quando faltam 7 dias ou menos para a próxima entrega)
  - Tempo sem visita (especialmente próximo ao fim da semana)
  - Solicitações pendentes de outros profissionais

- **Sistema de Autenticação**: Login e registro para diferentes tipos de profissionais:
  - Médicos
  - Fisioterapeutas
  - Fonoaudiólogos
  - Enfermeiros

- **Registro de Visitas**: Profissionais podem marcar visitas realizadas, registrar entrega de receita médica e definir a data da próxima entrega (com seletor de calendário), reduzindo a prioridade do paciente na lista

- **Solicitação de Visitas**: Profissionais podem solicitar visitas de outros tipos de profissionais quando identificam necessidade específica

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no Firebase
- Expo CLI instalado globalmente: `npm install -g expo-cli`

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd SadEmDia
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o Firebase:
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Ative o Authentication (Email/Password)
   - Crie um banco de dados Firestore
   - Crie um arquivo `.env` na raiz do projeto com as variáveis do Firebase (veja seção Configuração do Firebase)

4. Execute o aplicativo:
```bash
npm start          # Abre o menu do Expo
npm run web       # Executa na web
npm run android   # Executa no Android
npm run ios       # Executa no iOS
```

## 🔥 Configuração do Firebase

1. No Firebase Console, vá em **Project Settings** > **General**
2. Copie as configurações do seu projeto
3. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
EXPO_PUBLIC_FIREBASE_API_KEY=sua_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=seu_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=seu_measurement_id
```

> **Importante**: O arquivo `.env` não deve ser commitado. Adicione-o ao `.gitignore`.

### Estrutura do Firestore

O aplicativo utiliza as seguintes coleções:

- **users**: Dados dos profissionais
- **patients**: Dados dos pacientes (inclui `needsPrescription`, `nextPrescriptionDue` para controle de receitas médicas)
- **visits**: Registro de visitas realizadas (inclui `prescriptionDelivered`, `nextPrescriptionDue` quando aplicável)
- **visitRequests**: Solicitações de visitas entre profissionais

## 📱 Como Usar

1. **Registro/Login**: 
   - Na primeira vez, registre-se escolhendo seu tipo de profissional
   - Faça login com suas credenciais

2. **Visualizar Pacientes**:
   - A lista de pacientes é exibida automaticamente ordenada por prioridade
   - Pacientes com maior prioridade aparecem no topo

3. **Registrar Visita**:
   - Toque em um paciente para ver detalhes
   - Clique em "Registrar Visita Realizada"
   - Adicione observações (opcional)
   - Se o paciente precisa de receita, marque "Receita foi entregue?" e selecione a data da próxima entrega no calendário
   - Confirme

4. **Solicitar Visita de Outro Profissional**:
   - Na tela de detalhes do paciente
   - Clique em "Solicitar Visita de Outro Profissional"
   - Escolha o tipo de profissional necessário e informe o motivo

## 🏗️ Estrutura do Projeto

```
SadEmDia/
├── App.tsx                 # Componente principal e navegação
├── firebase.config.ts      # Configuração do Firebase
├── types/
│   └── index.ts           # Definições de tipos TypeScript
├── services/
│   ├── authService.ts     # Serviços de autenticação
│   ├── patientService.ts  # Serviços relacionados a pacientes
│   └── priorityService.ts # Lógica de cálculo de prioridade
└── screens/
    ├── LoginScreen.tsx           # Tela de login/registro
    ├── PatientListScreen.tsx     # Lista de pacientes
    └── PatientDetailScreen.tsx   # Detalhes do paciente
```

## 🎨 Tecnologias Utilizadas

- **React Native**: Framework para desenvolvimento mobile
- **Expo**: Plataforma para desenvolvimento React Native
- **Firebase**: Backend e banco de dados
  - Authentication: Autenticação de usuários
  - Firestore: Banco de dados NoSQL
- **TypeScript**: Tipagem estática
- **React Navigation**: Navegação entre telas
- **date-fns**: Manipulação de datas
- **@react-native-community/datetimepicker**: Seletor de data para entrega de receita (iOS/Android)

## 📝 Notas

- O sistema de priorização é calculado em tempo real baseado nos critérios definidos
- Quando uma visita é registrada, a prioridade do paciente é automaticamente recalculada
- O alerta "Precisa de receita médica" só aparece quando faltam 7 dias ou menos para a próxima data de entrega, ou quando não há data definida
- Solicitações de visitas aumentam a prioridade do paciente para o profissional solicitado

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📄 Licença

Este projeto está sob a licença MIT.
