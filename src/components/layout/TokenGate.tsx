"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __TOKEN_RESOURCE_KEY__?: string;
    __TOKEN_DENIED__?: (message: string) => void;
  }
}

const TOKEN_GATE_ORIGIN = "https://nazo-portal.vercel.app";
const LS_LOGIN = "ns_login_id";
const LS_MASTER = "ns_master_token";
const LS_CASE = "ns_case_id";
const MSG_REQUEST = "NS_AUTH_REQUEST";
const MSG_GRANT = "NS_AUTH_GRANT";
const SS_OK_PREFIX = "ns_gate_ok_v1_";
const OK_TTL_MS = 5 * 60 * 1000;

function readCreds() {
  try {
    return {
      loginId: (localStorage.getItem(LS_LOGIN) || "").trim(),
      masterToken: (localStorage.getItem(LS_MASTER) || "").trim(),
      caseId: (localStorage.getItem(LS_CASE) || "").trim(),
    };
  } catch {
    return { loginId: "", masterToken: "", caseId: "" };
  }
}

function writeCreds(c: { loginId: string; masterToken: string; caseId: string }) {
  try {
    if (c.loginId) localStorage.setItem(LS_LOGIN, c.loginId);
    if (c.masterToken) localStorage.setItem(LS_MASTER, c.masterToken);
    if (c.caseId) localStorage.setItem(LS_CASE, c.caseId);
  } catch {
    /* ignore */
  }
}

function ssOkKey(resourceKey: string) {
  return SS_OK_PREFIX + resourceKey;
}

function readCachedOk(resourceKey: string) {
  if (!resourceKey) return false;
  try {
    const raw = sessionStorage.getItem(ssOkKey(resourceKey));
    if (!raw) return false;
    const n = Number(raw);
    if (!n || Number.isNaN(n)) return false;
    if (Date.now() - n > OK_TTL_MS) {
      sessionStorage.removeItem(ssOkKey(resourceKey));
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function writeCachedOk(resourceKey: string) {
  if (!resourceKey) return;
  try {
    sessionStorage.setItem(ssOkKey(resourceKey), String(Date.now()));
  } catch {
    /* ignore */
  }
}

function clearCachedOk(resourceKey: string) {
  if (!resourceKey) return;
  try {
    sessionStorage.removeItem(ssOkKey(resourceKey));
  } catch {
    /* ignore */
  }
}

function showDenied(msg: string) {
  if (typeof window.__TOKEN_DENIED__ === "function") {
    window.__TOKEN_DENIED__(msg);
    return;
  }
  const m = document.createElement("div");
  m.setAttribute(
    "style",
    "position:fixed;inset:0;z-index:999999;background:#0a0a0c;color:#e8e8ec;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;text-align:center;"
  );
  m.innerHTML = `<div><p style="font-size:14px;opacity:.85">${msg.replace(/</g, "&lt;")}</p></div>`;
  document.documentElement.appendChild(m);
}

function unlock() {
  document.documentElement.classList.add("token-gate-ok");
}

function lock() {
  document.documentElement.classList.remove("token-gate-ok");
}

function isDevBypass(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  try {
    return localStorage.getItem("kasumi_dev_unlock") === "1";
  } catch {
    return false;
  }
}

async function callValidate(c: ReturnType<typeof readCreds>) {
  const resourceKey = window.__TOKEN_RESOURCE_KEY__ || "";
  const r = await fetch(`${TOKEN_GATE_ORIGIN}/api/platform/validate-entitlement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      loginId: c.loginId,
      masterToken: c.masterToken,
      caseId: c.caseId,
      resourceKey,
    }),
  });
  return r.json();
}

function bootstrapFromOpener(): Promise<{
  loginId: string;
  masterToken: string;
  caseId: string;
} | null> {
  return new Promise((resolve) => {
    if (!window.opener || window.opener.closed) {
      resolve(null);
      return;
    }
    let finished = false;
    let tries = 0;
    const poll = setInterval(() => {
      if (finished) return;
      tries++;
      if (tries > 12) {
        clearInterval(poll);
        if (!finished) resolve(null);
        return;
      }
      try {
        window.opener.postMessage(
          { type: MSG_REQUEST, resourceKey: window.__TOKEN_RESOURCE_KEY__ || "" },
          TOKEN_GATE_ORIGIN
        );
      } catch {
        /* ignore */
      }
    }, 150);

    function onGrant(ev: MessageEvent) {
      if (ev.origin !== TOKEN_GATE_ORIGIN) return;
      if (!ev.data || ev.data.type !== MSG_GRANT) return;
      finished = true;
      clearInterval(poll);
      window.removeEventListener("message", onGrant);
      const c = {
        loginId: String(ev.data.loginId || "").trim(),
        masterToken: String(ev.data.masterToken || "").trim(),
        caseId: String(ev.data.caseId || "").trim(),
      };
      if (c.loginId && c.masterToken && c.caseId) {
        writeCreds(c);
        resolve(c);
      } else resolve(null);
    }
    window.addEventListener("message", onGrant);
  });
}

function backgroundRevalidate(c: ReturnType<typeof readCreds>, resourceKey: string) {
  callValidate(c)
    .then((data) => {
      if (data?.valid === true) writeCachedOk(resourceKey);
      else {
        clearCachedOk(resourceKey);
        lock();
        showDenied(data?.message || "アクセス権限がありません。");
      }
    })
    .catch(() => {
      /* keep optimistic unlock */
    });
}

function deniedOverlay() {
  const el = document.createElement("div");
  el.className = "ns-denied-overlay";
  el.innerHTML =
    '<div class="ns-denied-card">' +
    "<h1>霞ノ杜町公式サイト｜ご案内</h1>" +
    "<p>ただいま当サイトはメンテナンス中のため、一般公開を停止しております。</p>" +
    "<p>ご利用の方は、次のサイトよりお進みください。</p>" +
    '<p><a href="https://nazo-portal.vercel.app/portal" target="_blank" rel="noopener noreferrer">任務ポータル</a></p>' +
    "</div>";
  document.documentElement.appendChild(el);
}

export function TokenGateInit() {
  useEffect(() => {
    window.__TOKEN_RESOURCE_KEY__ = "ext:kasuminomori";
    window.__TOKEN_DENIED__ = deniedOverlay;

    if (isDevBypass()) {
      document.documentElement.setAttribute("data-kasumi-dev", "1");
      unlock();
      return;
    }

    try {
      const u = new URL(window.location.href);
      if (u.searchParams.has("token")) {
        u.searchParams.delete("token");
        window.history.replaceState({}, "", u.pathname + u.search + u.hash);
      }
    } catch {
      /* ignore */
    }

    const resourceKey = window.__TOKEN_RESOURCE_KEY__ || "";
    const c = readCreds();

    if (resourceKey && readCachedOk(resourceKey) && c.loginId && c.masterToken && c.caseId) {
      unlock();
      return;
    }

    if (c.loginId && c.masterToken && c.caseId) {
      unlock();
      backgroundRevalidate(c, resourceKey);
      return;
    }

    bootstrapFromOpener().then((c2) => {
      if (!c2) {
        showDenied(
          "このページを単独で開くには、先に任務ポータルにログインし、対象作品をプレイ開始してください。"
        );
        return;
      }
      callValidate(c2)
        .then((data) => {
          if (data?.valid === true) {
            writeCachedOk(resourceKey);
            unlock();
          } else {
            showDenied(data?.message || "アクセス権限がありません。");
          }
        })
        .catch(() => showDenied("検証サーバーに接続できませんでした。"));
    });
  }, []);

  return null;
}
