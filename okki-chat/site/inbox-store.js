// @ts-check
import { jasonOpening } from "./jason-followup.js";
import { conversations, opening, buyerMail, waBuyer, waScript } from "./data.js";

/** @typedef {"tm" | "wa"} InboxChannel */
/** @typedef {{side: "buyer" | "agent" | "human" | "system", en: string, zh: string, time?: string, file?: string, collectId?:string, tone?:string}} InboxMessage */
/** @typedef {{id: string, name: string, avatar: string, flag: string, country: string, company: string, meta: string, topic: string, summary: Record<string,string>, history: InboxMessage[], unread: number, important: boolean, scriptedOnly?: boolean, clickFollowup?: boolean}} InboxProfile */
/** @typedef {{profile: InboxProfile, messages: InboxMessage[], unread: number, preview: string, time: string, draft: string}} InboxThread */

const scenarios = {
  ali: {
    company: "Ali Dental Trading", country: "中国", topic: "口腔耗材采购", meta: "上海 · 采购经理",
    summary: { "采购产品": "一次性口腔耗材套装", "采购数量": "500 套", "采购用途": "经销渠道补货", "采购周期": "本月底发货" },
    history: [
      {side:"buyer",en:"Hi, do you supply disposable dental kits?",zh:"你好，你们提供一次性口腔耗材套装吗？"},
      {side:"agent",en:"Yes. We offer sterile dental kits with customizable packaging.",zh:"提供的，我们有无菌口腔套装，也支持定制包装。"},
      {side:"buyer",en:"We need 500 sets. Please send the packaging options.",zh:"需要 500 套，请发一下包装选项。"},
      {side:"buyer",en:"Can you ship before the end of this month?",zh:"可以在这个月底前发货吗？"}
    ]
  },
  jason: {
    company: "Nord Dental Clinic", country: "德国", topic: "德国诊所设备报价", meta: "汉堡 · 诊所负责人",
    summary: { "采购产品": "DC-6800 牙科治疗机", "采购数量": "3 台", "采购用途": "汉堡诊所升级", "采购周期": "6 周内到货" },
    history: [
      {side:"buyer",en:"We are upgrading our clinic in Hamburg and need three dental chairs.",zh:"我们正在升级汉堡的诊所，需要三台牙科治疗椅。"},
      {side:"agent",en:"The DC-6800 is CE certified and includes installation guidance.",zh:"DC-6800 已通过 CE 认证，并提供安装指导。"},
      {side:"buyer",en:"Please quote CIF Hamburg and include the warranty details.",zh:"请报 CIF 汉堡价格，并附上保修说明。"},
      {side:"buyer",en:"Our target delivery time is within six weeks.",zh:"希望六周内到货。"}
    ]
  },
  yeare: {
    company: "Yeare Medical Supply", country: "中国", topic: "订单尾款与物流跟进", meta: "深圳 · 运营经理",
    summary: { "关联订单": "OK-2026-0817", "采购产品": "便携式牙科 X 光机", "付款状态": "尾款已安排", "物流进度": "等待提单副本" },
    history: [
      {side:"buyer",en:"I am following up on order OK-2026-0817.",zh:"想跟进订单 OK-2026-0817。"},
      {side:"agent",en:"Your portable X-ray units have passed the final inspection.",zh:"您的便携式 X 光机已通过最终检验。"},
      {side:"human",en:"We will share the shipping documents after the balance is received.",zh:"收到尾款后，我们会发送运输单据。"},
      {side:"buyer",en:"The balance payment is arranged. Please send the bill of lading.",zh:"尾款已安排，请发送提单副本。"}
    ]
  }
};

