// @ts-check
import { conversations, opening, defaultItems, buyerMail, mailThread, mailList, mailNew, mailSilence, waBuyer, waScript } from "./data.js";
import { fxReset } from "./summary-fx.js";
import { createInbox, incomingDemo } from "./inbox-store.js?v=jason-followup-20261030";
import { showAppleNotification } from "./notifications.js?v=manual-growth-20261106-1506";
import { fxHighIntent, resetCaptureFx } from "./capture-fx.js";
import { fxMailToWhatsApp, resetMailWaFx } from "./mail-wa-fx.js?v=mac-popup-20261026";
import { fxDetailText, resetDetailFx } from "./detail-fx.js";
import { fxDeliveryCard, resetDeliveryCardFx } from "./delivery-card-fx.js?v=intent-in-detail-20261029";
import { fxRecognizeSource, fxCompletedDashboard, resetDashboardFx } from "./dashboard-fx.js?v=completed-dashboard-20261028";
import { resetMessageCards, messageCardsVersion } from "./message-cards.js";
import { createJasonFollowup } from "./jason-followup.js";
import { createMixedBurst } from "./mixed-incoming.js";
import { createBurstMailStore } from "./burst-mail-store.js";

/** @typedef {import("./data.js").CollectItem} CollectItem */

const railItems = [
  ["star", "常用"], ["desk", "工作台"], ["robot", "智能销售"], ["spark", "OKKI<br>AiReach"],
  ["mail", "邮件"], ["chat", "沟通"], ["lead", "线索"], ["users", "客户"],
  ["target", "商机"], ["leads", "OKKI<br>Leads"], ["trade", "交易"], ["bars", "团队数据"]
];



/** Short acknowledgements so each single question reads naturally. */
const acks = [
  { en: "Got it. ", zh: "好的，" },
  { en: "Thank you. ", zh: "感谢告知，" },
  { en: "Understood. ", zh: "明白了，" },
  { en: "Great. ", zh: "好的，" }
];

/** @param {string} id */
function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node;
}

/** @param {string} s */
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);

/** @param {CollectItem[]} list */
const clone = (list) => list.map((i) => ({ ...i, ask: { ...i.ask }, answer: { ...i.answer } }));

/* ---------- state ---------- */
let items = clone(defaultItems);
/** @type {CollectItem[]} */
let draft = [];
/** @type {Record<string, string>} */
let collected = {};
let rule = { on: true, threshold: 1000 };
let runId = 0;
let dashboardShownRun = -1;
let dashboardCompletedRun = -1;
let customSeq = 0;
/** @type {string | null} */
let editingId = null;

const enabledItems = () => items.filter((i) => i.enabled);

/* ---------- linked inbox and independent conversations ---------- */
const inbox = createInbox();
const selected = { tm: "hyg", wa: "marco" };
const burstMail = createBurstMailStore(() => {renderBurstMailRows();refreshUnread();});
let receptionOpened = false;
let receptionPending = true;
/** @type {"chat" | "mail" | "wa"} */
let currentView = "chat";
let sessionFilter = "all";
let primaryAuto = true;
let inboxDemoStarted = false;

const highIntent = new Set();
/** @type {(() => void) | null} */
let pendingNotice = null;
/** @param {"tm" | "wa"} channel @param {string} id */
const isThreadVisible = (channel, id) => !document.hidden && selected[channel] === id && currentView === (channel === "tm" ? "chat" : "wa") && (channel !== "tm" || id !== "hyg" || receptionOpened);
const isPrimaryVisible = () => isThreadVisible("tm", "hyg");
const jasonFollowup = createJasonFollowup({
  visible:() => isThreadVisible("tm","jason"),
  append:message => inbox.append("tm","jason",message,isThreadVisible("tm","jason")),
  box:() => el("messages"),
  avatar:inbox.get("tm","jason").profile.avatar,
  changed:() => {if(isThreadVisible("tm","jason")) syncTmComposer();}
});

function refreshUnread() {
  el("tmUnreadTotal").textContent = String(inbox.total("tm"));
  el("waUnreadTotal").textContent = String(inbox.total("wa"));
  el("unreadFilter").setAttribute("aria-label", `未读，${inbox.total("tm")} 条消息`);
  const mailButton=document.querySelector('.rail [data-view="mail"]');
  if(mailButton){let badge=document.getElementById('mailUnreadTotal');if(!badge){badge=document.createElement('em');badge.id='mailUnreadTotal';badge.className='random-mail-unread';mailButton.appendChild(badge);}badge.textContent=String(burstMail.total());badge.hidden=!burstMail.total();mailButton.setAttribute('aria-label','邮件，'+burstMail.total()+' 条未读');}
}

function renderSessionList() {
  const query = /** @type {HTMLInputElement} */ (document.querySelector(".sessions .session-search input")).value.trim().toLowerCase();
  const list = inbox.list("tm").filter(t => (!query || `${t.profile.name} ${t.profile.company} ${t.preview}`.toLowerCase().includes(query)) &&
    (sessionFilter === "unread" ? t.unread > 0 : sessionFilter === "important" ? t.profile.important : sessionFilter === "pending" ? t.messages[t.messages.length - 1]?.side === "buyer" : true));
  el("sessionList").innerHTML = list.map(t => `
    <li class="session${selected.tm === t.profile.id ? " active" : ""}${t.unread ? " has-unread" : ""}">
      <button class="session-select" data-tm-session="${t.profile.id}" aria-label="${esc(t.profile.name)}，${t.unread} 条未读消息" aria-pressed="${selected.tm === t.profile.id}">
        <img class="avatar" src="${t.profile.avatar}" alt="" width="38" height="38" loading="lazy">
        <div class="session-main"><div class="session-top"><strong>${esc(t.profile.name)}</strong><span class="flag flag-${t.profile.flag}"></span><time>${esc(t.time)}</time></div>
          <div class="session-preview"><p>${t.unread ? "[未读] " : ""}${esc(t.preview)}</p>${t.unread ? `<em class="session-unread">${t.unread}</em>` : ""}</div>
          <span class="auto-tag${t.profile.id === "hyg" && !primaryAuto ? " manual" : ""}">${t.profile.id === "hyg" && !primaryAuto ? "人工接待" : "OKKI自动接待"}</span>
          ${highIntent.has(`tm/${t.profile.id}`) ? '<span class="intent-tag">高交付意向用户</span>' : ""}
        </div>
      </button>
    </li>`).join("") || '<li class="session-empty">没有匹配的会话</li>';
}

/** @param {string} text @param {CollectItem | undefined} item @param {"en" | "zh"} language */
function sourceText(text,item,language) {
  if (!item || !text) return esc(text);
  const needle = item.extract?.[language] || text;
  const at = text.indexOf(needle);
  if (at < 0) return esc(text);
  return esc(text.slice(0,at)) + `<mark class="requirement-source${collected[item.id] ? " is-captured" : ""}" data-collect-source="${esc(item.id)}" data-language="${language}">${esc(needle)}</mark>` + esc(text.slice(at+needle.length));
}

function renderIntentIndicators() {
  el("waIntentBadge").hidden = !highIntent.has(`wa/${selected.wa}`);
  renderDetailIntent();
}

function renderDetailIntent() {
  const row = el("detailIntentRow");
  const wasHidden = row.hidden;
  const previousCustomer = row.dataset.customer;
  const marked = highIntent.has(`tm/${selected.tm}`);
  if (!marked || previousCustomer !== selected.tm) resetDeliveryCardFx();
  row.hidden = !marked;
  row.dataset.customer = selected.tm;
  const profile = inbox.get("tm", selected.tm).profile;
  el("detailIntentBadge").setAttribute("aria-label", `${profile.name} 已标记为高交付意向用户`);
  if (marked && (wasHidden || previousCustomer !== selected.tm) && detailOpen()) fxDeliveryCard(el("detail"));
}

