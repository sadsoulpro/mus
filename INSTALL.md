# Mus.Link — Production Deployment Guide

**OS:** Ubuntu 24.04 LTS (noble)  
**Архитектура:** FastAPI backend + React frontend на одном VPS  
**Web server:** Caddy с Cloudflare DNS-01  
**TLS:** Wildcard сертификат (*.mus.link)  

---

## Требования к серверу

| Параметр | Значение |
|----------|----------|
| OS | Ubuntu 24.04 LTS (noble) |
| CPU | 4 vCPU |
| RAM | 8 GB |
| System disk | 80 GB SSD |
| Data volume | 100 GB (отдельный volume) |

### Структура дисков

| Диск | Назначение | Содержимое |
|------|------------|------------|
| System disk (80 GB) | Система и код | `/var/www/mus-link`, `/etc`, `/usr` |
| Data volume (100 GB) | Данные | `/data/mongodb`, `/data/uploads` |

---

## Архитектура окружений

### PRODUCTION

| Параметр | Значение |
|----------|----------|
| Домены | `mus.link`, `www.mus.link`, `*.mus.link` |
| Frontend | Static build через Caddy |
| Backend | PM2 → `127.0.0.1:8001` |
| Frontend port | — (static files) |
| Backend port | 8001 |

### DEVELOPMENT

| Параметр | Значение |
|----------|----------|
| Домен | `dev.mus.link` |
| Frontend | Dev server через Caddy proxy |
| Backend | PM2 → `127.0.0.1:8001` |
| Frontend port | 3001 |
| Backend port | 8001 |

---

## Часть 1: Подготовка сервера

### 1.1. Обновление системы

```bash
sudo apt update
sudo apt upgrade -y
sudo reboot
```

### 1.2. Установка базовых пакетов

```bash
sudo apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

---

## Часть 2: Настройка Data Volume

### 2.1. Определение volume

Выполните команду для просмотра дисков:

```bash
lsblk
```

Найдите неразмеченный диск (100 GB). В данном руководстве используется `/dev/vdb`. Замените на ваш диск.

### 2.2. Создание раздела и файловой системы

```bash
sudo parted /dev/vdb --script mklabel gpt
sudo parted /dev/vdb --script mkpart primary ext4 0% 100%
sudo mkfs.ext4 /dev/vdb1
```

### 2.3. Создание точки монтирования

```bash
sudo mkdir -p /data
```

### 2.4. Получение UUID

```bash
sudo blkid /dev/vdb1
```

Скопируйте значение UUID (формат: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

### 2.5. Настройка автомонтирования

Откройте fstab:

```bash
sudo nano /etc/fstab
```

Добавьте строку (замените UUID на ваш):

```
UUID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx /data ext4 defaults,nofail 0 2
```

### 2.6. Монтирование и проверка

```bash
sudo mount -a
df -h /data
```

Ожидаемый вывод: `/data` примонтирован с ~100 GB доступного места.

### 2.7. Создание директорий данных

```bash
sudo mkdir -p /data/mongodb
sudo mkdir -p /data/uploads
sudo mkdir -p /data/uploads/covers
```

---

## Часть 3: Установка MongoDB 7.0

### 3.1. Импорт GPG ключа

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
```

### 3.2. Добавление репозитория для Ubuntu 24.04

```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

### 3.3. Установка MongoDB

```bash
sudo apt update
sudo apt install -y mongodb-org
```

### 3.4. Настройка хранения данных на volume

Откройте конфигурацию MongoDB:

```bash
sudo nano /etc/mongod.conf
```

Измените секцию `storage`:

```yaml
storage:
  dbPath: /data/mongodb
