import { getStore } from "@netlify/blobs";

const OFFSETS = [10, 5, 0];

function pad(n) { return n < 10 ? "0" + n : "" + n; }

function nowInTashkent() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    hhmm: `${get("hour")}:${get("minute")}`,
    dateStr: `${get("year")}-${get("month")}-${get("day")}`
  };
}

function subtractMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(":").map(Number);
  let total = ((h * 60 + m - mins) % 1440 + 1440) % 1440;
  return pad(Math.floor(total / 60)) + ":" + pad(total % 60);
}

async function sendTelegram(token, chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch (e) { /* ignore single-message failures */ }
}

export default async () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return new Response("no token configured", { status: 200 });

  const { hhmm, dateStr } = nowInTashkent();
  const stateStore = getStore("user-state");
  const linksStore = getStore("telegram-links");
  const logStore = getStore("reminder-log");

  const { blobs } = await stateStore.list();

  for (const blob of blobs) {
    const deviceId = blob.key;
    const link = await linksStore.get(deviceId, { type: "json" });
    if (!link || !link.chatId) continue; // this user hasn't linked Telegram — nothing to send

    const data = await stateStore.get(deviceId, { type: "json" });
    if (!data) continue;

    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const alarms = Array.isArray(data.alarms) ? data.alarms : [];

    for (const a of alarms) {
      if (!a.on) continue;
      for (const off of OFFSETS) {
        if (subtractMinutes(a.time, off) !== hhmm) continue;
        const logKey = `${deviceId}:${dateStr}:alarm:${off}:${a.id}`;
        const already = await logStore.get(logKey);
        if (already) continue;
        await logStore.set(logKey, "1");
        const label = a.label || "Budilnik";
        const text = off === 0
          ? `⏰ Budilnik: ${label} (${a.time})`
          : `⏰ ${off} daqiqadan so'ng: ${label} (${a.time})`;
        await sendTelegram(token, link.chatId, text);
      }
    }

    for (const t of tasks) {
      if (t.done) continue;
      for (const off of OFFSETS) {
        if (subtractMinutes(t.time, off) !== hhmm) continue;
        const logKey = `${deviceId}:${dateStr}:task:${off}:${t.id}`;
        const already = await logStore.get(logKey);
        if (already) continue;
        await logStore.set(logKey, "1");
        const text = off === 0
          ? `📌 Vazifa: ${t.title} (${t.time})`
          : `📌 ${off} daqiqadan so'ng: ${t.title} (${t.time})`;
        await sendTelegram(token, link.chatId, text);
      }
    }
  }

  return new Response("OK", { status: 200 });
};

export const config = {
  schedule: "* * * * *"
};