/** @param {"tm" | "wa"} channel @param {string} id */
async function markHighIntent(channel,id) {
  const key = `${channel}/${id}`;
  if (highIntent.has(key)) return;
  highIntent.add(key);
  renderIntentIndicators(); renderSessionList(); renderWaShell();
  // TM keeps its real flag for the list and reception detail, not the chat header.
  if (channel === "tm" || !isThreadVisible(channel,id)) return;
  const host = /** @type {HTMLElement} */ (document.querySelector(".wa-chat"));
  await fxHighIntent(host,inbox.get(channel,id).profile,el("waIntentBadge"));
}

/** @param {import("./inbox-store.js").InboxMessage} msg @param {string} avatar */
function tmBubble(msg, avatar) {
  if (msg.side === "system") return `<div class="sys-note${msg.tone === "quiet" ? " is-quiet" : ""}" role="status">${esc(msg.zh || msg.en)}</div>`;
  const item = msg.side === "buyer" && msg.collectId ? items.find(i => i.id === msg.collectId) : undefined;
  return `<div class="msg ${msg.side === "buyer" ? "buyer" : "agent"}${msg.side === "human" ? " human" : ""}"><span class="face" style="background: #e9edf2 url('${msg.side === "buyer" ? avatar : "./assets/agent.jpg"}') center / cover"></span><div class="bubble"><p>${sourceText(msg.en,item,"en")}</p><p class="zh">${sourceText(msg.zh,item,"zh")}</p>${msg.side === "agent" ? '<small class="sender">OKKI智能销售发送</small>' : ""}</div>${msg.side === "human" ? '<small class="read-mark">已读</small>' : ""}</div>`;
}

function renderSelectedTm() {
  const thread = inbox.get("tm", selected.tm);
  /** @type {HTMLElement} */ (document.querySelector(".chat-head h1")).textContent = thread.profile.name;
  /** @type {HTMLElement} */ (document.querySelector(".chat-head p")).textContent = thread.profile.meta;
  el("openCollect").hidden = selected.tm !== "hyg";
  syncTmComposer();
  el("messages").innerHTML = `<div class="day">${selected.tm === "hyg" ? "7月22日 10:14" : "今天"}</div>` + thread.messages.map(m => tmBubble(m, thread.profile.avatar)).join("");
  if (selected.tm === "hyg") {
    renderSummary();
    if (!receptionPending && enabledItems().every(i => collected[i.id]) && thread.messages.some(m => m.side === "human")) el("handoff").hidden = false;
    setAutoReception(primaryAuto);
  } else {
    fxReset();
    const entries = Object.entries(thread.profile.summary);
    el("summaryList").innerHTML = entries.map(([label,value]) => `<li class="${value.includes("待") ? "" : "filled"}"><span class="sum-label">${esc(label)}</span><span class="sum-value">${esc(value)}</span></li>`).join("");
    el("progressTotal").textContent = String(entries.length);
    updateSummaryProgress(entries.filter(([,v]) => !v.includes("待")).length, entries.length);
    el("handoff").hidden = true;
    el("summaryRule").textContent = `${thread.profile.company} · ${thread.profile.topic}`;
    const toggle = document.querySelector(".accounts .toggle"); toggle?.classList.add("on"); toggle?.setAttribute("aria-pressed", "true");
    document.querySelector(".accounts .toggle-label")?.classList.remove("off");
  }
  el("messages").scrollTop = el("messages").scrollHeight;
  renderIntentIndicators();
  syncDashboardButton();
  if (detailOpen()) renderDetail();
  jasonFollowup.sync();
}

function syncTmComposer() {
  const input = /** @type {HTMLTextAreaElement} */ (el("input"));
  const unopened = selected.tm === "hyg" && !receptionOpened;
  const followupLocked = selected.tm === "jason" && jasonFollowup.locked();
  input.disabled = unopened || followupLocked;
  input.placeholder = "输入消息";
  /** @type {HTMLButtonElement} */ (el("send")).disabled = unopened || followupLocked || !input.value.trim();
}

/** @param {string} id */
function selectTm(id) {
  closeDashboard();
  resetMessageCards();
  // Repeated clicks on the open conversation must not interrupt or duplicate its run.
  if (id === "hyg" && selected.tm === id && currentView === "chat" && receptionOpened && !receptionPending) {
    inbox.markRead("tm", id); renderSessionList(); return;
  }
  resetCaptureFx();
  const input = /** @type {HTMLTextAreaElement} */ (el("input"));
  if (!input.classList.contains("auto-typing")) inbox.get("tm", selected.tm).draft = input.value;
  input.classList.remove("auto-typing");
  selected.tm = id;
  input.value = inbox.get("tm", id).draft;
  /** @type {HTMLButtonElement} */ (el("send")).disabled = !input.value.trim();
  if (id === "hyg") receptionOpened = true;
  hideMailAlert(); hideWaAlert();
  inbox.markRead("tm", id); renderSessionList(); renderSelectedTm();
  if (id === "hyg" && receptionPending) void playReception();
  else if (id === "hyg") showCompletedDashboard();
  else if (id === "jason") jasonFollowup.open();
}

/** @param {string} id */
function selectWa(id) {
  closeDashboard();
  resetMessageCards();
  resetMailWaFx();
  resetCaptureFx();
  inbox.get("wa", selected.wa).draft = /** @type {HTMLTextAreaElement} */ (el("waInput")).value;
  selected.wa = id;
  syncWaComposer();
  inbox.markRead("wa", id); renderWaShell(); renderSelectedWa();
}

/** @param {import("./notifications.js").NotificationPayload} payload @param {() => void} openTarget @param {boolean} [mailToWa] @param {boolean} [showCards] */
function notifyArrival(payload, openTarget, mailToWa = false, showCards = false) {
  // Ordinary hidden-page arrivals stay unread; manual growth cards must not replay on return.
  if (document.hidden) { if (!showCards) pendingNotice = () => notifyArrival(payload,openTarget,mailToWa); return; }
  pendingNotice = null;
  const autoOpen = mailToWa && currentView === "mail" && payload.channel === "wa" && payload.id === "marco";
  if (!autoOpen && !showCards) toast(`${payload.name} 有新${payload.channel === "mail" ? "邮件" : "消息"}`);
  showAppleNotification(payload, () => { closeModal(); closeDetail(); openTarget(); }, autoOpen, showCards);
}

/** @param {"tm" | "wa"} channel @param {string} id */
function openNotifiedConversation(channel,id) {
  // Select first so an unrelated previously selected thread is not marked read.
  if (channel === "tm") {
    sessionFilter = "all";
    /** @type {HTMLInputElement} */ (document.querySelector(".sessions .session-search input")).value = "";
    document.querySelectorAll("[data-filter]").forEach(b => b.classList.toggle("active",b.getAttribute("data-filter") === "all"));
    selectTm(id); showView("chat",false,false);
    el("sessionList").querySelector(`[data-tm-session="${id}"]`)?.scrollIntoView({block:"nearest"});
  }
  else { selectWa(id); showView("wa",false,false); }
}

/** @param {import("./inbox-store.js").IncomingEvent} event @param {boolean} [announce] @param {boolean} [showCards] */
function receiveIncoming(event, announce = true, showCards = announce) {
  const profile = inbox.get(event.channel,event.id).profile;
  if (profile.scriptedOnly || (event.channel === "tm" && profile.clickFollowup)) return;
  const batch = [event.message,
    {side:/** @type {"buyer"} */ ("buyer"),en:"Please include the available delivery dates in your reply.",zh:"请在回复中一并确认可以安排的交货日期。"},
    {side:/** @type {"buyer"} */ ("buyer"),en:"Thanks. We look forward to your confirmation.",zh:"谢谢，期待您确认这些细节。"}];
  batch.forEach(message => {
    inbox.append(event.channel,event.id,message,isThreadVisible(event.channel,event.id));
    if (showCards) notifyArrival({channel:event.channel,id:event.id,name:profile.name,avatar:profile.avatar,body:message.en || message.zh,translation:message.en ? message.zh : "",country:profile.country,time:message.time,context:profile.company}, () => openNotifiedConversation(event.channel,event.id));
  });
}

