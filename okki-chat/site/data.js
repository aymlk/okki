// @ts-check

/**
 * @typedef {{ name: string, avatar: string, flag: string, date: string, preview: string, tag?: string, active?: boolean }} Conversation
 * @typedef {{ en: string, zh: string }} Text
 * @typedef {{ id: string, label: string, summary: string, enabled: boolean, custom?: boolean, ask: Text, answer: Text, value: string, extract?:Text }} CollectItem
 */

/** @type {Conversation[]} */
export const conversations = [
  { name: "zhizhitesttradeag...", avatar: "./assets/contacts/c1.jpg", flag: "us", date: "2026-8-7", preview: "[已读] 可以" },
  { name: "Ali Tencent", avatar: "./assets/contacts/c2.jpg", flag: "cn", date: "2026-8-6", preview: "<b>[未读]</b> reply text" },
  { name: "hygmailcom", avatar: "./assets/buyer.jpg", flag: "us", date: "2026-8-6", preview: "[已读] Got it. Received your picture, th...", tag: "OKKI自动接待", active: true },
  { name: "Jasona juna", avatar: "./assets/contacts/c3.jpg", flag: "cn", date: "2026-8-5", preview: "我在测试debug" },
  { name: "zhizhitatestgmail...", avatar: "./assets/contacts/c4.jpg", flag: "us", date: "2026-8-5", preview: "it is too late, I want 2026-08-21" },
  { name: "zhizhitatestgmail...", avatar: "./assets/contacts/c5.jpg", flag: "us", date: "2026-8-4", preview: "100 pieces" },
  { name: "zhizhitestcardgm...", avatar: "./assets/contacts/c6.jpg", flag: "us", date: "2026-8-4", preview: "[询盘]" },
  { name: "hackicewang last...", avatar: "./assets/contacts/c7.jpg", flag: "cn", date: "2026-8-3", preview: "And finished products will be su..." },
  { name: "xpcom", avatar: "./assets/contacts/c8.jpg", flag: "za", date: "2026-8-3", preview: "[文本]", tag: "AI自动接待" },
  { name: "yeare zi", avatar: "./assets/contacts/c9.jpg", flag: "cn", date: "2026-7-30", preview: "[商品]" },
  { name: "desk monitor", avatar: "./assets/contacts/c10.jpg", flag: "cn", date: "2026-7-28", preview: "[图片]" }
];

/** Buyer's first message that starts the reception. */
export const opening = {
  en: "Hello, we would like to purchase a batch of dental medical equipment. Do you have dental comprehensive treatment units?",
  zh: "你好，我们想采购一批牙科医疗设备，你们有牙科综合治疗机吗？"
};

