// 页面演示数据：按视频画面整理的客户接待记录
window.CRM_DATA = {
  contacts: {
    liam: {
      email: "liam.green@dubaisolutions.ae", phone: "+971 50 382 6614", title: "采购总监",
      channels: [
        { key: "wa", label: "WhatsApp", ok: true }, { key: "mail", label: "邮箱", ok: true }, { key: "phone", label: "电话", ok: true },
        { key: "linkedin", label: "LinkedIn", ok: true }, { key: "facebook", label: "Facebook", ok: false }, { key: "instagram", label: "Instagram", ok: false }
      ]
    },
    mason: {
      email: "mason.lane@deserttech.io", phone: "+1 480 552 0193", title: "供应链副总裁",
      channels: [
        { key: "wa", label: "WhatsApp", ok: false }, { key: "mail", label: "邮箱", ok: true }, { key: "phone", label: "电话", ok: true },
        { key: "linkedin", label: "LinkedIn", ok: true }, { key: "facebook", label: "Facebook", ok: true }, { key: "instagram", label: "Instagram", ok: false }
      ]
    },
    lucas: {
      email: "lucas@oasisdigital.com", phone: "+1 512 873 4420", title: "运营经理",
      channels: [
        { key: "wa", label: "WhatsApp", ok: true }, { key: "mail", label: "邮箱", ok: true }, { key: "phone", label: "电话", ok: false },
        { key: "linkedin", label: "LinkedIn", ok: false }, { key: "facebook", label: "Facebook", ok: true }, { key: "instagram", label: "Instagram", ok: true }
      ]
    },
    oliver: {
      email: "o.stone@innohorizons.com", phone: "+1 303 618 2975", title: "品类采购经理",
      channels: [
        { key: "wa", label: "WhatsApp", ok: true }, { key: "mail", label: "邮箱", ok: true }, { key: "phone", label: "电话", ok: true },
        { key: "linkedin", label: "LinkedIn", ok: true }, { key: "facebook", label: "Facebook", ok: false }, { key: "instagram", label: "Instagram", ok: true }
      ]
    },
    noah: {
      email: "noah.reed@northwindmed.com", phone: "+1 503 240 7781", title: "设备采购主管",
      channels: [
        { key: "wa", label: "WhatsApp", ok: true }, { key: "mail", label: "邮箱", ok: true }, { key: "phone", label: "电话", ok: false },
        { key: "linkedin", label: "LinkedIn", ok: true }, { key: "facebook", label: "Facebook", ok: false }, { key: "instagram", label: "Instagram", ok: false }
      ]
    }
  },
  menu: [
    { key: "fav", label: "常用", icon: "star" },
    { key: "desk", label: "工作台", icon: "desk" },
    { key: "ai", label: "智能销售", icon: "bot", active: true },
    { key: "reach", label: "OKKI AiReach", icon: "spark" },
    { key: "mail", label: "邮件", icon: "mail" },
    { key: "chat", label: "沟通", icon: "chat" },
    { key: "lead", label: "线索", icon: "lead" },
    { key: "cust", label: "客户", icon: "users" },
    { key: "opp", label: "商机", icon: "target" },
    { key: "leads", label: "OKKI Leads", icon: "search" },
    { key: "deal", label: "交易", icon: "doc" },
    { key: "team", label: "团队数据", icon: "chart" },
    { key: "more", label: "更多", icon: "grid" }
  ],
  funnel: [
    { label: "询盘接入", num: 28464, today: 20 },
    { label: "已接待", num: 4625, today: 20 },
    { label: "交付人工", num: 631, today: 20 },
    { label: "人工已接手", num: 526, today: 20 }
  ],
  customers: [
    {
      id: "liam",
      name: "Liam Green",
      company: "Dubai Solutions",
      country: "美国",
      avatar: "av-1",
      amount: 720000,
      minutesAgo: 5,
      channels: ["wa"],
      tag: "信息补全",
      state: "pending",
      owner: "Linda",
      quoteVia: "wa",
      summary: "客户已明确采购意向，并要求确认合同条款与售后保障细节，对交付周期、服务范围及付款节点保持持续沟通，当前沟通已进入成交推进阶段",
      suggestion: "建议通过WhatsApp发送报价及售后保障文档",
      purchase: { product: "牙科治疗机*8", cycle: "30天", budget: "USD 72,000", usage: "日常诊疗" },
      needs: ["8 台牙科治疗机", "30 天内交付", "合同条款确认", "售后保障方案", "分期付款节点"],
      deliveryIntent: {
        level: "high",
        label: "高交付意向",
        signals: ["8 台牙科治疗机", "30 天内交付", "预算 USD 72,000"],
        reason: "采购产品、数量与交期明确，正在确认合同和售后保障。"
      },
      background: {
        site: "dubaisolutions.ae",
        founded: "2011 年",
        size: "120-200 人",
        industry: "医疗器械分销",
        region: "阿联酋 · 迪拜",
        trade: "近 12 个月进口 37 次",
        score: 86,
        risk: "未发现经营异常与诉讼记录，付款信用良好",
        insight: "连锁口腔诊所供应商，近期在扩张 3 家新诊所，采购需求真实且紧迫。"
      },
      whatsapp: [
        { from: "c", day: "7月22日 10:14", en: "Hello", zh: "你好" },
        { from: "c", en: "Hello, I'm very interested in your company's products. Could you please send me the latest product catalog for reference?", zh: "您好，我对贵司的产品很感兴趣，能否寄送最新的产品目录给我参考一下？谢谢！" },
        { from: "a", en: "Of course, we will promptly send the latest product catalog to your email. Please check your inbox. Feel free to reach out if you have any questions or need further information.", zh: "当然，我们会立即将最新的产品目录发送至您的邮箱，请查收。如果有任何疑问或需要进一步信息，请随时联系我们。" },
        { from: "c", en: "Can you offer more product discounts?", zh: "可以提供更多产品折扣吗？" },
        { from: "a", en: "For an order of 8 units we can offer a 5% volume discount and free installation training. Shall I prepare a formal quotation with warranty terms?", zh: "订购 8 台可享受 5% 批量折扣并免费安装培训。需要我准备一份含质保条款的正式报价吗？" },
        { from: "c", en: "Yes please. Also confirm the after-sales service and delivery within 30 days.", zh: "好的，请同时确认售后服务以及 30 天内交付。" }
      ],
      mails: [
        { dir: "out", subj: "Latest Product Catalog 2026 - Dental Units", time: "7月22日 10:20", body: "已发送最新产品目录及牙科治疗机参数表，附件 3 个。" },
        { dir: "in", subj: "RE: Latest Product Catalog 2026", time: "7月22日 15:42", body: "客户回复确认对型号 DU-680 感兴趣，询问保修期与配件供应。" }
      ],
      tm: [
        { from: "c", day: "7月21日 18:03", en: "Is the DU-680 CE certified?", zh: "DU-680 有 CE 认证吗？" },
        { from: "a", en: "Yes, DU-680 holds CE and ISO 13485 certificates. I can share copies.", zh: "有的，DU-680 拥有 CE 与 ISO 13485 认证，可以提供副本。" }
      ],
      timeline: [
        { time: "7月21日 18:03", text: "通过 TM 首次询盘，询问产品认证" },
        { time: "7月22日 10:14", text: "WhatsApp 索取产品目录，智能销售自动回复" },
        { time: "7月22日 10:20", text: "邮件发送产品目录" },
        { time: "7月22日 16:10", text: "客户询问折扣与售后，标记为信息补全，提醒转人工" }
      ]
    },
    {
      id: "mason",
      name: "Mason Lane",
      company: "Desert Tech Innovations",
      country: "美国",
      avatar: "av-2",
      amount: 900000,
      minutesAgo: 5,
      channels: ["web", "mail"],
      tag: "金额 ≥ 80,0000",
      state: "pending",
      owner: "Linda",
      quoteVia: "mail",
      summary: "客户已明确高金额采购意向，预计成交金额 ≥ 80万 USD，当前已进入价格博弈阶段，并持续对比竞品报价。由于成交概率、利润空间及最终底价需综合评估",
      suggestion: "<b>制定价格策略，</b>结合客户体量、成交概率及竞品报价情况，评估是否通过阶段性让价提升成交可能，同步确认可接受底线与利润空间，平衡成交结果与收益风险",
      purchase: { product: "工业储能柜*40", cycle: "60天", budget: "USD 900,000", usage: "园区储能项目" },
      needs: ["40 套储能柜", "竞品价格对比", "分批交付", "本地认证资料"],
      background: {
        site: "deserttech.io",
        founded: "2016 年",
        size: "500-1000 人",
        industry: "新能源工程",
        region: "美国 · 亚利桑那",
        trade: "近 12 个月进口 82 次",
        score: 79,
        risk: "存在 1 条历史合同纠纷（已结案），建议约定预付款比例",
        insight: "正在推进园区级储能项目，同时向 3 家供应商询价，对价格敏感。"
      },
      whatsapp: [],
      mails: [
        { dir: "in", subj: "RFQ: 40 sets Energy Storage Cabinet", time: "7月20日 09:12", body: "客户发来询价单，要求 2 周内给出含运费报价。" },
        { dir: "out", subj: "Quotation & Technical Specs", time: "7月20日 11:30", body: "智能销售已回复初步报价区间与技术规格书。" },
        { dir: "in", subj: "RE: Quotation & Technical Specs", time: "7月22日 14:05", body: "客户表示竞品报价低 6%，希望重新评估价格。" }
      ],
      tm: [],
      timeline: [
        { time: "7月20日 09:12", text: "官网表单询盘并发送 RFQ" },
        { time: "7月20日 11:30", text: "邮件回复报价区间" },
        { time: "7月22日 14:05", text: "客户进行竞品比价，金额超阈值转人工" }
      ]
    },
    {
      id: "lucas",
      name: "Lucas Sky",
      company: "Oasis Digital Services",
      country: "美国",
      avatar: "av-3",
      amount: 234000,
      minutesAgo: 5,
      channels: ["web", "mail"],
      tag: "无法回答",
      state: "pending",
      owner: "Linda",
      quoteVia: "wa",
      summary: "<b>当前报价是继续让价促成交，还是维持利润空间？</b>客户持续压价，已接近最低成交区间，并对比竞品报价，AI无法平衡成交概率与利润空间，需人工决策",
      suggestion: "<b>建议优先制定价格谈判策略，</b>结合客户体量、竞品报价及成交概率，评估是否需要有限度让价或通过附加服务提升竞争力，明确可接受底线与谈判空间后，再推进正式报价与成交确认",
      purchase: { product: "商用显示屏*120", cycle: "45天", budget: "USD 234,000", usage: "门店数字标牌" },
      needs: ["120 台商用显示屏", "最低价格", "附加安装服务", "2 年质保"],
      background: {
        site: "oasisdigital.com",
        founded: "2019 年",
        size: "50-100 人",
        industry: "数字营销服务",
        region: "美国 · 德州",
        trade: "近 12 个月进口 15 次",
        score: 72,
        risk: "公司规模较小，建议采用信用证付款",
        insight: "为连锁零售客户部署数字标牌，对价格高度敏感，决策链较短。"
      },
      whatsapp: [
        { from: "c", day: "7月22日 09:40", en: "Your price is still higher than others. Can you match $1,850 per unit?", zh: "你们价格仍然比别家高，能做到每台 1850 美元吗？" },
        { from: "a", en: "Thanks for your feedback. I'll check with our sales manager and get back to you shortly.", zh: "感谢反馈，我会与销售经理确认后尽快回复您。" }
      ],
      mails: [
        { dir: "in", subj: "Commercial display inquiry", time: "7月19日 16:22", body: "客户询问 55 寸商用显示屏批量价格。" }
      ],
      tm: [],
      timeline: [
        { time: "7月19日 16:22", text: "邮件询盘" },
        { time: "7月22日 09:40", text: "客户持续压价，AI 无法回答，转人工" }
      ]
    },
    {
      id: "oliver",
      name: "Oliver Stone",
      company: "Innovative Horizons",
      country: "美国",
      avatar: "av-4",
      amount: 720000,
      minutesAgo: 5,
      channels: ["web", "wa", "mail"],
      tag: "",
      state: "taken",
      owner: "Linda",
      quoteVia: "wa",
      summary: "业务员已接手跟进，客户确认样品测试通过，正在走内部采购审批流程",
      suggestion: "建议跟进审批进度，并提前准备形式发票与装运计划",
      purchase: { product: "户外露营装备*3000", cycle: "40天", budget: "USD 720,000", usage: "零售渠道铺货" },
      needs: ["3000 套露营装备", "定制 Logo", "形式发票", "海运方案"],
      background: {
        site: "innohorizons.com",
        founded: "2008 年",
        size: "200-500 人",
        industry: "户外用品零售",
        region: "美国 · 科罗拉多",
        trade: "近 12 个月进口 64 次",
        score: 91,
        risk: "合作历史良好，回款及时",
        insight: "老客户复购，样品测试已通过，成交概率高。"
      },
      whatsapp: [
        { from: "c", day: "7月22日 08:15", en: "Samples passed our test. Purchase approval is in progress.", zh: "样品通过测试，采购审批进行中。" },
        { from: "s", en: "Great news! I'll prepare the proforma invoice for you today.", zh: "好消息！我今天就为您准备形式发票。" }
      ],
      mails: [],
      tm: [],
      timeline: [
        { time: "7月18日 10:00", text: "官网询盘，智能销售自动接待" },
        { time: "7月20日 14:30", text: "人工 Linda 已接手" },
        { time: "7月22日 08:15", text: "客户确认样品测试通过" }
      ]
    },
    {
      id: "noah",
      name: "Noah Reed",
      company: "Northwind Medical",
      country: "美国",
      avatar: "",
      amount: 156000,
      minutesAgo: 18,
      channels: ["wa"],
      tag: "",
      state: "ai",
      owner: "Lida",
      quoteVia: "wa",
      summary: "智能销售正在接待中，客户咨询便携式超声设备的参数与认证资料",
      suggestion: "建议继续由智能销售发送产品规格书，待客户明确数量后再报价",
      purchase: { product: "便携超声仪*20", cycle: "待确认", budget: "USD 156,000", usage: "社区诊所" },
      needs: ["产品参数", "FDA 认证", "数量待确认"],
      background: {
        site: "northwindmed.com",
        founded: "2014 年",
        size: "100-200 人",
        industry: "医疗服务",
        region: "美国 · 俄勒冈",
        trade: "近 12 个月进口 9 次",
        score: 76,
        risk: "未发现异常",
        insight: "社区诊所集团，处于需求了解阶段。"
      },
      whatsapp: [
        { from: "c", day: "7月22日 15:20", en: "Do you have FDA approval for the portable ultrasound?", zh: "便携超声仪有 FDA 认证吗？" },
        { from: "a", en: "Yes, our PU-20 series is FDA 510(k) cleared. I'll send you the spec sheet now.", zh: "有的，PU-20 系列已通过 FDA 510(k)，现在为您发送规格书。" }
      ],
      mails: [],
      tm: [],
      timeline: [{ time: "7月22日 15:20", text: "WhatsApp 询盘，智能销售接待中" }]
    },
    {
      id: "spam",
      name: "Liam Green",
      company: "未识别公司",
      country: "未知",
      avatar: "av-4",
      amount: 0,
      minutesAgo: 60,
      channels: ["tm"],
      tag: "",
      state: "blocked",
      compact: true,
      owner: "Linda",
      quoteVia: "wa",
      summary: "<b>检测到非目标客户询盘，</b>存在明显广告/推广特征，已自动拦截，未进入接待流程",
      suggestion: "无需跟进；如判断有误，可点击「恢复接待」交由智能销售继续接待",
      purchase: { product: "—", cycle: "—", budget: "—", usage: "—" },
      needs: [],
      background: { site: "growfast-seo.top", score: 96, insight: "" },
      screen: {
        email: "growfast.promo2026@gmail.com",
        emailNote: "免费邮箱 · 近 30 天群发 1,240 次",
        companyNote: "工商库未匹配到注册信息",
        siteNote: "注册仅 12 天的推广域名",
        prob: 96,
        reason: "询盘内容为 SEO 推广群发模板，不含采购产品、数量、预算等任何采购意向信息。",
        signals: ["含推广外链", "群发模板文案", "免费邮箱", "无产品/数量/预算", "1 小时内重复发送 3 次"]
      },
      whatsapp: [],
      mails: [],
      tm: [
        { from: "c", day: "今天 09:12", en: "Hi! We help businesses rank #1 on Google in 7 days. 10,000 backlinks only $99! Visit growfast-seo.top now!", zh: "你好！我们帮助企业 7 天内登上谷歌第一。10,000 条外链只需 99 美元！立即访问 growfast-seo.top！" },
        { from: "c", en: "Limited offer today only. Reply YES to get a free trial.", zh: "限时优惠仅限今天，回复 YES 即可免费试用。" },
        { from: "c", en: "Hi! We help businesses rank #1 on Google in 7 days...", zh: "你好！我们帮助企业 7 天内登上谷歌第一……" }
      ],
      timeline: [
        { time: "今天 09:12", text: "收到 TM 询盘" },
        { time: "今天 09:12", text: "AI 识别到推广外链与群发模板特征" },
        { time: "今天 09:12", text: "自动拦截，未进入接待流程" },
        { time: "今天 09:13", text: "已通知归属人 Linda，可随时恢复接待" }
      ]
    }
  ]
};
