/**
 * Open a game in its own browser tab, at the provider's URL.
 *
 * Games used to run inside an iframe in a full-screen overlay, which means the
 * whole site stays loaded underneath: the React tree, the catalog queries, the
 * 5-second balance poll, the chat widget, every image on the page behind it.
 * The game engine then competes with all of it for CPU and bandwidth on a phone
 * that has neither to spare, and players feel it as "the game is slow to load".
 * A separate tab has none of that — the game gets the whole browser.
 *
 * THE PART THAT IS EASY TO GET WRONG. A launch URL only exists after a POST to
 * the provider, so the obvious code is `await launch(); window.open(url)` — and
 * that is blocked. Browsers only allow a popup while a user gesture is still on
 * the stack, and the gesture is long gone by the time the request comes back.
 * Mobile Safari and Chrome are the strictest, which is exactly the audience.
 *
 * So the tab is opened SYNCHRONOUSLY inside the click, before anything is
 * awaited, and pointed at the real URL once it arrives. The blank tab shows a
 * "starting your game" holding page in the meantime rather than a white screen.
 *
 * If the popup is blocked anyway — some in-app browsers refuse regardless — the
 * caller is told, and navigates the current tab instead. Never silently fail:
 * a player who tapped a game and got nothing has no idea it was the browser.
 */

/** A tab opened and waiting for its URL. */
export interface PendingGameTab {
  /** Point the tab at the launch URL. No-op if it was closed meanwhile. */
  send: (url: string) => void;
  /** Give up: close the placeholder so no orphan tab is left behind. */
  cancel: () => void;
  /** False when the browser refused the popup — fall back to same-tab. */
  readonly opened: boolean;
}

/** Holding page shown while the launch request is in flight. */
function holdingMarkup(gameName?: string): string {
  const safe = String(gameName ?? 'your game').replace(/[<>&"]/g, '');
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Starting ${safe}…</title>
<style>
  html,body{height:100%;margin:0;background:#0b0d12;color:#e8eaf0;
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  .w{height:100%;display:flex;flex-direction:column;align-items:center;
    justify-content:center;gap:18px;text-align:center;padding:24px}
  .s{width:44px;height:44px;border-radius:50%;border:3px solid rgba(255,255,255,.15);
    border-top-color:#f0b90b;animation:r .9s linear infinite}
  @keyframes r{to{transform:rotate(360deg)}}
  p{margin:0;font-size:14px;opacity:.75}
</style></head>
<body><div class="w"><div class="s"></div><p>Starting ${safe}…</p></div></body></html>`;
}

/**
 * Call this DIRECTLY in the click handler, before any await.
 */
export function openGameTab(gameName?: string): PendingGameTab {
  let tab: Window | null = null;
  let settled = false;
  try {
    tab = window.open('', '_blank');
  } catch {
    tab = null;
  }

  if (tab) {
    try {
      tab.document.write(holdingMarkup(gameName));
      tab.document.close();
    } catch {
      // Cross-origin or a browser that will not let us write to a blank tab.
      // Harmless: the tab still works, it is just blank until the URL lands.
    }
  }

  /*
   * A launch that never arrives must not leave a tab spinning forever.
   *
   * The failure paths are spread across every call site, each with its own
   * onError, and relying on all of them to clean up is how one gets missed. A
   * single timer here covers all of them: if no URL has been delivered by the
   * time it fires, the tab says so plainly instead of pretending to load. 30s
   * is far longer than any healthy launch and short enough that nobody sits
   * watching a dead spinner.
   */
  const guard = setTimeout(() => {
    if (settled || !tab || tab.closed) return;
    try {
      tab.document.write(
        holdingMarkup().replace(
          /<div class="s"><\/div><p>[^<]*<\/p>/,
          '<p style="font-size:15px;opacity:1">Could not start the game.<br><br>' +
            '<span style="opacity:.7;font-size:13px">Please close this tab and try again from the site.</span></p>',
        ),
      );
      tab.document.close();
    } catch {
      try { tab.close(); } catch { /* gone */ }
    }
  }, 30000);

  return {
    opened: Boolean(tab),
    send: (url: string) => {
      settled = true;
      clearTimeout(guard);
      if (!tab || tab.closed) return;
      try {
        // `replace` so the holding page does not sit in the tab's history and
        // strand the player on a spinner when they press Back.
        tab.location.replace(url);
      } catch {
        try { tab.location.href = url; } catch { /* tab is gone */ }
      }
    },
    cancel: () => {
      settled = true;
      clearTimeout(guard);
      try { if (tab && !tab.closed) tab.close(); } catch { /* already gone */ }
    },
  };
}

/**
 * Send the player to the game, wherever it can be opened.
 *
 * Returns true when the launch was handled. Same-tab navigation is the fallback
 * for a blocked popup — worse than a new tab, but it still starts the game,
 * which is the only outcome the player cares about.
 */
export function deliverGameUrl(pending: PendingGameTab, url: string): boolean {
  if (!url) { pending.cancel(); return false; }
  if (pending.opened) { pending.send(url); return true; }
  window.location.href = url;
  return true;
}
