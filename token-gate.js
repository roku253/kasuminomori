/**
 * 外部サイト用: ?token= を検証し、無効ならコンテンツを隠す。
 * 同一オリジンの Next 本番/プレビュー URL を TOKEN_GATE_ORIGIN に設定してください。
 * 例: const TOKEN_GATE_ORIGIN = "https://your-portal.vercel.app";
 */
(function () {
  var TOKEN_GATE_ORIGIN = "https://nazo-portal.vercel.app"
  var params = new URLSearchParams(window.location.search)
  var token = params.get("token")
  if (!token) {
    showDenied("アクセス用のトークンがありません。")
    return
  }
  var resourceKey = window.__TOKEN_RESOURCE_KEY__ || ""
  fetch(TOKEN_GATE_ORIGIN + "/api/platform/validate-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token, resourceKey: resourceKey, consume: true }),
  })
    .then(function (r) {
      return r.json()
    })
    .then(function (data) {
      if (data && data.valid === true) {
        document.documentElement.classList.add("token-gate-ok")
        return
      }
      showDenied((data && data.message) || "アクセス権限がありません。")
    })
    .catch(function () {
      showDenied("検証サーバーに接続できませんでした。")
    })

  function showDenied(msg) {
    var m = document.createElement("div")
    m.setAttribute("style", [
      "position:fixed",
      "inset:0",
      "z-index:999999",
      "background:#0a0a0c",
      "color:#e8e8ec",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:24px",
      "font-family:system-ui,sans-serif",
      "text-align:center",
    ].join(";"))
    m.innerHTML = "<div><p style=\"font-size:14px;opacity:.85\">" + escapeHtml(msg) + "</p></div>"
    document.documentElement.appendChild(m)
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
  }
})()