/** @param {"tm" | "wa"} channel @param {string} id */
function pulseUnread(channel,id) {
  const G = /** @type {any} */ (window).gsap;
  if (!G || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const nodes = [el(channel === "tm" ? "tmUnreadTotal" : "waUnreadTotal"),document.querySelector(channel === "tm" ? `[data-tm-session="${id}"] .session-unread` : `[data-wa-session="${id}"] em`) ].filter(Boolean);
  G.fromTo(nodes,{scale:1.32},{scale:1,duration:.20,ease:"power2.out",overwrite:true,clearProps:"transform"});
}

function simulateIncomingBurst() {
  const pool=incomingDemo.filter(e=>e.id!==selected[e.channel]&&!inbox.get(e.channel,e.id).profile.scriptedOnly&&!(e.channel==='tm'&&inbox.get(e.channel,e.id).profile.clickFollowup)).map(e=>({channel:e.channel,profile:inbox.get(e.channel,e.id).profile,message:e.message}));
  const mailProfiles=inbox.list('tm').map(t=>t.profile).filter(p=>p.id!=='hyg'&&!p.clickFollowup);
  const batch=createMixedBurst(pool,mailProfiles);
  const presentation=messageCardsVersion();
  batch.forEach((entry,n)=>window.setTimeout(()=>{
    const {channel,profile,message,card}=entry;
    if(channel==='mail'){
      const record=burstMail.append(profile,message);
      if(messageCardsVersion()===presentation)notifyArrival({channel:'mail',id:record.id,name:profile.name,avatar:profile.avatar,body:card.body,translation:card.translation,location:card.location,flag:card.flag,country:profile.country,time:card.time,context:profile.company},()=>burstMail.open(record.id),false,true);
    }else{
      inbox.append(channel,profile.id,message,isThreadVisible(channel,profile.id));
      if(messageCardsVersion()===presentation)notifyArrival({channel,id:profile.id,name:profile.name,avatar:profile.avatar,body:card.body,translation:card.translation,location:card.location,flag:card.flag,country:profile.country,time:card.time,context:profile.company},()=>openNotifiedConversation(channel,profile.id),false,true);
      pulseUnread(channel,profile.id);
    }
  },n*40));
}

// Four deliberate rapid blank-area clicks only; normal controls and synthetic clicks cannot start growth.
const QUAD_GAP_MS = 350, QUAD_TOTAL_MS = 1100, QUAD_RADIUS_PX = 30;
let messageClicks = 0, messageLastClick = 0, messageFirstClick = 0, messageClickX = 0, messageClickY = 0;
/** @param {MouseEvent} event */
function handleGlobalMessageClick(event) {
  if (!event.isTrusted || event.button !== 0 || event.detail === 0 || !(event.target instanceof Element) || event.target.closest('button,a,input,textarea,select,label,[role="button"],[role="tab"],[contenteditable]:not([contenteditable="false"]),dialog,#collectModal,#detail,#incomingMessageCards')) {messageClicks = 0;return;}
  const now = performance.now();
  const far = Math.hypot(event.clientX - messageClickX, event.clientY - messageClickY) > QUAD_RADIUS_PX;
  if (!messageClicks || now - messageLastClick > QUAD_GAP_MS || now - messageFirstClick > QUAD_TOTAL_MS || far) {
    messageClicks = 0; messageFirstClick = now; messageClickX = event.clientX; messageClickY = event.clientY;
  }
  messageLastClick = now;
  if (++messageClicks === 4) {
    messageClicks = 0;
    // Let the clicked control finish its normal action before showing new cards.
    window.setTimeout(simulateIncomingBurst,0);
  }
}

function startInboxDemo() {
  if (inboxDemoStarted) return;
  inboxDemoStarted = true;
  incomingDemo.forEach((event, n) => window.setTimeout(() => receiveIncoming(event), 3000 + n * 7000));
}

function bindInbox() {
  inbox.subscribe((channel,id) => {
    refreshUnread(); renderSessionList(); renderWaShell();
    if (isThreadVisible(channel,id)) {
      if (channel === "tm" && id !== "hyg") renderSelectedTm();
      if (channel === "wa") renderSelectedWa();
    }
  });
  el("sessionList").addEventListener("click", e => { const button = /** @type {HTMLElement} */ (e.target).closest("[data-tm-session]"); if (button) selectTm(button.getAttribute("data-tm-session") || "hyg"); });
  el("waList").addEventListener("click", e => { const button = /** @type {HTMLElement} */ (e.target).closest("[data-wa-session]"); if (button) selectWa(button.getAttribute("data-wa-session") || "marco"); });
  document.querySelector(".sessions .session-search input")?.addEventListener("input", renderSessionList);
  document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => { sessionFilter = button.getAttribute("data-filter") || "all"; renderSessionList(); }));
  document.addEventListener("click",handleGlobalMessageClick,true);
  window.addEventListener("blur",()=>{messageClicks=0;});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)messageClicks=0;});
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && pendingNotice) { const show = pendingNotice; pendingNotice = null; show(); return; }
    if (!document.hidden && currentView !== "mail") {
      const channel = currentView === "wa" ? "wa" : "tm";
      if (isThreadVisible(channel,selected[channel])) inbox.markRead(channel,selected[channel]);
      if (currentView === "wa") renderSelectedWa(); else renderSelectedTm();
    }
  });
  const input = /** @type {HTMLTextAreaElement} */ (el("waInput"));
  input.addEventListener("input", () => { if (inbox.get("wa",selected.wa).profile.scriptedOnly) { syncWaComposer(); return; } inbox.get("wa",selected.wa).draft = input.value; /** @type {HTMLButtonElement} */ (el("waSend")).disabled = !input.value.trim(); });
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); el("waComposer").dispatchEvent(new Event("submit",{cancelable:true})); } });
  el("waComposer").addEventListener("submit", e => {
    if (inbox.get("wa",selected.wa).profile.scriptedOnly) { e.preventDefault(); syncWaComposer(); return; }
    e.preventDefault(); const text = input.value.trim(); if (!text) return;
    const id = selected.wa; inbox.get("wa",id).draft = "";
    inbox.append("wa",id,{side:"human",en:text,zh:""},true); input.value = ""; /** @type {HTMLButtonElement} */ (el("waSend")).disabled = true;
    queuePeerReply("wa",id);
  });
  el('mailList').addEventListener('click',e=>{const button=/** @type {HTMLElement} */ (e.target).closest('[data-burst-mail]');if(button)burstMail.open(button.getAttribute('data-burst-mail')||'');});
  refreshUnread();
}

/** @param {"tm" | "wa"} channel @param {string} id */
function queuePeerReply(channel,id) {
  const profile = inbox.get(channel,id).profile;
  if (profile.scriptedOnly || (channel === "tm" && profile.clickFollowup)) return;
  window.setTimeout(() => {
    const message = {side:/** @type {"agent"} */ ("agent"), en:`Thank you. I have noted your message regarding ${profile.topic}. Our sales team will follow up with the details.`, zh:`收到，已记录您关于“${profile.topic}”的消息，销售团队会继续跟进具体细节。`};
    if (channel === "tm" && id === "hyg") addMessage(message); else inbox.append(channel,id,message,isThreadVisible(channel,id));
  },1000);
}

/* ---------- shell ---------- */
function renderShell() {
  el("rail").innerHTML = railItems.map(([icon, label]) =>
    `<button class="rail-item${label === "沟通" ? " active" : ""}"${label === "邮件" ? ' data-view="mail"' : label === "沟通" ? ' data-view="chat"' : ""}><i class="ic ic-${icon}"></i><span>${label}</span></button>`
  ).join("") + `<button class="rail-item rail-more" aria-label="更多"><i class="ic ic-tag"></i></button>`;


  renderSessionList();
}

/* ---------- mail view ---------- */
let mailPlayed = false;

function renderBurstMailRows() {
  const list=el('mailList');list.querySelectorAll('.random-mail-item').forEach(row=>row.remove());
  list.insertAdjacentHTML('afterbegin',burstMail.listMarkup());
}

