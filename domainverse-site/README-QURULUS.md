# domainverse.store — quraşdırma addımları

## 1) Supabase hesabı (auth + database + storage)
1. https://supabase.com → qeydiyyat → "New Project".
2. Layihə yarandıqdan sonra sol menyudan **SQL Editor** açın, bu repodakı
   `supabase-schema.sql` faylının içindəkiləri kopyalayıb işə salın (RUN).
3. Sol menyudan **Storage** → **New bucket** → adı: `projects` → **Public bucket = ON**.
4. Sol menyudan **Project Settings → API** bölməsinə keçin, bunları kopyalayın:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (bunu heç kimlə paylaşmayın!)
5. **Authentication → Providers → Email** bölməsində "Confirm email" seçimini
   test mərhələsində rahatlıq üçün söndürə bilərsiniz (sonra geri aça bilərsiniz).

## 2) GitHub-a yükləmək
1. github.com-da yeni boş repo yaradın (məs. `domainverse-site`).
2. Bu qovluğun içindəkiləri (node_modules və .next xaric) o repo-ya push edin.

## 3) Vercel-də deploy
1. https://vercel.com → GitHub hesabınızla qeydiyyat.
2. "Add New Project" → GitHub repo-nuzu seçin → Import.
3. **Environment Variables** bölməsində `.env.example`-dakı 3 dəyişəni əlavə edin
   (yuxarıda Supabase-dən götürdüyünüz dəyərlərlə).
4. Deploy düyməsinə basın.

## 4) Domeni bağlamaq
1. Vercel-də layihə → **Settings → Domains** → `domainverse.store` yazıb əlavə edin.
2. Vercel sizə 1-2 DNS record göstərəcək (A record və ya CNAME).
3. Domeni aldığınız yerdə (registrar) DNS bölməsinə bu recordları əlavə edin.
4. Bir neçə dəqiqə-saat ərzində domen aktivləşəcək, SSL avtomatik quraşdırılacaq
   — heç bir manual "Install SSL" addımı yoxdur.

## Necə işləyir?
- İstifadəçi `/signup`-da qeydiyyatdan keçir.
- `/dashboard`-da öz layihə qovluğunu **zip** halında yükləyir (içində
  `index.html` olmalıdır), ada əsasən link yaranır: `domainverse.store/links/ad`.
- Dashboard-dan həmin layihəni yeniləmək (yeni zip yükləmək), adını dəyişmək,
  ya da silmək mümkündür.
