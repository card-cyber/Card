# GultekinCardBot kurulumu

Bot, Telegram'da herhangi bir sohbette `@GultekinCardBot` yazınca kart görseli + yazı + 6 inline butonu **sizin hesabınızdan** gönderir.

## 1. Cloudflare Worker
1. https://dash.cloudflare.com → ücretsiz hesap → **Workers & Pages** → **Create** → **Create Worker** → ad: `card` → **Deploy**.
2. **Edit code** → içindekini silip `bot/worker.js` dosyasının tamamını yapıştırın → **Deploy**.
3. **Settings → Variables and Secrets** → **Add** (tip: *Secret*):
   - `BOT_TOKEN` = BotFather'ın verdiği token
   - `WEBHOOK_SECRET` = rastgele uzun bir metin (örn. 30 harf/rakam)
4. Worker adresinizi not edin: `https://card.card007800.workers.dev`

## 2. Telegram'a adresi bildirme
Tarayıcıda tek seferlik açın (köşeli parantezleri kaldırın):

```
https://api.telegram.org/bot[BOT_TOKEN]/setWebhook?url=https://card.card007800.workers.dev/webhook&secret_token=[WEBHOOK_SECRET]&allowed_updates=["inline_query","message"]
```
`{"ok":true,"result":true,...}` görürseniz tamam.

## 3. BotFather
`Inline Mode → Placeholder` alanına örn. `Kartı seç / Pick a card` yazın.

## 4. Deneme
Bir sohbette `@GultekinCardBot` yazıp boşluk bırakın → TR/EN kartlar çıkar → birini seçin.
Her butonu deneyin, mesajı başka sohbete iletip butonların durduğunu kontrol edin.

## Notlar
- Token ve `WEBHOOK_SECRET` repoya, sohbete, ekran görüntüsüne yazılmaz. Sızarsa BotFather → `/revoke`.
- Yazı metinleri `worker.js` başındaki `CARDS` bölümünden değişir (en fazla 1024 karakter).
- Kart görselleri `gultekin/telegram/kart-tg-*.jpg`. Görsel değişirse Telegram önbelleği için dosya adını değiştirin.
