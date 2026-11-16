// @ts-check
// Visual feedback only: this module never creates messages or changes the route.
/** @typedef {{tm:number, wa:number}} UnreadTotals */
/** @typedef {"wa" | "tm" | "wab"} GrowthChannel */
/** @typedef {{value:number, channel:GrowthChannel}} GrowthCounter */
/** @typedef {{layer:HTMLElement, card:HTMLElement, initial:UnreadTotals, latest:UnreadTotals, lastTotal:number, ready:boolean, entryTimer:number, dismissTimer:number, removeTimer:number, counters:GrowthCounter[]}} GrowthPopup */
/** @type {GrowthPopup | null} */
let active = null;

/** @type {GrowthChannel[]} */
const channels = ["wa", "tm", "wab"];
/** Enterprise shares the existing local WhatsApp data, not another inbox.
 * @param {UnreadTotals} totals @param {GrowthChannel} channel */
const channelTotal = (totals, channel) => totals[channel === "wab" ? "wa" : channel];
/** @param {GrowthChannel} channel */
const channelLabel = channel => channel === "tm" ? "TM" : channel === "wab" ? "WhatsApp 企业版" : "WhatsApp";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const gsap = () => /** @type {any} */ (window).gsap;

export function resetUnreadPopup() {
  if (!active) return;
  const popup = active;
  active = null;
  window.clearTimeout(popup.entryTimer);
  window.clearTimeout(popup.dismissTimer);
  window.clearTimeout(popup.removeTimer);
  const G = gsap();
  if (G) G.killTweensOf([popup.card, ...Array.from(popup.card.querySelectorAll("*")), ...popup.counters]);
  popup.layer.remove();
}

/** @param {GrowthPopup} popup */
function dismiss(popup) {
  if (active !== popup) return;
  window.clearTimeout(popup.entryTimer);
  window.clearTimeout(popup.dismissTimer);
  const G = gsap();
  if (G) G.killTweensOf([popup.card, ...Array.from(popup.card.querySelectorAll("*")), ...popup.counters]);
  if (reducedMotion() || !G) { resetUnreadPopup(); return; }
  popup.layer.classList.add("is-leaving");
  G.to(popup.card, {opacity:0, y:-10, scale:.97, duration:.24, ease:"power2.in"});
  popup.removeTimer = window.setTimeout(() => { if (active === popup) resetUnreadPopup(); }, 250);
}

/** @param {GrowthPopup} popup @param {boolean} [animateCatchUp] */
function renderCounts(popup, animateCatchUp = false) {
  if (active !== popup || !popup.ready) return;
  const G = gsap();
  const motion = !!G && !reducedMotion();
  const nextTotal = popup.latest.tm + popup.latest.wa;
  const emphasiseAll = animateCatchUp || nextTotal > popup.lastTotal;
  popup.lastTotal = nextTotal;
  for (const [index, channel] of channels.entries()) {
    const chip = /** @type {HTMLElement} */ (popup.card.querySelector(`[data-growth-channel="${channel}"]`));
    const badge = /** @type {HTMLElement} */ (chip.querySelector(".unread-popup-badge"));
    const digit = /** @type {HTMLElement} */ (badge.querySelector("span"));
    const total = channelTotal(popup.latest, channel);
    const previous = Number(badge.dataset.count || 0);
    const label = channelLabel(channel);
    chip.setAttribute("aria-label", `${label}，${total} 条未读消息${channel === "wab" ? "（共享 WhatsApp 本地演示未读）" : ""}`);
    badge.dataset.count = String(total);
    badge.hidden = false;
    if (previous !== total || animateCatchUp) {
      const stale = popup.counters.filter(counter => counter.channel === channel);
      G?.killTweensOf(stale);
      popup.counters = popup.counters.filter(counter => counter.channel !== channel);
      if (motion && (animateCatchUp || total > previous)) {
        const counter = {value:animateCatchUp ? 0 : Number(digit.textContent || previous), channel};
        popup.counters.push(counter);
        digit.textContent = String(Math.round(counter.value));
        G.to(counter, {value:total, duration:animateCatchUp ? .4 : .18, ease:"power1.out", onUpdate:() => {
          if (active === popup && Number(badge.dataset.count) === total) digit.textContent = String(Math.round(counter.value));
        }, onComplete:() => {
          if (active === popup && Number(badge.dataset.count) === total) digit.textContent = String(total);
          popup.counters = popup.counters.filter(target => target !== counter);
        }});
      } else digit.textContent = String(total);
    }
    if (motion && emphasiseAll) {
      G.fromTo(digit, {y:5, opacity:.5}, {y:0, opacity:1, duration:.16, ease:"power2.out", overwrite:true, clearProps:"transform,opacity"});
      G.fromTo(badge, {scale:1.21, "--badge-glow":1}, {scale:1, "--badge-glow":0, delay:index*.025, duration:.27, ease:"power2.out", overwrite:true, clearProps:"transform,--badge-glow"});
    }
  }
  const added = Math.max(0, popup.latest.tm + popup.latest.wa - popup.initial.tm - popup.initial.wa);
  const summary = /** @type {HTMLElement} */ (popup.card.querySelector(".unread-popup-added"));
  summary.textContent = added ? `已新增 ${added} 条未读消息` : "等待新消息入列";
  popup.card.classList.toggle("has-growth", added > 0);
}

