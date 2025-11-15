# Fasticket Database Migration Guide

## Phase 1: Foundation - Database Schema Setup

Bu rehber, Fasticket projesinin database schema'sını Supabase'e nasıl uygulayacağınızı adım adım gösterir.

## 📋 Önkoşullar

1. ✅ Supabase hesabı ve proje oluşturulmuş olmalı
2. ✅ Supabase Project URL ve Anon Key `.env.local` dosyasında olmalı
3. ✅ Mevcut authentication çalışıyor olmalı

## 🚀 Migration Adımları

### Seçenek 1: Supabase Dashboard (Önerilen)

1. **Supabase Dashboard'a gidin**
   - https://supabase.com/dashboard
   - Projenizi seçin

2. **SQL Editor'ü açın**
   - Sol menüden "SQL Editor" seçeneğine tıklayın
   - "New Query" butonuna tıklayın

3. **Migration Script'i kopyalayın**
   - `supabase/migrations/20251109000001_complete_schema.sql` dosyasını açın
   - Tüm içeriği kopyalayın

4. **Script'i çalıştırın**
   - SQL Editor'e yapıştırın
   - "Run" butonuna tıklayın
   - Başarılı olursa "Success. No rows returned" mesajı görmelisiniz

5. **Kontrol edin**
   - Sol menüden "Table Editor" açın
   - Şu tabloları görmelisiniz:
     - ✅ profiles (güncellenmiş)
     - ✅ organizations
     - ✅ organization_members
     - ✅ events
     - ✅ bookings

### Seçenek 2: Supabase CLI

```bash
# Supabase CLI'yi yükleyin (eğer yoksa)
npm install -g supabase

# Supabase'e login olun
supabase login

# Projenizi link edin
supabase link --project-ref YOUR_PROJECT_REF

# Migration'ı uygulayın
supabase db push
```

## ✅ Verification (Doğrulama)

Migration'ın başarılı olduğunu doğrulamak için:

### 1. Tabloları Kontrol Edin

```sql
-- Tüm tabloları listele
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

Beklenen sonuç:
- profiles
- organizations
- organization_members
- events
- bookings

### 2. RLS Policies Kontrol Edin

```sql
-- RLS policies kontrol
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

Her tablo için policy'ler görmelisiniz.

### 3. Functions & Triggers Kontrol Edin

```sql
-- Functions listele
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

Beklenen functions:
- handle_updated_at
- handle_new_organization
- generate_booking_code
- handle_new_booking
- update_event_capacity

## 🧪 Test Senaryoları

### Test 1: Mevcut Kullanıcılar

```sql
-- Mevcut profillerin yeni kolonları olmalı
SELECT id, fullname, avatar_url, bio, created_at 
FROM profiles;
```

### Test 2: Organization Oluşturma

Supabase Dashboard'da veya uygulama üzerinden:

```sql
-- Manuel test (Dashboard'da)
INSERT INTO organizations (name, slug, created_by)
VALUES ('Test Organization', 'test-org', '<your_user_id>');

-- Otomatik olarak organization_members'a eklendiğini kontrol et
SELECT * FROM organization_members 
WHERE organization_id = '<new_org_id>';
```

### Test 3: Event Oluşturma

```sql
-- Event oluştur (organizer olarak)
INSERT INTO events (
  organization_id,
  title,
  slug,
  start_date,
  end_date,
  is_free,
  total_capacity,
  available_capacity,
  status,
  created_by
) VALUES (
  '<org_id>',
  'Test Event',
  'test-event',
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '2 days',
  true,
  100,
  100,
  'published',
  '<user_id>'
);
```

### Test 4: Booking Oluşturma

```sql
-- Bilet al
INSERT INTO bookings (event_id, user_id, quantity, total_price)
VALUES ('<event_id>', '<user_id>', 2, 0);

-- Kapasitinin azaldığını kontrol et
SELECT available_capacity FROM events WHERE id = '<event_id>';
-- Beklenen: 98 (100 - 2)

-- Booking code'un otomatik oluştuğunu kontrol et
SELECT booking_code FROM bookings WHERE event_id = '<event_id>';
-- Beklenen: FST-XXXXXXXX formatında
```

## 🔧 Sorun Giderme

### Hata: "relation already exists"

Eğer migration daha önce çalıştırıldıysa, script'teki `IF NOT EXISTS` kontrolleri sayesinde sorun olmamalı. Ama eğer manuel değişiklik yaptıysanız:

```sql
-- Tabloları temizle (DİKKAT: Tüm data silinir!)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Enum'ları temizle
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS organization_role CASCADE;

-- Sonra migration'ı tekrar çalıştırın
```

### Hata: "permission denied"

RLS policies çalışıyor olabilir. Supabase Dashboard üzerinden çalıştırdığınızdan emin olun (servis role ile çalışır).

### Hata: Foreign key constraint

Sıralama önemli! Script zaten doğru sırada ama eğer manuel yapıyorsanız:
1. profiles (zaten var)
2. organizations
3. organization_members
4. events
5. bookings

## 📦 Sonraki Adımlar

Migration başarılı olduktan sonra:

1. ✅ **Uygulamayı çalıştırın**
   ```bash
   npm install  # Eğer node_modules yoksa
   npm run dev
   ```

2. ✅ **Environment variables kontrol edin**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. ✅ **Test edin**
   - Login olun
   - Profile sayfasına gidin: `/profile`
   - Profil bilgilerinizi güncelleyin
   - Organization oluşturun (gelecek phase'de)

## 🎯 Başarı Kriterleri

- [x] Tüm tablolar oluşturuldu
- [x] RLS policies aktif
- [x] Triggers çalışıyor
- [x] Mevcut kullanıcılar korundu
- [x] TypeScript types oluşturuldu
- [x] Auth provider güncellendi
- [x] Profile sayfası çalışıyor

## 📚 İlgili Dökümanlar

- `docs/RFC-001-database-schema.md` - Detaylı schema açıklaması
- `docs/RFC-002-authentication-authorization.md` - Auth sistemi
- `types/database.ts` - TypeScript type definitions
- `lib/auth/permissions.ts` - Permission helpers

## 🆘 Yardım

Sorun yaşarsanız:
1. Supabase Dashboard'daki Logs'u kontrol edin
2. Browser console'u kontrol edin
3. RFC dökümanlarını okuyun
4. Migration script'i tekrar gözden geçirin

---

**Not**: Bu migration mevcut data'yı korur. `profiles` tablosuna sadece yeni kolonlar ekler, mevcut data'yı silmez.
