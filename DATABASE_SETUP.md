# 🚀 Fasticket Database Setup - Adım Adım Kılavuz

Bu kılavuz, Fasticket projesinin database'ini sıfırdan kurmanız için gereken tüm adımları içerir.

## ✅ Phase 1: Foundation - TAMAMLANDI!

Aşağıdaki dosyalar başarıyla oluşturuldu:

### 📁 Database Migrations (supabase/migrations/)
- ✅ `001_update_profiles.sql` - Profiles tablosunu günceller
- ✅ `002_create_organizations.sql` - Organizations tablosu
- ✅ `003_create_organization_members.sql` - Üyelik sistemi
- ✅ `004_create_events.sql` - Events tablosu + slug generation
- ✅ `005_create_bookings.sql` - Bookings + capacity management
- ✅ `006_create_views.sql` - Helper views (upcoming, ongoing, past events)

### 📁 TypeScript Types (types/)
- ✅ `database.ts` - Tüm database type definitions

### 📁 Auth Helpers (lib/auth/)
- ✅ `permissions.ts` - Client-side permission checks
- ✅ `server-permissions.ts` - Server-side authorization guards

### 📁 React Providers (components/providers/)
- ✅ `auth-provider.tsx` - Global auth context

---

## 🎯 Şimdi Ne Yapmalısınız?

### 1️⃣ Supabase Dashboard'a Gidin

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) adresine gidin
2. Projenizi seçin
3. Sol menüden **SQL Editor**'e tıklayın

### 2️⃣ Migration'ları Çalıştırın

Her migration dosyasını **SIRAYLA** çalıştırın:

#### Migration 001: Update Profiles
```bash
# Dosya: supabase/migrations/001_update_profiles.sql
```
1. Dosyayı açın
2. Tüm içeriği kopyalayın
3. SQL Editor'e yapıştırın
4. ▶️ "RUN" butonuna basın
5. ✅ "Success" mesajını bekleyin

#### Migration 002: Create Organizations
```bash
# Dosya: supabase/migrations/002_create_organizations.sql
```
Yukarıdaki adımları tekrarlayın

#### Migration 003: Organization Members
```bash
# Dosya: supabase/migrations/003_create_organization_members.sql
```

#### Migration 004: Events
```bash
# Dosya: supabase/migrations/004_create_events.sql
```

#### Migration 005: Bookings
```bash
# Dosya: supabase/migrations/005_create_bookings.sql
```

#### Migration 006: Views
```bash
# Dosya: supabase/migrations/006_create_views.sql
```

### 3️⃣ Doğrulama

Migration'lar tamamlandıktan sonra:

1. **Table Editor**'e gidin
2. Aşağıdaki tabloları görmelisiniz:
   - ✅ `profiles` (güncellenmiş)
   - ✅ `organizations`
   - ✅ `organization_members`
   - ✅ `events`
   - ✅ `bookings`

3. **Database → Functions** bölümünde:
   - ✅ `handle_updated_at()`
   - ✅ `handle_new_organization()`
   - ✅ `handle_new_booking()`
   - ✅ `update_event_capacity()`
   - ✅ `generate_event_slug()`
   - ✅ `generate_booking_code()`

4. **Authentication → Policies** bölümünde her tablo için RLS policy'leri görmelisiniz

---

## 🔧 Alternatif: Supabase CLI ile (Önerilen)

Eğer CLI kullanmak isterseniz:

```bash
# 1. Supabase CLI'yi yükleyin (eğer yoksa)
npm install -g supabase

# 2. Projenizi link edin
supabase link --project-ref YOUR_PROJECT_REF

# 3. Migration'ları push edin
supabase db push

# 4. Type definitions generate edin (opsiyonel)
supabase gen types typescript --local > types/supabase.ts
```

---

## ⚠️ Önemli Notlar

1. **Migration Sırası ÇOK ÖNEMLİ**: Mutlaka 001'den 006'ya sırayla çalıştırın
2. **Hata Alırsanız**: Her migration BEGIN/COMMIT bloğu ile çalışır, hata olursa otomatik rollback olur
3. **Mevcut Kullanıcılar**: Migration'lar mevcut data'yı korur (IF NOT EXISTS kullanımı)
4. **RLS Policies**: Tüm tablolarda Row Level Security aktif edildi

---

## 🧪 Test Senaryosu

Migration'lar başarıyla tamamlandıktan sonra test etmek için:

### SQL Editor'de Test Sorguları

```sql
-- 1. Profiles tablosu kontrolü
SELECT * FROM public.profiles;

-- 2. Organization oluştur (kendi user_id'nizi kullanın)
INSERT INTO public.organizations (name, slug, created_by)
VALUES ('Test Organization', 'test-org', 'YOUR_USER_ID_HERE');

-- 3. Creator otomatik organizer oldu mu?
SELECT * FROM public.organization_members;

-- 4. Event oluştur
INSERT INTO public.events (
  organization_id, 
  title, 
  slug, 
  start_date, 
  end_date, 
  total_capacity, 
  available_capacity,
  is_free,
  ticket_price,
  status,
  created_by
) VALUES (
  (SELECT id FROM public.organizations LIMIT 1),
  'Test Event',
  'test-event',
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '2 days',
  100,
  100,
  true,
  0,
  'published',
  'YOUR_USER_ID_HERE'
);

-- 5. Event slug generate oldu mu kontrol et
SELECT slug FROM public.events;

-- 6. Booking yap
INSERT INTO public.bookings (event_id, user_id, quantity, total_price)
VALUES (
  (SELECT id FROM public.events LIMIT 1),
  'YOUR_USER_ID_HERE',
  2,
  0
);

-- 7. Capacity azaldı mı?
SELECT available_capacity FROM public.events; -- 98 olmalı

-- 8. Booking code generate oldu mu?
SELECT booking_code FROM public.bookings;

-- 9. Views çalışıyor mu?
SELECT * FROM public.upcoming_events;
```

---

## ✨ Başarılı Setup Sonrası

Migration'lar başarılı olduktan sonra:

### Next.js App'i Çalıştırın

```bash
# Dependencies install
npm install

# Dev server
npm run dev
```

### Environment Variables Kontrolü

`.env.local` dosyanızda olması gerekenler:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📋 Sonraki Adımlar (Phase 2-5)

Database hazır olduğuna göre şimdi:

1. ✅ **Phase 1: Foundation** - TAMAMLANDI
2. ⏭️ **Phase 2: Organizations** - Organization CRUD UI components
3. ⏭️ **Phase 3: Events** - Event management UI
4. ⏭️ **Phase 4: Bookings** - Ticket booking flow
5. ⏭️ **Phase 5: UI/UX** - Navigation, dashboards, polish

Hangi phase ile devam etmek istediğinizi söyleyin! 🚀

---

## 🆘 Sorun Giderme

### Migration Hatası Alıyorum
- SQL Editor'de hata mesajını okuyun
- Hangi migration'da hata aldığınızı not edin
- Önceki migration'ların başarılı olduğundan emin olun

### "relation already exists" Hatası
- Bu migration zaten çalışmış demektir
- Bir sonraki migration'a geçin

### Permission Denied Hatası
- Supabase project owner'ı olduğunuzdan emin olun
- SQL Editor'de "Service Role" seçeneğini kullanın

### Auth User ID Bulamıyorum
```sql
-- Mevcut kullanıcıları görün
SELECT id, email FROM auth.users;
```

---

**Hazırlayan**: GitHub Copilot  
**Tarih**: 9 Kasım 2025  
**Proje**: Fasticket - Event Ticketing Platform
