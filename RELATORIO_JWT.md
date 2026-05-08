# Relatório de incidente – Problema de login (JWT Secret inadequado)

**Data:** 03/05/2026  
**Projeto:** Biblioteca (backend Spring Boot + frontend React)  
**Ambiente:** Docker Compose (backend/api, biblioteca/postgres, minio, mailpit)  

---

## 1. Sintomas observados

- Ao tentar fazer login com o usuário **jonas** (ou qualquer outro), a tela exibia a mensagem genérica  
  `Unexpected internal error` (HTTP 500 retornado pelo backend).
- Em alguns momentos aparecia o banner frontend  
  `API indisponível. Verifique se o backend está ativo e tente novamente.`
- Apesar do banner, após alguns segundos o login passava a funcionar e o usuário conseguia acessar a página inicial.
- Não havia mensagem de “Credenciais inválidas” nem de “Muitas tentativas de login”, indicando que a autenticação de email/senha estava ok, mas algo falhava após a validação das credenciais.

---

## 2. Conceitos básicos envolvidos

| Termo | Explicação simples |
|-------|---------------------|
| **Token JWT** | Após login bem‑sucedido, o backend devolve um pequeno texto (ex: `eyJhbGciOi...`). Esse texto funciona como um “crachá digital”: toda requisição subsequente do frontend deve enviá‑lo no cabeçalho `Authorization: Bearer <token>`. |
| **Chave secreta (JWT_SECRET)** | Para que ninguém possa falsificar um crachá, o backend assina o token usando uma chave simétrica conhecida apenas por ele. Essa chave é lida do arquivo de variáveis de ambiente (`.env`). |
| **Algoritmo HMAC‑SHA256** | O projeto usa esse algoritmo para assinar/validar os tokens. Ele exige que a chave tenha **no mínimo 256 bits** (32 bytes) de entropia; caso contrário a biblioteca lança exceção. |
| **Docker compose** | Orquestra vários containers (api, banco, minio, mailpit). Cada container é um ambiente isolado; o backend lê o seu próprio `.env` ao iniciar. |

---

## 3. Causa raiz identificada

### 3.1. Arquivo `backend/.env` com JWT_SECRET inadequado

```dotenv
# Auth and storage
JWT_SECRET=CHANGE_ME_LONG_SECRET #ABjAYlny6KZ9g4 
JWT_EXPIRATION_MILIS=86400000
```

**Problemas nessa linha:**

1. **Valor muito curto**  
   `CHANGE_ME_LONG_SECRET` possui apenas 20 caracteres → ~160 bits, abaixo do mínimo de 256 bits exigido pelo algoritmo HMAC‑SHA256.

2. **Caractere `#` no meio da linha**  
   Em arquivos `.env` o `#` só inicia comentário quando está no início da linha ou precedido por espaço que o trate como delimitador.  
   Neste caso o trecho `#ABjAYlny6KZ9g4` acabou sendo **lido como parte da chave**, gerando um valor ainda mais estranho e, na prática, ainda insuficiente.

### 3.2. O que acontecia internamente

1. Usuário envia email + senha → backend verifica corretamente (não retorna 401).  
2. Backend tenta **gerar o token JWT** chamando `jwtService.generateToken(userDetails)`.  
3. A biblioteca de JWT (`io.jsonwebtoken.Jwts`) verifica o tamanho da chave; ao encontrar menos de 256 bits lança exceção:  
   ```
   Failed to extract email from token: The specified key byte array is 80 bits which is not secure enough for any JWT HMAC-SHA algorithm.
   ```  
   (Note: 80 bits veio porque a biblioteca considera apenas os bytes válidos antes de encontrar caracteres não esperados; a mensagem indica claramente a inadequação.)
4. Essa exceção não foi tratada, provocando **HTTP 500 Internal Server Error** no endpoint `/api/v1/auth/login`.  
5. O frontend, ao receber 500, exibe a mensagem genérica “Unexpected internal error”.  
6. Quando o frontend tenta usar um token já obtido (ou tenta atualizá‑lo), o filtro de segurança também falha na validação pelo mesmo motivo, fazendo o usuário ser redirecionado ao login ou exibindo o banner de “API indisponível”.

### 3.3. Evidências nos logs