/** @type {InboxProfile[]} */
export const tmProfiles = conversations.map((contact, index) => {
  const id = index===2 ? "hyg" : index===1 ? "ali" : index===3 ? "jason" : index===9 ? "yeare" : `tm-${index}`;
  const scenario = /** @type {Record<string, any>} */ (scenarios)[id];
  return {
    id, name:contact.name, avatar:contact.avatar, flag:contact.flag,
    country:scenario?.country || (id==="hyg" ? "法国" : "美国"),
    company:scenario?.company || (id==="hyg" ? "HY Dental Group" : `${contact.name.replace(/\.\.\.$/, "")} Dental Supply`),
    meta:scenario?.meta || (id==="hyg" ? "法国 · 里昂 · 采购经理" : "设备采购询盘"),
    topic:scenario?.topic || (id==="hyg" ? "法国连锁诊所设备采购" : "医疗设备询盘"),
    summary:scenario?.summary || {"采购产品":"牙科医疗设备","采购数量":"待确认","采购用途":"采购咨询","采购周期":"待确认"},
    history:scenario?.history || (id==="hyg" ? [{side:"buyer",...opening,time:"10:14"}] : [
      {side:"buyer",en:`Hello, this is ${contact.name}. Could you share your dental equipment catalog?`,zh:"你好，能分享你们的牙科设备目录吗？"},
      {side:"agent",en:"Of course. Which equipment and quantity are you interested in?",zh:"当然，请问您对哪类设备感兴趣，大概需要多少？"},
      {side:"buyer",en:"Please include the technical specifications and available delivery dates.",zh:"请一并提供技术参数和可安排的交货日期。"}
    ]),
    clickFollowup:id === "jason",
    unread:[3,8,1,1,4,3,4,2,3,5,2][index] || 0,
    important:["hyg","ali","jason"].includes(id)
  };
});

/** @type {InboxProfile[]} */
export const waProfiles = [
  {id:"marco", name:buyerMail.name, avatar:buyerMail.avatar, flag:"it", country:"意大利", company:buyerMail.company,
    meta:`${waBuyer.phone} · ${waBuyer.local}`, topic:"邮件报价接续", important:true, unread:0, scriptedOnly:true,
    summary:{"采购产品":"DC-6800（意大利语版）","采购数量":"10 台","交货条款":"FOB · USD 2,650/台","采购周期":"8 月 31 日前下单"},
    history:[]},
  ...["ali","jason","yeare"].map(id=>{
    const p=/** @type {InboxProfile} */ (tmProfiles.find(profile=>profile.id===id));
    return {...p, clickFollowup:false, meta:`${p.country} · WhatsApp 联系`, history:p.history.map(m=>({...m,time:"14:08"})), unread:id==="ali" ? 4 : 3};
  })
];

/** @typedef {{channel: InboxChannel, id: string, message: InboxMessage}} IncomingEvent */
/** @type {IncomingEvent[]} */
export const incomingDemo = [
  {channel:"tm",id:"ali",message:{side:"buyer",en:"Can you add our clinic logo to the 500 kits?",zh:"500 套耗材包装上可以加诊所 Logo 吗？"}},
  {channel:"wa",id:"jason",message:{side:"buyer",en:"Could you send a video of the DC-6800 in use?",zh:"能发一个 DC-6800 使用演示视频吗？"}},
  {channel:"tm",id:"jason",message:{side:"buyer",en:"Please include installation support in the quotation.",zh:"请在报价中列明安装支持。"}},
  {channel:"wa",id:"ali",message:{side:"buyer",en:"We would like to confirm the packaging artwork today.",zh:"我们希望今天确认包装设计稿。"}},
  {channel:"tm",id:"yeare",message:{side:"buyer",en:"The transfer receipt is ready. Who should I send it to?",zh:"转账回单已经准备好，应该发给谁？"}},
  {channel:"tm",id:"ali",message:{side:"buyer",en:"Please also quote express shipping to Shanghai.",zh:"请同时报价快递到上海的运费。"}},
  {channel:"wa",id:"yeare",message:{side:"buyer",en:"Please share the tracking number when available.",zh:"有物流追踪号后请发给我。"}},
  {channel:"tm",id:"jason",message:{side:"buyer",en:"Would delivery in September still be possible?",zh:"九月份安排交付还来得及吗？"}},
  {channel:"wa",id:"ali",message:{side:"buyer",en:"Please confirm the carton dimensions for the 500 kits.",zh:"请确认 500 套耗材的外箱尺寸。"}},
  {channel:"tm",id:"yeare",message:{side:"buyer",en:"Our finance team has sent the bank transfer receipt.",zh:"财务已经发送银行转账回单了。"}},
  {channel:"tm",id:"tm-0",message:{side:"buyer",en:"Please send your latest dental equipment catalog and price list.",zh:"请发送最新牙科设备目录和价目表。"}},
  {channel:"wa",id:"jason",message:{side:"buyer",en:"Could we arrange a product demonstration this Friday?",zh:"能安排这周五做产品演示吗？"}},
  {channel:"tm",id:"tm-8",message:{side:"buyer",en:"We are planning a repeat order. Please check current stock.",zh:"我们计划复购，请确认当前库存。"}},
  {channel:"wa",id:"yeare",message:{side:"buyer",en:"Please update us when the shipment clears customs.",zh:"货物清关后请及时通知我们。"}}
];

