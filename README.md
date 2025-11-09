<a href="https://github.com/Frontend-CMT-PZR-16-19/fasticket">
  <h1 align="center">🎫 Fasticket</h1>
</a>

<p align="center">
  Bilet satın alma ve etkinlik organizasyonu platformu
</p>

<p align="center">
  <a href="#features"><strong>Özellikler</strong></a> ·
  <a href="#getting-started"><strong>Başlangıç</strong></a> ·
  <a href="#tech-stack"><strong>Teknolojiler</strong></a> ·
  <a href="#project-status"><strong>Proje Durumu</strong></a> ·
  <a href="#documentation"><strong>Dökümanlar</strong></a>
</p>
<br/>

## 🎯 Proje Hakkında

Fasticket, organizasyonların etkinlik oluşturmasını ve kullanıcıların bu etkinliklere bilet satın almasını sağlayan modern bir web platformudur.

### Ana Özellikler

- 👤 **Kullanıcı Yönetimi**: Kayıt, giriş, profil yönetimi
- 🏢 **Organizasyon Sistemi**: Kullanıcılar organizasyon oluşturabilir ve yönetebilir
- 🎫 **Etkinlik Yönetimi**: Draft/Published etkinlikler, ücretsiz/ücretli biletler
- 🎟️ **Bilet Rezervasyonu**: Otomatik kapasite yönetimi ile bilet satın alma
- 🔐 **Rol Tabanlı Erişim**: Regular users ve organizers için farklı yetkiler
- 📊 **Dashboard**: Kullanıcılar ve organizer'lar için özel paneller

## 🚀 Getting Started

### Önkoşullar

- Node.js 18+ ve npm
- Supabase hesabı ve projesi
- Git

### Kurulum

1. **Repository'yi klonlayın**
   ```bash
   git clone https://github.com/Frontend-CMT-PZR-16-19/fasticket.git
   cd fasticket
   ```

2. **Dependencies'i yükleyin**
   ```bash
   npm install
   ```

3. **Environment variables'ı ayarlayın**
   ```bash
   cp .env.example .env.local
   ```
   
   `.env.local` dosyasını düzenleyin:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Database migration'ı uygulayın**
   
   Detaylı talimatlar için: [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)
   
   Kısaca:
   - Supabase Dashboard > SQL Editor
   - `supabase/migrations/20251109000001_complete_schema.sql` içeriğini çalıştır

5. **Uygulamayı başlatın**
   ```bash
   npm run dev
   ```
   
   http://localhost:3000 adresini ziyaret edin

## 🛠 Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **Sonner** - Toast notifications

### Backend
- **Supabase** - Backend as a Service
  - Authentication
  - PostgreSQL Database
  - Row Level Security (RLS)
  - Realtime subscriptions
- **Supabase SSR** - Server-side auth with cookies

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting (optional)
- **Git** - Version control

## 📊 Project Status

### ✅ Phase 1: Foundation (COMPLETED)
- [x] Database schema (5 tables, RLS policies, triggers)
- [x] TypeScript type definitions
- [x] Auth & permission helpers
- [x] Auth context provider
- [x] Profile management

### 🚧 Phase 2: Organization System (TODO)
- [ ] Organization creation page
- [ ] Organization management dashboard
- [ ] Member invitation system
- [ ] Role management

### 📋 Phase 3: Event System (TODO)
- [ ] Event creation form
- [ ] Public event listing
- [ ] Event detail page
- [ ] Event management

### 📋 Phase 4: Booking System (TODO)
- [ ] Ticket booking flow
- [ ] My Tickets page
- [ ] Booking management
- [ ] Capacity tracking

### 📋 Phase 5: UI/UX Polish (TODO)
- [ ] Landing page
- [ ] Navigation improvements
- [ ] Dashboard pages
- [ ] Mobile responsive design

## 📚 Documentation

### Setup & Migration
- [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md) - Database migration rehberi
- [`PHASE_1_COMPLETE.md`](./PHASE_1_COMPLETE.md) - Phase 1 özeti