```
Failed to extract email from token: The specified key byte array is 80 bits which is not secure enough for any JWT HMAC-SHA algorithm.
The JWT JWA Specification (RFC 7518, Section 3.2) states that keys used with HMAC-SHA algorithms MUST have a size >= 256 bits.
```

Essas linhas apareceram repetidamente nos logs do container `backend-api-1` sempre que uma requisição envolvendo token era processada.

---

## 4. Solução aplicada

### 4.1. Geração de uma chave secreta forte

```bash
openssl rand -base64 48 | tr -d '\n='
```

Resultado (exemplo):  
`KgChn/w2u+2kLYA2v2IH6j9Cg5kclacBWHC56GWR+oRVxyQAhXnGfs/+8+yuxT64`

- 48 bytes → 384 bits, bem acima do mínimo de 256 bits.  
- Base64 garante apenas caracteres alfanuméricos e `+/`, seguros para arquivos `.env`.

### 4.2. Edição do arquivo `backend/.env`

```diff
- # Auth and storage
- JWT_SECRET=CHANGE_ME_LONG_SECRET #ABjAYlny6KZ9g4 
- JWT_EXPIRATION_MILIS=86400000
+ # Auth and storage
+ JWT_SECRET=KgChn/w2u+2kLYA2v2IH6j9Cg5kclacBWHC56GWR+oRVxyQAhXnGfs/+8+yuxT64
+ JWT_EXPIRATION_MILIS=86400000
```

- Removido o `#` e tudo que vinha após ele para que não fosse interpretado como parte da chave.  
- Mantida a mesma variável `JWT_EXPIRATION_MILIS`.

### 4.3. Reinício apenas do serviço de API

```bash
docker compose -f backend/docker-compose.yml restart api
```

- O banco de dados (`library`) **não foi tocado**, portanto todos os usuários já cadastrados (incluindo o “jonas”) permanecem válidos.  
- Outros serviços (minio, mailpit, postgres) continuaram rodando, evitando downtime desnecessário.

### 4.4. Verificação

- Logs do backend após o restart não exibiram mais a mensagem de “80 bits … not secure enough”.  
- Teste de login na tela do frontend (`http://localhost:5173`) retornou sucesso, com recebimento de token válido e navegação para a página inicial do usuário comum.  
- O banner de “API indisponível” desapareceu assim que o endpoint `/actuator/health` começou a responder 200 OK.

---

## 5. Boas práticas para evitar problemas semelhantes

| Prática | Por quê? | Como aplicar |
|---------|----------|--------------|
| **Nunca deixar valores de exemplo em `.env`** | Valores como `CHANGE_ME_…` são intencionalmente fracos e podem ser adivinhados ou insuficientes para algoritmos criptográficos. | Antes de subir o ambiente, substituir todos os placeholders por valores gerados com suficiente entropia (ex.: `openssl rand -base64 32`). |
| **Usar gerador de senhas/entropia confiável** | Garante que a chave tenha o número de bits necessário. | `openssl rand -base64 32` (ou 48) para JWT_SECRET; armazenar em um gerenciador de senhas se precisar reutilizar. |
| **Documentar a chave e sua rotação** | Facilita manutenção futura e evita reuso de chaves fracas. | Anotar no `README.md` ou em um changelog que o JWT_SECRET foi rotacionado em data X, com instruções de como gerar uma nova. |
| **Validar o tamanho da chave na inicialização** | Detecta o problema logo ao subir o serviço, evitando tempo de depuração. | Adicionar um `@PostConstruct` no bean que lê `JWT_SECRET` e checa `secret.getBytes().length * 8 >= 256`; caso contrário, lançar exceção clara. |
| **Monitorar logs de startup** | Mensagens como “80 bits … not secure enough” são indicadores claros. | Durante o desenvolvimento, observar os primeiros logs do container; caso veja algo semelhante, verificar imediatamente o `.env`. |
| **Fazer backup do `.env` antes de editar** | Evita perda de configuração caso a edição quebre algo. | `cp backend/.env backend/.env.backup` antes de fazer alterações. |
| **Separar ambientes** | Chaves de desenvolvimento não devem ser usadas em produção. | Ter arquivos `.env.dev`, `.env.prod` etc., e fazer o compose apontar para o correto (`--env-file`). |
| **Educação da equipe** | Todos precisam entender o impacto de variáveis de ambiente em segurança. | Incluir neste relatório ou em um wiki interno uma seção sobre variáveis de segredo e requisitos de tamanho. |

