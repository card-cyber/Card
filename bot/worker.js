// The Listing - Telegram inline kartvizit botu
// Cloudflare Worker, bağımlılık yok. Token/secret KOD İÇİNDE DEĞİL, Cloudflare "Secrets" içinde durur.

const BOT_USERNAME = "GultekinCardBot";
const BASE = "https://card-cyber.github.io/Card/gultekin";
const LINKS = {
  telegram: "https://t.me/tekinn",
  linkedin: "https://www.linkedin.com/in/gultekinoksuz",
  website: "https://thelisting.io/",
  mail: `${BASE}/mail.html`, // Telegram mailto: butonunu reddedebilir; bu sayfa mailto'ya yönlendirir
};

// Mesajın altındaki yazı (en fazla 1024 karakter). Buradan düzenleyin.
const CARDS = {
  en: {
    title: "Digital card (English)",
    description: "Card image + 6 buttons",
    photo: `${BASE}/telegram/kart-tg-en.jpg`,
    caption:
      "Hi, I'm Gültekin. I handle exchange relations and listings for Web3 projects.\n\n" +
      "I work directly with listing teams at 40+ exchanges across Tier 1–3, helping projects identify suitable exchanges and manage the listing process end to end.\n\n" +
      "If you're exploring listings, happy to connect and hear what you're building.",
    labels: { tg: "✈️ Telegram", li: "in LinkedIn", mail: "✉️ E-mail", web: "🌐 Website", add: "➕ Add Contact", share: "🔗 Share Card" },
    vcf: "Tap the file to save my contact details.",
    welcome: "This bot sends Gültekin Öksüz's digital business card. In any chat, type @" + BOT_USERNAME + " and pick a card.",
  },
  tr: {
    title: "Dijital kart (Türkçe)",
    description: "Kart görseli + 6 buton",
    photo: `${BASE}/telegram/kart-tg-tr.jpg`,
    caption:
      "Merhaba, ben Gültekin. Web3 projeleri için borsa ilişkileri ve listeleme süreçlerini yönetiyorum.\n\n" +
      "Tier 1–3 arasındaki 40'tan fazla borsanın listeleme ekipleriyle doğrudan çalışıyor, projelerin uygun borsaları belirlemesine ve listeleme sürecini baştan sona yönetmesine yardımcı oluyorum.\n\n" +
      "Listeleme seçeneklerini araştırıyorsanız, projenizi dinlemekten memnuniyet duyarım.",
    labels: { tg: "✈️ Telegram", li: "in LinkedIn", mail: "✉️ E-posta", web: "🌐 Website", add: "➕ Kişilere Ekle", share: "🔗 Kartı Paylaş" },
    vcf: "Kişi bilgilerimi kaydetmek için dosyaya dokunun.",
    welcome: "Bu bot Gültekin Öksüz'ün dijital kartvizitini gönderir. Herhangi bir sohbette @" + BOT_USERNAME + " yazıp bir kart seçin.",
  },
};

function keyboard(lang) {
  const t = CARDS[lang].labels;
  return {
    inline_keyboard: [
      [{ text: t.tg, url: LINKS.telegram }, { text: t.li, url: LINKS.linkedin }, { text: t.mail, url: LINKS.mail }],
      [{ text: t.web, url: LINKS.website }, { text: t.add, url: `https://t.me/${BOT_USERNAME}?start=vcf_${lang}` }, { text: t.share, switch_inline_query: "" }],
    ],
  };
}

async function tg(env, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function sendVcf(env, chatId, lang) {
  // sendDocument URL ile sadece PDF/ZIP kabul eder; .vcf dosyasını indirip yüklemek gerekir.
  const file = await fetch(`${BASE}/Gultekin_Oksuz.vcf`);
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", CARDS[lang].vcf);
  form.append("document", new Blob([await file.arrayBuffer()], { type: "text/vcard" }), "Gultekin_Oksuz.vcf");
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendDocument`, { method: "POST", body: form });
  return r.json();
}

async function onInlineQuery(env, q) {
  // Kullanıcının dili Türkçe ise Türkçe kart başa gelir
  const order = (q.from?.language_code || "").toLowerCase().startsWith("tr") ? ["tr", "en"] : ["en", "tr"];
  const results = order.map((lang) => ({
    type: "photo",
    id: `card_${lang}`,
    photo_url: CARDS[lang].photo,
    thumbnail_url: CARDS[lang].photo,
    photo_width: 1280,
    photo_height: 1357,
    title: CARDS[lang].title,
    description: CARDS[lang].description,
    caption: CARDS[lang].caption,
    reply_markup: keyboard(lang),
  }));
  // Herkes kullanabilir: müşteri "Kartı Paylaş"a bastığında da kart çıkmalı.
  return tg(env, "answerInlineQuery", { inline_query_id: q.id, results, cache_time: 60, is_personal: false });
}

async function onMessage(env, m) {
  const text = (m.text || "").trim();
  const lang = (m.from?.language_code || "").toLowerCase().startsWith("tr") ? "tr" : "en";
  const start = text.match(/^\/start(?:@\w+)?\s*(.*)$/);
  if (start) {
    const payload = start[1];
    if (payload.startsWith("vcf")) {
      const l = payload.endsWith("_tr") ? "tr" : payload.endsWith("_en") ? "en" : lang;
      return sendVcf(env, m.chat.id, l);
    }
    return tg(env, "sendMessage", { chat_id: m.chat.id, text: CARDS[lang].welcome });
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method !== "POST" || url.pathname !== "/webhook") return new Response("ok");
    if (req.headers.get("x-telegram-bot-api-secret-token") !== env.WEBHOOK_SECRET) return new Response("forbidden", { status: 403 });
    const update = await req.json();
    try {
      if (update.inline_query) await onInlineQuery(env, update.inline_query);
      else if (update.message) await onMessage(env, update.message);
    } catch (e) {
      console.error("handler error", e && e.message);
    }
    return new Response("ok");
  },
};