/** Default collection items. The AI asks enabled items one at a time, in this order. */
/** @type {CollectItem[]} */
export const defaultItems = [
  {
    id: "product", label: "产品类目", summary: "采购产品", enabled: true,
    ask: { en: "We offer dental comprehensive treatment units, panoramic X-ray machines and other dental equipment. Which model are you interested in?", zh: "我们可以提供牙科综合治疗机、全景 X 光机等口腔设备。请问您想要哪一款呢？" },
    answer: { en: "We are interested in your dental comprehensive treatment unit, model DC-6800.", zh: "我们想要你们的牙科综合治疗机，型号 DC-6800。" },
    extract: {en:"dental comprehensive treatment unit, model DC-6800",zh:"牙科综合治疗机，型号 DC-6800"},
    value: "牙科综合治疗机 DC-6800"
  },
  {
    id: "quantity", label: "采购数量", summary: "采购数量", enabled: true,
    ask: { en: "How many units do you plan to purchase?", zh: "请问您这次大概需要采购多少台？" },
    answer: { en: "About 6 units for the first order.", zh: "首单大概需要 6 台。" },
    extract: {en:"6 units",zh:"6 台"},
    value: "6 台（首单）"
  },
  {
    id: "usage", label: "采购用途", summary: "采购用途", enabled: true,
    ask: { en: "May I ask what the equipment will be used for?", zh: "方便问一下这批设备主要用在什么地方吗？" },
    answer: { en: "They are for our new chain dental clinics in France.", zh: "用于我们在法国新开的连锁牙科诊所。" },
    extract: {en:"new chain dental clinics in France",zh:"法国新开的连锁牙科诊所"},
    value: "法国新开连锁牙科诊所使用"
  },
  {
    id: "cycle", label: "采购周期", summary: "采购周期", enabled: true,
    ask: { en: "When do you need the equipment delivered?", zh: "请问您希望什么时候到货呢？" },
    answer: { en: "We hope to receive them within 2 months, before the clinics open in October.", zh: "希望 2 个月内到货，赶在 10 月诊所开业前。" },
    extract: {en:"within 2 months, before the clinics open in October",zh:"2 个月内到货，赶在 10 月诊所开业前"},
    value: "2 个月内到货（10 月开业前）"
  },
  {
    id: "custom", label: "定制需求", summary: "定制需求", enabled: false,
    ask: { en: "Do you have any customization requirements, such as voltage, color or logo?", zh: "请问有没有定制需求，比如电压、颜色或 Logo？" },
    answer: { en: "We need 220V, and our clinic logo printed on the chair.", zh: "需要 220V 电压，椅身印上我们诊所的 Logo。" },
    extract: {en:"220V, and our clinic logo printed on the chair",zh:"220V 电压，椅身印上我们诊所的 Logo"},
    value: "220V 电压，椅身印诊所 Logo"
  },
  {
    id: "budget", label: "预算金额", summary: "预算金额", enabled: false,
    ask: { en: "May I know your approximate budget for this order?", zh: "方便透露一下这次采购的大致预算吗？" },
    answer: { en: "Our budget is around USD 30,000.", zh: "我们的预算大约是 3 万美元。" },
    extract: {en:"USD 30,000",zh:"3 万美元"},
    value: "约 USD 30,000"
  },
  {
    id: "position", label: "联系人职位", summary: "联系人职位", enabled: false, custom: true,
    ask: { en: "May I ask your position in the company?", zh: "方便问一下您在公司的职位吗？" },
    answer: { en: "I am the purchasing manager of the clinic group.", zh: "我是诊所集团的采购经理。" },
    extract: {en:"purchasing manager of the clinic group",zh:"诊所集团的采购经理"},
    value: "诊所集团采购经理"
  }
];

/**
 * @typedef {{ from: "buyer" | "agent", date: string, gap?: string, subject: string, en: string[], zh: string[], attach?: string, read?: string, ai?: boolean }} MailMessage
 * @typedef {{ id: string, from: string, avatar: string, subject: string, snippet: string, date: string, unread?: boolean, tag?: string, active?: boolean }} MailListItem
 */

/** Email thread with the same buyer, earlier than the 7/22 TM chat. */
export const buyerMail = {
  name: "Marco Bianchi",
  address: "marco@bianchidental.it",
  company: "Bianchi Dental Supply · Italy",
  avatar: "./assets/mail-buyer.jpg"
};