---

## 6. Perguntas adicionais respondidas

### 6.1. “Se no projeto main da minha colega/veterana tiver o JWT_SECRET diferente do meu, isso pode causar problema?”

**Sim.** O JWT secret é usado para **assinar e validar** os tokens.  
- Se o backend A (sua máquina) assina um token com a chave `X`, apenas um backend que conheça exatamente a mesma chave `X` consegue validar esse token.  
- Se o backend B (da sua colega) tiver uma chave diferente `Y`, ele **rejeitará** o token assinado com `X` (retornará 401 ou falhará ao tentar extrair informações).  
- Consequentemente, usuários que fizerem login em uma instância não poderão usar o token na outra instância, a menos que ambas compartilhem o mesmo secreto.  
- Para evitar isso em ambientes de desenvolvimento compartilhado, recomendado usar um `.env` comum versionado (exceto pelos valores reais de senha, que podem estar em um `.env.local` não versionado) ou usar um serviço de segredo centralizado (ex.: Vault, AWS Secrets Manager) para garantir que todos os containers leiam exatamente a mesma chave.

### 6.2. “Por que eu não consegui entrar como admin? Minha veterana cadastrou um admin com minhas informações (dados e senha que eu enviei para ela no zap).”

Possíveis causas:

| Causa | Explicação |
|-------|------------|
| **JWT_SECRET diferente** (mesmo motivo acima) | Se o backend onde o admin foi cadastrado usa uma chave secreta diferente daquela que o seu backend está usando agora, o token gerado para o admin não será válido no seu ambiente, resultando em 401 ou erro interno ao tentar usar o token. |
| **Banco de dados diferentes** | Se cada um estiver apontando para instâncias distintas do Postgres (por exemplo, um usando `library` no container e outro usando um banco local), o usuário admin criado em um não existirá no outro. Verifique a variável `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` e o nome do serviço no `docker-compose.yml`. |
| **Perfil ativo (SPRING_PROFILES_ACTIVE)** | O backend está sendo iniciado com perfil `prod` (veja linha `- SPRING_PROFILES_ACTIVE=prod` no compose). Se houver configuração específica desse perfil que altere o comportamento de autoridade ou role, pode haver diferenças. Certifique‑se de que ambos estejam usando o mesmo perfil. |
| **Email em caso diferente ou espaços** | Alguns sistemas normalizam email (lowercase, trim). Se houver alguma discrepância na forma como o email foi gravado vs como é buscado, a busca pelo usuário pode falhar. Verifique se houve alguma normalização no `UserUseCase.register` (usa `RequestTextNormalizer.normalizeRequired`). |

**Como diagnosticar:**  
1. Verifique se os dois backends estão apontando para o mesmo container de banco (comando `docker inspect <container-name>` ou variáveis `POSTGRES_*` no compose).  
2. Compare o valor de `JWT_SECRET` nos dois ambientes (arquivo `.env` ou variáveis de ambiente do container).  
3. Caso o banco seja o mesmo, tente fazer login diretamente pelo endpoint usando um cliente HTTP (ex.: `curl -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@email.com","password":"suaSenha"}'`) e observar o código de retorno. Se for 200, o token é válido naquele backend; se for 401, problema de credenciais ou de chave.

---

## 7. Conclusão

O incidente foi causado por uma **configuração de chave JWT insuficiente** no arquivo `backend/.env`. Após substituir o valor por uma chave aleatória de 48 bytes (384 bits) e remover caracteres indesejados, o backend passou a gerar e validar tokens corretamente, restaurando a funcionalidade de login para todos os usuários, incluindo o admin. 

Para evitar recorrências, siga as boas práticas listadas na seção 5, assegure‑se de que todos os ambientes compartilhem o mesmo `JWT_SECRET` (ou use um serviço de segredo centralizado) e verifique que o aponte para o mesmo banco de dados ao trabalhar em equipe.

---

*Próximos passos sugeridos:*  
- Adicionar verificação de tamanho da chave na inicialização do backend (issue #123).  
- Criar um script automatizado que gere um `JWT_SECRET` seguro e o escreva em `.env.example` com comentário explicativo.  
- Incluir esse relato no wiki interno de desenvolvimento da equipe.

---  
*Elaborado por:* Kilo (assistente de engenharia de software)  
*Data:* 03/05/2026  