```

### 3.5. Установка прав доступа

```bash
sudo chown -R mongodb:mongodb /data/mongodb
sudo chmod 755 /data/mongodb
```

### 3.6. Запуск MongoDB

```bash
sudo systemctl daemon-reload
sudo systemctl enable mongod
sudo systemctl start mongod
sudo systemctl status mongod
```

### 3.7. Проверка работы

```bash
mongosh --eval "db.runCommand({ ping: 1 })"
```

Ожидаемый вывод: `{ ok: 1 }`

---

## Часть 4: Установка Node.js 20 LTS

### 4.1. Установка nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

### 4.2. Активация nvm

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

Добавьте в `~/.bashrc`:

```bash
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
source ~/.bashrc
```

### 4.3. Установка Node.js 20

```bash
nvm install 20
nvm use 20
nvm alias default 20
```

### 4.4. Проверка версии

```bash
node --version
```

Ожидаемый вывод: `v20.x.x`

### 4.5. Установка Yarn

```bash
npm install -g yarn
yarn --version
```

### 4.6. Установка PM2

```bash
npm install -g pm2
pm2 --version
```

---

## Часть 5: Установка Python 3.12

### 5.1. Проверка системного Python

Ubuntu 24.04 включает Python 3.12 по умолчанию:

```bash
python3 --version
```

Ожидаемый вывод: `Python 3.12.x`

### 5.2. Установка venv и pip

```bash
sudo apt install -y python3.12-venv python3-pip
```

---

## Часть 6: Установка Caddy с Cloudflare DNS

### 6.1. Установка Go (требуется для xcaddy)

```bash
sudo apt install -y golang-go
go version
```

### 6.2. Установка xcaddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/xcaddy/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/xcaddy-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/xcaddy/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/xcaddy.list
sudo apt update
sudo apt install -y xcaddy
```

### 6.3. Сборка Caddy с модулем Cloudflare

```bash
cd /tmp
xcaddy build --with github.com/caddy-dns/cloudflare
sudo mv caddy /usr/bin/caddy
sudo chmod +x /usr/bin/caddy
sudo setcap cap_net_bind_service=+ep /usr/bin/caddy
```

### 6.4. Проверка установки

```bash
caddy version
caddy list-modules | grep cloudflare
```

Ожидаемый вывод должен содержать: `dns.providers.cloudflare`

### 6.5. Создание пользователя caddy

```bash
sudo useradd --system --home /var/lib/caddy --shell /usr/sbin/nologin caddy
sudo mkdir -p /var/lib/caddy
sudo mkdir -p /var/log/caddy
sudo mkdir -p /etc/caddy
sudo chown -R caddy:caddy /var/lib/caddy
sudo chown -R caddy:caddy /var/log/caddy
```

---

## Часть 7: Клонирование проекта

### 7.1. Создание директории

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/sadsoulpro/mu-mu.git mus-link
sudo chown -R $USER:$USER /var/www/mus-link
cd /var/www/mus-link
```

### 7.2. Создание символической ссылки для uploads

```bash
ln -s /data/uploads /var/www/mus-link/backend/uploads
```

---

## Часть 8: Настройка Backend

### 8.1. Создание виртуального окружения

```bash
cd /var/www/mus-link/backend
python3 -m venv venv
source venv/bin/activate
```

### 8.2. Установка зависимостей

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 8.3. Создание .env файла (PRODUCTION)

```bash
nano /var/www/mus-link/backend/.env
```

Содержимое:

```env
# Database
MONGO_URL=mongodb://localhost:27017/smartlink
DB_NAME=smartlink

# Security
JWT_SECRET=GENERATE_SECURE_64_CHAR_STRING_HERE

# Owner
OWNER_EMAIL=admin@mus.link

# URLs
FRONTEND_URL=https://mus.link
MAIN_DOMAIN=mus.link
CORS_ORIGINS=https://mus.link,https://www.mus.link

# Resend API
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
SENDER_EMAIL=noreply@mus.link

