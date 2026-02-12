# 🧱 Requisitos para Subir o Projeto

## ⚙️ Pré-requisitos

Você precisa ter **PostgreSQL** instalado **ou** o **Docker** disponível em sua máquina.

### 🐘 Caso esteja usando PostgreSQL local
Crie um banco de dados local de acordo com as configurações definidas no arquivo:
`src/main/resources/application.yaml`

### Caso esteja usando Docker
Na raiz do projeto execute o comando `docker-compose up -d` para subir um container de um banco local PostgreSQL.


## Criando Migrations
Para criar uma migration, vá até o diretório `src/main/resources/db` e faça:
### Caso esteja no Windows:
Execute o comando `./generate-migration.ps1 nome-da-migration`

### Caso esteja no Unix:
Execute o comando `./generate-migration.sh nome-da-migration`

### Rodando a Migration
Rode o projeto para executar as migrations automaticamente 