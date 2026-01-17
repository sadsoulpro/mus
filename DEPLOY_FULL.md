# Muslink — Полная инструкция по установке на VPS

## Обзор архитектуры

```
┌─────────────────────────────────────────────────────────────┐
│                         VPS                                  │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌──────────┐ │
│  │  Caddy  │───▶│ React   │    │ FastAPI │◀──▶│ MongoDB  │ │
│  │  :443   │    │ (build) │    │  :8001  │    │  :27017  │ │
│  └─────────┘    └─────────┘    └─────────┘    └──────────┘ │
│       │              │              │               │       │
│       └──────────────┴──────────────┘               │       │
│                      │                              │       │
│              /var/www/muslink                /data/mongodb  │
└─────────────────────────────────────────────────────────────┘
```

---

## Структура директорий

```
/var/www/muslink/          # Код приложения
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── build/
│   └── .env
└── DEPLOY.md

/data/                     # Отдельный volume для данных
├── mongodb/               # База данных MongoDB
├── uploads/               # Загруженные файлы пользователей
└── backups/               # Бэкапы
```

---

## Шаг 1: Подготовка VPS

### 1.1 Подключение и обновление

```bash
# Подключение к серверу
ssh root@YOUR_SERVER_IP

# Обновление системы
apt update && apt upgrade -y

# Установка базовых пакетов
apt install -y curl wget git build-essential software-properties-common
```

### 1.2 Создание пользователя (опционально, но рекомендуется)

```bash
# Создание пользователя
adduser muslink
usermod -aG sudo muslink

# Переключение на нового пользователя
su - muslink
```

---

## Шаг 2: Подготовка отдельного volume для данных

### 2.1 Если volume уже примонтирован

```bash
# Проверка примонтированных дисков
lsblk
df -h

# Обычно дополнительный диск: /dev/sdb или /dev/vdb
```

### 2.2 Форматирование и монтирование нового диска

```bash
# Проверка доступных дисков
sudo fdisk -l

# Форматирование (ВНИМАНИЕ: удалит все данные на диске!)
sudo mkfs.ext4 /dev/sdb

# Создание точки монтирования
sudo mkdir -p /data

# Монтирование
sudo mount /dev/sdb /data

# Автоматическое монтирование при перезагрузке
# Получаем UUID диска
sudo blkid /dev/sdb

# Добавляем в fstab (замените UUID на ваш)
echo "UUID=ваш-uuid-здесь /data ext4 defaults 0 2" | sudo tee -a /etc/fstab

# Проверка
sudo mount -a
df -h
```

### 2.3 Создание структуры директорий

```bash
sudo mkdir -p /data/mongodb
sudo mkdir -p /data/uploads
sudo mkdir -p /data/backups

# Права доступа
sudo chown -R $USER:$USER /data/uploads
sudo chown -R $USER:$USER /data/backups
```

---

## Шаг 3: Установка MongoDB

### 3.1 Добавление репозитория и установка

```bash
# Импорт ключа
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Добавление репозитория (Ubuntu 22.04)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Установка
sudo apt update
sudo apt install -y mongodb-org
```

### 3.2 Настройка MongoDB для хранения на отдельном volume

```bash
# Остановка MongoDB
sudo systemctl stop mongod

# Изменение пути к данным
sudo nano /etc/mongod.conf
```

Измените секцию `storage`:

```yaml
storage:
  dbPath: /data/mongodb
  journal:
    enabled: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1
```

```bash
# Установка прав для MongoDB
sudo chown -R mongodb:mongodb /data/mongodb

# Запуск MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Проверка статуса
sudo systemctl status mongod

# Проверка подключения
mongosh --eval "db.runCommand({ ping: 1 })"
```

---

## Шаг 4: Установка Node.js

```bash
# Установка Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка версии
node -v
npm -v

# Установка yarn (опционально)
sudo npm install -g yarn
```

---

## Шаг 5: Установка Python

```bash
# Установка Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Проверка версии
python3.11 --version
```

---

## Шаг 6: Установка Caddy

```bash
# Добавление репозитория
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | \
   sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | \
   sudo tee /etc/apt/sources.list.d/caddy-stable.list

# Установка
sudo apt update
sudo apt install -y caddy

# Проверка
caddy version
```

---

## Шаг 7: Клонирование и настройка проекта

### 7.1 Клонирование репозитория

```bash
# Создание директории
sudo mkdir -p /var/www
cd /var/www

# Клонирование (замените на ваш репозиторий)
sudo git clone https://github.com/YOUR_USERNAME/muslink.git
sudo chown -R $USER:$USER /var/www/muslink

cd /var/www/muslink
```

### 7.2 Настройка Backend

```bash
cd /var/www/muslink/backend

# Создание виртуального окружения
python3.11 -m venv venv
source venv/bin/activate

# Установка зависимостей
pip install --upgrade pip
pip install -r requirements.txt

# Создание .env файла
nano .env
```

**Содержимое `/var/www/muslink/backend/.env`:**

