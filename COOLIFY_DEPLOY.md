# Coolify Deployment Guide

## 1. GitHub Repo Oluştur

```bash
cd /Users/ht44/Desktop/lingeria
git init
git add .
git commit -m "Initial commit for Coolify deployment"
git remote add origin https://github.com/YOUR_USERNAME/lingeria.git
git push -u origin main
```

## 2. Coolify'de Proje Oluştur

### Seçenek A: Docker Compose ile Tek Tıkla (Önerilen)

1. Coolify Dashboard → **New Project**
2. **New Resource** → **Docker Compose**
3. `docker-compose.coolify.yml` dosyasını kullan
4. Environment variables'ları ayarla

### Seçenek B: Ayrı Ayrı Servisler

#### PostgreSQL
- **New Resource** → **PostgreSQL**
- Database: `lingeria`
- User: `fasheone`
- Password: `fasheone_db_password`

#### Redis
- **New Resource** → **Redis**
- Varsayılan ayarlar

#### Backend
- **New Resource** → **Git-based**
- Repo: `https://github.com/YOUR_USERNAME/lingeria.git`
- Build Pack: `nixpacks` veya `dockerfile`
- Build Path: `./backend`
- Port: `4000`
- Environment Variables:
  ```
  NODE_ENV=production
  PORT=4000
  POSTGRES_HOST=<postgres-service-url>
  POSTGRES_PORT=5432
  POSTGRES_USER=fasheone
  POSTGRES_PASSWORD=fasheone_db_password
  POSTGRES_DB=lingeria
  REDIS_URL=redis://<redis-service-url>:6379
  JWT_SECRET=fasheone-secret-key-change-in-production
  KIE_API_KEY=dcbf5792e5a6f789a6363f77e092daf4
  KIE_BASE_URL=https://api.kie.ai
  ALLOWED_ORIGINS=https://<frontend-url>,http://localhost:3001
  ```

#### Frontend
- **New Resource** → **Git-based**
- Repo: `https://github.com/YOUR_USERNAME/lingeria.git`
- Build Pack: `nixpacks` veya `dockerfile`
- Build Path: `./frontend`
- Port: `3001`
- Environment Variables:
  ```
  NODE_ENV=production
  NEXT_PUBLIC_BACKEND_URL=https://<backend-url>
  NEXT_PUBLIC_API_URL=https://<backend-url>
  ```

## 3. Database Migration

PostgreSQL servisi başladığında, Coolify'de terminal açıp:

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 100.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  result_url TEXT,
  model TEXT,
  prompt TEXT,
  cost DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

## 4. Netlify'den Taşıma (Opsiyonel)

Frontend'i de Coolify'e taşıdıktan sonra Netlify deployment'ı silebilirsiniz.

## 5. Domain Ayarı

Coolify'de her servis için custom domain ekleyin:
- Backend: `api.yourdomain.com`
- Frontend: `yourdomain.com`