# Hugging Face API
HUGGINGFACE_TOKEN=hf_XXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Uploads path
UPLOAD_DIR=/data/uploads
```

### 8.4. Генерация JWT_SECRET

```bash
openssl rand -hex 32
```

Вставьте результат в переменную `JWT_SECRET`.

### 8.5. Деактивация venv

```bash
deactivate
```

---

## Часть 9: Настройка Frontend

### 9.1. Установка зависимостей

```bash
cd /var/www/mus-link/frontend
yarn install
```

### 9.2. Создание .env файла (PRODUCTION)

```bash
nano /var/www/mus-link/frontend/.env
```

Содержимое:

```env
REACT_APP_BACKEND_URL=https://mus.link/api
```

### 9.3. Сборка production build

```bash
yarn build
```

Результат: директория `/var/www/mus-link/frontend/build`

---

## Часть 10: Настройка PM2

### 10.1. Создание ecosystem файла

```bash
nano /var/www/mus-link/ecosystem.config.js
```

Содержимое:

```javascript
module.exports = {
  apps: [
    {
      name: 'mus-link-backend',
      cwd: '/var/www/mus-link/backend',
      script: '/var/www/mus-link/backend/venv/bin/uvicorn',
      args: 'server:app --host 127.0.0.1 --port 8001',
      interpreter: 'none',
      env: {
        PATH: '/var/www/mus-link/backend/venv/bin:' + process.env.PATH
      }
    }
  ]
};
```

### 10.2. Запуск backend

```bash
cd /var/www/mus-link
pm2 start ecosystem.config.js
pm2 save
```

### 10.3. Настройка автозапуска PM2

```bash
pm2 startup
```

Выполните команду, которую выведет PM2 (начинается с `sudo env PATH=...`).

### 10.4. Проверка статуса

```bash
pm2 status
pm2 logs mus-link-backend --lines 20
```

---

## Часть 11: Настройка Cloudflare

### 11.1. DNS записи

В панели Cloudflare для домена `mus.link` создайте записи:

| Type | Name | Content | Proxy status |
|------|------|---------|--------------|
| A | @ | IP_СЕРВЕРА | DNS only |
| A | www | IP_СЕРВЕРА | DNS only |
| A | * | IP_СЕРВЕРА | DNS only |
| A | dev | IP_СЕРВЕРА | DNS only |

**Важно:** Все записи должны быть в режиме "DNS only" (серая иконка облака).

### 11.2. Создание API Token

1. Откройте https://dash.cloudflare.com/profile/api-tokens
2. Нажмите **Create Token**
3. Выберите **Custom token**
4. Настройки:
   - Token name: `caddy-dns`
   - Permissions: Zone → DNS → Edit
   - Zone Resources: Include → Specific zone → mus.link
5. Нажмите **Continue to summary** → **Create Token**
6. Скопируйте токен

### 11.3. Сохранение токена на сервере

```bash
sudo nano /etc/caddy/cloudflare.env
```

Содержимое:

```
CLOUDFLARE_API_TOKEN=ваш_токен_здесь
```

```bash
sudo chmod 600 /etc/caddy/cloudflare.env
sudo chown caddy:caddy /etc/caddy/cloudflare.env
```

---

## Часть 12: Настройка Caddy

### 12.1. Создание Caddyfile

```bash
sudo nano /etc/caddy/Caddyfile
```

Содержимое:

```caddyfile
{
	email admin@mus.link
	acme_dns cloudflare {env.CLOUDFLARE_API_TOKEN}
}

