// @ts-check
// Presentation only: actual messages and unread state remain in inbox-store.
/** @typedef {import('./notifications.js').NotificationPayload} CardMessage */
/** @typedef {{payload:CardMessage, open?:()=>void}} CardEntry */
/** @typedef {{layer:HTMLElement, list:HTMLElement, queue:CardEntry[], running:boolean, stepTimer:number, dismissTimer:number, shown:number, received:number}} CardFeed */
const W = /** @type {any} */ (window);
/** @type {CardFeed | null} */ let active = null;
let presentationVersion = 0;
export const messageCardsVersion = () => presentationVersion;
const MAX_CARDS = 5;
const TONES = ['', ' is-blue', ' is-soft', ' is-strong', ''];
const motion = () => !!W.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function resetMessageCards() {
  presentationVersion++;
  if (!active) return;
  const feed = active; active = null;
  window.clearTimeout(feed.stepTimer); window.clearTimeout(feed.dismissTimer);
  W.gsap?.killTweensOf([feed.layer, ...Array.from(feed.layer.querySelectorAll('*'))]);
  feed.queue.length = 0; feed.layer.remove();
}

/** @param {CardMessage['channel']} channel */
function channelIcon(channel) {
  if (channel === 'wa') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" aria-hidden="true"><path d="M20.5 11.6a8.6 8.6 0 0 1-12.7 7.5L3.5 20.5l1.4-4.1a8.6 8.6 0 1 1 15.6-4.8Z"/><path d="M8.6 7.7c-.7.6-.5 2.2.8 3.9 1.4 1.8 3.1 3 4.6 3.2.9.1 1.7-.4 1.9-1.2l-2.4-1.2-.9 1c-1.3-.6-2.4-1.6-3-2.9l.8-.8-1.2-2.4-.6.4Z" fill="currentColor" stroke="none"/></svg>';
  if (channel === 'tm') return '<b aria-hidden="true">TM</b>';
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>';
}


/** @returns {CardFeed} */
function createFeed() {
  const layer = document.createElement('section');
  layer.id = 'incomingMessageCards'; layer.className = 'incoming-message-feed';
  layer.setAttribute('role','region'); layer.setAttribute('aria-label','逐条新消息');
  const beijingTime = '03:45';
  layer.innerHTML = '<div class="incoming-scene-bg" aria-hidden="true"></div><div class="incoming-phone"><div class="incoming-phone-status" aria-hidden="true"><span class="incoming-phone-notch"></span><span class="incoming-phone-signal"><i></i><i></i><i></i><i></i></span><svg class="incoming-phone-wifi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9a14 14 0 0 1 18 0M6 12a9 9 0 0 1 12 0M9 15a4 4 0 0 1 6 0"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/></svg><span class="incoming-phone-battery"></span></div><header class="incoming-feed-head"><button type="button" aria-label="关闭新消息卡片">×</button></header><div class="incoming-phone-clock"><time datetime="03:45" aria-label="北京时间 03:45">'+beijingTime+'</time><div><span>Beijing</span><small>(UTC+8)</small></div></div><div class="incoming-card-surface"><div class="incoming-card-list" role="log" aria-live="polite" aria-relevant="additions"></div></div></div>';
  document.body.appendChild(layer);
  layer.querySelector('button')?.addEventListener('click',resetMessageCards);
  if (motion()) {
    W.gsap.fromTo(layer.querySelector('.incoming-scene-bg'),{opacity:0},{opacity:1,duration:.4,clearProps:'opacity'});
    W.gsap.fromTo(layer.querySelector('.incoming-phone'),{opacity:0,y:48,scale:1.16},{opacity:1,y:0,scale:1,duration:.75,ease:'power3.out',clearProps:'transform,opacity'});
  }
  return {layer,list:/** @type {HTMLElement} */(layer.querySelector('.incoming-card-list')),queue:[],running:false,stepTimer:0,dismissTimer:0,shown:0,received:0};
}

