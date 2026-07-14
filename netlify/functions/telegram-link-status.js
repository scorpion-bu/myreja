import { getStore } from "@netlify/blobs";

export default async (req) => {
  const url = new URL(req.url);
  const deviceId = url.searchParams.get("deviceId");
  if (!deviceId) {
    return new Response(JSON.stringify({ linked: false }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const store = getStore("telegram-links");
  const data = await store.get(deviceId, { type: "json" });
  return new Response(JSON.stringify({ linked: !!data }), {
    headers: { "Content-Type": "application/json" }
  });
};