/** @type {MailMessage[]} */
export const mailThread = [
  {
    from: "buyer", date: "7月3日 09:12", subject: "Inquiry: Dental Equipment",
    en: ["Hi,", "We are a dental equipment distributor in Milan, Italy, and are looking for new suppliers. Could you send us your catalog and price list? What is your MOQ?", "Best regards,\nMarco Bianchi"],
    zh: ["你好，", "我们是意大利米兰的一家牙科设备经销商，正在寻找新的供应商。能发一下你们的产品目录和价格表吗？最小起订量是多少？", "Marco Bianchi"]
  },
  {
    from: "agent", date: "7月3日 10:05", subject: "Re: Inquiry: Dental Equipment",
    en: ["Dear Marco,", "Thank you for your inquiry. Attached is our 2026 catalog, covering dental comprehensive treatment units, panoramic X-ray machines and other dental equipment. Our MOQ is 1 unit.", "To recommend the right models and quote accurately, could you tell us which equipment you need and the approximate quantity?", "Best regards,\nOKKI Medical Sales"],
    zh: ["Marco 您好：", "感谢您的询盘。附件是我们 2026 年的产品目录，包含牙科综合治疗机、全景 X 光机等口腔设备。最小起订量为 1 台。", "为了推荐合适型号并准确报价，方便告诉我们需要哪些设备、大概数量是多少吗？", "OKKI 医疗销售"],
    attach: "OKKI_Dental_Catalog_2026.pdf", read: "对方已读 · 7月3日 14:26"
  },
  {
    from: "buyer", date: "7月4日 16:40", gap: "1 天后", subject: "Re: Inquiry: Dental Equipment",
    en: ["Thanks. What is your best price for the DC-6800 unit? Do you have CE certification?", "To be honest, other suppliers have offered us much lower prices."],
    zh: ["谢谢。DC-6800 综合治疗机最低能给什么价？有 CE 认证吗？", "说实话，其他供应商给我们的报价低很多。"]
  },
  {
    from: "agent", date: "7月5日 09:30", subject: "Re: Inquiry: Dental Equipment",
    en: ["Dear Marco,", "The DC-6800 is CE and ISO 13485 certified. The FOB price is USD 2,850–3,200 per unit depending on quantity and configuration, with a 2-year warranty and remote installation support.", "If you share your quantity and timeline, we can offer a more competitive project price."],
    zh: ["Marco 您好：", "DC-6800 已通过 CE 和 ISO 13485 认证。FOB 单价为 2,850–3,200 美元/台，视数量和配置而定，含 2 年质保和远程安装指导。", "如果方便告知数量和时间安排，我们可以给到更有竞争力的项目价。"],
    attach: "DC-6800_CE_Certificate.pdf", read: "对方已读 · 7月5日 11:02"
  },
  {
    from: "agent", date: "7月9日 10:00", gap: "4 天未回复", subject: "Follow-up: DC-6800 quotation",
    en: ["Dear Marco,", "Just following up on the quotation. Is there anything else you would like to know, such as lead time or payment terms? We are happy to arrange a video call to show the unit."],
    zh: ["Marco 您好：", "跟进一下之前的报价。您还想了解交期或付款方式等信息吗？我们也可以安排视频通话，实时展示设备。"],
    read: "对方已读 · 7月10日 08:47"
  },
  {
    from: "agent", date: "7月15日 09:20", gap: "6 天未回复", subject: "Follow-up: Product video for your reference",
    en: ["Dear Marco,", "Sharing a short product demo video of the DC-6800 for your reference. Please feel free to contact us whenever convenient."],
    zh: ["Marco 您好：", "附上 DC-6800 的产品演示视频供您参考。方便的时候随时联系我们。"],
    attach: "DC-6800_Demo.mp4", read: "对方未读"
  }
];

/** @type {MailListItem[]} */
export const mailList = [
  { id: "mb", from: "Marco Bianchi", avatar: "./assets/mail-buyer.jpg", subject: "Follow-up: Product video for your reference", snippet: "Sharing a short product demo video of the DC-6800...", date: "7月15日", tag: "未回复 7 天", active: true },
  { id: "a", from: "Ali Tencent", avatar: "./assets/contacts/c2.jpg", subject: "Re: Sample shipment", snippet: "We have received the samples, thanks.", date: "7月14日" },
  { id: "b", from: "Jasona juna", avatar: "./assets/contacts/c3.jpg", subject: "Price inquiry for dental chairs", snippet: "Could you quote 20 units CIF Hamburg?", date: "7月12日", unread: true },
  { id: "c", from: "xpcom", avatar: "./assets/contacts/c8.jpg", subject: "Catalog request", snippet: "Please send your latest catalog.", date: "7月10日" },
  { id: "d", from: "yeare zi", avatar: "./assets/contacts/c9.jpg", subject: "Re: Invoice PI-20260706", snippet: "Payment has been arranged today.", date: "7月8日" },
  { id: "e", from: "hackicewang", avatar: "./assets/contacts/c7.jpg", subject: "Autoclave specifications", snippet: "And finished products will be shipped...", date: "7月6日" }
];