/** @param {CardFeed} feed */
function revealNext(feed) {
  if (active !== feed) return;
  const entry = feed.queue.shift();
  if (!entry) {
    feed.running = false;
    feed.dismissTimer = window.setTimeout(resetMessageCards,3000);
    return;
  }
  feed.running = true;
  // Video order: oldest stays on top, new cards are appended below; like the reference only five cards appear once.
  // No re-layout of cards that are still flying in (that caused jumps/overlaps).
  const card = document.createElement('article');
  card.className = 'incoming-message-card' + TONES[feed.shown % TONES.length];
  card.dataset.sequence = String(++feed.shown);
  card.dataset.channel = entry.payload.channel; card.dataset.user = entry.payload.id;
  card.innerHTML = '<div class="incoming-card-avatar-wrap"><img class="incoming-card-avatar" alt="" width="48" height="48"><span class="incoming-card-channel-icon incoming-channel-icon channel-'+entry.payload.channel+'" data-channel-icon="'+entry.payload.channel+'" role="img" aria-label="'+(entry.payload.channel==='wa'?'WhatsApp':entry.payload.channel==='tm'?'TM':'邮件')+'消息">'+channelIcon(entry.payload.channel)+'</span></div><div class="incoming-card-copy"><p class="incoming-card-body"></p><p class="incoming-card-translation"></p><footer><b class="incoming-card-name"></b><span class="incoming-card-meta"></span></footer></div>';
  /** @type {HTMLImageElement} */(card.querySelector('img')).src = entry.payload.avatar;
  /** @type {HTMLElement} */(card.querySelector('.incoming-card-body')).textContent = entry.payload.body;
  const translation = /** @type {HTMLElement} */(card.querySelector('.incoming-card-translation'));
  translation.textContent = entry.payload.translation || ''; translation.hidden = !entry.payload.translation;
  /** @type {HTMLElement} */(card.querySelector('.incoming-card-name')).textContent = entry.payload.name;
  const channel = entry.payload.channel === 'wa' ? 'WhatsApp' : entry.payload.channel === 'tm' ? 'TM' : '邮件';
  const place = entry.payload.country || entry.payload.context || '';
  const meta = /** @type {HTMLElement} */(card.querySelector('.incoming-card-meta'));
  if (entry.payload.location) {
    card.classList.add('is-video');
    meta.innerHTML = '<i class="vflag vflag-'+(entry.payload.flag||'')+'" aria-hidden="true"></i><span></span>';
    /** @type {HTMLElement} */(meta.querySelector('span')).textContent = `${entry.payload.location} · ${entry.payload.time || ''}`;
  } else meta.textContent = `${place ? place+' · ' : ''}${channel} · ${entry.payload.time || new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`;
  if (entry.open) {
    card.classList.add('is-actionable'); card.tabIndex = 0; card.setAttribute('role','button');
    card.setAttribute('aria-label',`查看 ${entry.payload.name} 的${channel}消息`);
    const open = () => {resetMessageCards();entry.open?.();};
    card.addEventListener('click',open);
    card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open();}});
  }
  feed.list.append(card);
  feed.layer.dataset.shown = String(feed.shown);
  feed.layer.dataset.queued = String(feed.queue.length);
  if (motion()) {
    W.gsap.fromTo(card,{opacity:0,y:78,x:-8,rotation:-7,scale:.94,filter:'blur(2px)'},{opacity:1,y:0,x:0,rotation:0,scale:1,filter:'blur(0px)',duration:.55,ease:'power3.out',clearProps:'transform,opacity,filter'});
  }
  feed.stepTimer = window.setTimeout(()=>revealNext(feed),350);
}

/** @param {CardMessage} payload @param {()=>void} [openTarget] */
export function enqueueMessageCard(payload,openTarget) {
  if (document.hidden) return null;
  if (!active) active = createFeed();
  const feed = active;
  window.clearTimeout(feed.dismissTimer);
  // Remaining burst messages are still stored/unread by the caller, but no longer recycle cards in the phone.
  if (feed.shown + feed.queue.length < MAX_CARDS) feed.queue.push({payload:{...payload},open:openTarget});
  feed.layer.dataset.received = String(++feed.received);
  const key='received'+(payload.channel==='wa'?'Wa':payload.channel==='tm'?'Tm':'Mail');
  feed.layer.dataset[key]=String(Number(feed.layer.dataset[key]||0)+1);
  feed.layer.dataset.queued = String(feed.queue.length);
  if (!feed.running) revealNext(feed);
  return feed.layer;
}
window.addEventListener('resize',resetMessageCards);
window.addEventListener('pagehide',resetMessageCards);
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetMessageCards();});
