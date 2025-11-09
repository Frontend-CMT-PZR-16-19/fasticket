# Veritabanı Migration'ları

Bu dizin Fasticket veritabanı şeması için SQL migration dosyalarını içerir.

## Ön Gereksinimler

- Oluşturulmuş ve bağlanmış Supabase projesi
- Supabase Dashboard SQL Editor erişimi

## Migration Dosyaları

### 001_initial_schema.sql
Tüm veritabanı şemasını oluşturur:
- `profiles` tablosunu günceller (avatar_url, bio, timestamps ekler)
- `organizations` tablosunu oluşturur
- Rol yönetimi ile `organization_members` tablosunu oluşturur
- `events` tablosunu oluşturur
- Otomatik kapasite yönetimi ile `bookings` tablosunu oluşturur
- Tüm tablolar için Row Level Security (RLS) politikalarını ayarlar
- Yardımcı fonksiyonlar ve trigger'lar oluşturur
- Aktif/yaklaşan/geçmiş etkinlikler için view'lar oluşturur

### 002_storage_setup.sql
Kullanıcı avatarları için storage bucket'ı ayarlar:
- Avatar yüklemeleri için `profiles` bucket'ı oluşturur
- CRUD işlemleri için storage politikalarını ayarlar

## Migration'ları Çalıştırma

### Adım 1: İlk Şemayı Çalıştır

1. Supabase Dashboard'unuza gidin
2. **SQL Editor** bölümüne gidin
3. **New Query** butonuna tıklayın
4. `001_initial_schema.sql` dosyasının tüm içeriğini kopyalayın
5. SQL Editor'e yapıştırın
6. **Run** butonuna tıklayın
7. Başarı onayını bekleyin ("Success. No rows returned" görmelisiniz)

### Adım 2: Storage Kurulumunu Çalıştır

1. SQL Editor'de tekrar **New Query** butonuna tıklayın
2. `002_storage_setup.sql` dosyasının tüm içeriğini kopyalayın
3. SQL Editor'e yapıştırın
4. **Run** butonuna tıklayın
5. Başarı onayını bekleyin

### Adım 3: RLS Policy Düzeltmesi (ÖNEMLİ!)

1. SQL Editor'de tekrar **New Query** butonuna tıklayın
2. `003_fix_rls_policies.sql` dosyasının tüm içeriğini kopyalayın
3. SQL Editor'e yapıştırın
4. **Run** butonuna tıklayın
5. Başarı onayını bekleyin

**Not:** Bu düzeltme `organization_members` tablosundaki infinite recursion hatasını çözer.

### Adım 4: Migration'ı Doğrula

Tüm tabloların mevcut olduğunu doğrulamak için bu sorguyu çalıştırın:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Şunları görmelisiniz:
- bookings
- events
- organization_members
- organizations
- profiles

Storage bucket'ı kontrol edin:
```sql
SELECT * FROM storage.buckets WHERE id = 'profiles';
```

## Geri Alma (Gerekirse)

Migration'ları geri almanız gerekirse:

```sql
-- Tabloları ters sırada sil (foreign key'ler nedeniyle)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Fonksiyonları sil
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS handle_new_organization() CASCADE;
DROP FUNCTION IF EXISTS generate_booking_code() CASCADE;
DROP FUNCTION IF EXISTS handle_new_booking() CASCADE;
DROP FUNCTION IF EXISTS update_event_capacity() CASCADE;

-- Type'ları sil
DROP TYPE IF EXISTS organization_role CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;

-- View'ları sil
DROP VIEW IF EXISTS active_events CASCADE;
DROP VIEW IF EXISTS upcoming_events CASCADE;
DROP VIEW IF EXISTS past_events CASCADE;

-- Profiles'dan kolonları kaldır (sadece kesinlikle gerekliyse)
ALTER TABLE profiles DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE profiles DROP COLUMN IF EXISTS bio;
ALTER TABLE profiles DROP COLUMN IF EXISTS created_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS updated_at;

-- Storage bucket'ı sil
DELETE FROM storage.buckets WHERE id = 'profiles';
```

## Migration Sonrası Test

Migration'ları çalıştırdıktan sonra, bu sorgularla test edin:

### 1. Mevcut profillerin bozulmadığını kontrol et
```sql
SELECT id, fullname FROM profiles;
```

### 2. Test organizasyonu oluştur
```sql
INSERT INTO organizations (name, slug, created_by)
VALUES ('Test Org', 'test-org', (SELECT id FROM profiles LIMIT 1))
RETURNING *;
```

### 3. Trigger'ın otomatik üye eklediğini doğrula
```sql
SELECT om.*, p.fullname 
FROM organization_members om
JOIN profiles p ON p.id = om.user_id
WHERE om.organization_id = (SELECT id FROM organizations WHERE slug = 'test-org');
```

### 4. Test verisini temizle
```sql
DELETE FROM organizations WHERE slug = 'test-org';
```

## Önemli Notlar

- ⚠️ Migration, mevcut profiles tablosuna güvenli bir şekilde eklemek için `IF NOT EXISTS` ve `ALTER TABLE ADD COLUMN IF NOT EXISTS` kullanır
- ⚠️ Mevcut 2 kullanıcınız etkilenmeyecek
- ⚠️ Tüm tablolarda Row Level Security (RLS) etkin
- ⚠️ Trigger'lar otomatik olarak şunları yönetir:
  - updated_at timestamp'lerini ayarlama
  - Organizasyon yaratıcısını otomatik olarak organizer olarak ekleme
  - Benzersiz rezervasyon kodları oluşturma
  - Etkinlik kapasitesini yönetme

## Sonraki Adımlar

Migration başarılı olduktan sonra:
1. `tsconfig.json` dosyasını types dizinini içerecek şekilde güncelle
2. `lib/auth/permissions.ts` içinde auth yardımcı fonksiyonları oluştur
3. AuthProvider component'ini oluştur
4. Organizasyon yönetimi UI'ını oluşturmaya başla

## Sorun Giderme

### Hata: "relation already exists"
- Migration'ları yeniden çalıştırıyorsanız bu hatayı görmezden gelebilirsiniz
- Önce yukarıdaki geri alma script'ini kullanarak temizleyin

### Hata: "permission denied"
- Supabase Dashboard'a admin yetkileriyle giriş yaptığınızdan emin olun
- Projenizin duraklatılmadığını kontrol edin

### Hata: "foreign key constraint"
- Migration'ların sırayla çalıştığından emin olun (002'den önce 001)
- Kısıtlamaları ihlal eden manuel veri olmadığını kontrol edin

## Destek

Sorunla karşılaşırsanız:
1. Supabase Dashboard → Database → Logs bölümünü kontrol edin
2. Hata mesajlarını dikkatlice inceleyin
3. Tüm adımların sırayla tamamlandığını doğrulayın
4. Geri alma script'ini deneyin ve migration'ları yeniden çalıştırın