function renderMailList() {
  el("mailList").innerHTML = burstMail.listMarkup() + mailList.map((m) => `
    <li class="mail-item${m.active ? " active" : ""}${m.unread ? " unread" : ""}">
      <img class="avatar" src="${m.avatar}" alt="" width="34" height="34">
      <div>
        <div class="mail-item-top"><strong>${m.from}</strong><time>${m.date}</time></div>
        <b>${m.subject}</b>
        <p>${m.snippet}</p>
        ${m.tag ? `<span class="mail-chip warn">${m.tag}</span>` : ""}
      </div>
    </li>`).join("");
}

/** @param {import("./data.js").MailMessage} m @param {boolean} [fresh] */
function mailCard(m, fresh = false) {
  const buyer = m.from === "buyer";
  const who = buyer ? `${buyerMail.name} &lt;${buyerMail.address}&gt;` : "OKKI 医疗销售 &lt;sales@okkimed.com&gt;";
  const to = buyer ? "sales@okkimed.com" : buyerMail.address;
  const body = m.en.map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
  const zh = m.zh.map((p) => `<p>${p}</p>`).join("");
  return `
    ${m.gap ? `<div class="mail-gap${m.from === "agent" ? " silent" : ""}"><span>${m.gap}</span></div>` : ""}
    <article class="mail-card ${m.from}${fresh ? " fresh" : ""}">
      <header>
        ${buyer ? `<img class="face face-img" src="${buyerMail.avatar}" alt="" width="32" height="32">` : '<span class="face face-me"></span>'}
        <div class="mail-meta"><b>${who}${fresh && buyer ? '<span class="new-dot">新邮件</span>' : ""}</b><small>发送至 ${to} · ${m.subject}</small></div>
        <time>${m.date}</time>
      </header>
      <div class="mail-body">${body}</div>
      <div class="mail-zh"><small>译文</small>${zh}</div>
      ${m.attach ? `<div class="mail-attach"><i class="ic ic-folder"></i>${m.attach}</div>` : ""}
      ${m.read || m.ai ? `<footer class="${m.read?.includes("未读") ? "unread" : ""}">${m.ai ? '<span class="ai-sent">✦ OKKI智能销售发送</span>' : ""}${m.read || ""}</footer>` : ""}
    </article>`;
}

/** @param {"silent" | "replied" | "done"} s @param {number} count @param {import("./data.js").MailMessage} [latest] */
function setMailState(s, count, latest) {
  const st = el("mailState");
  st.textContent = s === "silent" ? "客户 7 天未回复" : s === "replied" ? "客户已回复" : "已读未回复 · 转 WhatsApp";
  st.className = `mail-chip ${s === "replied" ? "ok" : "warn"}`;
  el("mailCount").textContent = `共 ${count} 封`;
  const item = mailList[0];
  const li = document.querySelector(".mail-item.active");
  if (!li) return;
  const last = s === "silent" ? null : latest || mailNew[mailNew.length - 1];
  /** @type {HTMLElement} */ (li.querySelector("b")).textContent = last ? last.subject : item.subject;
  /** @type {HTMLElement} */ (li.querySelector("time")).textContent = last ? last.date.split(" ")[1] : item.date;
  /** @type {HTMLElement} */ (li.querySelector("p")).textContent = last ? (last.en.find((t) => t.length > 24) || last.en[0]) : item.snippet;
  const chip = li.querySelector(".mail-chip");
  if (chip) { chip.textContent = s === "silent" ? item.tag || "" : s === "replied" ? "客户已回复" : "已读未回复"; chip.className = `mail-chip ${s === "replied" ? "ok" : "warn"}`; }
}

const newDivider = '<div class="mail-new-divider"><span>7月22日 · 新对话</span></div>';
const mailEnd = () => `<div class="mail-status"><b>客户已读邮件，但未回复</b><span>${buyerMail.name} 读了 AI 的报价邮件后没有再回信，随后通过 WhatsApp 主动发来消息，系统已识别为同一客户并接续上下文。</span><button data-view="wa">查看 WhatsApp 沟通</button></div>`;

/** @param {"agent" | "buyer"} from */
function mailTyping(from) {
  const label = from === "agent" ? "OKKI智能销售正在撰写邮件" : `${buyerMail.name} 正在回复`;
  return `<div class="mail-typing ${from}" id="mailTyping">${from === "agent" ? '<span class="face face-me"></span>' : `<img class="face face-img" src="${buyerMail.avatar}" alt="" width="26" height="26">`}<span>${label}</span><i></i><i></i><i></i></div>`;
}

/** @param {boolean} [force] replay the new conversation after the history */
async function playMail(force = false) {
  const box = el("mailThread");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const history = '<div class="mail-history">' + mailThread.map((m) => mailCard(m)).join("") + "</div>";
  if (force) mailPlayed = false;
  if (mailPlayed || reduce) {
    const firstPlay = !mailPlayed;
    const run = ++mailRun;
    box.innerHTML = history + newDivider + mailNew.map((m) => mailCard(m)).join("") + mailEnd();
    setMailState("done", mailThread.length + mailNew.length);
    mailPlayed = true;
    box.scrollTo({ top: box.scrollHeight });
    if (firstPlay && reduce) { await wait(0); if (run === mailRun && currentView === "mail") showWaAlert(); }
    return;
  }
  mailPlayed = true;
  const run = ++mailRun;
  box.innerHTML = history + newDivider;
  setMailState("silent", mailThread.length);
  box.scrollTo({ top: box.scrollHeight });
  await wait(900);
  let count = mailThread.length;
  for (const m of mailNew) {
    if (run !== mailRun) return;
    box.insertAdjacentHTML("beforeend", mailTyping(m.from === "buyer" ? "buyer" : "agent"));
    box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
    await wait(m.from === "buyer" ? 2000 : 2300);
    if (run !== mailRun) return;
    document.getElementById("mailTyping")?.remove();
    box.insertAdjacentHTML("beforeend", mailCard(m, true));
    box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
    count += 1;
    setMailState(m.from === "buyer" || count > mailThread.length + 1 ? "replied" : "silent", count, m);
    await wait(900);
  }
  if (run !== mailRun) return;
  // The buyer reads the AI email but never replies on email.
  box.insertAdjacentHTML("beforeend", '<div class="mail-silence" id="mailSilence"><i></i><span></span></div>');
  const silence = /** @type {HTMLElement} */ (document.querySelector("#mailSilence span"));
  for (const step of mailSilence) {
    if (run !== mailRun) return;
    silence.textContent = step;
    box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
    await wait(1100);
  }
  if (run !== mailRun) return;
  setMailState("done", count);
  box.insertAdjacentHTML("beforeend", mailEnd());
  box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  await wait(1200);
  if (run !== mailRun || el("mailView").hidden) return;
  showWaAlert();
}
let mailRun = 0;

