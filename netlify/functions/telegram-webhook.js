import { getStore } from "@netlify/blobs";

export default async (req) => {
  try {
    const update = await req.json();
    const msg = update.message;
    if (msg && msg.text && msg.text.indexOf("/start") === 0) {
      const parts = msg.text.trim().split(" ");
      const deviceId = parts[1];
      if (deviceId) {
        const store = getStore("telegram-links");
        await store.setJSON(deviceId, { chatId: msg.chat.id, linkedAt: Date.now() });

        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (token) {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: msg.chat.id,
              text: "✅ Kun Tartibim ilovasiga muvaffaqiyatli ulandingiz! Endi ilovadan bildirishnomalar shu yerga keladi."
            })
          });
        }
      }
    }
    return new Response("OK", { status: 200 });
  } catch (e) {
    return new Response("OK", { status: 200 });
  }
};
