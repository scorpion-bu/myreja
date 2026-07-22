import { getStore } from "@netlify/blobs";

export default async (req) => {
  try {
    const { deviceId, tasks, alarms } = await req.json();
    if (!deviceId) {
      return new Response(JSON.stringify({ ok: false, error: "missing-device-id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const store = getStore("user-state");
    await store.setJSON(deviceId, {
      tasks: Array.isArray(tasks) ? tasks : [],
      alarms: Array.isArray(alarms) ? alarms : [],
      updatedAt: Date.now()
    });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "server-error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
