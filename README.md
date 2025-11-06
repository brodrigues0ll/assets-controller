# 💼 Assetly - NAV Brasil

Sistema Web de Controle de Inventário desenvolvido para gerenciar ativos de TI e patrimônios da NAV Brasil.

## 🚀 Tecnologias

- **Frontend:** Next.js 14 (React)
- **Estilização:** Tailwind CSS + Shadcn UI
- **Backend:** Next.js Server Actions
- **Banco de Dados:** MongoDB
- **Autenticação:** NextAuth.js
- **Container:** Docker + Docker Compose

## 📋 Pré-requisitos

- Docker Engine (20.10+)
- Docker Compose (2.0+)

**OU**

- Node.js 20+
- MongoDB 7.0+

## 🐳 Instalação com Docker (Recomendado)

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd Assetly
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` e ajuste as seguintes variáveis:

```env
MONGODB_URI=mongodb://admin:assetly_secure_password_2024@mongodb:27017/assetly?authSource=admin
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu-secret-super-seguro-aqui-mude-em-producao
NODE_ENV=production
```

### 3. Construa e inicie os containers

```bash
docker-compose up -d --build
```

Este comando irá:
- Construir a imagem da aplicação Next.js
- Iniciar o container MongoDB
- Iniciar o container da aplicação web
- Criar os volumes para persistência de dados

### 4. Verifique se os containers estão rodando

```bash
docker-compose ps
```

Você deverá ver dois containers rodando:
- `assetly-mongodb`
- `assetly-web`

### 5. Acesse a aplicação

Abra seu navegador e acesse:

```
http://localhost:3000
```

## 🔧 Instalação Manual (Sem Docker)

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure o MongoDB

Certifique-se de que o MongoDB está rodando localmente na porta 27017.

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/assetly
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu-secret-super-seguro-aqui
NODE_ENV=development
```

### 4. Execute em modo de desenvolvimento

```bash
npm run dev
```

### 5. Acesse a aplicação

```
http://localhost:3000
```

## 👥 Primeiro Acesso - Criação do Administrador

Na **primeira vez** que você acessar o sistema (quando não houver nenhum usuário cadastrado), você será automaticamente redirecionado para a página de **Setup** (`/setup`).

### 🚀 Como configurar:

1. Inicie os containers: `docker-compose up -d --build`
2. Acesse: `http://localhost:3010`
3. Você será redirecionado para `/setup`
4. Preencha o formulário com os dados do administrador:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)
   - Confirmar senha
5. Clique em "Criar Administrador"
6. Você será logado automaticamente e redirecionado para o dashboard

⚠️ **IMPORTANTE:**
- O primeiro usuário criado **sempre** terá privilégios de administrador
- Após a criação, a página `/setup` ficará inacessível
- Guarde bem as credenciais do administrador
- Para resetar e criar um novo admin, remova os volumes: `docker-compose down -v`

## 🔐 Papéis e Permissões

### 🧰 Técnico
- Visualiza inventários de todas as DNBs
- Edita apenas inventários da sua DNB

### 📋 Gestor
- Visualiza e edita inventários de todas as DNBs
- Reseta senhas de técnicos
- Gerencia usuários e DNBs
- Configura campos do sistema

### ⚙️ Administrador
- Acesso total ao sistema
- Todas as permissões de Gestor
- Configurações globais do sistema

## 📦 Estrutura do Projeto

```
Assetly/
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/     # Rotas de autenticação
│   │   ├── dashboard/                   # Páginas do dashboard
│   │   ├── login/                       # Página de login
│   │   ├── layout.js                    # Layout raiz
│   │   ├── page.js                      # Página inicial
│   │   └── globals.css                  # Estilos globais
│   ├── components/
│   │   ├── ui/                          # Componentes UI (Shadcn)
│   │   └── layout/                      # Componentes de layout
│   └── lib/
│       ├── actions/                     # Server Actions
│       ├── models/                      # Modelos MongoDB
│       ├── auth.js                      # Configuração NextAuth
│       ├── mongodb.js                   # Conexão MongoDB
│       ├── permissions.js               # Controle de permissões
│       └── utils.js                     # Funções utilitárias
├── public/                              # Arquivos estáticos
├── docker-compose.yml                   # Configuração Docker Compose
├── Dockerfile                           # Dockerfile da aplicação
├── next.config.js                       # Configuração Next.js
├── tailwind.config.js                   # Configuração Tailwind
└── package.json                         # Dependências do projeto
```

## 🔨 Comandos Úteis

### Docker

```bash
# Iniciar containers
docker-compose up -d

# Parar containers
docker-compose down

# Ver logs
docker-compose logs -f

# Rebuildar imagem
docker-compose up -d --build

# Acessar MongoDB
docker exec -it assetly-mongodb mongosh -u admin -p assetly_secure_password_2024

# Backup do MongoDB
docker exec assetly-mongodb mongodump --out=/backup --authenticationDatabase admin -u admin -p assetly_secure_password_2024

# Limpar volumes (CUIDADO: apaga todos os dados)
docker-compose down -v
```

### NPM

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start

# Lint
npm run lint
```

## 🗄️ Modelo de Dados

### Assets (Ativos)
- Tipo de Equipamento
- Subtipo/Modelo
- Fabricante
- Usuário Responsável
- Localização/Setor
- DNB (Localidade)
- Patrimônio (único)
- Número de Série
- Hostname/IP
- Sistema Operacional
- Situação (Ativo, Reserva, Em manutenção, Descartado)
- E mais...

### DNBs (Localidades)
- Nome
- Código
- Setores
- Status

### Users (Usuários)
- Nome
- Email
- Senha (hash)
- Role (técnico, gestor, administrador)
- DNB vinculada

### Audit Logs
- Usuário
- Ação (create, update, delete, movimentacao)
- Tipo de entidade
- Alterações
- Timestamp

## 🔒 Segurança

- Senhas são hasheadas com bcrypt
- Autenticação baseada em JWT
- Proteção de rotas por role
- Validação de permissões em Server Actions
- Log de auditoria para todas as operações

## 📝 Próximos Passos

Após a instalação básica, você pode:

1. Criar DNBs (localidades)
2. Criar usuários técnicos vinculados às DNBs
3. Cadastrar ativos de TI
4. Configurar campos personalizados
5. Exportar relatórios
6. Visualizar logs de auditoria

## 🐛 Troubleshooting

### Container não inicia

```bash
# Verificar logs
docker-compose logs web
docker-compose logs mongodb

# Verificar portas em uso
netstat -tlnp | grep 3000
netstat -tlnp | grep 27017
```

### Erro de conexão com MongoDB

Verifique se:
- O container MongoDB está rodando
- A string de conexão está correta no `.env`
- As credenciais estão corretas

### Erro ao fazer build

```bash
# Limpar cache do Docker
docker system prune -a

# Rebuildar sem cache
docker-compose build --no-cache
```

## 📄 Licença

Este projeto é proprietário da NAV Brasil.

## 👨‍💻 Suporte

Para suporte e dúvidas, entre em contato com a equipe de TI da NAV Brasil.
