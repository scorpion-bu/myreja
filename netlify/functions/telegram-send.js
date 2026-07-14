import { getStore } from "@netlify/blobs";

export default async (req) => {
  try {
    const { deviceId, text } = await req.json();
    if (!deviceId || !text) {
      return new Response(JSON.stringify({ ok: false, error: "missing-params" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const store = getStore("telegram-links");
    const data = await store.get(deviceId, { type: "json" });
    if (!data) {
      return new Response(JSON.stringify({ ok: false, error: "not-linked" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: data.chatId, text })
    });
    const result = await res.json();
    return new Response(JSON.stringify(result), {
      status: res.ok ? 200 : 400,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "server-error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
