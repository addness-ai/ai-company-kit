// Google 連携（Gmail 取得・送信 / カレンダー 取得・作成）
// 認証情報が未設定なら configured:false を返し、オフィスはサンプル表示にフォールバックする。
import { google } from "googleapis";

function hasGoogle() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
}

function client() {
  const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2;
}

function fmtTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

// 受信メールの最近のもの（壁アプリ用）
export async function listMail(max = 5) {
  if (!hasGoogle()) return { configured: false, items: [] };
  const gmail = google.gmail({ version: "v1", auth: client() });
  const list = await gmail.users.messages.list({ userId: "me", maxResults: max, q: "in:inbox" });
  const ids = (list.data.messages || []).map((m) => m.id);
  const items = [];
  for (const id of ids) {
    const msg = await gmail.users.messages.get({ userId: "me", id, format: "metadata", metadataHeaders: ["From", "Subject", "Date"] });
    const headers = {};
    (msg.data.payload?.headers || []).forEach((h) => (headers[h.name] = h.value));
    const from = (headers.From || "").replace(/<.*>/, "").replace(/"/g, "").trim();
    items.push({
      ic: "📨",
      tt: from || "(差出人不明)",
      sub: headers.Subject || msg.data.snippet || "",
      time: fmtTime(headers.Date),
    });
  }
  return { configured: true, items };
}

// 今日の予定（壁アプリ用）
export async function listCalendar() {
  if (!hasGoogle()) return { configured: false, items: [] };
  const cal = google.calendar({ version: "v3", auth: client() });
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const res = await cal.events.list({
    calendarId: "primary",
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });
  const items = (res.data.items || []).map((e) => ({
    ic: "🗓",
    tt: e.summary || "(無題の予定)",
    sub: e.location || "",
    time: fmtTime(e.start?.dateTime) || (e.start?.date ? "終日" : ""),
  }));
  return { configured: true, items };
}

// メール送信（承認後に実行）
export async function sendMail({ to, subject, body }) {
  if (!hasGoogle()) throw new Error("Google が未設定です");
  const gmail = google.gmail({ version: "v1", auth: client() });
  const raw = Buffer.from(
    `To: ${to}\r\nSubject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=\r\n` +
      `Content-Type: text/plain; charset=UTF-8\r\n\r\n${body}`
  ).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
  const res = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  return { id: res.data.id };
}

// 予定作成（承認後に実行）
export async function createEvent({ title, start, end }) {
  if (!hasGoogle()) throw new Error("Google が未設定です");
  const cal = google.calendar({ version: "v3", auth: client() });
  const res = await cal.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: title,
      start: { dateTime: new Date(start).toISOString() },
      end: { dateTime: new Date(end || new Date(new Date(start).getTime() + 30 * 60000)).toISOString() },
    },
  });
  return { id: res.data.id, link: res.data.htmlLink };
}

export const googleConfigured = hasGoogle;
