# Fasticket Database Migrations

Bu dizin Fasticket projesinin database migration dosyalarını içerir.

## Migration Sırası

Migration'lar numaraya göre sırayla çalıştırılmalıdır:

1. **001_update_profiles.sql** - Profiles tablosuna yeni alanlar ekler
2. **002_create_organizations.sql** - Organizations tablosunu oluşturur
3. **003_create_organization_members.sql** - Organization üyelik sistemini oluşturur
4. **004_create_events.sql** - Events tablosunu oluşturur
5. **005_create_bookings.sql** - Bookings tablosunu oluşturur
6. **006_create_views.sql** - Yardımcı view'ları oluşturur

## Nasıl Çalıştırılır?

### Supabase Dashboard Üzerinden

1. Supabase Dashboard'a giriş yapın
2. SQL Editor'e gidin
3. Her migration dosyasını sırayla kopyalayıp çalıştırın

### Supabase CLI ile (Önerilen)

```bash
# Supabase CLI kurulumu (eğer yoksa)
npm install -g supabase

# Supabase projenizi link edin
supabase link --project-ref YOUR_PROJECT_REF

# Migration'ları çalıştırın
supabase db push
```

## Rollback

Migration'ları geri almak için her migration için bir rollback scripti yazmak gerekir. Şu an için rollback stratejisi yok, bu yüzden migration'ları production'a göndermeden önce test ortamında test edin!

## Önemli Notlar

- Migration'ları çalıştırmadan önce **mutlaka backup alın**
- Her migration atomik olarak çalışır (BEGIN/COMMIT bloğu ile)
- Hata durumunda migration otomatik olarak rollback olur
- Mevcut kullanıcılar için migration güvenlidir (IF NOT EXISTS kullanımı)

## Güvenlik

- Tüm tablolarda Row Level Security (RLS) aktiftir
- Her tablo için detaylı policy'ler tanımlanmıştır
- Trigger'lar SECURITY DEFINER ile çalışır

## Test

Migration'ları test etmek için:

1. Yeni bir test database oluşturun
2. Migration'ları sırayla çalıştırın
3. Test senaryolarını çalıştırın (docs/RFC-001'de örnekler var)
4. Her şey çalışıyorsa production'a geçin