# PRODUCTION: mus.link + www.mus.link
mus.link, www.mus.link {
	encode zstd gzip

	header {
		X-Content-Type-Options "nosniff"
		X-Frame-Options "SAMEORIGIN"
		Referrer-Policy "strict-origin-when-cross-origin"
		-Server
	}

	handle /api/* {
		reverse_proxy 127.0.0.1:8001 {
			header_up Host {host}
			header_up X-Real-IP {remote_host}
			header_up X-Forwarded-For {remote_host}
			header_up X-Forwarded-Proto {scheme}

			transport http {
				read_timeout 120s
				write_timeout 120s
			}
		}
	}

	handle /api/uploads/* {
		uri strip_prefix /api
		root * /data
		file_server
	}

	handle {
		root * /var/www/mus-link/frontend/build

		@static {
			path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2 *.ttf *.eot
		}
		header @static Cache-Control "public, max-age=31536000, immutable"

		try_files {path} /index.html
		file_server
	}

	log {
		output file /var/log/caddy/mus-link-access.log {
			roll_size 10mb
			roll_keep 5
		}
		format json
	}
}

# DEVELOPMENT: dev.mus.link
dev.mus.link {
	encode zstd gzip

	handle /api/* {
		reverse_proxy 127.0.0.1:8001 {
			header_up Host {host}
			header_up X-Real-IP {remote_host}
			header_up X-Forwarded-For {remote_host}
			header_up X-Forwarded-Proto {scheme}
		}
	}

	handle {
		reverse_proxy 127.0.0.1:3001 {
			header_up Host {host}
			header_up X-Real-IP {remote_host}
		}
	}

	log {
		output file /var/log/caddy/dev-access.log {
			roll_size 10mb
			roll_keep 3
		}
	}
}

# WILDCARD: *.mus.link
*.mus.link {
	tls {
		dns cloudflare {env.CLOUDFLARE_API_TOKEN}
	}

	encode zstd gzip

	header {
		X-Content-Type-Options "nosniff"
		X-Frame-Options "SAMEORIGIN"
		Referrer-Policy "strict-origin-when-cross-origin"
		-Server
	}

	@subdomain {
		header_regexp subdomain Host ^([a-zA-Z0-9-]+)\.mus\.link$
	}

	handle /api/* {
		reverse_proxy 127.0.0.1:8001 {
			header_up Host {host}
			header_up X-Real-IP {remote_host}
			header_up X-Forwarded-For {remote_host}
			header_up X-Forwarded-Proto {scheme}
			header_up X-Subdomain {re.subdomain.1}

			transport http {
				read_timeout 120s
				write_timeout 120s
			}
		}
	}

	handle /api/uploads/* {
		uri strip_prefix /api
		root * /data
		file_server
	}

	handle {
		root * /var/www/mus-link/frontend/build

		@static {
			path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2 *.ttf *.eot
		}
		header @static Cache-Control "public, max-age=31536000, immutable"

		try_files {path} /index.html
		file_server
	}

	log {
		output file /var/log/caddy/subdomain-access.log {
			roll_size 10mb
			roll_keep 5
		}
		format json
	}
}
```

### 12.2. Создание systemd сервиса

```bash
sudo nano /etc/systemd/system/caddy.service
```

Содержимое:

```ini
[Unit]
Description=Caddy Web Server
Documentation=https://caddyserver.com/docs/
After=network.target network-online.target
Requires=network-online.target

[Service]
Type=notify
User=caddy
Group=caddy
EnvironmentFile=/etc/caddy/cloudflare.env
ExecStart=/usr/bin/caddy run --environ --config /etc/caddy/Caddyfile
ExecReload=/usr/bin/caddy reload --config /etc/caddy/Caddyfile --force
TimeoutStopSec=5s
LimitNOFILE=1048576
LimitNPROC=512
PrivateTmp=true
ProtectSystem=full
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
```

### 12.3. Запуск Caddy

```bash
sudo systemctl daemon-reload
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable caddy
sudo systemctl start caddy
sudo systemctl status caddy
```

---

## Часть 13: Настройка Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## Часть 14: Проверка деплоя

### 14.1. Проверка сервисов

```bash
# MongoDB
sudo systemctl status mongod

# PM2 / Backend
pm2 status

# Caddy
sudo systemctl status caddy
```

### 14.2. Проверка портов

```bash
sudo ss -tlnp | grep -E '80|443|8001|27017'
```

Ожидаемый вывод:

```
LISTEN  0  511  *:80       *:*  users:(("caddy",...))
LISTEN  0  511  *:443      *:*  users:(("caddy",...))
LISTEN  0  128  127.0.0.1:8001  *:*  users:(("uvicorn",...))
LISTEN  0  128  127.0.0.1:27017 *:*  users:(("mongod",...))
```

### 14.3. Проверка PRODUCTION

```bash
# Главная страница
curl -I https://mus.link

# API health
curl https://mus.link/api/health

# www redirect
curl -I https://www.mus.link
```

### 14.4. Проверка TLS сертификата

```bash
echo | openssl s_client -connect mus.link:443 -servername mus.link 2>/dev/null | openssl x509 -noout -dates
```

### 14.5. Проверка wildcard сертификата

```bash
echo | openssl s_client -connect test.mus.link:443 -servername test.mus.link 2>/dev/null | openssl x509 -noout -text | grep -A1 "Subject Alternative Name"
```

### 14.6. Проверка volume

```bash
df -h /data
ls -la /data/mongodb
ls -la /data/uploads
```

---

## Часть 15: Настройка DEVELOPMENT окружения

### 15.1. Запуск frontend dev server

Откройте отдельную SSH сессию:

```bash
cd /var/www/mus-link/frontend
yarn start --port 3001
```

Альтернатива — добавить в PM2:

```bash
pm2 start "yarn start --port 3001" --name "mus-link-frontend-dev" --cwd /var/www/mus-link/frontend
pm2 save
```

### 15.2. Проверка DEV

```bash
curl -I https://dev.mus.link
```

---

## Управление сервисами

### MongoDB

```bash
sudo systemctl start mongod
sudo systemctl stop mongod
sudo systemctl restart mongod
sudo systemctl status mongod
```

### PM2 (Backend)

```bash
pm2 status
pm2 logs mus-link-backend
pm2 restart mus-link-backend
pm2 stop mus-link-backend
```

### Caddy

```bash
sudo systemctl start caddy
sudo systemctl stop caddy
sudo systemctl restart caddy
sudo systemctl status caddy

# Перезагрузка конфига без downtime
sudo caddy reload --config /etc/caddy/Caddyfile

# Валидация конфига
sudo caddy validate --config /etc/caddy/Caddyfile
```

---

## Логи

```bash
# Backend
pm2 logs mus-link-backend --lines 100

# Caddy (systemd)
sudo journalctl -u caddy -f

# Caddy access logs
sudo tail -f /var/log/caddy/mus-link-access.log

# MongoDB
sudo journalctl -u mongod -f
```

---

## Обновление проекта

```bash
cd /var/www/mus-link
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
pm2 restart mus-link-backend

# Frontend (production)
cd ../frontend
yarn install
yarn build

# Caddy (при изменении Caddyfile)
sudo caddy reload --config /etc/caddy/Caddyfile
```

---

## Структура файлов

```
/var/www/mus-link/
├── backend/
│   ├── venv/
│   ├── server.py
│   ├── requirements.txt
│   ├── .env                    # Production env
│   └── uploads -> /data/uploads
├── frontend/
│   ├── src/
│   ├── build/                  # Production build
│   ├── package.json
│   └── .env
├── deploy/
│   └── caddy/
│       ├── Caddyfile
│       └── README.md
└── ecosystem.config.js

/data/
├── mongodb/                    # MongoDB data
└── uploads/                    # User uploads
    └── covers/

/etc/caddy/
├── Caddyfile
└── cloudflare.env              # Cloudflare API token
```

---

## Переменные окружения

### Backend .env (`/var/www/mus-link/backend/.env`)

| Переменная | Назначение |
|------------|------------|
| MONGO_URL | Строка подключения к MongoDB |
| DB_NAME | Имя базы данных |
| JWT_SECRET | Секретный ключ для JWT токенов |
| OWNER_EMAIL | Email администратора (роль owner) |
| FRONTEND_URL | URL фронтенда для ссылок в письмах |
| MAIN_DOMAIN | Основной домен |
| CORS_ORIGINS | Разрешённые origins для CORS |
| RESEND_API_KEY | API ключ Resend для email |
| SENDER_EMAIL | Email отправителя |
| HUGGINGFACE_TOKEN | API токен Hugging Face |
| UPLOAD_DIR | Директория для загрузок |

### Frontend .env (`/var/www/mus-link/frontend/.env`)

| Переменная | Назначение |
|------------|------------|
| REACT_APP_BACKEND_URL | URL API для запросов |

### Cloudflare .env (`/etc/caddy/cloudflare.env`)

| Переменная | Назначение |
|------------|------------|
| CLOUDFLARE_API_TOKEN | API токен для DNS-01 challenge |

---

## OPTIONAL: Python 3.11 fallback

Используйте этот раздел только при наличии несовместимости зависимостей с Python 3.12.

### Установка Python 3.11

```bash
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.11 python3.11-venv
```

### Создание venv с Python 3.11

```bash
cd /var/www/mus-link/backend
rm -rf venv
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
```

### Перезапуск backend

```bash
pm2 restart mus-link-backend
```