/** @param {"chat" | "mail" | "wa"} view @param {boolean} [replay] @param {boolean} [withScript] @param {boolean} [withTransition] */
function showView(view, replay = false, withScript = true, withTransition = true) {
  burstMail.close();
  closeDashboard();
  resetMessageCards();
  if (withTransition && view === "wa" && currentView === "mail" && selected.wa === "marco") {
    void fxMailToWhatsApp(el("mailView"),el("waView"),{name:buyerMail.name,avatar:buyerMail.avatar,email:buyerMail.address},() => showView(view,replay,withScript,false));
    return;
  }
  if (withTransition) resetMailWaFx();
  if (view !== currentView) resetCaptureFx();
  const mail = view === "mail";
  if (currentView === "chat" && view !== "chat") {
    const input = /** @type {HTMLTextAreaElement} */ (el("input"));
    if (input.classList.contains("auto-typing")) { input.classList.remove("auto-typing"); input.value = ""; }
    else inbox.get("tm",selected.tm).draft = input.value;
  }
  if (currentView === "wa" && view !== "wa") inbox.get("wa",selected.wa).draft = /** @type {HTMLTextAreaElement} */ (el("waInput")).value;
  currentView = view;
  jasonFollowup.sync();
  hideMailAlert();
  hideWaAlert();
  el("mailView").hidden = !mail;
  el("waView").hidden = view !== "wa";
  /** @type {HTMLElement} */ (document.querySelector(".workspace")).hidden = view !== "chat";
  const railView = view === "wa" ? "chat" : view;
  document.querySelectorAll(".rail-item").forEach((b) => b.classList.toggle("active", b.getAttribute("data-view") === railView));
  if (mail) playMail(replay);
  if (view === "wa") {
    syncWaComposer();
    inbox.markRead("wa",selected.wa);
    if (withScript) playWa(); else renderSelectedWa();
  }
  if (view === "chat") {
    /** @type {HTMLTextAreaElement} */ (el("input")).value = inbox.get("tm",selected.tm).draft;
    /** @type {HTMLButtonElement} */ (el("send")).disabled = !inbox.get("tm",selected.tm).draft.trim();
    if (isThreadVisible("tm",selected.tm)) inbox.markRead("tm",selected.tm);
    renderSelectedTm();
  }
}

/* ---------- WhatsApp: the same buyer continues after ignoring the email ---------- */
let waRun = 0;
let waPlayed = false;

function hideWaAlert() {
  document.getElementById("waAlert")?.remove();
}

function showWaAlert() {
  hideWaAlert();
  notifyArrival({channel:"wa",id:"marco",name:buyerMail.name,avatar:buyerMail.avatar,body:waScript[0].zh,count:1,context:"已识别为邮件中的同一客户 · 邮件上下文已接续"}, () => { selectWa("marco"); showView("wa"); }, true);
}

function renderWaShell() {
  el("waList").innerHTML = inbox.list("wa").map(t => `<li class="wa-item${selected.wa === t.profile.id ? " active" : ""}${t.unread ? " has-unread" : ""}"><button class="session-select" data-wa-session="${t.profile.id}" aria-label="${esc(t.profile.name)}，${t.unread} 条未读消息" aria-pressed="${selected.wa === t.profile.id}"><img src="${t.profile.avatar}" alt="" width="42" height="42"><div><p><b>${esc(t.profile.name)}</b><time>${esc(t.time)}</time></p><p><span class="wa-preview">${esc(t.preview)}</span>${t.unread ? `<em>${t.unread}</em>` : ""}</p><span class="wa-same">${t.profile.id === "marco" ? "同邮件客户" : esc(t.profile.topic)}</span>${highIntent.has(`wa/${t.profile.id}`) ? '<span class="intent-tag">高交付意向用户</span>' : ""}</div></button></li>`).join("");
}

function syncWaComposer() {
  const thread = inbox.get("wa",selected.wa);
  const fixed = !!thread.profile.scriptedOnly;
  const input = /** @type {HTMLTextAreaElement} */ (el("waInput"));
  const value = fixed ? "" : thread.draft;
  if (input.value !== value) input.value = value;
  input.disabled = fixed;
  input.placeholder = "输入消息";
  /** @type {HTMLButtonElement} */ (el("waSend")).disabled = fixed || !value.trim();
}

function renderSelectedWa() {
  const thread = inbox.get("wa",selected.wa);
  /** @type {HTMLImageElement} */ (el("waAvatar")).src = thread.profile.avatar;
  el("waName").textContent = thread.profile.name;
  el("waMeta").textContent = thread.profile.meta;
  el("waLinked").textContent = thread.profile.id === "marco" ? waBuyer.linked : "独立客户会话";
  const intro = thread.profile.id === "marco" ? '<div class="wa-context"><b>已接续邮件上下文</b>10 台 DC-6800（意大利语版）· FOB USD 2,650/台 · 邮件已读未回复。</div>' : `<div class="wa-context"><b>${esc(thread.profile.company)}</b>${esc(thread.profile.topic)}</div>`;
  el("waMessages").innerHTML = '<div class="wa-day">今天</div>' + intro + thread.messages.map(m => waBubble(m,thread.profile.avatar)).join("");
  el("waMessages").scrollTop = el("waMessages").scrollHeight;
  syncWaComposer();
  renderIntentIndicators();
}

/** @param {import("./inbox-store.js").InboxMessage} m @param {string} [avatar] */
function waBubble(m, avatar = buyerMail.avatar) {
  const buyer = m.side === "buyer";
  const face = buyer ? `<img class="wa-face" src="${avatar}" alt="" width="34" height="34">` : '<span class="face face-me wa-face"></span>';
  const file = m.file ? `<div class="wa-file"><span>PDF</span><div><b>${m.file}</b><small>1 页 · 186 KB</small></div></div>` : "";
  const foot = buyer ? `<small class="wa-time">${m.time || "刚刚"}</small>` : `<small class="wa-time">${m.side === "human" ? "由 Lily 发送" : "由智能销售发送"} · ${m.time || "刚刚"} <i class="ticks">✓✓</i></small>`;
  return `<div class="wa-msg ${buyer ? "buyer" : "agent"}${m.side === "human" ? " human" : ""}">${face}<div class="wa-bubble"><p>${esc(m.en)}</p><p class="zh">${esc(m.zh)}</p>${file}${foot}</div></div>`;
}

async function playWa() {
  if (waPlayed || selected.wa !== "marco") { renderSelectedWa(); return; }
  inbox.clear("wa","marco");
  waPlayed = true;
  const run = ++waRun;
  const box = el("waMessages");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const intro = `<div class="wa-day">今天</div><div class="wa-context"><b>已接续邮件上下文</b>客户在邮件中询问 10 台 DC-6800（意大利语版）交期与报价，AI 已报 FOB 2,650 美元/台、8 月 31 日前下单享 9.2 折；客户已读未回复。</div>`;
  const lastBuyerIndex = waScript.reduce((last,m,n) => m.side === "buyer" ? n : last,-1);
  if (reduce) { for (const [n,m] of waScript.entries()) { inbox.append("wa","marco",m,isThreadVisible("wa","marco")); if (n === lastBuyerIndex) await markHighIntent("wa","marco"); } renderSelectedWa(); return; }
  renderSelectedWa();
  for (const [n,m] of waScript.entries()) {
    await wait(m.side === "buyer" ? 900 : 600);
    if (run !== waRun) return;
    const typing = document.createElement("div");
    typing.className = `wa-msg ${m.side} typing`;
    typing.innerHTML = `${m.side === "buyer" ? `<img class="wa-face" src="${buyerMail.avatar}" alt="" width="34" height="34">` : '<span class="face face-me wa-face"></span>'}<div class="wa-bubble"><i></i><i></i><i></i></div>`;
    if (isThreadVisible("wa","marco")) { box.appendChild(typing); box.scrollTo({ top: box.scrollHeight, behavior: "smooth" }); }
    await wait(m.side === "buyer" ? 1500 : 1700);
    typing.remove();
    if (run !== waRun) return;
    inbox.append("wa","marco",m,isThreadVisible("wa","marco"));
    if (n === lastBuyerIndex) await markHighIntent("wa","marco");
  }
}

/* ---------- mail alert after the chat ends ---------- */
function hideMailAlert() {
  document.getElementById("mailAlert")?.remove();
}

/** Shows a mail reminder without leaving the current TM conversation. @param {number} id */
function showMailAlert(id) {
  hideMailAlert();
  if (id !== runId || /** @type {HTMLElement} */ (document.querySelector(".workspace")).hidden) return;
  const last = mailNew[0];
  notifyArrival({channel:"mail",id:"marco",name:buyerMail.name,avatar:buyerMail.avatar,body:last.subject,count:1,context:"客户时隔 7 天再次来信 · 当前会话保持不变"}, () => { if (id === runId) showView("mail",true); });
}

function bindViews() {
  document.addEventListener("click", (e) => {
    const t = /** @type {HTMLElement} */ (e.target).closest("[data-view]");
    if (t) {
      const view = /** @type {"chat" | "mail" | "wa"} */ (t.getAttribute("data-view"));
      if (view === "wa" && currentView === "mail") selected.wa = "marco";
      showView(view);
    }
  });
}

