const TOKEN = Deno.env.get("BOT_TOKEN")!;
const WEBAPP = Deno.env.get("WEBAPP_URL")!;
const SECRET = Deno.env.get("WEBHOOK_SECRET")!;

Deno.serve(async (req) => {
  if (req.headers.get("x-telegram-bot-api-secret-token") !== SECRET) return new Response("no", { status: 401 });
  const up = await req.json();
  const m = up.message;
  if (m?.text?.startsWith("/start")) {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: m.chat.id,
        text: "سلام! 🪙 برای شروع روی دکمه‌ی پایین بزن و سکه جمع کن.",
        reply_markup: { inline_keyboard: [[{ text: "🪙 شروع بازی", web_app: { url: WEBAPP } }]] },
      }),
    });
  }
  return new Response("ok");
});
