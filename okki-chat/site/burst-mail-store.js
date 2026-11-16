// @ts-check
// In-memory mock mail only. No server, network sends or account access.
/** @typedef {import('./inbox-store.js').InboxProfile} Profile */
/** @typedef {import('./inbox-store.js').InboxMessage} Message */
/** @typedef {{id:string,profile:Profile,message:Message,time:string,unread:boolean}} MailRecord */
/** @param {string} value */
const escapeHtml=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
/** @param {()=>void} changed */
export function createBurstMailStore(changed) {
  /** @type {MailRecord[]} */ const records=[];
  /** @type {HTMLDialogElement | null} */ let dialog=null;
  const close=()=>{if(dialog?.open)dialog.close();};
  /** @param {Profile} profile @param {Message} message */
  function append(profile,message) {
    const time=message.time||new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
    const record={id:'burst-mail-'+(records.length+1),profile,message:{...message,time},time,unread:true};
    records.push(record);changed();return record;
  }
  function listMarkup() {
    return records.slice().reverse().map(r=>`<li class="mail-item random-mail-item${r.unread?' unread':''}"><button type="button" data-burst-mail="${r.id}" aria-label="查看${escapeHtml(r.profile.name)}的邮件"><img class="avatar" src="${escapeHtml(r.profile.avatar)}" alt="" width="34" height="34"><div><div class="mail-item-top"><strong>${escapeHtml(r.profile.name)}</strong><time>${r.time}</time></div><b>${escapeHtml(r.profile.topic)}</b><p>${escapeHtml(r.message.zh)}</p><span class="mail-chip ${r.unread?'warn':'ok'}">${r.unread?'新邮件':'已读'}</span></div></button></li>`).join('');
  }
  /** @param {string} id */
  function open(id) {
    const record=records.find(r=>r.id===id);if(!record)return;
    if(!dialog){
      dialog=document.createElement('dialog');dialog.id='burstMailPreview';dialog.className='burst-mail-preview';dialog.setAttribute('aria-labelledby','burstMailTitle');
      document.body.appendChild(dialog);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
      dialog.addEventListener('click',e=>{const current=dialog;if(current&&e.target===current){const r=current.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
    }
    record.unread=false;changed();
    dialog.innerHTML=`<header><span>邮件</span><button type="button" aria-label="关闭邮件">×</button></header><div class="burst-mail-author"><img src="${escapeHtml(record.profile.avatar)}" alt="" width="44" height="44"><div><h2 id="burstMailTitle">${escapeHtml(record.profile.name)}</h2><p>${escapeHtml(record.profile.company)} · ${escapeHtml(record.profile.country)}</p></div><time>${record.time}</time></div><div class="burst-mail-content"><h3>${escapeHtml(record.profile.topic)}</h3><p>${escapeHtml(record.message.en)}</p><div><small>译文</small><p>${escapeHtml(record.message.zh)}</p></div></div>`;
    dialog.querySelector('button')?.addEventListener('click',close);
    if(!dialog.open)dialog.showModal();
  }
  return {append,listMarkup,open,close,total:()=>records.filter(r=>r.unread).length,list:()=>records.slice()};
}
