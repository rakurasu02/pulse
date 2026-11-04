// Pulse service worker: shows push notifications and opens the right chat when tapped.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("fetch", () => {});   // lets browsers offer "Install app"
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) {}
  const isIOS = /iPhone|iPad|iPod/.test(self.navigator.userAgent || "");
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // Don't buzz if Pulse is already open and in front (iPhones must always show one).
    if (!isIOS && list.some((c) => c.visibilityState === "visible" && c.focused)) return;
    await self.registration.showNotification(d.title || "Pulse", {
      body: d.body || "",
      icon: "icon-192.png",
      badge: "icon-192.png",
      tag: d.tag || undefined,
      renotify: !!d.tag,
      data: { open: d.open || "" },
      requireInteraction: d.kind === "call",
      vibrate: d.kind === "call" ? [300, 150, 300, 150, 300] : undefined,
    });
  })());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const open = (e.notification.data && e.notification.data.open) || "";
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) {
      if ("focus" in c) { await c.focus(); c.postMessage({ type: "open", open }); return; }
    }
    await self.clients.openWindow("./?open=" + encodeURIComponent(open));
  })());
});
