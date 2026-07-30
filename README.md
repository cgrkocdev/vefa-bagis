# Vefa Bağış Yönetim Sistemi

Next.js 16, React 19, TypeScript, Tailwind CSS 4, PostgreSQL ve Prisma ORM 7 ile geliştirilen bağış ve kurban yönetim paneli.

## Kurulum

```bash
npm install
copy .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

`DATABASE_URL` PostgreSQL bağlantısını, `SESSION_SECRET` ise en az 32 baytlık rastgele oturum sırrını içermelidir. Gizli değerleri repoya eklemeyin.

İlk seed yöneticisi:

- Kullanıcı: `yasir@gmail`
- Geçici şifre: `12345678`

İlk girişten sonra geçici şifre değiştirilmelidir.

## Veri ve güvenlik

- Üretim verileri PostgreSQL’de tutulur.
- Parolalar bcrypt ile hashlenir.
- Oturum belirteçleri yalnızca hashlenmiş biçimde veritabanında, ham değerleri HTTP-only cookie içinde saklanır.
- Kritik değişiklikler `AuditLog` tablosuna kaydedilir.
- Proje oluşturma ve bağış/hisse atama işlemleri transaction içinde yürütülür.
- Aynı yıl, bölüm ve proje numarası veritabanı benzersizlik kuralıyla korunur.
- Aynı hisse sürüm ve durum kontrollü atomik güncellemeyle iki bağışa atanamaz.

Geçici tarayıcı modu yalnızca veri geçişi veya arayüz gösterimi içindir:

```env
NEXT_PUBLIC_USE_LOCAL_API=true
```

Bu değer üretimde `false` olmalıdır.

## Kontroller

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
