# MyTrack - Link-in-Bio for Musicians

## Original Problem Statement
Application cloned from GitHub repository `https://github.com/sadsoulpro/prefinal-final.git`. A link-in-bio service for musicians with smart link pages.

## What's Been Implemented

### Core Features (Existing)
- JWT-based authentication (login, register, password reset)
- Role-based access control (Owner, Admin, Moderator, User)
- Smart link pages with music platform links
- Odesli/Songlink API integration for auto-filling music links (URL + UPC code support)
- Cover image upload and management
- QR code generation for pages
- Analytics (views, clicks, geography)
- Subdomain management
- Admin panel with global analytics
- Support ticket system
- Verification badge system
- RandomCover - AI-powered cover art editor

### Session Updates (2025-01-15)
1. **Subscription Plan Cleanup** - Removed "Ultimate" plan, keeping only FREE and PRO
2. **Owner Test Feature** - API endpoint for owner to switch plans for testing
3. **Odesli UPC Search** - Added UPC code search via iTunes API + Odesli
4. **Platform Expansion** - Added 15+ music platforms with icons
5. **API Keys** - Added RESEND_API_KEY and HUGGINGFACE_TOKEN to backend
6. **Full Internationalization (i18n)** - Complete translation system for RU, EN, ES

### i18n Implementation
- Custom React Context-based i18n system
- Central translations file: `/app/frontend/src/i18n/translations.js`
- Language switcher in sidebar
- Browser language auto-detection with localStorage persistence
- Translated pages:
  - Landing page
  - Login / Register
  - Dashboard / Sidebar
  - Settings
  - PageBuilder
  - RandomCover
  - Analytics
  - Domains
  - Verification
  - Support
  - FAQ
  - Admin Panel

## Tech Stack
- **Backend**: FastAPI, MongoDB (motor), Pydantic, JWT, bcrypt
- **Frontend**: React, React Router, Tailwind CSS, Shadcn UI, Axios, Framer Motion
- **Database**: MongoDB
- **Services**: Managed by Supervisor

## Key API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users/me` - Current user profile
- `GET /api/lookup/odesli?url=<url_or_upc>` - Music link lookup
- `PUT /api/owner/my-plan` - Owner plan change (testing)
- CRUD endpoints for pages, links, subdomains, tickets

## Database Schema
- **users**: id, email, username, password_hash, role, plan, status, verified
- **pages**: id, user_id, slug, title, cover_image, links, qr_enabled
- **subdomains**: id, user_id, subdomain, is_active
- **tickets**: id, user_id, subject, messages, status

## Test Credentials
- **Owner**: `thedrumepic@gmail.com` / `test123`

## Pending/Future Tasks

### P2 - Security Improvements
- Remove hardcoded JWT_SECRET fallback
- Make OWNER_EMAIL configurable via .env

### P3 - Performance
- Optimize N+1 database queries in admin panel

## File Structure
```
/app
├── backend/
│   ├── .env
│   ├── requirements.txt
│   └── server.py
├── frontend/
│   ├── .env
│   ├── package.json
│   ├── src/
│   │   ├── App.js
│   │   ├── i18n/
│   │   │   ├── index.js
│   │   │   └── translations.js
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── LanguageContext.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   └── LanguageSwitcher.jsx
│   │   └── pages/
│   │       ├── Landing.jsx
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── Dashboard.jsx
│   │       ├── PageBuilder.jsx
│   │       ├── RandomCover.jsx
│   │       ├── Analytics.jsx
│   │       ├── Domains.jsx
│   │       ├── Settings.jsx
│   │       ├── Support.jsx
│   │       ├── FAQ.jsx
│   │       ├── Verification.jsx
│   │       └── AdminPanel.jsx
└── memory/
    └── PRD.md
```

## 3rd Party Integrations
- **Odesli/Songlink API** - No key required
- **iTunes Search API** - No key required  
- **Resend** - Key in .env (not implemented yet)
- **Hugging Face** - Key in .env (not implemented yet)
