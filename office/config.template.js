// オフィスと「AI会社の本体（hosted）」をつなぐ設定。
//
// 最初は空でOK（オフラインのサンプル表示で動きます）。
// 本物連携（Gmail / カレンダー / LINE）を使うときに、
// 自分でデプロイした本体の URL をここに貼ります。
//   例: window.AI_CONFIG = { apiBase: "https://my-ai-company.onrender.com" };
//
// ※ セットアップは Claude Code が会話で手取り足取り案内します。
//
// 成果物のクリック動作：
//   - url（スプレッドシート等）→ この設定に関係なく新規タブで開く
//   - path（ローカルファイル）→ 本体をローカル起動（http://localhost:3000/）して
//     オフィスをそこから開いていれば、コンピューターの標準アプリで開く
window.AI_CONFIG = {
  apiBase: "http://localhost:3000", // ← ローカル本体に接続（Gmail/カレンダー連携 有効）
};