```env
# MongoDB (данные на отдельном volume)
MONGO_URL=mongodb://127.0.0.1:27017/muslink
DB_NAME=muslink

# JWT секрет (ОБЯЗАТЕЛЬНО ЗАМЕНИТЕ на свой!)
# Сгенерировать: openssl rand -hex 32
JWT_SECRET=your-super-secret-key-minimum-32-characters-long

# Email владельца (получит роль owner при регистрации)
OWNER_EMAIL=your-email@example.com

# URLs (замените на ваш домен)
FRONTEND_URL=https://mus.link
MAIN_DOMAIN=mus.link
CORS_ORIGINS=https://mus.link

# Email через Resend (https://resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
SENDER_EMAIL=noreply@mus.link

# Путь для загрузок (отдельный volume)
UPLOADS_PATH=/data/uploads

# AI генерация обложек (опционально)
HUGGINGFACE_TOKEN=hf_xxxxxxxxxxxxxxxxxxxx
```

### 7.3 Настройка Frontend

```bash
cd /var/www/muslink/frontend

# Установка зависимостей
npm install
# или
yarn install

# Создание .env файла
nano .env
```

**Содержимое `/var/www/muslink/frontend/.env`:**

```env
REACT_APP_BACKEND_URL=https://mus.link
```

### 7.4 Сборка Frontend

```bash
cd /var/www/muslink/frontend

# Production сборка
npm run build
# или
yarn build

# Проверка что build создан
ls -la build/
```

---

## Шаг 8: Создание Systemd сервиса для Backend

```bash
sudo nano /etc/systemd/system/muslink.service
```

**Содержимое:**

```ini
[Unit]
Description=Muslink Backend API
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/muslink/backend
Environment="PATH=/var/www/muslink/backend/venv/bin"
EnvironmentFile=/var/www/muslink/backend/.env
ExecStart=/var/www/muslink/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001 --workers 2
Restart=always
RestartSec=5
StandardOutput=append:/var/log/muslink/backend.log
StandardError=append:/var/log/muslink/backend-error.log

[Install]
WantedBy=multi-user.target
```