/* ---------- chat ---------- */
const transcript = inbox.get("tm","hyg").messages;

/** @param {{ side: "buyer" | "agent" | "human", en: string, zh: string, collectId?:string }} msg */
function addMessage(msg) {
  inbox.append("tm","hyg",msg,isPrimaryVisible());
  if (!isPrimaryVisible()) return;
  const box = el("messages");
  box.insertAdjacentHTML("beforeend",tmBubble(msg,inbox.get("tm","hyg").profile.avatar));
  box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
}

/** @param {string} text */
function addSystemNote(text) {
  inbox.append("tm","hyg",{side:"system",en:"",zh:text},true);
  if (!isPrimaryVisible()) return;
  const box = el("messages");
  box.insertAdjacentHTML("beforeend", `<div class="sys-note" role="status">${esc(text)}</div>`);
  box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
}

/** Switches the account toggle and the session tag between AI and human reception. @param {boolean} on */
function setAutoReception(on) {
  primaryAuto = on;
  renderSessionList();
  if (selected.tm !== "hyg") return;
  const t = /** @type {HTMLElement | null} */ (document.querySelector(".accounts .toggle"));
  t?.classList.toggle("on", on);
  t?.setAttribute("aria-pressed", String(on));
  const label = document.querySelector(".accounts .toggle-label");
  label?.classList.toggle("off", !on);
  const tag = document.querySelector(".session.active .auto-tag");
  if (tag) {
    tag.textContent = on ? "OKKI自动接待" : "人工接待";
    tag.classList.toggle("manual", !on);
  }
}

/** A salesperson takes over after the AI closes the reception. @param {number} id */
async function handoffToHuman(id) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  await wait(reduce ? 0 : 1600);
  if (id !== runId) return;
  const product = collected.product ? "DC-6800" : "the equipment";
  const productZh = collected.product ? "DC-6800 " : "设备";
  const qty = collected.quantity ? "6 units of " : "";
  const qtyZh = collected.quantity ? " 6 台 " : "";
  const reply = {
    en: `Hi, this is Lily, your sales manager. I will send the quotation for ${qty}${product} to your email today.`,
    zh: `您好，我是销售经理 Lily，今天会把${qtyZh}${productZh}的报价发到您邮箱。`
  };
  if (!(await typeAndSend(id, reply, reduce))) return;
  await wait(reduce ? 0 : 500);
  if (id !== runId) return;
  setAutoReception(false);
  addSystemNote("由于您介入该会话，智能销售将不再接待");
}

/**
 * Types the salesperson's reply into the composer, then presses send.
 * Returns false if a newer run started meanwhile.
 * @param {number} id @param {{ en: string, zh: string }} reply @param {boolean} reduce
 */
async function typeAndSend(id, reply, reduce) {
  const input = /** @type {HTMLTextAreaElement} */ (el("input"));
  const send = /** @type {HTMLButtonElement} */ (el("send"));
  const sendInBackground = () => { addMessage({side:"human",...reply}); return true; };
  if (!isPrimaryVisible() || input.value.trim()) return sendInBackground();
  input.focus({ preventScroll: true });
  input.classList.add("auto-typing");
  const ownsComposer = () => isPrimaryVisible() && input.classList.contains("auto-typing");
  const abort = () => { if (ownsComposer()) { input.value = ""; send.disabled = true; input.classList.remove("auto-typing"); } return false; };
  if (reduce) {
    input.value = reply.en;
  } else {
    for (let i = 1; i <= reply.en.length; i++) {
      if (id !== runId) return abort();
      if (!ownsComposer()) return sendInBackground();
      input.value = reply.en.slice(0, i);
      send.disabled = false;
      input.scrollTop = input.scrollHeight;
      await wait(reply.en[i - 1] === " " ? 20 : 34);
    }
  }
  send.disabled = false;
  await wait(reduce ? 0 : 450);
  if (id !== runId) return abort();
  if (!ownsComposer()) return sendInBackground();
  send.classList.add("pressed");
  await wait(reduce ? 0 : 180);
  send.classList.remove("pressed");
  if (id !== runId) return abort();
  if (!ownsComposer()) return sendInBackground();
  input.value = "";
  send.disabled = true;
  input.classList.remove("auto-typing");
  input.blur();
  addMessage({ side: "human", ...reply });
  return true;
}

/** @param {"buyer" | "agent" | "human"} side */
function showTyping(side) {
  const box = el("messages");
  const row = document.createElement("div");
  row.className = side === "human" ? "msg agent human typing" : `msg ${side} typing`;
  row.innerHTML = `<span class="face ${side === "buyer" ? "face-buyer" : "face-me"}"></span><div class="bubble"><i></i><i></i><i></i></div>`;
  if (isPrimaryVisible()) { box.appendChild(row); box.scrollTo({ top: box.scrollHeight, behavior: "smooth" }); }
  return row;
}

/** @param {number} ms */
const wait = (ms) => new Promise((r) => window.setTimeout(r, ms));

/**
 * Plays one message after a typing indicator. Returns false if a newer run started.
 * @param {number} id @param {"buyer" | "agent" | "human"} side @param {{ en: string, zh: string, collectId?:string }} text @param {number} ms
 */
async function say(id, side, text, ms) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const typing = showTyping(side);
  await wait(reduce ? 0 : ms);
  typing.remove();
  if (id !== runId) return false;
  addMessage({ side, ...text });
  return true;
}

/** @param {boolean} [replay] Explicit settings replay; initialization only seeds the buyer message. */
function prepareReception(replay = false) {
  closeDashboard();
  dashboardShownRun = -1;
  dashboardCompletedRun = -1;
  resetCaptureFx();
  ++runId; // Invalidate any previous reception without resetting the source or animation files.
  receptionPending = true;
  receptionOpened = false;
  collected = {};
  highIntent.delete("tm/hyg"); renderIntentIndicators();
  inbox.clear("tm","hyg");
  inbox.append("tm","hyg",{side:"buyer",...opening,time:"10:14"},false);
  hideMailAlert();
  hideWaAlert();
  setAutoReception(true);
  if (selected.tm === "hyg") renderSelectedTm();
  if (replay && selected.tm === "hyg" && currentView === "chat") selectTm("hyg");
}

async function playReception() {
  if (!receptionOpened || !receptionPending) return;
  resetCaptureFx();
  receptionPending = false;
  const id = ++runId;
  collected = {};
  highIntent.delete("tm/hyg"); renderIntentIndicators();
  hideMailAlert();
  setAutoReception(true);
  // The initial buyer message is already visible; keep it instead of appending it again.
  renderSelectedTm();
  const queue = enabledItems();

  await wait(800);
  if (id !== runId) return;

  for (const [n, item] of queue.entries()) {
    const ack = n === 0 ? { en: "Hello, thank you for your inquiry! ", zh: "您好，感谢您的咨询！" } : acks[(n - 1) % acks.length];
    const question = { en: ack.en + item.ask.en, zh: ack.zh + item.ask.zh };
    if (!(await say(id, "agent", question, 1100))) return;
    markAsking(item.id);
    if (!(await say(id, "buyer", {...item.answer,collectId:item.id}, 1700))) return;
    if (isPrimaryVisible()) {
      fxReset();
      el("messages").scrollTop = el("messages").scrollHeight;
      const source = /** @type {HTMLElement | null} */ (el("messages").querySelector(`[data-collect-source="${item.id}"][data-language="zh"]`));
      await fxRecognizeSource(source,{label:item.summary});
      if (id !== runId) return;
    }
    collected[item.id] = item.value;
    renderSummary(item.id, true);
    el("messages").querySelectorAll(`[data-collect-source="${item.id}"]`).forEach(node => node.classList.add("is-captured"));
  }

  if (queue.length) { await markHighIntent("tm","hyg"); if (id !== runId) return; }
  dashboardCompletedRun = id;
  syncDashboardButton();
  showCompletedDashboard();
  startInboxDemo();
  const closing = queue.length
    ? { en: "Thank you for the details! I have noted all your requirements, and our sales manager will contact you shortly with a quotation.", zh: "感谢您提供的信息！您的需求我都已记录，我们的销售经理会尽快联系您并提供报价。" }
    : { en: "Thank you! Our sales manager will contact you shortly.", zh: "感谢您的咨询！我们的销售经理会尽快联系您。" };
  if (!(await say(id, "agent", closing, 1200))) return;
  if (isPrimaryVisible()) el("handoff").hidden = false;
  if (detailOpen()) renderDetail();
  await handoffToHuman(id);
  if (detailOpen()) renderDetail();
  await wait(900);
  showMailAlert(id);
}

