# Fasticket - Doğrulama Kontrol Listesi

## ✅ 1. Database Kontrolü

Supabase Dashboard'da SQL Editor'de bu sorguları çalıştırın:

### Tabloları Kontrol Et
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```
**Beklenen:** bookings, events, organization_members, organizations, profiles

### Profiles Tablosu Kolonları
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```
**Beklenen:** id, fullname, avatar_url, bio, created_at, updated_at

### RLS Politikalarını Kontrol Et
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```
**Beklenen:** Her tablo için birden fazla policy olmalı

### Trigger'ları Kontrol Et
```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```
**Beklenen:** profiles_updated_at, organizations_updated_at, events_updated_at, on_organization_created, on_booking_created, on_booking_capacity_change

### View'ları Kontrol Et
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
```
**Beklenen:** active_events, past_events, upcoming_events

### Storage Bucket'ı Kontrol Et
```sql
SELECT id, name, public 
FROM storage.buckets;
```
**Beklenen:** profiles bucket, public = false

---

## ✅ 2. Application Kontrolü

### 2.1 Browser'da Kontrol
1. **http://localhost:3000** adresini açın
2. Console'da hata olmamalı (F12 → Console)
3. Network tab'ında 500 hatası olmamalı

### 2.2 Authentication Test
1. Login sayfasına gidin: **http://localhost:3000/auth/login**
2. Mevcut kullanıcı ile giriş yapın
3. Console'da auth hatası olmamalı
4. Profile yüklenmeli (useAuth hook çalışmalı)

### 2.3 Protected Route Test
1. **http://localhost:3000/protected** sayfasına gidin
2. Login olmadan erişememelisiniz (redirect edilmelisiniz)
3. Login olduktan sonra erişebilmelisiniz

---

## ✅ 3. TypeScript Kontrolü

Terminal'de çalıştırın:
```bash
npm run build
```

**Beklenen:** 
- Type hataları olmamalı
- Build başarılı olmalı

---

## ✅ 4. Database Fonksiyonellik Testi

Supabase SQL Editor'de test sorguları:

### Test 1: Organization Oluştur
```sql
-- Mevcut bir user ID'si ile test (kendi user ID'nizi kullanın)
INSERT INTO organizations (name, slug, created_by)
VALUES ('Test Organization', 'test-org', 'YOUR_USER_ID_HERE')
RETURNING *;
```

### Test 2: Trigger Kontrolü (Otomatik organizer eklendi mi?)
```sql
SELECT om.*, p.fullname 
FROM organization_members om
JOIN profiles p ON p.id = om.user_id
WHERE om.organization_id = (SELECT id FROM organizations WHERE slug = 'test-org');
```
**Beklenen:** Creator otomatik olarak organizer olarak eklenmiş olmalı

### Test 3: Event Oluştur
```sql
INSERT INTO events (
  organization_id, 
  title, 
  slug,
  start_date, 
  end_date, 
  total_capacity,
  available_capacity,
  is_free,
  status,
  created_by
)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'test-org'),
  'Test Event',
  'test-event',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '8 days',
  100,
  100,
  true,
  'published',
  'YOUR_USER_ID_HERE'
)
RETURNING *;
```

### Test 4: Booking Oluştur
```sql
INSERT INTO bookings (event_id, user_id, quantity, total_price)
VALUES (
  (SELECT id FROM events WHERE slug = 'test-event'),
  'YOUR_USER_ID_HERE',
  2,
  0
)
RETURNING *;
```
**Kontrol:** booking_code otomatik oluşturuldu mu? (FST-XXXXXXXX formatında)

### Test 5: Kapasite Güncellemesi
```sql
SELECT available_capacity 
FROM events 
WHERE slug = 'test-event';
```
**Beklenen:** available_capacity 100'den 98'e düşmüş olmalı (2 bilet rezerve edildi)

### Test 6: Booking İptal Et
```sql
UPDATE bookings 
SET status = 'cancelled', cancelled_at = NOW()
WHERE booking_code = 'BOOKING_CODE_BURAYA' -- önceki adımdan gelen code
RETURNING *;
```

### Test 7: Kapasite Geri Yüklenme
```sql
SELECT available_capacity 
FROM events 
WHERE slug = 'test-event';
```
**Beklenen:** available_capacity tekrar 100'e dönmüş olmalı

### Test 8: View Kontrolü
```sql
SELECT * FROM active_events;
SELECT * FROM upcoming_events;
SELECT * FROM past_events;
```

### Temizlik (Test Sonrası)
```sql
DELETE FROM organizations WHERE slug = 'test-org';
-- CASCADE nedeniyle tüm ilgili events, members, bookings otomatik silinecek
```

---

## ✅ 5. Auth Helper Fonksiyonları Test

`app/protected/page.tsx` dosyasını geçici olarak şöyle güncelleyin:

```tsx
import { getCurrentUser, getUserOrganizations } from '@/lib/auth/permissions';

export default async function ProtectedPage() {
  const user = await getCurrentUser();
  const orgs = await getUserOrganizations();
  
  return (
    <div className="p-8">
      <h1>Protected Page</h1>
      <pre>{JSON.stringify({ user, orgs }, null, 2)}</pre>
    </div>
  );
}
```

**http://localhost:3000/protected** sayfasını açın ve:
- User bilgisi görünmeli
- Organizations listesi görünmeli (varsa)

---

## ✅ 6. Client-Side Auth Context Test

`app/protected/page.tsx` dosyasını şöyle güncelleyin:

```tsx
'use client';

import { useAuth } from '@/lib/auth/context';

export default function ProtectedPage() {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="p-8">
      <h1>Protected Page</h1>
      <pre>{JSON.stringify({ user, profile }, null, 2)}</pre>
    </div>
  );
}
```

**http://localhost:3000/protected** sayfasını açın ve:
- Loading state çalışmalı
- User ve profile yüklenmeli
- Console'da hata olmamalı

---

## 📊 Kontrol Sonuçları

| Kontrol | Durum | Notlar |
|---------|-------|--------|
| Database tabloları | ⬜ | |
| RLS Politikaları | ⬜ | |
| Trigger'lar | ⬜ | |
| Views | ⬜ | |
| Storage bucket | ⬜ | |
| App çalışıyor | ⬜ | |
| TypeScript build | ⬜ | |
| Auth context | ⬜ | |
| Permission helpers | ⬜ | |
| Organization trigger | ⬜ | |
| Booking code generation | ⬜ | |
| Capacity management | ⬜ | |

---

## 🐛 Yaygın Sorunlar ve Çözümler

### Sorun: "supabase is not defined"
**Çözüm:** `.env.local` dosyasında Supabase credentials'ları var mı kontrol edin

### Sorun: Type errors
**Çözüm:** 
```bash
npm run build
```
çalıştırın ve hataları düzeltin

### Sorun: RLS policy hatası
**Çözüm:** Supabase Dashboard'da RLS politikalarının doğru kurulduğunu kontrol edin

### Sorun: Auth redirect çalışmıyor
**Çözüm:** `lib/supabase/middleware.ts` dosyasını kontrol edin

---

## ✅ Tamamlandığında

Tüm kontroller başarılı ise **Phase 3: Organization Management** başlayabilirsiniz!