### Architecture (RFC Dökümanları)
- [`RFC-000`](./docs/RFC-000-implementation-roadmap.md) - Implementation roadmap
- [`RFC-001`](./docs/RFC-001-database-schema.md) - Database schema design
- [`RFC-002`](./docs/RFC-002-authentication-authorization.md) - Auth & authorization
- [`RFC-003`](./docs/RFC-003-user-registration-profile.md) - User registration & profile
- [`RFC-004`](./docs/RFC-004-organization-management.md) - Organization management
- [`RFC-005`](./docs/RFC-005-event-management.md) - Event management
- [`RFC-006`](./docs/RFC-006-ticket-booking-system.md) - Ticket booking system
- [`RFC-007`](./docs/RFC-007-ui-ux-architecture.md) - UI/UX architecture

## 🗂 Project Structure

```
fasticket/
├── app/                          # Next.js App Router pages
│   ├── auth/                     # Authentication pages
│   ├── profile/                  # Profile management
│   ├── protected/                # Protected routes
│   └── layout.tsx                # Root layout with providers
├── components/                   # React components
│   ├── providers/                # Context providers
│   │   └── auth-provider.tsx     # Auth context
│   ├── profile/                  # Profile components
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utility libraries
│   ├── auth/                     
│   │   └── permissions.ts        # Permission helpers
│   ├── supabase/                 # Supabase clients
│   └── utils.ts                  # General utilities
├── types/                        # TypeScript types
│   └── database.ts               # Database type definitions
├── supabase/                     # Supabase configuration
│   └── migrations/               # Database migrations
├── docs/                         # RFC documentation
└── public/                       # Static assets
```

## 🔐 Security Features

- ✅ Row Level Security (RLS) policies on all tables
- ✅ Role-based access control
- ✅ Server-side authentication
- ✅ Protected routes with middleware
- ✅ SQL injection prevention
- ✅ XSS protection

## 🧪 Testing (TODO)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📝 License

MIT License - see LICENSE file for details

## 👥 Team

Frontend-CMT-PZR-16-19

## 🆘 Support

Sorun yaşarsanız:
1. [Issues](https://github.com/Frontend-CMT-PZR-16-19/fasticket/issues) sayfasından yeni issue açın
2. RFC dökümanlarını okuyun
3. Migration guide'ı kontrol edin

---

Built with ❤️ using Next.js and Supabase
   ```

   ```bash
   yarn create next-app --example with-supabase with-supabase-app
   ```

   ```bash
   pnpm create next-app --example with-supabase with-supabase-app
   ```

3. Use `cd` to change into the app's directory

   ```bash
   cd with-supabase-app
   ```

4. Rename `.env.example` to `.env.local` and update the following:

  ```env
  NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[INSERT SUPABASE PROJECT API PUBLISHABLE OR ANON KEY]
  ```
  > [!NOTE]
  > This example uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, which refers to Supabase's new **publishable** key format.
  > Both legacy **anon** keys and new **publishable** keys can be used with this variable name during the transition period. Supabase's dashboard may show `NEXT_PUBLIC_SUPABASE_ANON_KEY`; its value can be used in this example.
  > See the [full announcement](https://github.com/orgs/supabase/discussions/29260) for more information.

  Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` can be found in [your Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true)

5. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The starter kit should now be running on [localhost:3000](http://localhost:3000/).

6. This template comes with the default shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete `components.json` and [re-install shadcn/ui](https://ui.shadcn.com/docs/installation/next)

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.

## Feedback and issues

Please file feedback and issues over on the [Supabase GitHub org](https://github.com/supabase/supabase/issues/new/choose).

## More Supabase examples

- [Next.js Subscription Payments Starter](https://github.com/vercel/nextjs-subscription-payments)
- [Cookie-based Auth and the Next.js 13 App Router (free course)](https://youtube.com/playlist?list=PL5S4mPUpp4OtMhpnp93EFSo42iQ40XjbF)
- [Supabase Auth and the Next.js App Router](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)


## ENV
# Update these with your Supabase details from your project settings > API
# https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://kmszqzbdylforjsiuzgj.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttc3pxemJkeWxmb3Jqc2l1emdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDk5MjksImV4cCI6MjA3ODE4NTkyOX0.iNkWplzLDvd_7oJfbu7X-H5tQLboO46YESwb-9uUZIY