```bash
# Создание директории для логов
sudo mkdir -p /var/log/muslink
sudo chown www-data:www-data /var/log/muslink

# Права на директории
sudo chown -R www-data:www-data /var/www/muslink
sudo chown -R www-data:www-data /data/uploads

# Активация и запуск сервиса
sudo systemctl daemon-reload
sudo systemctl enable muslink
sudo systemctl start muslink

# Проверка статуса
sudo systemctl status muslink

# Проверка работы API
curl http://127.0.0.1:8001/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

---

## Шаг 9: Настройка Caddy

### 9.1 Создание Caddyfile

```bash
sudo nano /etc/caddy/Caddyfile
```

**Полный Caddyfile:**

```caddyfile
# Главный домен
mus.link {
    # Логирование
    log {
        output file /var/log/caddy/access.log {
            roll_size 10mb
            roll_keep 5
        }
    }

    # Определение ботов соцсетей для OG-тегов
    @ogbots {
        header_regexp User-Agent (?i)(facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot|vkShare|Viber)
    }

    # OG-теги для ботов (публичные страницы)
    handle @ogbots {
        # Если путь не начинается с /api, /static, /_next
        @publicpage not path /api/* /static/* /_next/* /login /register /forgot-password /reset-password/*
        rewrite @publicpage /api/s{uri}
        reverse_proxy localhost:8001
    }

    # API запросы -> Backend
    handle /api/* {
        reverse_proxy localhost:8001 {
            header_up Host {host}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Загруженные файлы (с отдельного volume)
    handle /uploads/* {
        root * /data
        file_server
    }

    # React Frontend (статика)
    handle {
        root * /var/www/muslink/frontend/build
        try_files {path} /index.html
        file_server
    }

    # Сжатие
    encode gzip zstd

    # Заголовки безопасности
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options SAMEORIGIN
        X-XSS-Protection "1; mode=block"
        Referrer-Policy strict-origin-when-cross-origin
        -Server
    }

    # Кэширование статики
    @static {
        path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2
    }
    header @static Cache-Control "public, max-age=31536000, immutable"
}

# Редирект с www на основной домен
www.mus.link {
    redir https://mus.link{uri} permanent
}

# Если нужен дополнительный домен
# mytrack.cc {
#     redir https://mus.link{uri} permanent
# }
```

### 9.2 Запуск Caddy

```bash
# Создание директории для логов Caddy
sudo mkdir -p /var/log/caddy
sudo chown caddy:caddy /var/log/caddy

# Проверка конфигурации
sudo caddy validate --config /etc/caddy/Caddyfile

# Форматирование (опционально)
sudo caddy fmt --overwrite /etc/caddy/Caddyfile

# Перезапуск Caddy
sudo systemctl restart caddy
sudo systemctl enable caddy

# Проверка статуса
sudo systemctl status caddy
```

---

## Шаг 10: Настройка DNS

В панели управления вашего домена добавьте:

| Тип | Имя | Значение | TTL |
|-----|-----|----------|-----|
| A | @ | YOUR_SERVER_IP | 300 |
| A | www | YOUR_SERVER_IP | 300 |
| CNAME | * | mus.link | 300 |

---

## Шаг 11: Настройка Firewall

```bash
# Установка UFW
sudo apt install -y ufw

# Базовые правила
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Разрешить SSH
sudo ufw allow 22/tcp

# Разрешить HTTP и HTTPS (для Caddy)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Включить firewall
sudo ufw enable

# Проверка статуса
sudo ufw status verbose
```

---

## Шаг 12: Автоматические бэкапы

### 12.1 Скрипт бэкапа

```bash
sudo nano /data/backups/backup.sh
```

```bash
#!/bin/bash

# Конфигурация
BACKUP_DIR="/data/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Создание директории для текущего бэкапа
mkdir -p "$BACKUP_DIR/$DATE"

# Бэкап MongoDB
mongodump --db muslink --out "$BACKUP_DIR/$DATE/mongodb"

# Бэкап uploads
tar -czf "$BACKUP_DIR/$DATE/uploads.tar.gz" -C /data uploads

# Бэкап конфигов
tar -czf "$BACKUP_DIR/$DATE/configs.tar.gz" \
    /var/www/muslink/backend/.env \
    /var/www/muslink/frontend/.env \
    /etc/caddy/Caddyfile \
    /etc/systemd/system/muslink.service

# Удаление старых бэкапов
find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \;

echo "Backup completed: $BACKUP_DIR/$DATE"
```

```bash
# Права на выполнение
sudo chmod +x /data/backups/backup.sh

# Тестовый запуск
sudo /data/backups/backup.sh
```

### 12.2 Автоматический запуск через cron

```bash
sudo crontab -e
```

Добавьте строку (бэкап каждый день в 3:00):

```
0 3 * * * /data/backups/backup.sh >> /var/log/muslink/backup.log 2>&1
```

---

## Шаг 13: Проверка установки

### 13.1 Проверка всех сервисов

```bash
# Статус всех сервисов
sudo systemctl status mongod caddy muslink

# Проверка портов
sudo ss -tlnp | grep -E "27017|8001|80|443"
```

### 13.2 Проверка API

```bash
# Health check
curl -s https://mus.link/api/health || echo "API не отвечает"

# Или через локальный адрес
curl -s http://127.0.0.1:8001/api/health
```

### 13.3 Проверка SSL

```bash
# Проверка сертификата
curl -vI https://mus.link 2>&1 | grep -E "SSL|subject|expire"
```

---

## Полезные команды

### Логи

```bash
# Backend логи
sudo tail -f /var/log/muslink/backend.log
sudo tail -f /var/log/muslink/backend-error.log

# Caddy логи
sudo tail -f /var/log/caddy/access.log

# MongoDB логи
sudo tail -f /var/log/mongodb/mongod.log

# Systemd журнал
sudo journalctl -u muslink -f
sudo journalctl -u caddy -f
```

### Перезапуск сервисов

```bash
# Перезапуск всего
sudo systemctl restart mongod muslink caddy

# Только backend (после изменения кода)
sudo systemctl restart muslink

# Только Caddy (после изменения Caddyfile)
sudo caddy reload --config /etc/caddy/Caddyfile
```

### Обновление приложения

```bash
cd /var/www/muslink

# Получить изменения
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart muslink

# Frontend
cd ../frontend
npm install
npm run build

# Готово! Caddy автоматически отдаст новые файлы
```

---

## Устранение проблем

### MongoDB не запускается

```bash
# Проверка прав
sudo chown -R mongodb:mongodb /data/mongodb

# Проверка SELinux/AppArmor
sudo aa-status

# Логи MongoDB
sudo cat /var/log/mongodb/mongod.log
```

### Backend не запускается

```bash
# Проверка вручную
cd /var/www/muslink/backend
source venv/bin/activate
python -c "import server; print('OK')"

# Запуск вручную для отладки
uvicorn server:app --host 127.0.0.1 --port 8001
```

### Caddy не получает SSL

```bash
# Проверка DNS
dig mus.link +short

# Проверка портов
sudo ss -tlnp | grep -E "80|443"

# Логи Caddy
sudo journalctl -u caddy -f
```

### 502 Bad Gateway

```bash
# Проверка что backend работает
curl http://127.0.0.1:8001/api/health

# Перезапуск backend
sudo systemctl restart muslink
```

---

## Итоговая проверка

После выполнения всех шагов:

1. ✅ Откройте `https://mus.link` — должна загрузиться главная страница
2. ✅ Зарегистрируйтесь с email из `OWNER_EMAIL` — получите роль owner
3. ✅ Создайте тестовую страницу
4. ✅ Проверьте OG-теги: https://developers.facebook.com/tools/debug/
5. ✅ Проверьте что данные в `/data/mongodb` растут

---

## Контакты и поддержка

При возникновении проблем создайте issue в репозитории проекта.