/* ---------- handoff detail drawer ---------- */
const detailOpen = () => el("detail").classList.contains("open");

function renderDetail() {
  resetDetailFx();
  renderDetailIntent();
  const thread = inbox.get("tm",selected.tm);
  /** @type {HTMLImageElement} */ (document.querySelector(".buyer-card > img")).src = thread.profile.avatar;
  /** @type {HTMLElement} */ (document.querySelector(".buyer-info")).innerHTML = `<p><b>${esc(thread.profile.name)}</b><span>· Buyer</span></p><p class="sub">${esc(thread.profile.company)} · ${esc(thread.profile.country)}<i class="sep"></i><span id="replyAgo">TM · 最近会话</span></p>`;
  el("sendQuote").hidden = selected.tm !== "hyg";
  if (selected.tm !== "hyg") {
    el("reqGrid").innerHTML = Object.entries(thread.profile.summary).map(([k,v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
    el("ruleTag").textContent = "独立客户会话"; el("ruleTag").classList.add("live");
    el("aiSummary").textContent = `${thread.profile.name} · ${thread.profile.topic}`;
    el("aiAdvice").textContent = "结合该客户自己的询盘和历史消息继续跟进";
    if (detailOpen()) fxDetailText(el("detail"),true);
    return;
  }
  const list = enabledItems();
  const done = list.filter((i) => collected[i.id]).length;
  const complete = list.length > 0 && done === list.length;
  el("reqGrid").innerHTML = list.map((i) => {
    const v = collected[i.id];
    return `<div><dt>${esc(i.summary)}</dt><dd class="${v ? "" : "pending"}">${v ? esc(v) : "待收集"}</dd></div>`;
  }).join("");

  const budget = collected.budget ? Number(collected.budget.replace(/[^\d]/g, "")) : 0;
  const byAmount = rule.on && budget >= rule.threshold;
  el("ruleTag").textContent = byAmount ? `金额≥${rule.threshold.toLocaleString("en-US")}` : complete ? "需求收集完整" : "接待中";
  el("ruleTag").classList.toggle("live", !complete && !byAmount);
  el("replyAgo").textContent = transcript.some((m) => m.side === "buyer") ? "TM · 刚刚回复" : "TM · 暂无回复";

  el("aiSummary").innerHTML = complete
    ? "<b>客户已明确采购意向</b>，需求已收集完整，需尽快发送正式报价"
    : `<b>AI 接待中</b>，已收集 ${done}/${list.length} 项需求，全部收集后转交人工`;
  el("aiAdvice").innerHTML = complete
    ? "<b>建议通过 TM 发送正式报价</b>，附 CE 证书与连锁诊所批量优惠，主动约视频演示"
    : "<b>建议等待 AI 完成需求收集</b>，再由人工跟进报价";
  if (detailOpen()) fxDetailText(el("detail"),true);
}

function openDetail() {
  renderDetail();
  el("detailMask").hidden = false;
  el("detail").classList.add("open");
  el("detail").setAttribute("aria-hidden", "false");
  fxDetailText(el("detail"));
  fxDeliveryCard(el("detail"));
}

function closeDetail() {
  resetDeliveryCardFx();
  resetDetailFx(true);
  el("detail").classList.remove("open");
  el("detail").setAttribute("aria-hidden", "true");
  el("detailMask").hidden = true;
}

function bindDetail() {
  document.addEventListener("click", (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    if (t.closest("[data-open-detail]")) openDetail();
  });
  el("closeDetail").addEventListener("click", closeDetail);
  el("detailMask").addEventListener("click", closeDetail);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && detailOpen()) closeDetail(); });
  el("sendQuote").addEventListener("click", () => {
    closeDetail();
    addMessage({ side: "human", en: "Please find attached our formal quotation for the DC-6800 together with the CE certificate. We offer a special price for chain clinic orders. Would you be available for a video demo this week?", zh: "附件是 DC-6800 的正式报价单和 CE 证书，连锁诊所批量采购可享专属优惠价。本周方便安排一次视频演示吗？" });
    toast("报价已通过 TM 发送");
  });
}

/* ---------- summary ---------- */
/** @param {string} id */
function markAsking(id) {
  if (!isPrimaryVisible()) return;
  const li = document.querySelector(`[data-sum="${id}"]`);
  li?.classList.add("asking");
  // No sidebar card animation; recognition stays in the buyer message.
}

/** @param {string} [justFilled] @param {boolean} [softArrival] */
function renderSummary(justFilled, softArrival = false) {
  if (selected.tm !== "hyg") return;
  const list = enabledItems();
  const done = list.filter((i) => collected[i.id]).length;
  fxReset();
  el("summaryList").innerHTML = list.map((i) => {
    const v = collected[i.id];
    return `<li data-sum="${i.id}" class="${v ? "filled" : ""}">
      <span class="sum-label">${esc(i.summary)}</span>
      ${v ? `<span class="sum-value">${esc(v)}</span>` : '<span class="sum-pending">待收集</span>'}
      ${v ? '<i class="sum-check" aria-hidden="true"><svg viewBox="0 0 22 22"><circle cx="11" cy="11" r="9"/><path d="M6.5 11.3l3 3 6-6.2"/></svg></i>' : ""}
    </li>`;
  }).join("") || '<li class="empty">未开启任何收集项</li>';
  el("progressTotal").textContent = String(list.length);
  updateSummaryProgress(done, list.length);
  // The delivery action stays available through later message refreshes.
  el("handoff").hidden = !(dashboardCompletedRun === runId && list.length > 0 && done === list.length);
  el("summaryRule").innerHTML = rule.on ? `转人工条件：客户表达金额 ≥ USD ${rule.threshold.toLocaleString("en-US")}` : "金额阈值转人工：已关闭";
  if (detailOpen()) renderDetail();
}

/* ---------- completed collection dashboard ---------- */
function updateSummaryProgress(done, total) {
  el("progressNum").textContent = String(done);
  el("progressNum").dataset.v = String(done);
  el("progressTotal").textContent = String(total);
  el("progressBar").style.transform = `scaleX(${total ? done / total : 0})`;
}

function syncDashboardButton() {
  const complete = dashboardCompletedRun === runId && enabledItems().length > 0 && enabledItems().every(item => collected[item.id]);
  el("reopenDashboard").hidden = selected.tm !== "hyg" || !complete;
}

function closeDashboard() {
  const dialog = /** @type {HTMLDialogElement} */ (el("requirementsDashboard"));
  resetDashboardFx();
  if (dialog.open) dialog.close();
}

/** @param {boolean} [manual] */
function showCompletedDashboard(manual = false) {
  const list = enabledItems();
  if (!isPrimaryVisible() || dashboardCompletedRun !== runId || !list.length || !list.every(item => collected[item.id])) return;
  if (!manual && (dashboardShownRun === runId || !el("collectModal").hidden)) return;
  const dialog = /** @type {HTMLDialogElement} */ (el("requirementsDashboard"));
  if (dialog.open) return;
  renderSummary();
  const profile = inbox.get("tm", "hyg").profile;
  el("dashboardBuyer").textContent = profile.name;
  el("dashboardCompany").textContent = `${profile.company} · ${profile.country}`;
  /** @type {HTMLImageElement} */ (el("dashboardAvatar")).src = profile.avatar;
  el("dashboardState").textContent = `${list.length}/${list.length} 项已确认`;
  renderDetailIntent();
  el("handoff").hidden = false;
  resetMessageCards();
  closeDetail();
  dashboardShownRun = runId;
  dialog.showModal();
  dialog.scrollTop = 0;
  fxCompletedDashboard(el("dashboardShell"));
}

