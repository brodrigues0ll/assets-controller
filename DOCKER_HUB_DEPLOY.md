# Guia Completo: Deploy da Aplicação Assetly no Docker Hub

Este guia detalha o processo completo para publicar a aplicação Assetly no Docker Hub e criar releases automáticos a cada alteração.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Criando Conta no Docker Hub](#criando-conta-no-docker-hub)
3. [Configurando a Aplicação Localmente](#configurando-a-aplicação-localmente)
4. [Build e Push Manual da Imagem](#build-e-push-manual-da-imagem)
5. [Configurando GitHub Actions para CI/CD](#configurando-github-actions-para-cicd)
6. [Sistema de Releases Automáticos](#sistema-de-releases-automáticos)
7. [Usando a Imagem em Outros Lugares](#usando-a-imagem-em-outros-lugares)
8. [Boas Práticas e Troubleshooting](#boas-práticas-e-troubleshooting)

---

## 🔧 Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ Conta no [Docker Hub](https://hub.docker.com/) (gratuita)
- ✅ Docker instalado localmente
- ✅ Git instalado
- ✅ Repositório do projeto no GitHub
- ✅ Acesso de administrador ao repositório GitHub
- ✅ Dockerfile funcional (já existe no projeto)

---

## 🌐 Criando Conta no Docker Hub

### Passo 1: Registro no Docker Hub

1. Acesse: https://hub.docker.com/signup
2. Preencha os dados:
   - **Username**: Escolha um nome único (ex: `seunome` ou `suaempresa`)
   - **Email**: Seu email válido
   - **Password**: Senha forte
3. Confirme o email recebido
4. Faça login em: https://hub.docker.com/

### Passo 2: Criar Repositório no Docker Hub

1. No Docker Hub, clique em **"Create Repository"**
2. Configure o repositório:
   - **Name**: `assetly-nav-brasil` (ou nome de sua preferência)
   - **Description**: "Sistema Web de Controle de Inventário para NAV Brasil"
   - **Visibility**:
     - **Public** (gratuito, qualquer um pode usar)
     - **Private** (requer plano pago, apenas você acessa)
3. Clique em **"Create"**

Sua imagem estará disponível em: `seuusername/assetly-nav-brasil`

---

## 💻 Configurando a Aplicação Localmente

### Passo 1: Login no Docker via Terminal

Abra o terminal e execute:

```bash
docker login
```

Digite suas credenciais do Docker Hub:
- **Username**: seu username do Docker Hub
- **Password**: sua senha

Você verá: `Login Succeeded`

### Passo 2: Verificar o Dockerfile

O projeto já possui um `Dockerfile` funcional. Estrutura atual:

```
/home/brodrigues/Projects/Assetly/
├── Dockerfile          ← Arquivo de build da imagem
├── docker-compose.yml  ← Orquestração de containers
├── .dockerignore       ← Arquivos ignorados no build
└── ...
```

---

## 🐋 Build e Push Manual da Imagem

### Passo 1: Build da Imagem Local

No diretório do projeto, execute:

```bash
# Formato: docker build -t DOCKERHUB_USERNAME/NOME_IMAGEM:TAG .
docker build -t seuusername/assetly-nav-brasil:latest .
```

**Explicação dos parâmetros:**
- `-t`: Tag/nome da imagem
- `seuusername`: Seu username do Docker Hub
- `assetly-nav-brasil`: Nome do repositório
- `latest`: Tag da versão (sempre a mais recente)
- `.`: Contexto do build (diretório atual)

**Tempo estimado:** 5-10 minutos (primeira vez)

### Passo 2: Testar a Imagem Localmente

Antes de publicar, teste se funciona:

```bash
# Criar network
docker network create assetly-network

# Subir MongoDB
docker run -d \
  --name assetly-mongodb \
  --network assetly-network \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=assetly_secure_password_2024 \
  -p 27017:27017 \
  mongo:7.0

# Subir aplicação
docker run -d \
  --name assetly-web \
  --network assetly-network \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://admin:assetly_secure_password_2024@assetly-mongodb:27017/assetly?authSource=admin \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXTAUTH_SECRET=8f4e7d6c9b2a1f3e5d8c7b4a9e2f1d3c6b5a8e7d4c9f2a1e3b6d5c8f7a4e9b2d \
  -e NODE_ENV=production \
  seuusername/assetly-nav-brasil:latest
```

Acesse: http://localhost:3000

**Limpar após teste:**
```bash
docker stop assetly-web assetly-mongodb
docker rm assetly-web assetly-mongodb
docker network rm assetly-network
```

### Passo 3: Push da Imagem para Docker Hub

Se o teste funcionou, publique:

```bash
docker push seuusername/assetly-nav-brasil:latest
```

**Tempo estimado:** 5-15 minutos (dependendo da conexão)

Verifique no Docker Hub: https://hub.docker.com/r/seuusername/assetly-nav-brasil

---

## 🚀 Configurando GitHub Actions para CI/CD

Agora vamos automatizar o processo para que cada push crie uma nova versão.

### Passo 1: Criar Access Token no Docker Hub

1. Acesse: https://hub.docker.com/settings/security
2. Clique em **"New Access Token"**
3. Configure:
   - **Token Description**: `GitHub Actions - Assetly`
   - **Access permissions**: `Read, Write, Delete`
4. Clique em **"Generate"**
5. **COPIE O TOKEN** (aparece apenas uma vez!)
   - Formato: `dckr_pat_xxxxxxxxxxxxxxxxxxxxx`

### Passo 2: Configurar Secrets no GitHub

1. Acesse seu repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **"New repository secret"**
4. Crie dois secrets:

**Secret 1:**
- **Name**: `DOCKERHUB_USERNAME`
- **Value**: `seuusername` (seu username do Docker Hub)

**Secret 2:**
- **Name**: `DOCKERHUB_TOKEN`
- **Value**: Cole o token gerado anteriormente

### Passo 3: Criar Workflow do GitHub Actions

Crie o arquivo `.github/workflows/docker-publish.yml`:

```bash
mkdir -p .github/workflows
```

Conteúdo do arquivo `.github/workflows/docker-publish.yml`:

```yaml
name: Build and Push Docker Image

on:
  push:
    branches:
      - main
      - master
      - develop
    tags:
      - 'v*'
  pull_request:
    branches:
      - main
      - master

env:
  REGISTRY: docker.io
  IMAGE_NAME: ${{ secrets.DOCKERHUB_USERNAME }}/assetly-nav-brasil

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract metadata (tags, labels)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Image digest
        run: echo ${{ steps.meta.outputs.tags }}
```

### Passo 4: Commit e Push do Workflow

```bash
git add .github/workflows/docker-publish.yml
git commit -m "feat: Add Docker Hub automated deployment"
git push origin main
```

### Passo 5: Verificar Execução

1. Acesse: `https://github.com/SEU_USUARIO/SEU_REPO/actions`
2. Você verá o workflow executando
3. Aguarde a conclusão (5-10 minutos)
4. Verifique no Docker Hub a nova imagem publicada

---

## 🏷️ Sistema de Releases Automáticos

### Estratégia de Versionamento (Semantic Versioning)

O projeto usará versionamento semântico: `MAJOR.MINOR.PATCH`

- **MAJOR** (v1.0.0 → v2.0.0): Mudanças incompatíveis
- **MINOR** (v1.0.0 → v1.1.0): Novas funcionalidades compatíveis
- **PATCH** (v1.0.0 → v1.0.1): Correções de bugs

### Tipo 1: Release Manual com Tags

#### Criar uma Release/Tag

```bash
# Versão atual do projeto
git tag v1.0.0 -m "Release inicial - Primeira versão estável"
git push origin v1.0.0
```

Isso automaticamente:
1. Dispara o GitHub Actions
2. Cria imagem com tags:
   - `seuusername/assetly-nav-brasil:v1.0.0`
   - `seuusername/assetly-nav-brasil:1.0`
   - `seuusername/assetly-nav-brasil:latest`

#### Criar Release no GitHub (UI)

1. Acesse: `https://github.com/SEU_USUARIO/SEU_REPO/releases`
2. Clique em **"Draft a new release"**
3. Configure:
   - **Tag version**: `v1.0.0` (criar nova tag)
   - **Release title**: `v1.0.0 - Primeira Versão Estável`
   - **Description**:
     ```markdown
     ## 🎉 Release v1.0.0 - Primeira Versão Estável

     ### ✨ Novas Funcionalidades
     - Sistema de autenticação completo
     - Gestão de ativos (CRUD)
     - Gestão de DNBs
     - Gestão de usuários
     - Sistema de auditoria
     - Dashboard com estatísticas

     ### 🐳 Imagem Docker
     ```bash
     docker pull seuusername/assetly-nav-brasil:v1.0.0
     ```

     ### 📦 Como usar
     Consulte o arquivo `README.md` para instruções de instalação.
     ```
   - **Set as the latest release**: ✅ Marcar
4. Clique em **"Publish release"**

### Tipo 2: Release Automático a Cada Commit

#### Opção A: Criar Tag Automaticamente com Conventional Commits

Instale o pacote `standard-version`:

```bash
npm install --save-dev standard-version
```

Adicione scripts no `package.json`:

```json
{
  "scripts": {
    "release": "standard-version",
    "release:minor": "standard-version --release-as minor",
    "release:major": "standard-version --release-as major",
    "release:patch": "standard-version --release-as patch"
  }
}
```

**Uso:**

```bash
# Automaticamente determina a versão baseado nos commits
npm run release

# Forçar versão específica
npm run release:minor  # v1.0.0 → v1.1.0
npm run release:major  # v1.0.0 → v2.0.0
npm run release:patch  # v1.0.0 → v1.0.1

# Fazer push da tag
git push --follow-tags origin main
```

**Padrão de Commits (Conventional Commits):**

```bash
# Correção de bug (PATCH)
git commit -m "fix: corrigir erro no login"

# Nova funcionalidade (MINOR)
git commit -m "feat: adicionar exportação de relatórios"

# Mudança incompatível (MAJOR)
git commit -m "feat!: mudar estrutura da API"
# ou
git commit -m "feat: mudar estrutura da API

BREAKING CHANGE: endpoints da API foram renomeados"
```

#### Opção B: Workflow Automático de Release

Crie `.github/workflows/release.yml`:

```yaml
name: Create Release

on:
  push:
    branches:
      - main
      - master

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Bump version and push tag
        id: tag_version
        uses: mathieudutour/github-tag-action@v6.1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          default_bump: patch
          release_branches: main,master

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ steps.tag_version.outputs.new_tag }}
          release_name: Release ${{ steps.tag_version.outputs.new_tag }}
          body: ${{ steps.tag_version.outputs.changelog }}
          draft: false
          prerelease: false
```

Agora, **a cada push na branch main**, será criada automaticamente:
- Nova tag versionada
- Nova release no GitHub
- Nova imagem Docker com a tag

### Tipo 3: Release Apenas em PRs Aprovados

Crie `.github/workflows/release-on-merge.yml`:

```yaml
name: Release on PR Merge

on:
  pull_request:
    types: [closed]
    branches:
      - main
      - master

jobs:
  release:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Determine version bump
        id: bump
        run: |
          if [[ "${{ github.event.pull_request.title }}" =~ ^feat!:|BREAKING ]]; then
            echo "bump=major" >> $GITHUB_OUTPUT
          elif [[ "${{ github.event.pull_request.title }}" =~ ^feat: ]]; then
            echo "bump=minor" >> $GITHUB_OUTPUT
          else
            echo "bump=patch" >> $GITHUB_OUTPUT
          fi

      - name: Bump version and create tag
        id: tag_version
        uses: mathieudutour/github-tag-action@v6.1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          default_bump: ${{ steps.bump.outputs.bump }}
          release_branches: main,master

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ steps.tag_version.outputs.new_tag }}
          release_name: Release ${{ steps.tag_version.outputs.new_tag }}
          body: |
            ## Changes in this Release
            ${{ github.event.pull_request.title }}

            **PR:** #${{ github.event.pull_request.number }}
            **Author:** @${{ github.event.pull_request.user.login }}

            ${{ steps.tag_version.outputs.changelog }}
```

**Fluxo de trabalho:**
1. Criar branch: `git checkout -b feature/nova-funcionalidade`
2. Fazer alterações e commits
3. Push: `git push origin feature/nova-funcionalidade`
4. Criar Pull Request no GitHub
5. Após aprovação e merge → Release automático criado

---

## 📦 Usando a Imagem em Outros Lugares

### 1. Uso com Docker Run

```bash
docker pull seuusername/assetly-nav-brasil:latest

docker network create assetly-network

docker run -d \
  --name assetly-mongodb \
  --network assetly-network \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=SUA_SENHA_SEGURA \
  mongo:7.0

docker run -d \
  --name assetly-web \
  --network assetly-network \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://admin:SUA_SENHA@assetly-mongodb:27017/assetly?authSource=admin \
  -e NEXTAUTH_URL=http://seu-dominio.com:3000 \
  -e NEXTAUTH_SECRET=seu_secret_aqui \
  -e NODE_ENV=production \
  seuusername/assetly-nav-brasil:latest
```

### 2. Uso com Docker Compose

Crie arquivo `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: assetly-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    networks:
      - assetly-network

  web:
    image: seuusername/assetly-nav-brasil:latest
    container_name: assetly-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/assetly?authSource=admin
      - NEXTAUTH_URL=${APP_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NODE_ENV=production
    depends_on:
      - mongodb
    networks:
      - assetly-network

volumes:
  mongodb_data:
    driver: local

networks:
  assetly-network:
    driver: bridge
```

Crie arquivo `.env.production`:

```env
MONGO_PASSWORD=sua_senha_segura_aqui
APP_URL=http://seu-dominio.com:3000
NEXTAUTH_SECRET=gere_um_secret_com_openssl_rand_base64_32
```

Execute:

```bash
docker-compose -f docker-compose.production.yml up -d
```

### 3. Uso em Servidor Cloud (AWS, DigitalOcean, etc.)

#### AWS EC2 / DigitalOcean Droplet

```bash
# 1. Conectar ao servidor
ssh seu-usuario@ip-do-servidor

# 2. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Criar diretório do projeto
mkdir -p ~/assetly
cd ~/assetly

# 5. Criar docker-compose.yml (copiar conteúdo acima)
nano docker-compose.production.yml

# 6. Criar .env.production
nano .env.production

# 7. Iniciar aplicação
docker-compose -f docker-compose.production.yml up -d

# 8. Verificar logs
docker-compose -f docker-compose.production.yml logs -f
```

### 4. Uso com Kubernetes

Crie `kubernetes-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: assetly-web
  labels:
    app: assetly
spec:
  replicas: 3
  selector:
    matchLabels:
      app: assetly
  template:
    metadata:
      labels:
        app: assetly
    spec:
      containers:
      - name: assetly-web
        image: seuusername/assetly-nav-brasil:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: assetly-secrets
              key: mongodb-uri
        - name: NEXTAUTH_URL
          value: "https://assetly.seudominio.com"
        - name: NEXTAUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: assetly-secrets
              key: nextauth-secret
        - name: NODE_ENV
          value: "production"
---
apiVersion: v1
kind: Service
metadata:
  name: assetly-service
spec:
  selector:
    app: assetly
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

Deploy:

```bash
kubectl apply -f kubernetes-deployment.yaml
```

### 5. Atualização para Nova Versão

#### Especificar Versão Exata

```bash
# Parar versão atual
docker-compose down

# Atualizar imagem
docker pull seuusername/assetly-nav-brasil:v1.2.0

# Editar docker-compose.yml para usar a versão específica
# image: seuusername/assetly-nav-brasil:v1.2.0

# Reiniciar
docker-compose up -d
```

#### Sempre Última Versão (latest)

```bash
docker-compose pull
docker-compose up -d
```

---

## 📚 Boas Práticas e Troubleshooting

### Boas Práticas de Versionamento

#### 1. Nomenclatura de Tags

```bash
# ✅ Recomendado
v1.0.0
v1.2.3
v2.0.0-beta.1
v1.5.0-rc.2

# ❌ Evitar
version-1
1.0
latest-production
```

#### 2. Múltiplas Tags para Flexibilidade

Uma mesma imagem deve ter várias tags:

```bash
# Versão exata
docker tag assetly:latest seuusername/assetly-nav-brasil:v1.2.3
docker tag assetly:latest seuusername/assetly-nav-brasil:1.2
docker tag assetly:latest seuusername/assetly-nav-brasil:1
docker tag assetly:latest seuusername/assetly-nav-brasil:latest

# Push todas
docker push seuusername/assetly-nav-brasil --all-tags
```

Usuários podem escolher:
- `v1.2.3` - Versão exata, nunca muda
- `1.2` - Última patch da versão 1.2.x
- `1` - Última minor da versão 1.x.x
- `latest` - Sempre a mais recente

#### 3. Changelog Automático

Use commitizen ou conventional commits para gerar changelog automático:

```bash
# Instalar
npm install -g commitizen cz-conventional-changelog

# Configurar
echo '{ "path": "cz-conventional-changelog" }' > ~/.czrc

# Usar
git cz
# Ou
npm run commit
```

### Troubleshooting Comum

#### Problema 1: Build Falha no GitHub Actions

**Erro:** `Error: buildx failed with: ERROR: failed to solve: process "/bin/sh -c npm run build" did not complete successfully`

**Solução:**
1. Verifique se o build funciona localmente:
   ```bash
   docker build -t teste .
   ```
2. Adicione logs ao Dockerfile para debug:
   ```dockerfile
   RUN npm install --include=dev && \
       echo "Dependencies installed" && \
       ls -la node_modules && \
       npm run build
   ```

#### Problema 2: Imagem Muito Grande

**Sintomas:** Imagem com mais de 1GB

**Soluções:**

1. **Multi-stage build** (já implementado no Dockerfile)
2. **Usar Alpine Linux:**
   ```dockerfile
   FROM node:18-alpine AS builder
   ```
3. **Limpar cache:**
   ```dockerfile
   RUN npm ci --only=production && \
       npm cache clean --force
   ```

#### Problema 3: Erro de Autenticação no Docker Hub

**Erro:** `unauthorized: authentication required`

**Solução:**
```bash
# Re-login
docker logout
docker login -u seuusername

# Verificar se o token está correto no GitHub Secrets
```

#### Problema 4: Tags Não Aparecem no Docker Hub

**Possíveis causas:**
1. Workflow não executou (verificar Actions no GitHub)
2. Secrets incorretos (DOCKERHUB_USERNAME, DOCKERHUB_TOKEN)
3. Permissões do token insuficientes (deve ter Write)

**Solução:**
```bash
# Verificar tags locais
git tag -l

# Deletar tag local e remota se necessário
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Recriar
git tag v1.0.0
git push origin v1.0.0
```

#### Problema 5: Container Inicia mas Aplicação Não Responde

**Debug:**

```bash
# Ver logs do container
docker logs assetly-web -f

# Entrar no container
docker exec -it assetly-web sh

# Verificar processo Node
ps aux | grep node

# Testar conexão com MongoDB
wget -O- mongodb:27017
```

**Soluções comuns:**
1. Variáveis de ambiente incorretas
2. MongoDB não acessível
3. Porta já em uso
4. Falta de memória

### Segurança

#### 1. Nunca Commite Secrets

```bash
# .gitignore deve conter:
.env
.env.local
.env.production
*.pem
*.key
secrets/
```

#### 2. Use Docker Secrets em Produção

```yaml
# docker-compose.yml
services:
  web:
    secrets:
      - db_password
      - nextauth_secret

secrets:
  db_password:
    file: ./secrets/db_password.txt
  nextauth_secret:
    file: ./secrets/nextauth_secret.txt
```

#### 3. Scan de Vulnerabilidades

```bash
# Usar Trivy
docker run -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image seuusername/assetly-nav-brasil:latest

# Ou Docker Scout
docker scout cves seuusername/assetly-nav-brasil:latest
```

### Monitoramento

#### Adicionar Healthcheck ao Dockerfile

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"
```

#### Logs Estruturados

Use Winston ou Pino para logs JSON:

```javascript
// lib/logger.js
import winston from 'winston';

export const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});
```

### Performance

#### Otimizar Build Time

```yaml
# .github/workflows/docker-publish.yml
- name: Build and push
  uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
    platforms: linux/amd64  # Remover arm64 se não necessário
```

---

## 🎯 Checklist Final

Antes de considerar completo, verifique:

- [ ] ✅ Conta Docker Hub criada
- [ ] ✅ Repositório Docker Hub configurado
- [ ] ✅ Secrets configurados no GitHub
- [ ] ✅ Workflow GitHub Actions funcionando
- [ ] ✅ Build local bem-sucedido
- [ ] ✅ Primeira release criada (v1.0.0)
- [ ] ✅ Imagem disponível no Docker Hub
- [ ] ✅ Testado pull da imagem em outro ambiente
- [ ] ✅ Docker Compose de produção configurado
- [ ] ✅ Documentação README.md atualizada
- [ ] ✅ .env.example criado com variáveis necessárias

---

## 📖 Referências

- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [GitHub Actions - Docker](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verificar logs do GitHub Actions
2. Consultar Issues do repositório
3. Documentação oficial do Docker Hub
4. Stack Overflow com tag `docker` e `github-actions`

---

**Criado em:** Novembro 2025
**Versão do Documento:** 1.0
**Autor:** Equipe Assetly NAV Brasil
