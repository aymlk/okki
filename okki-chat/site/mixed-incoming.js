// @ts-check
// One finite, local burst. Allocation is separate from inbox/UI state.
/** @typedef {import('./inbox-store.js').InboxProfile} Profile */
/** @typedef {import('./inbox-store.js').InboxMessage} Message */
/** @typedef {{channel:'tm'|'wa',profile:Profile,message:Message}} ChatCandidate */
/** @typedef {{body:string,translation:string,location:string,flag:string,time:string}} VideoCard */
/** @typedef {{channel:'tm'|'wa'|'mail',profile:Profile,message:Message,card:VideoCard}} MixedMessage */
/** Card copy matches the 11月2日 reference video, in order. */
/** @type {(VideoCard & {zh:string})[]} */
export const videoMessages=[
  {body:'¿Me puede enviar su catálogo?',translation:'(Can you send me your catalog?)',location:'Mexico City, Mexico',flag:'mx',time:'13:45',zh:'可以发送一下贵司的产品目录吗？'},
  {body:'Vocês oferecem amostras grátis?',translation:'(Do you offer free samples?)',location:'São Paulo, Brazil',flag:'br',time:'16:45',zh:'你们提供免费样品吗？'},
  {body:'Can we customize the packaging?',translation:'',location:'Los Angeles, USA',flag:'us',time:'12:45',zh:'我们可以定制包装吗？'},
  {body:'¿Cuáles son sus métodos de pago?',translation:'(What are your payment methods?)',location:'Bogotá, Colombia',flag:'co',time:'14:45',zh:'你们支持哪些付款方式？'},
  {body:'Do you offer bulk discounts?',translation:'',location:'Toronto, Canada',flag:'ca',time:'15:45',zh:'批量采购有折扣吗？'}
];
/** @template T @param {T[]} values @param {()=>number} random @returns {T[]} */
function shuffled(values,random) {
  const result=values.slice();
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
/** @param {ChatCandidate[]} pool @param {Profile[]} mailProfiles @param {()=>number} [random] @returns {MixedMessage[]} */
export function createMixedBurst(pool,mailProfiles,random=Math.random) {
  const channels=/** @type {('tm'|'wa'|'mail')[]} */ (['tm','wa','mail']);
  if(!pool.some(p=>p.channel==='tm')||!pool.some(p=>p.channel==='wa')||!mailProfiles.length)throw new Error('Three nonempty channel pools are required');
  const order=[...shuffled(channels,random),...Array.from({length:18},()=>channels[Math.floor(random()*3)]),...shuffled(channels,random)];
  const questions=[
    {side:/** @type {'buyer'} */ ('buyer'),en:'Please email your latest equipment catalog and quotation.',zh:'请通过邮件发送最新设备目录及报价。'},
    {side:/** @type {'buyer'} */ ('buyer'),en:'Could you confirm the warranty terms and available delivery schedule?',zh:'可以确认保修条款和可安排的交期吗？'},
    {side:/** @type {'buyer'} */ ('buyer'),en:'Please send the specification sheet so our purchasing team can review it.',zh:'请发送技术参数表，方便我们的采购团队确认。'},
    {side:/** @type {'buyer'} */ ('buyer'),en:'Could you share the payment terms and packing details by email?',zh:'能通过邮件提供付款条款和包装详情吗？'}
  ];
  void questions;
  return order.map((channel,n)=>{
    const v=videoMessages[n%videoMessages.length];
    const card={body:v.body,translation:v.translation,location:v.location,flag:v.flag,time:v.time};
    const message={side:/** @type {'buyer'} */ ('buyer'),en:v.body,zh:v.zh,time:v.time};
    if(channel==='mail')return {channel,profile:mailProfiles[Math.floor(random()*mailProfiles.length)],message,card};
    const candidates=pool.filter(p=>p.channel===channel),chosen=candidates[Math.floor(random()*candidates.length)];
    return {channel,profile:chosen.profile,message,card};
  });
}
