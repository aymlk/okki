// @ts-check
// Finite in-page demonstration, not a real messaging or background scheduling service.
/** @typedef {import('./inbox-store.js').InboxMessage} Message */
/** @type {Message} */
export const jasonOpening = {side:'buyer',en:'Could you prepare a proforma invoice for our review?',zh:'可以准备形式发票供我们确认吗？',time:'14:21'};
/** @type {Message[]} */
export const jasonConversation = [
  {side:'agent',en:'Of course. How many DC-6800 units do you need, and which destination port should I use for the quotation?',zh:'当然可以。请问需要几台 DC-6800？报价需要按哪个目的港安排？'},
  {side:'buyer',en:'Three units for our clinic in Hamburg. Please quote CIF Hamburg and include installation support.',zh:'汉堡诊所需要 3 台，请报 CIF 汉堡价格，并包含安装支持。'},
  {side:'agent',en:'Understood. I will list the three units, standard accessories, warranty and installation support in the quotation. When would you like them to arrive?',zh:'明白，我会在报价中列明 3 台设备、标配附件、保修及安装支持。您希望什么时候到货？'},
  {side:'buyer',en:'Within six weeks. Please prepare the proforma invoice so our finance team can review it.',zh:'希望六周内到货。请准备形式发票，方便我们的财务团队确认。'},
  {side:'agent',en:'Certainly. I can prepare the proforma invoice for three DC-6800 units under CIF Hamburg terms. Please share your billing company name and invoice address so I can complete the draft for your review.',zh:'好的，我可以按 3 台 DC-6800、CIF 汉堡条款准备形式发票。请提供开票公司名称和地址，我就可以整理草稿供您确认。'}
];
/** @type {Message} */
export const jasonFollowupMessage = {side:'agent',en:'Hi Jasona, just following up on the proforma invoice for the three DC-6800 units, CIF Hamburg. When convenient, could you confirm the billing company name and invoice address? I can then prepare the draft and confirm the available delivery schedule.',zh:'您好 Jasona，想跟进一下 3 台 DC-6800、CIF 汉堡条款的形式发票。方便时请确认开票公司名称和地址，我会据此准备草稿，并再次确认可安排的交期。'};

/** @typedef {{visible:()=>boolean,append:(message:Message)=>void,box:()=>HTMLElement,avatar:string,changed:()=>void}} FollowupOptions */
/** @param {FollowupOptions} options */
export function createJasonFollowup(options) {
  let started = false, cursor = 0;
  /** @type {'idle'|'conversation'|'waiting'|'notice'|'followup'|'done'} */
  let phase = 'idle';
  let remaining = 0, lastTick = 0, timer = 0, ticking = false;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = () => reduced() ? 180 : (jasonConversation[cursor]?.side === 'buyer' ? 1400 : 1250);
  const W = /** @type {any} */ (window);

  function removeNotice() {
    const stage = document.getElementById('jasonFollowupStage');
    if (stage) {W.gsap?.killTweensOf([stage,...Array.from(stage.querySelectorAll('*'))]);stage.remove();}
  }
  function clearPresentation() {
    options.box().querySelectorAll('[data-jason-followup-ui]').forEach(node=>node.remove());
    delete options.box().dataset.followupPhase;
    removeNotice();
  }
  function pause() {
    window.clearTimeout(timer);timer = 0;lastTick = 0;
    clearPresentation();
  }
  function renderPresentation() {
    if (!options.visible() || !started) {clearPresentation();return;}
    const box = options.box();
    box.dataset.followupPhase = phase;
    const previous = box.querySelector('[data-jason-followup-ui]');
    if (previous?.getAttribute('data-jason-followup-ui') !== phase) previous?.remove();
    if (phase !== 'done' && !box.querySelector('[data-jason-followup-ui]')) {
      const row = document.createElement('div');
      row.dataset.jasonFollowupUi = phase;
      if (phase === 'conversation' || phase === 'followup') {
        const buyer = phase === 'conversation' && jasonConversation[cursor]?.side === 'buyer';
        row.className = `msg ${buyer ? 'buyer' : 'agent'} typing jason-typing`;
        row.innerHTML = `<span class="face ${buyer ? '' : 'face-me'}"></span><div class="bubble"><i></i><i></i><i></i></div>`;
        if (buyer) /** @type {HTMLElement} */ (row.querySelector('.face')).style.background = `#e9edf2 url('${options.avatar}') center / cover`;
      } else {
        row.className = 'jason-followup-status';row.setAttribute('role','status');
        row.innerHTML = phase === 'done'
          ? '<span class="jason-status-check">✓</span><span>AI 已主动跟进<small>等待客户回复</small></span>'
          : '<span class="jason-status-dot"></span><span>客户长时间不回复<small>AI准备主动跟进...</small></span>';
      }
      box.appendChild(row);box.scrollTop = box.scrollHeight;
    }
    removeNotice();
  }
  function advance() {
    if (phase === 'conversation') {
      const message = jasonConversation[cursor++];
      if (cursor === jasonConversation.length) {phase = 'waiting';remaining = 8000;}
      else remaining = duration();
      options.append({...message});
    } else if (phase === 'waiting') {
      phase = 'notice';remaining = 3200;
      renderPresentation();
    } else if (phase === 'notice') {
      phase = 'followup';remaining = 4000;
      renderPresentation();
    } else if (phase === 'followup') {
      phase = 'done';remaining = 0;
      options.append({...jasonFollowupMessage});
      options.changed();
    }
  }
  function tick() {
    timer = 0;ticking = true;
    if (!options.visible()) {ticking = false;pause();return;}
    const now = performance.now();
    // Count only time the target conversation is visible; no hidden-page catch-up.
    remaining -= Math.min(250,Math.max(0,now-lastTick));lastTick = now;
    if (remaining <= 0) advance();
    renderPresentation();ticking = false;
    if (phase !== 'done' && phase !== 'idle') timer = window.setTimeout(tick,80);
  }
  function sync() {
    if (!started || !options.visible()) {pause();return;}
    renderPresentation();
    if (phase !== 'done' && !timer && !ticking) {lastTick = performance.now();timer = window.setTimeout(tick,80);}
  }
  function open() {
    if (!started) {started = true;phase = 'conversation';remaining = duration();}
    sync();
  }
  window.addEventListener('resize',()=>{removeNotice();if(phase === 'notice' && options.visible())renderPresentation();});
  window.addEventListener('pagehide',pause);
  document.addEventListener('visibilitychange',sync);
  return {open,sync,locked:()=>phase !== 'done',getPhase:()=>phase};
}
