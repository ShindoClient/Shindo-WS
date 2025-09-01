<div align="center">
  <img src="assets/logo.png" style="width: 128px; height: auto;" alt="Shindo Logo">
  
  # Shindo WebSocket
  
  **Servidor WebSocket para o ShindoClient**

 [![Discord](https://img.shields.io/badge/Join%20our%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://shindoclient.com/discord)
 [![License](https://img.shields.io/github/license/ShindoClient/Shindo-WS?style=for-the-badge)](https://github.com/ShindoClient/Shindo-WS/blob/master/LICENSE)

  ---
</div>

## 📋 Visão Geral

Servidor WebSocket desenvolvido para gerenciar conexões em tempo real para o ShindoClient, com integração ao Firebase para persistência de dados e autenticação.

## 🏗️ Estrutura do Projeto

```
shindo-ws/
├── src/
│   ├── config.ts        # Configurações do servidor
│   ├── firebase.ts      # Configuração do Firebase
│   ├── gateway.ts       # Lógica principal do WebSocket
│   ├── index.ts         # Ponto de entrada da aplicação
│   ├── logger.ts        # Utilitários de log
│   ├── presence.ts      # Gerenciamento de presença
│   └── types.ts         # Definições de tipos TypeScript
├── assets/              # Recursos estáticos
├── .env.example         # Exemplo de variáveis de ambiente
├── Dockerfile           # Configuração do Docker
├── package.json         # Dependências e scripts
└── tsconfig.json        # Configuração do TypeScript
```

## 🛠️ Tecnologias Principais

<div align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express" alt="Express">
  <img src="https://img.shields.io/badge/WebSocket-000000?style=for-the-badge&logo=websocket" alt="WebSocket">
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
</div>

## 🚀 Primeiros Passos

### Pré-requisitos
- Node.js 18+
- pnpm 8+
- Conta no Firebase (para autenticação e banco de dados)

### Instalação

1. **Clonar o repositório**
   ```bash
   git clone [URL_DO_REPOSITÓRIO]
   cd shindo-ws
   ```

2. **Instalar dependências**
   ```bash
   pnpm install
   ```

3. **Configurar ambiente**
   - Copie o arquivo `.env.example` para `.env`
   - Preencha as variáveis de ambiente necessárias

## 🛠️ Desenvolvimento

### Iniciar servidor de desenvolvimento
```bash
pnpm dev
```

### Compilar para produção
```bash
pnpm build
```

### Iniciar servidor de produção
```bash
pnpm start
```

## 🚀 Deploy

### Render (PaaS)
O projeto inclui um `render.yaml` pronto para deploy no Render. Basta fazer push para o repositório conectado.

## 🐳 Docker

### Construir a imagem
```bash
docker build -t shindo-ws .
```

### Executar o container
```bash
docker run -d \
  --name shindo-ws \
  -p 8080:8080 \
  --env-file .env \
  --restart unless-stopped \
  shindo-ws
```

### Variáveis de Ambiente
Crie um arquivo `.env` baseado no `.env.example` com as seguintes variáveis:

```env
# Porta do servidor
PORT=8080

# Configurações do Firebase
FIREBASE_PROJECT_ID=seu-projeto
FIREBASE_CLIENT_EMAIL=seu-email@projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Adicione suas mudanças (`git add .`)
4. Comite suas mudanças (`git commit -m 'Add some AmazingFeature'`)
5. Faça o Push da Branch (`git push origin feature/AmazingFeature`)
6. Abra um Pull Request

---

<div align="center">
  Feito com ❤️ por ShindoClient Team
</div>