/** New email conversation played after jumping from the TM chat: the buyer writes a request, the AI answers, then the buyer goes silent on email. @type {MailMessage[]} */
export const mailNew = [
  {
    from: "buyer", date: "7月22日 10:32", gap: "7 天后 · 客户主动来信", subject: "Re: Follow-up: Product video for your reference",
    en: ["Hi,", "Sorry for the late reply, I was travelling. We watched the demo video and we are interested now.", "Can you supply 10 units of the DC-6800 with an Italian-language manual and interface? What is the delivery time to Milan, and is the price from July 5 still valid?", "Marco"],
    zh: ["你好，", "抱歉回复晚了，我之前在出差。我们看了演示视频，现在有兴趣了。", "DC-6800 能供 10 台吗？需要配意大利语说明书和界面。发到米兰交期多久？7 月 5 日的报价还有效吗？", "Marco"]
  },
  {
    from: "agent", ai: true, date: "7月22日 10:34", subject: "Re: Follow-up: Product video for your reference",
    en: ["Dear Marco,", "Welcome back, and thank you for your interest! Yes, the Italian manual and interface are included at no extra cost. Production takes 25–30 days after the deposit, followed by about 30 days by sea or 7 days by air.", "Even better, this month we offer distributors 8% off for orders placed before August 31. For 10 units that is USD 2,650 per unit FOB, with free shipping to Milan. When do you plan to place the order?", "Best regards,\nOKKI Medical Sales"],
    zh: ["Marco 您好：", "欢迎回来，感谢您的关注！意大利语说明书和界面免费提供。收到定金后生产 25–30 天，海运约 30 天，空运约 7 天。", "另外，本月经销商在 8 月 31 日前下单可享 9.2 折，10 台即 FOB 2,650 美元/台，并免费运到米兰。请问您计划什么时候下单？", "OKKI 医疗销售"],
    attach: "DC-6800_Quotation_10units.pdf", read: "对方已读 · 7月22日 10:41"
  }
];

/** Silence steps shown after the buyer reads the AI email but does not reply. */
export const mailSilence = ["已读 · 未回复 10 分钟", "已读 · 未回复 1 小时", "已读 · 未回复 3 小时"];

/** The same buyer resumes on WhatsApp. */
export const waBuyer = {
  phone: "+39 347 ••• 2816",
  local: "米兰 14:12",
  linked: "已关联邮件 marco@bianchidental.it · 8 封往来"
};

/**
 * @typedef {{ side: "buyer" | "agent", en: string, zh: string, time: string, file?: string }} WaMessage
 */

/** WhatsApp chat that continues the email topic. @type {WaMessage[]} */
export const waScript = [
  { side: "buyer", time: "14:12", en: "Hi, it's Marco from Bianchi Dental. I read your email, it's easier for me to chat here.", zh: "你好，我是 Bianchi Dental 的 Marco。邮件我看了，在这里聊更方便。" },
  { side: "buyer", time: "14:12", en: "Is the 8% discount still valid if we confirm the PI now but pay the deposit in early September?", zh: "如果我们现在确认 PI，但 9 月初再付定金，9.2 折还能保留吗？" },
  { side: "agent", time: "14:13", en: "Hi Marco, great to hear from you! Yes, as long as the PI is confirmed before August 31, the 8% discount is kept, and the deposit can be paid in early September.", zh: "Marco 您好，很高兴在这里收到您的消息！可以的，只要 8 月 31 日前确认 PI，就保留 9.2 折，定金可以 9 月初再付。" },
  { side: "buyer", time: "14:15", en: "Perfect. Can you also add 2 spare handpieces? Then please send the PI here.", zh: "太好了。能再加 2 个备用手机吗？然后把 PI 直接发到这里。" },
  { side: "agent", time: "14:16", en: "Sure! 2 spare handpieces are added free of charge. Here is the PI for 10 units of DC-6800, Italian version, CIF Milan.", zh: "没问题！免费加送 2 个备用手机。这是 10 台 DC-6800（意大利语版，CIF 米兰）的 PI。", file: "PI_BianchiDental_DC-6800_10units.pdf" }
];
