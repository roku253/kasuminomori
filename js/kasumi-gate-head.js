window.__TOKEN_RESOURCE_KEY__ = "ext:kasuminomori";
window.__TOKEN_DENIED__ = function () {
  var el = document.createElement("div");
  el.className = "ns-denied-overlay";
  el.innerHTML =
    '<div class="ns-denied-card">' +
    '<h1>霞ノ杜町公式サイト｜ご案内</h1>' +
    '<p>ただいま当サイトはメンテナンス中のため、一般公開を停止しております。</p>' +
    '<p>ご利用の方は、次のサイトよりお進みください。</p>' +
    '<p><a href="https://nazo-portal.vercel.app/portal" target="_blank" rel="noopener noreferrer">任務ポータル</a></p>' +
    "</div>";
  document.documentElement.appendChild(el);
};
