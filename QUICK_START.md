# 🚀 Início Rápido - SadEmDia

## Configuração em 5 minutos

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative **Authentication** > **Email/Password**
4. Ative **Firestore Database** (modo teste)
5. Vá em **Project Settings** > copie as credenciais
6. Copie o arquivo `.env.example` para `.env` e preencha as variáveis com as credenciais do Firebase

### 3. Executar
```bash
npm start
```

Pressione `a` para Android ou escaneie o QR code com Expo Go.

### 4. Primeiro uso

1. **Registre-se** no app escolhendo seu tipo de profissional
2. **Adicione pacientes** via Firebase Console (Firestore > `patients` collection)

Exemplo de paciente:
```json
{
  "name": "Maria Silva",
  "age": 70,
  "comorbidities": ["Diabetes", "Hipertensão"],
  "needsPrescription": true,
  "visits": [],
  "visitRequests": [],
  "createdAt": [Timestamp - use o botão de data],
  "updatedAt": [Timestamp - use o botão de data]
}
```

### 5. Aplicar regras de segurança (importante!)

No Firebase Console > Firestore > Rules, cole o conteúdo de `firestore.rules`

---

**Pronto!** O app está funcionando. Veja `SETUP.md` para detalhes completos.