/** @param {InboxProfile} profile @returns {InboxMessage[]} */
function seedMessages(profile) {
  if (profile.clickFollowup) return [{...jasonOpening}];
  const previous=profile.history.map(m=>({...m}));
  if(profile.scriptedOnly || profile.id==="hyg") return previous;
  const followUps=[
    ["Please share the latest catalog for this inquiry.","请发一下这次询盘相关的最新产品目录。"],
    ["Could you confirm the available stock and delivery schedule?","可以确认当前库存和交货安排吗？"],
    ["Please send the detailed specification sheet.","请提供详细的技术参数表。"],
    ["Does the quotation include the standard accessories?","报价是否包含标配附件？"],
    ["Please include the warranty and installation support details.","请一并说明保修与安装支持。"],
    ["What are the packing dimensions and gross weight?","包装尺寸与毛重分别是多少？"],
    ["Could you prepare a proforma invoice for our review?","可以准备形式发票供我们确认吗？"],
    ["Please also confirm the payment terms for this order.","请同时确认这笔订单的付款条款。"]
  ];
  for(let n=0;n<profile.unread;n++) {
    const [en,zh]=followUps[n%followUps.length];
    previous.push({side:"buyer",en,zh,time:`14:${String(15+n).padStart(2,"0")}`});
  }
  return previous;
}

/** A local inbox only: each channel/user owns messages, unread counts and its draft. */
export function createInbox() {
  /** @type {Record<InboxChannel, InboxThread[]>} */
  const state={tm:[],wa:[]};
  /** @type {Set<(channel:InboxChannel,id:string)=>void>} */
  const listeners=new Set();
  for(const channel of /** @type {InboxChannel[]} */ (["tm","wa"])) {
    state[channel]=(channel==="tm"?tmProfiles:waProfiles).map(profile=>{
      const messages=seedMessages(profile);
      const last=messages[messages.length-1];
      return {profile,messages,unread:profile.unread,preview:last?.zh || profile.topic,time:last?.time || "昨天",draft:""};
    });
  }
  /** @param {InboxChannel} channel @param {string} id */
  const get=(channel,id)=>{
    const thread=state[channel].find(t=>t.profile.id===id);
    if(!thread) throw new Error(`Unknown demo thread: ${channel}/${id}`);
    return thread;
  };
  /** @param {InboxChannel} channel @param {string} id */
  const notify=(channel,id)=>listeners.forEach(fn=>fn(channel,id));
  return {
    get,
    /** @param {InboxChannel} channel */
    list:channel=>state[channel],
    /** @param {InboxChannel} channel */
    total:channel=>state[channel].reduce((total,t)=>total+t.unread,0),
    /** @param {(channel:InboxChannel,id:string)=>void} fn */
    subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
    /** @param {InboxChannel} channel @param {string} id @param {InboxMessage} message @param {boolean} [read] */
    append(channel,id,message,read=false){
      const thread=get(channel,id);
      if(thread.profile.scriptedOnly){
        // Fixed demo: accept only the next original script message, once.
        const expected=waScript[thread.messages.length];
        if(!expected || message.side!==expected.side || message.en!==expected.en || message.zh!==expected.zh || (message.file || "")!==(expected.file || "")) return;
      }
      const time=message.time || new Date().toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"});
      thread.messages.push({...message,time});
      if(message.side!=="system") {thread.preview=message.zh || message.en;thread.time=time;}
      if(message.side==="buyer" && !read) thread.unread++;
      notify(channel,id);
    },
    /** @param {InboxChannel} channel @param {string} id */
    markRead(channel,id){const thread=get(channel,id);if(thread.unread){thread.unread=0;notify(channel,id);}},
    /** @param {InboxChannel} channel @param {string} id */
    clear(channel,id){const thread=get(channel,id);thread.messages.length=0;thread.unread=0;notify(channel,id);}
  };
}