function bindDashboard() {
  const dialog = /** @type {HTMLDialogElement} */ (el("requirementsDashboard"));
  el("closeDashboard").addEventListener("click", closeDashboard);
  el("dashboardDone").addEventListener("click", closeDashboard);
  el("reopenDashboard").addEventListener("click", () => showCompletedDashboard(true));
  el("dashboardDetail").addEventListener("click", () => {closeDashboard();openDetail();});
  dialog.addEventListener("cancel", event => { event.preventDefault(); closeDashboard(); });
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDashboard();
  });
  dialog.addEventListener("close", () => {if (!dialog.open) resetDashboardFx();});
  document.addEventListener("visibilitychange", () => {if (document.hidden) closeDashboard();else showCompletedDashboard();});
}

/* ---------- collect settings modal ---------- */
/** @param {CollectItem} i */
function chip(i) {
  const tools = i.custom ? `<span class="chip-tools"><button type="button" data-edit="${i.id}" aria-label="编辑${esc(i.label)}"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M3 13h10M4 10.5 10.5 4l1.5 1.5L5.5 12H4z"/></svg></button><button type="button" data-del="${i.id}" aria-label="删除${esc(i.label)}"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5M7 7v4M9 7v4"/></svg></button></span>` : "";
  return `<div class="chip${i.enabled ? " on" : ""}"><button type="button" class="chip-main" data-toggle="${i.id}" aria-pressed="${i.enabled}"><span class="check"></span>${esc(i.label)}</button>${tools}</div>`;
}

function renderChips() {
  el("presetChips").innerHTML = draft.filter((i) => !i.custom).map(chip).join("");
  const custom = draft.filter((i) => i.custom);
  el("customChips").innerHTML = custom.length ? custom.map(chip).join("") : '<p class="no-custom">暂无自定义收集项，点击右上角「新增收集项」添加</p>';
}

/** @param {string} msg */
function cfgError(msg) { el("cfgError").textContent = msg; }

function openModal() {
  draft = clone(items);
  editingId = null;
  el("itemForm").hidden = true;
  cfgError("");
  /** @type {HTMLInputElement} */ (el("threshold")).value = String(rule.threshold);
  setToggle(rule.on);
  renderChips();
  el("collectModal").hidden = false;
}

function closeModal() { el("collectModal").hidden = true; }

/** @param {boolean} on */
function setToggle(on) {
  const t = el("ruleToggle");
  t.classList.toggle("on", on);
  t.setAttribute("aria-pressed", String(on));
}

/** @param {string} [label] */
function showItemForm(label = "") {
  const f = el("itemForm");
  const input = /** @type {HTMLInputElement} */ (el("itemName"));
  f.hidden = false;
  input.value = label;
  input.focus();
  cfgError("");
}

/** @param {string} label */
function customItem(label) {
  return {
    id: `c${++customSeq}`, label, summary: label, enabled: true, custom: true,
    ask: { en: "May I also ask one more detail about your purchase?", zh: `方便再了解一下您的${label}吗？` },
    answer: { en: "Sure, I will confirm it with my team and let you know.", zh: "可以，我和团队确认后告诉您。" },
    value: "客户确认后回复"
  };
}

function bindModal() {
  el("openCollect").addEventListener("click", openModal);
  el("closeCollect").addEventListener("click", closeModal);
  el("cancelCollect").addEventListener("click", closeModal);
  el("collectModal").addEventListener("click", (e) => { if (e.target === el("collectModal")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !el("collectModal").hidden) closeModal(); });

  el("collectModal").addEventListener("click", (e) => {
    const t = /** @type {HTMLElement} */ (e.target).closest("button");
    if (!t) return;
    const tog = t.getAttribute("data-toggle");
    const del = t.getAttribute("data-del");
    const edit = t.getAttribute("data-edit");
    if (tog) {
      const it = draft.find((i) => i.id === tog);
      if (it) it.enabled = !it.enabled;
      cfgError("");
      renderChips();
    } else if (del) {
      draft = draft.filter((i) => i.id !== del);
      renderChips();
    } else if (edit) {
      editingId = edit;
      showItemForm(draft.find((i) => i.id === edit)?.label);
    }
  });

  el("addItem").addEventListener("click", () => { editingId = null; showItemForm(); });
  el("cancelItem").addEventListener("click", () => { el("itemForm").hidden = true; });
  el("itemForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const label = /** @type {HTMLInputElement} */ (el("itemName")).value.trim();
    if (!label) return cfgError("请输入收集项名称");
    if (draft.some((i) => i.label === label && i.id !== editingId)) return cfgError("该收集项已存在");
    if (editingId) {
      const it = draft.find((i) => i.id === editingId);
      if (it) Object.assign(it, customItem(label), { id: it.id, enabled: it.enabled });
    } else {
      draft.push(customItem(label));
    }
    editingId = null;
    el("itemForm").hidden = true;
    cfgError("");
    renderChips();
  });

  el("ruleToggle").addEventListener("click", () => setToggle(!el("ruleToggle").classList.contains("on")));

  el("saveCollect").addEventListener("click", () => {
    if (!draft.some((i) => i.enabled)) return cfgError("请至少开启一个收集项");
    items = draft;
    const n = Number(/** @type {HTMLInputElement} */ (el("threshold")).value);
    rule = { on: el("ruleToggle").classList.contains("on"), threshold: Number.isFinite(n) && n >= 0 ? n : 1000 };
    closeModal();
    toast("收集项已保存");
    prepareReception(true);
  });

}

/* ---------- misc ---------- */
/** @param {string} text */
function toast(text) {
  const t = el("toast");
  t.textContent = text;
  t.classList.add("show");
  window.setTimeout(() => t.classList.remove("show"), 1800);
}

function bindComposer() {
  const input = /** @type {HTMLTextAreaElement} */ (el("input"));
  const send = /** @type {HTMLButtonElement} */ (el("send"));
  input.addEventListener("input", () => { input.classList.remove("auto-typing"); send.disabled = input.value.trim() === ""; inbox.get("tm",selected.tm).draft = input.value; });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      el("composer").dispatchEvent(new Event("submit", { cancelable: true }));
    } else if (e.key === "Enter" && e.ctrlKey) {
      input.setRangeText("\n", input.selectionStart, input.selectionEnd, "end");
    }
  });
  el("composer").addEventListener("submit", (e) => {
    e.preventDefault();
    if ((selected.tm === "hyg" && !receptionOpened) || (selected.tm === "jason" && jasonFollowup.locked())) return;
    const text = input.value.trim();
    if (!text) return;
    const id = selected.tm;
    inbox.get("tm",id).draft = "";
    if (id === "hyg") addMessage({side:"human",en:text,zh:""}); else inbox.append("tm",id,{side:"human",en:text,zh:""},true);
    if (id !== "hyg") queuePeerReply("tm",id);
    input.value = "";
    send.disabled = true;
  });
  document.querySelectorAll("[data-ai]").forEach((btn) => {
    btn.addEventListener("click", () => toast(`${btn.getAttribute("data-ai")}：正在分析当前会话…`));
  });
  document.querySelectorAll(".session-tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.parentElement?.querySelectorAll(".active").forEach((n) => {
        n.classList.remove("active");
        if (n.getAttribute("role") === "tab") n.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      if (btn.getAttribute("role") === "tab") btn.setAttribute("aria-selected", "true");
    });
  });
}

renderShell();
renderMailList();
renderWaShell();
bindComposer();
bindModal();
bindViews();
bindDetail();
bindDashboard();
bindInbox();
window.addEventListener("resize",resetCaptureFx);
prepareReception();
renderSelectedTm();