/** Show the original three channel marks before the rapid burst starts.
 * @param {UnreadTotals} totals @param {"tm" | "wa"} channel
 * @returns {number} Visual entry lead-in; the caller independently owns all delivery timers.
 */
export function showUnreadPopup(totals, channel) {
  resetUnreadPopup();
  if (document.hidden) return 0;
  // A growth overview replaces only a regular reminder, never an automatic mail handoff.
  const reminder = document.getElementById("arrivalNotification");
  if (reminder?.dataset.autoOpen === "false") reminder.remove();
  const layer = document.createElement("div");
  layer.id = "unreadGrowthPopup";
  layer.className = "unread-growth-layer";
  const card = document.createElement("section");
  card.className = "unread-growth-popup";
  card.setAttribute("role", "region");
  card.setAttribute("aria-label", "渠道未读消息增长提示");
  card.innerHTML = `<header class="unread-popup-header"><div><span class="unread-popup-eyebrow"><i aria-hidden="true"></i>沟通消息</span><h2>新消息正在增加</h2></div><button type="button" class="unread-popup-close" aria-label="关闭消息增长弹窗">×</button></header><div class="unread-popup-channels"><div class="unread-popup-channel" data-growth-channel="wa" role="group"><span class="cdot c-wa" aria-hidden="true"></span><span class="unread-popup-name">WhatsApp</span><b class="unread-popup-badge wa-badge" aria-hidden="true"><span></span></b></div><div class="unread-popup-channel" data-growth-channel="tm" role="group"><span class="cdot c-tm" aria-hidden="true"></span><span class="unread-popup-name">TM</span><b class="unread-popup-badge" aria-hidden="true"><span></span></b></div><div class="unread-popup-channel enterprise" data-growth-channel="wab" data-count-source="wa" role="group" title="企业版共享 WhatsApp 本地演示未读数据"><span class="cdot c-wab" aria-hidden="true"></span><span class="unread-popup-name">WhatsApp 企业版</span><b class="unread-popup-badge wa-badge" aria-hidden="true"><span></span></b></div></div><footer class="unread-popup-footer"><strong class="unread-popup-added" role="status" aria-live="polite">等待新消息入列</strong></footer>`;
  layer.appendChild(card);
  /** @type {GrowthPopup} */
  const popup = {layer, card, initial:{...totals}, latest:{...totals}, lastTotal:totals.tm+totals.wa, ready:true, entryTimer:0, dismissTimer:0, removeTimer:0, counters:[]};
  active = popup;
  for (const key of channels) {
    const chip = /** @type {HTMLElement} */ (card.querySelector(`[data-growth-channel="${key}"]`));
    chip.classList.toggle("is-active", key === channel);
    const badge = /** @type {HTMLElement} */ (chip.querySelector(".unread-popup-badge"));
    badge.dataset.count = String(channelTotal(totals,key));
    badge.hidden = false;
    /** @type {HTMLElement} */ (badge.querySelector("span")).textContent = String(channelTotal(totals,key));
  }
  document.body.appendChild(layer);
  renderCounts(popup);
  card.querySelector(".unread-popup-close")?.addEventListener("click", () => resetUnreadPopup());
  const G = gsap();
  const leadIn = reducedMotion() || !G ? 0 : 380;
  if (leadIn) {
    popup.ready = false;
    G.fromTo(card, {opacity:0, y:-16, scale:.88}, {opacity:1, y:0, scale:1, duration:.36, ease:"back.out(1.35)", clearProps:"transform,opacity"});
    popup.entryTimer = window.setTimeout(() => {
      if (active !== popup) return;
      popup.ready = true;
      renderCounts(popup, true);
    }, 360);
  }
  popup.dismissTimer = window.setTimeout(() => dismiss(popup), 3200);
  return leadIn;
}

/** @param {UnreadTotals} totals */
export function syncUnreadPopup(totals) {
  if (!active || active.layer.classList.contains("is-leaving")) return;
  active.latest = {...totals};
  renderCounts(active);
  window.clearTimeout(active.dismissTimer);
  const popup = active;
  popup.dismissTimer = window.setTimeout(() => dismiss(popup), 2300);
}

window.addEventListener("resize", resetUnreadPopup);
window.addEventListener("pagehide", resetUnreadPopup);
document.addEventListener("visibilitychange", () => { if (document.hidden) resetUnreadPopup(); });
