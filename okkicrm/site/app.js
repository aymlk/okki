(() => {
  const { menu, funnel, customers } = window.CRM_DATA;
  const $ = (sel) => document.querySelector(sel);

  const icons = {
    star: '<path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4 7.2 18.9l.9-5.4-3.9-3.8 5.4-.8z" fill="currentColor"/>',
    desk: '<rect x="4" y="5" width="16" height="11" rx="2" fill="currentColor" stroke="none"/><path d="M9 20h6M12 16v4"/>',
    bot: '<circle cx="12" cy="12" r="8" fill="currentColor" stroke="none"/><path d="M8.5 11.5h7M9.5 14.5c1.5 1 3.5 1 5 0" stroke="#1f6bff"/>',
    spark: '<path d="M12 4v5M12 15v5M4 12h5M15 12h5"/><path d="M18 5l-2 2M8 17l-2 2"/>',
    mail: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="m4.5 7 7.5 6 7.5-6"/>',
    chat: '<path d="M5 6h10v7H9l-4 3z"/><path d="M15 9h4v8l-3-2h-5v-2"/>',
    lead: '<path d="M8 5h8v14l-4-3-4 3z"/>',
    users: '<circle cx="9" cy="9" r="3"/><circle cx="16" cy="10" r="2.5"/><path d="M3.5 18a5.5 5.5 0 0 1 11 0M14 15.5a4.5 4.5 0 0 1 6.5 2.5"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    search: '<circle cx="12" cy="10" r="5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
    doc: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 9h6M9 13h6M9 17h3"/>',
    chart: '<path d="M5 19V11M10 19V7M15 19v-5M20 19V5"/>',
    grid: '<rect x="5" y="5" width="5" height="5" rx="1"/><rect x="14" y="5" width="5" height="5" rx="1"/><rect x="5" y="14" width="5" height="5" rx="1"/><rect x="14" y="14" width="5" height="5" rx="1"/>'
  };
  const chIcons = {
    wa: '<path d="M6 18l1-3.2A6.5 6.5 0 1 1 9.4 17z"/><path d="M10 9.5c.3 1.8 1.6 3.2 3.5 3.8"/>',
    web: '<circle cx="12" cy="12" r="6"/><path d="M6 12h12M12 6c2 2 2 10 0 12M12 6c-2 2-2 10 0 12"/>',
    mail: '<rect x="6" y="8" width="12" height="9" rx="1.5"/><path d="m6.5 9 5.5 4 5.5-4"/>',
    tm: '<rect x="6.5" y="8" width="11" height="9" rx="3.5"/><path d="M12 8V6M10 12.3v.1M14 12.3v.1"/>'
  };
  const svg = (inner) => `<svg viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
  const userIcon = svg('<circle cx="12" cy="9" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>');
  const waIcon = svg(chIcons.wa);
  const mailIcon = svg(chIcons.mail);
  const flag = '<i class="flag" aria-hidden="true"></i>';

  const state = {
    selected: null,
    tab: "wa",
    onlyPending: false,
    sort: "recent",
    keyword: "",
    filter: "all",
    translate: true
  };

  const fmt = (n) => n.toLocaleString("en-US");
  const avatarHtml = (c, cls = "") =>
    c.avatar
      ? `<span class="avatar ${c.avatar} ${cls}"></span>`
      : `<span class="avatar initials ${cls}">${c.name.split(" ").map((p) => p[0]).join("")}</span>`;

  let toastTimer;
  function toast(text) {
    const el = $("#toast");
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
  }

  /* 菜单与漏斗 */
  $("#menu").innerHTML = menu
    .map(
      (m) => `<li class="${m.active ? "active" : ""}"><button type="button" data-menu="${m.key}" ${m.active ? 'aria-current="page"' : ""}>${svg(icons[m.icon])}<span>${m.label}</span></button></li>`
    )
    .join("");
  $("#menu").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn || btn.dataset.menu === "ai") return;
    toast(`「${btn.textContent.trim()}」模块不在本次复刻范围内`);
  });

  let activeStage = 2;
  function renderFunnel() {
    $("#funnel").innerHTML = funnel
      .map(
        (s, i) => `<button type="button" class="stage ${i === activeStage ? "active" : ""}" data-stage="${i}" aria-pressed="${i === activeStage}">
          <div class="label">${s.label}</div>
          <div class="num">${fmt(s.num)}</div>
          <div class="trend">今日 <b>↑ ${s.today}</b></div>
        </button>`
      )
      .join("");
  }
  $("#funnel").addEventListener("click", (e) => {
    const btn = e.target.closest(".stage");
    if (!btn) return;
    activeStage = Number(btn.dataset.stage);
    renderFunnel();
  });
  renderFunnel();

  /* 列表 */
  function channelChain(c) {
    return `<div class="chain">${c.channels
      .map((ch) => `<span class="ch ${ch}" title="${{ wa: "WhatsApp", web: "官网", mail: "邮件", tm: "TM" }[ch]}">${svg(chIcons[ch])}</span>`)
      .join("<span>→</span>")}</div>`;
  }

  function statusHtml(c) {
    if (c.state === "blocked") return `<div class="status"><span class="blocked-txt">已拦截</span></div>`;
    if (c.state === "taken") return `<div class="status"><span class="taken">人工已接手</span></div>`;
    if (c.state === "ai") return `<div class="status"><span class="tag" style="background:#1f6bff">AI 接待中</span></div>`;
    return `<div class="status">${c.tag ? `<span class="tag">${c.tag}</span>` : ""}<button type="button" class="to-human" data-act="human" data-id="${c.id}">转人工</button></div>`;
  }

  function visibleCustomers() {
    const kw = state.keyword.trim().toLowerCase();
    let list = customers.filter((c) => {
      if (state.onlyPending && c.state === "taken") return false;
      if (state.filter !== "all" && c.state !== state.filter) return false;
      if (!kw) return true;
      const type = $("#searchType").value;
      const fields = type === "name" ? [c.name] : type === "company" ? [c.company] : type === "owner" ? [c.owner] : [c.name, c.company, c.owner];
      return fields.some((f) => f.toLowerCase().includes(kw));
    });
    if (state.sort === "amount") list = [...list].sort((a, b) => b.amount - a.amount);
    else list = [...list].sort((a, b) => a.minutesAgo - b.minutesAgo);
    return list;
  }

  function renderCards() {
    const list = visibleCustomers();
    if (!list.length) {
      $("#cards").innerHTML = `<div class="empty"><b>没有符合条件的客户</b>试试清空关键字，或关闭“仅展示人工未接手”</div>`;
      return;
    }
    $("#cards").innerHTML = list
      .map((c) =>
        c.compact
          ? `<article class="card compact ${c.state === "blocked" ? "is-blocked" : ""} ${state.selected === c.id ? "selected" : ""}" data-id="${c.id}" tabindex="0" aria-label="查看 ${c.name} 接待详情">
        <div class="cp-top">
          <div class="who">${avatarHtml(c)}<div class="name">${c.name}</div></div>
          <div class="cp-ch">${channelChain(c)}<span class="since">1h 前 · 收到 TM 询盘</span></div>
          <div class="cp-side">${statusHtml(c)}<span class="owner pill">${userIcon}归属人: ${c.owner}</span></div>
        </div>
        <div class="cp-bottom">
          <div class="ai-line"><span class="k"><span class="spark">✦</span>概要</span><span class="v">${c.state === "blocked" ? c.summary : "<b>已恢复接待，</b>智能销售将继续跟进该询盘"}</span></div>
          ${c.state === "blocked" ? `<button type="button" class="btn-restore" data-act="restore" data-id="${c.id}">恢复接待</button>` : ""}
        </div>
      </article>`
          : `<article class="card ${state.selected === c.id ? "selected" : ""}" data-id="${c.id}" tabindex="0" aria-label="查看 ${c.name} 接待详情">
        <div class="card-top">
          <div class="who">${avatarHtml(c)}<div><div class="name">${c.name}</div><div class="company">${c.company} · ${flag} ${c.country}</div></div></div>
          <div class="amount">USD <b>${fmt(c.amount)}</b></div>
          <div class="channels">${channelChain(c)}<span class="since">${c.minutesAgo}分钟前有沟通</span></div>
        </div>
        <div class="side">
          ${statusHtml(c)}
          <span class="owner">${userIcon}归属人: ${c.owner}</span>
          <button type="button" class="btn-quote" data-act="quote" data-id="${c.id}">${c.quoteVia === "mail" ? mailIcon : waIcon}发报价</button>
        </div>
        <div class="ai-lines">
          <div class="ai-line"><span class="k"><span class="spark">✦</span>概要</span><span class="v">${c.summary}</span></div>
          <div class="ai-line"><span class="k"><span class="spark">✦</span>建议</span><span class="v">${c.suggestion}</span></div>
        </div>
      </article>`
      )
      .join("");
  }

  function handleAction(act, id) {
    const c = customers.find((x) => x.id === id);
    if (!c) return;
    if (act === "quote") {
      toast(`已生成报价单，正在通过${c.quoteVia === "mail" ? "邮件" : " WhatsApp "}发送给 ${c.name}`);
    } else if (act === "human") {
      c.state = "taken";
      funnel[3].num += 1;
      renderFunnel();
      toast(`已转交人工，${c.owner} 将接手跟进 ${c.name}`);
      renderCards();
      if (state.selected === id) renderDrawer();
    } else if (act === "restore") {
      c.state = "ai";
      c.summary = "<b>已恢复接待，</b>智能销售将继续跟进该询盘";
      c.suggestion = "建议先由智能销售确认对方是否存在真实采购需求";
      toast(`已恢复接待，智能销售将继续跟进 ${c.name}`);
      renderCards();
      if (state.selected === id) {
        if (state.bgTl) state.bgTl.kill();
        renderDrawer();
        // 恢复后直接展示「已恢复」，不重播旧的异常拦截判定。
        if (state.tab === "bg" && !c.compact) animateBg(c, { forceScan: true });
      }
    }
  }

  // 空闲告警只传递演示客户 ID，状态变更仍由原接待操作统一处理。
  document.addEventListener("crm:restore-reception", (e) => {
    const c = customers.find((x) => x.id === e.detail?.id);
    if (c?.state === "blocked") handleAction("restore", c.id);
  });

  document.addEventListener("crm:show-intercept", (e) => {
    const c = customers.find((x) => x.id === e.detail?.id);
    if (!c?.compact || c.state !== "blocked") return;
    $("#drawer").classList.add("intercept-preview");
    $("#mask").classList.add("intercept-scene");
    openDrawer(c.id, { tab: "bg", forceScan: true, focus: false });
    // 直接让核验区进入视野，不需要先滚过采购信息和摘要。
    const body = $("#drawerBody");
    const scan = body.querySelector(".bg-wrap");
    if (scan) body.scrollTop = scan.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 16;
  });
  document.addEventListener("crm:intercept-alert-closed", () => {
    $("#drawer").classList.remove("intercept-preview");
    $("#mask").classList.remove("intercept-scene");
  });

  $("#cards").addEventListener("click", (e) => {
    const actBtn = e.target.closest("[data-act]");
    if (actBtn) {
      e.stopPropagation();
      handleAction(actBtn.dataset.act, actBtn.dataset.id);
      return;
    }
    const card = e.target.closest(".card");
    if (card) openDrawer(card.dataset.id);
  });
  $("#cards").addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("card")) {
      e.preventDefault();
      openDrawer(e.target.dataset.id);
    }
  });

  /* 抽屉 */
  function msgHtml(m, c) {
    const mine = m.from !== "c";
    const av = mine ? `<span class="avatar ${m.from === "s" ? "av-6" : "av-5"}"></span>` : avatarHtml(c);
    const name = mine ? (m.from === "s" ? c.owner : "") : c.name;
    return `${m.day ? `<div class="day">${m.day}</div>` : ""}
      <div class="msg ${mine ? "me" : ""}">${av}<div>
        ${name ? `<div class="who-s">${name}</div>` : '<div class="who-s">&nbsp;</div>'}
        <div class="bubbles"><div class="bubble">${m.en}${state.translate ? `<div class="zh">${m.zh}</div>` : ""}
        ${m.from === "a" ? '<div class="by-ai">由智能销售发送</div>' : ""}</div></div>
      </div></div>`;
  }

  function chatPane(list, c, label) {
    if (!list.length) return `<div class="chat"><div class="day">暂无${label}沟通记录</div></div>`;
    return `<div class="chat"><button type="button" class="translate ${state.translate ? "on" : ""}" data-act-d="translate" title="显示/隐藏翻译" aria-label="切换翻译">译</button>${list.map((m) => msgHtml(m, c)).join("")}</div>`;
  }

  function mailPane(c) {
    if (!c.mails.length) return `<div class="chat"><div class="day">暂无邮件往来</div></div>`;
    return c.mails
      .map(
        (m) => `<div class="mail-item"><div class="subj"><span><span class="dir ${m.dir === "in" ? "in" : ""}">${m.dir === "in" ? "收" : "发"}</span>${m.subj}</span><time>${m.time}</time></div><p>${m.body}</p></div>`
      )
      .join("");
  }

  function bgPane(c) {
    if (c.compact) return blockedPane(c);
    const b = c.background;
    const ct = contactOf(c);
    const rows = [
      ["邮箱", ct.email],
      ["公司名称", c.company],
      ["公司官网", b.site]
    ];
    const check = svg('<path d="m6 12.5 4 4 8-9"/>');
    const cross = svg('<path d="M7 7l10 10M17 7 7 17"/>');
    return `<div class="bg-wrap">
      <div class="verify" aria-live="polite">
        <div class="scan-head"><span class="scan-orb" aria-hidden="true"><i></i></span>
          <div><b>AI 背调 · 信息核验</b><div class="scan-sub">核验完成 · 3/3 项已确认</div></div>
          <span class="scan-pct">100%</span>
          <button type="button" class="rescan" data-act-d="rescan" title="重新背调" aria-label="重新背调">${svg('<path d="M19 12a7 7 0 1 1-2.05-4.95M19 4v4h-4"/>')}</button></div>
        <div class="scan-bar"><i></i></div>
        <div class="v-rows">${rows
          .map(
            ([k, v]) => `<div class="v-row"><span class="v-k">${k}</span><span class="v-val">${v}</span>
              <span class="v-state" aria-label="已核验"><i class="v-spin" aria-hidden="true"></i><span class="v-ok">${check}</span></span></div>`
          )
          .join("")}</div>
        <div class="scan-beam" aria-hidden="true"></div>
      </div>
      <div class="persona">
        <h4>联系人画像</h4>
        <div class="p-top">${avatarHtml(c, "p-avatar")}
          <div class="p-grid">
            ${[["姓名", ct.name], ["邮箱", ct.email], ["电话", ct.phone], ["职位", ct.title]]
              .map(([k, v]) => `<div class="p-field"><span>${k}</span><b class="type" data-text="${v}">${v}</b></div>`)
              .join("")}
          </div>
        </div>
        <div class="p-ch" aria-label="可触达渠道">
          ${ct.channels
            .map(
              (ch) => `<span class="pc ${ch.ok ? "ok" : "no"}" title="${ch.label}${ch.ok ? " 可触达" : " 未找到"}">
                <span class="pc-ic">${svg(socialIcons[ch.key])}</span>
                <span class="pc-badge">${ch.ok ? check : cross}</span><em>${ch.label}</em></span>`
            )
            .join("")}
        </div>
      </div>
      <div class="bg-result">
      <div class="score"><div class="ring" style="--p:${b.score}"><span class="ring-num">${b.score}</span></div>
        <div><b>AI 背调评分 <span class="score-lv">${b.score >= 85 ? "优质客户" : b.score >= 75 ? "值得跟进" : "需谨慎"}</span></b><div class="insight">${b.insight}</div></div></div>
      <div class="bg-section"><h4>企业背景</h4><div class="bg-grid">
        <div class="bg-cell"><span>成立时间</span><b>${b.founded}</b></div>
        <div class="bg-cell"><span>公司规模</span><b>${b.size}</b></div>
        <div class="bg-cell"><span>所属行业</span><b>${b.industry}</b></div>
        <div class="bg-cell"><span>所在地区</span><b>${b.region}</b></div>
        <div class="bg-cell"><span>贸易记录</span><b>${b.trade}</b></div>
        <div class="bg-cell"><span>风险提示</span><b>${b.risk}</b></div>
      </div></div>
      <div class="bg-section"><h4>客户需求</h4><div class="need-list">${c.needs.map((n) => `<span class="need">${n}</span>`).join("")}</div></div>
      <div class="bg-section"><h4>沟通时间线</h4><ul class="timeline"><span class="tl-line" aria-hidden="true"></span>${c.timeline.map((t) => `<li><time>${t.time}</time>${t.text}</li>`).join("")}</ul></div>
      </div></div>`;
  }

  const socialIcons = {
    wa: chIcons.wa,
    mail: chIcons.mail,
    phone: '<path d="M7 4.5h3l1.5 4-2 1.3a9 9 0 0 0 4.7 4.7l1.3-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 5 6.5a2 2 0 0 1 2-2z"/>',
    linkedin: '<rect x="4.5" y="4.5" width="15" height="15" rx="3"/><path d="M8.5 10.5v5M8.5 8v.1M11.5 15.5v-5M11.5 12.5c0-1.2 1-2 2-2s2 .8 2 2v3"/>',
    facebook: '<path d="M13.5 20v-7h2.5l.5-3h-3V8.5c0-.9.4-1.5 1.6-1.5H16.6V4.4A18 18 0 0 0 14.3 4.2C12 4.2 10.5 5.6 10.5 8v2H8v3h2.5v7"/>',
    instagram: '<rect x="4.5" y="4.5" width="15" height="15" rx="4.5"/><circle cx="12" cy="12" r="3.5"/><path d="M16.5 7.5v.1"/>'
  };

  function contactOf(c) {
    const base = (window.CRM_DATA.contacts || {})[c.id] || {};
    const first = c.name.split(" ")[0].toLowerCase();
    return {
      name: c.name,
      email: base.email || `${first}@${c.background.site}`,
      phone: base.phone || "+1 415 000 0000",
      title: base.title || "采购负责人",
      channels: base.channels || [
        { key: "wa", label: "WhatsApp", ok: true },
        { key: "mail", label: "邮箱", ok: true },
        { key: "phone", label: "电话", ok: true },
        { key: "linkedin", label: "LinkedIn", ok: false },
        { key: "facebook", label: "Facebook", ok: false },
        { key: "instagram", label: "Instagram", ok: false }
      ]
    };
  }

  /* AI 背调动画：核验三项逐个变绿 → 联系人画像补全 → 渠道打勾/打叉 → 背调结果 */
  const scanned = new Set();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function animateBg(c, { forceScan = false } = {}) {
    if (state.bgTl) state.bgTl.kill();
    const root = $("#drawerBody .bg-wrap");
    if (!root || !window.gsap || !c) return;
    // 默认 HTML 即最终态；只有首次打开或点「重新背调」才播放
    if (reduceMotion.matches || (!forceScan && scanned.has(c.id))) {
      scanned.add(c.id);
      return;
    }
    scanned.add(c.id);

    const q = (sel) => root.querySelectorAll(sel);
    if (c.compact) {
      animateBlocked(root, c);
      return;
    }
    const one = (sel) => root.querySelector(sel);
    const pct = one(".scan-pct");
    const sub = one(".scan-sub");
    const rows = [...q(".v-row")];
    const ring = one(".ring");
    const num = one(".ring-num");
    const score = c.background.score;
    const GREEN_BG = "#eafaf1";
    const GREEN_LINE = "#bfeacf";

    sub.textContent = `正在核验 ${c.company} 的客户信息…`;
    pct.textContent = "0%";
    gsap.set(rows, { backgroundColor: "#f7f8fb", borderColor: "#eceff4", autoAlpha: 0.45 });
    gsap.set(q(".v-val"), { color: "#9aa2b1" });
    gsap.set(q(".v-ok"), { scale: 0, autoAlpha: 0 });
    gsap.set(q(".v-spin"), { autoAlpha: 0 });
    q(".type").forEach((el) => (el.textContent = "—"));
    gsap.set([one(".persona"), one(".bg-result")], { autoAlpha: 0, y: 14 });
    gsap.set(q(".pc"), { autoAlpha: 0, scale: 0.4 });
    gsap.set(q(".pc-badge"), { scale: 0 });

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    state.bgTl = tl;
    const counter = { v: 0 };

    tl.from(one(".verify"), { autoAlpha: 0, y: 12, duration: 0.3 })
      .to(q(".scan-orb i"), { rotation: 720, duration: 2.6, ease: "none" }, 0)
      .fromTo(q(".scan-beam"), { yPercent: -100 }, { yPercent: 260, duration: 1.2, ease: "sine.inOut", repeat: 1 }, 0.1)
      .fromTo(q(".scan-bar i"), { scaleX: 0 }, { scaleX: 1, duration: 2.1, ease: "none" }, 0.2)
      .to(counter, { v: 100, duration: 2.1, ease: "none", onUpdate: () => (pct.textContent = `${Math.round(counter.v)}%`) }, 0.2);

    // 邮箱 → 公司名称 → 公司官网：一项一项打勾变绿
    rows.forEach((row, i) => {
      const at = 0.3 + i * 0.7;
      const spin = row.querySelector(".v-spin");
      tl.to(row, { autoAlpha: 1, duration: 0.2 }, at)
        .to(spin, { autoAlpha: 1, duration: 0.15 }, at)
        .fromTo(spin, { rotation: 0 }, { rotation: 360, duration: 0.5, ease: "none" }, at)
        .to(spin, { autoAlpha: 0, duration: 0.1 }, at + 0.5)
        .to(row.querySelector(".v-ok"), { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(3)" }, at + 0.5)
        .to(row, { backgroundColor: GREEN_BG, borderColor: GREEN_LINE, duration: 0.3 }, at + 0.5)
        .to(row.querySelector(".v-val"), { color: "#12a15c", duration: 0.3 }, at + 0.5)
        .fromTo(row, { scale: 1 }, { scale: 1.02, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" }, at + 0.5);
    });
    tl.call(() => (sub.textContent = "核验完成 · 3/3 项已确认"), null, 2.35);

    // 联系人画像：姓名、邮箱、电话、职位逐个补全
    tl.to(one(".persona"), { autoAlpha: 1, y: 0, duration: 0.4 }, 2.4);
    q(".type").forEach((el, i) => {
      const text = el.dataset.text;
      const prog = { n: 0 };
      tl.to(prog, {
        n: text.length,
        duration: Math.min(0.7, 0.2 + text.length * 0.025),
        ease: "none",
        onStart: () => el.classList.add("typing"),
        onUpdate: () => (el.textContent = text.slice(0, Math.round(prog.n)) || "—"),
        onComplete: () => el.classList.remove("typing")
      }, 2.65 + i * 0.35);
    });

    // 渠道图标：先依次出现，再逐个打勾/打叉
    tl.to(q(".pc"), { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(2)", stagger: 0.07 }, 3.9);
    q(".pc").forEach((pc, i) => {
      const ok = pc.classList.contains("ok");
      tl.to(pc.querySelector(".pc-badge"), { scale: 1, duration: 0.35, ease: ok ? "back.out(3)" : "elastic.out(1, 0.45)" }, 4.35 + i * 0.16);
      if (!ok) tl.fromTo(pc.querySelector(".pc-ic"), { x: 0 }, { x: 3, duration: 0.06, repeat: 3, yoyo: true, ease: "power1.inOut" }, 4.35 + i * 0.16);
    });

    // 背调结果
    const ringState = { p: 0 };
    tl.addLabel("reveal", 5.4)
      .to(one(".bg-result"), { autoAlpha: 1, y: 0, duration: 0.4 }, "reveal")
      .to(ringState, {
        p: score,
        duration: 1.1,
        ease: "power3.out",
        onUpdate: () => {
          ring.style.setProperty("--p", ringState.p);
          num.textContent = Math.round(ringState.p);
        }
      }, "reveal+=0.1")
      .from(ring, { scale: 0.6, rotation: -90, duration: 0.7, ease: "back.out(1.8)" }, "reveal+=0.05")
      .from(q(".score-lv"), { autoAlpha: 0, x: -8, duration: 0.3 }, "reveal+=0.8")
      .from(q(".bg-result .bg-cell"), { autoAlpha: 0, y: 14, duration: 0.35, stagger: 0.05 }, "reveal+=0.3")
      .from(q(".need"), { autoAlpha: 0, scale: 0.4, duration: 0.45, ease: "back.out(2.2)", stagger: 0.06 }, "reveal+=0.6")
      .from(q(".tl-line"), { scaleY: 0, transformOrigin: "top center", duration: 0.7, ease: "power2.inOut" }, "reveal+=0.75")
      .from(q(".timeline li"), { autoAlpha: 0, x: 14, duration: 0.35, stagger: 0.12 }, "reveal+=0.8");
  }

  /* 被拦截接待：询盘甄别面板 */
  function blockedPane(c) {
    const s = c.screen;
    const blocked = c.state === "blocked";
    const cross = svg('<path d="M7 7l10 10M17 7 7 17"/>');
    const warn = svg('<path d="M12 4 21 19H3z"/><path d="M12 10v4M12 16.5v.1"/>');
    const rows = [
      ["邮箱", s.email, s.emailNote],
      ["公司名称", "未找到", s.companyNote],
      ["公司官网", c.background.site, s.siteNote]
    ];
    return `<div class="bg-wrap">
      <div class="verify danger" aria-live="polite">
        <div class="scan-head"><span class="scan-orb" aria-hidden="true"><i></i></span>
          <div><b>AI 背调 · 询盘甄别</b><div class="scan-sub">判定为非目标客户 · 3/3 项异常</div></div>
          <span class="scan-pct">100%</span>
          <button type="button" class="rescan" data-act-d="rescan" title="重新甄别" aria-label="重新背调">${svg('<path d="M19 12a7 7 0 1 1-2.05-4.95M19 4v4h-4"/>')}</button></div>
        <div class="scan-bar"><i></i></div>
        <div class="v-rows">${rows
          .map(
            ([k, v, note]) => `<div class="v-row bad"><span class="v-k">${k}</span><span class="v-val">${v}<small>${note}</small></span>
              <span class="v-state" aria-label="异常"><i class="v-spin" aria-hidden="true"></i><span class="v-no">${cross}</span></span></div>`
          )
          .join("")}</div>
        <div class="scan-beam" aria-hidden="true"></div>
      </div>
      <div class="intercept">
        <div class="ic-head">
          <div class="ring danger" style="--p:${s.prob}"><span class="ring-num">${s.prob}</span></div>
          <div class="ic-text"><b>广告 / 推广概率 ${s.prob}%</b><div class="insight">${s.reason}</div></div>
          <span class="stamp ${blocked ? "" : "restored"}" aria-label="${blocked ? "已拦截" : "已恢复接待"}">${blocked ? "已拦截" : "已恢复"}</span>
        </div>
        <h4>命中特征</h4>
        <div class="sig-list">${s.signals.map((x) => `<span class="sig">${warn}${x}</span>`).join("")}</div>
        <h4>处理过程</h4>
        <div class="flow">${c.timeline
          .map((t, i) => `<div class="flow-step ${i === 2 ? "hit" : ""}"><span class="flow-dot">${i + 1}</span><div><b>${t.text}</b><time>${t.time}</time></div></div>`)
          .join("")}</div>
        ${blocked ? `<div class="restore-tip"><span>如判断有误，可恢复接待，交由智能销售继续跟进</span><button type="button" class="btn-restore" data-act="restore" data-id="${c.id}">恢复接待</button></div>` : `<div class="restore-tip ok"><span>已恢复接待，智能销售正在跟进该询盘</span></div>`}
      </div>
    </div>`;
  }

  function animateBlocked(root, c) {
    const q = (sel) => root.querySelectorAll(sel);
    const one = (sel) => root.querySelector(sel);
    const rows = [...q(".v-row")];
    const pct = one(".scan-pct");
    const sub = one(".scan-sub");
    const ring = one(".ring");
    const num = one(".ring-num");
    const stamp = one(".stamp");
    const prob = c.screen.prob;
    const RED_BG = "#fff1f0";
    const RED_LINE = "#ffccc7";

    sub.textContent = "正在甄别询盘来源与内容…";
    pct.textContent = "0%";
    gsap.set(rows, { backgroundColor: "#f7f8fb", borderColor: "#eceff4", autoAlpha: 0.45 });
    gsap.set(q(".v-val"), { color: "#9aa2b1" });
    gsap.set(q(".v-val small"), { autoAlpha: 0, y: -4 });
    gsap.set(q(".v-no"), { scale: 0, autoAlpha: 0 });
    gsap.set(q(".v-spin"), { autoAlpha: 0 });
    gsap.set(one(".intercept"), { autoAlpha: 0, y: 14 });
    gsap.set(stamp, { autoAlpha: 0 });
    gsap.set(q(".sig"), { autoAlpha: 0, scale: 0.5 });
    gsap.set(q(".flow-step"), { autoAlpha: 0, x: 16 });
    gsap.set(q(".restore-tip"), { autoAlpha: 0, y: 8 });
    ring.style.setProperty("--p", 0);
    num.textContent = "0";

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    state.bgTl = tl;
    const counter = { v: 0 };

    tl.from(one(".verify"), { autoAlpha: 0, y: 12, duration: 0.3 })
      .to(q(".scan-orb i"), { rotation: 720, duration: 2.6, ease: "none" }, 0)
      .fromTo(q(".scan-beam"), { yPercent: -100 }, { yPercent: 260, duration: 1.2, ease: "sine.inOut", repeat: 1 }, 0.1)
      .fromTo(q(".scan-bar i"), { scaleX: 0 }, { scaleX: 1, duration: 2.1, ease: "none" }, 0.2)
      .to(counter, { v: 100, duration: 2.1, ease: "none", onUpdate: () => (pct.textContent = `${Math.round(counter.v)}%`) }, 0.2);

    // 邮箱 → 公司名称 → 公司官网：逐项打叉变红并抖动
    rows.forEach((row, i) => {
      const at = 0.3 + i * 0.7;
      const spin = row.querySelector(".v-spin");
      tl.to(row, { autoAlpha: 1, duration: 0.2 }, at)
        .to(spin, { autoAlpha: 1, duration: 0.15 }, at)
        .fromTo(spin, { rotation: 0 }, { rotation: 360, duration: 0.5, ease: "none" }, at)
        .to(spin, { autoAlpha: 0, duration: 0.1 }, at + 0.5)
        .to(row.querySelector(".v-no"), { scale: 1, autoAlpha: 1, duration: 0.5, ease: "elastic.out(1, 0.45)" }, at + 0.5)
        .to(row, { backgroundColor: RED_BG, borderColor: RED_LINE, duration: 0.25 }, at + 0.5)
        .to(row.querySelector(".v-val"), { color: "#e5484d", duration: 0.25 }, at + 0.5)
        .to(row.querySelector(".v-val small"), { autoAlpha: 1, y: 0, duration: 0.3 }, at + 0.55)
        .fromTo(row, { x: 0 }, { x: 5, duration: 0.05, repeat: 5, yoyo: true, ease: "power1.inOut" }, at + 0.5);
    });
    tl.call(() => (sub.textContent = "判定为非目标客户 · 3/3 项异常"), null, 2.35)
      .to(one(".verify .scan-orb"), { boxShadow: "0 0 0 6px rgba(229,72,77,.18)", duration: 0.3, repeat: 1, yoyo: true }, 2.35);

    // 拦截判定：概率环 → 命中特征 → 盖章「已拦截」→ 处理过程
    const r = { p: 0 };
    tl.to(one(".intercept"), { autoAlpha: 1, y: 0, duration: 0.4 }, 2.5)
      .to(r, {
        p: prob,
        duration: 1,
        ease: "power3.out",
        onUpdate: () => {
          ring.style.setProperty("--p", r.p);
          num.textContent = Math.round(r.p);
        }
      }, 2.6)
      .from(ring, { scale: 0.6, rotation: -90, duration: 0.6, ease: "back.out(1.8)" }, 2.6)
      .to(q(".sig"), { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(2.4)", stagger: 0.1 }, 3.0)
      .fromTo(q(".sig svg"), { rotation: -15 }, { rotation: 15, duration: 0.08, repeat: 3, yoyo: true, stagger: 0.1, ease: "power1.inOut", clearProps: "transform" }, 3.1)
      .fromTo(stamp, { autoAlpha: 0, scale: 2.8, rotation: -30 }, { autoAlpha: 1, scale: 1, rotation: -12, duration: 0.45, ease: "back.out(1.6)" }, 3.75)
      .fromTo(one(".intercept"), { x: 0 }, { x: 3, duration: 0.05, repeat: 3, yoyo: true, ease: "power1.inOut" }, 4.15)
      .to(q(".flow-step"), { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.18 }, 4.2)
      .fromTo(one(".flow-step.hit .flow-dot"), { scale: 1 }, { scale: 1.35, duration: 0.2, yoyo: true, repeat: 1, ease: "power1.inOut" }, 4.75)
      .to(q(".restore-tip"), { autoAlpha: 1, y: 0, duration: 0.35 }, 5.0);
  }

  function renderDrawer() {
    const c = customers.find((x) => x.id === state.selected);
    if (!c) return;
    const p = c.purchase;
    const panes = {
      wa: () => chatPane(c.whatsapp, c, " WhatsApp "),
      mail: () => mailPane(c),
      tm: () => chatPane(c.tm, c, " TM "),
      bg: () => bgPane(c)
    };
    $("#drawerBody").innerHTML = `
      <div class="d-cust" data-customer-id="${c.id}">${avatarHtml(c)}
        <div class="meta"><div class="name">${c.name}</div>
          <div class="company">${c.compact ? `${c.company}<span class="reply">${svg(chIcons.tm)}1h 前收到 TM 询盘</span>` : `${c.company} · ${flag} ${c.country}<span class="reply">${waIcon}${c.minutesAgo}分钟前回复</span>`}</div></div>
        <div class="right">${statusHtml(c)}<span>归属人: ${c.owner}</span></div>
      </div>
      <div class="panel">
        <div class="kv">
          <div><span>采购产品</span>${p.product}</div><div><span>预算金额</span>${p.budget}</div>
          <div><span>采购周期</span>${p.cycle}</div><div><span>采购用途</span>${p.usage}</div>
        </div>
        <div class="ai-line"><span class="k"><span class="spark">✦</span>概要</span><span class="v">${c.summary}</span></div>
        <div class="suggest-row"><span class="k" style="color:var(--sub)"><span class="spark">✦</span> 建议</span><span class="v" style="font-weight:500">${c.suggestion}</span>
          ${c.compact
            ? c.state === "blocked" ? `<button type="button" class="btn-restore" data-act="restore" data-id="${c.id}">恢复接待</button>` : ""
            : `<button type="button" class="btn-quote" data-act="quote" data-id="${c.id}">${c.quoteVia === "mail" ? mailIcon : waIcon}发报价</button>`}</div>
      </div>
      <div class="panel">
        <div class="tabs" role="tablist">
          ${[["wa", "WhatsApp"], ["mail", "邮件"], ["tm", "TM"], ["bg", "AI背调"]]
            .map(([k, l]) => `<button type="button" role="tab" class="tab ${state.tab === k ? "active" : ""}" aria-selected="${state.tab === k}" data-tab="${k}">${l}</button>`)
            .join("")}
        </div>
        <div class="tab-pane" role="tabpanel">${panes[state.tab]()}</div>
      </div>`;
  }

  function openDrawer(id, { tab, forceScan = false, focus = true } = {}) {
    const changed = state.selected !== id;
    state.selected = id;
    if (tab) state.tab = tab;
    else if (changed) state.tab = customers.find((x) => x.id === id)?.compact ? "bg" : "wa";
    renderCards();
    renderDrawer();
    if (state.tab === "bg") animateBg(customers.find((x) => x.id === id), { forceScan });
    const mask = $("#mask");
    mask.hidden = false;
    requestAnimationFrame(() => {
      mask.classList.add("show");
      $("#drawer").classList.add("open");
    });
    $("#drawer").setAttribute("aria-hidden", "false");
    $("#drawerBody").scrollTop = 0;
    if (focus) $("#closeDrawer").focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent("crm:reception-opened", { detail: { id } }));
  }

  function closeDrawer() {
    document.dispatchEvent(new CustomEvent("crm:dismiss-intercept-alert"));
    document.dispatchEvent(new CustomEvent("crm:reception-closed"));
    if (state.bgTl) state.bgTl.kill();
    $("#drawer").classList.remove("intercept-preview");
    $("#mask").classList.remove("intercept-scene");
    $("#drawer").classList.remove("open");
    $("#drawer").setAttribute("aria-hidden", "true");
    $("#mask").classList.remove("show");
    setTimeout(() => ($("#mask").hidden = true), 250);
    const card = document.querySelector(`.card[data-id="${state.selected}"]`);
    if (card) card.focus({ preventScroll: true });
  }

  $("#drawerBody").addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (tab) {
      state.tab = tab.dataset.tab;
      renderDrawer();
      if (state.tab === "bg") animateBg(customers.find((x) => x.id === state.selected));
      return;
    }
    if (e.target.closest('[data-act-d="translate"]')) {
      state.translate = !state.translate;
      renderDrawer();
      return;
    }
    if (e.target.closest('[data-act-d="rescan"]')) {
      const c = customers.find((x) => x.id === state.selected);
      renderDrawer();
      animateBg(c, { forceScan: true });
      return;
    }
    const act = e.target.closest("[data-act]");
    if (act) handleAction(act.dataset.act, act.dataset.id);
  });
  $("#closeDrawer").addEventListener("click", closeDrawer);
  $("#mask").addEventListener("click", closeDrawer);
  $("#customerDetail").addEventListener("click", () => {
    state.tab = "bg";
    renderDrawer();
    animateBg(customers.find((x) => x.id === state.selected));
  });

  /* 工具栏 */
  $("#onlyPending").addEventListener("change", (e) => {
    state.onlyPending = e.target.checked;
    renderCards();
  });
  $("#sortBy").addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderCards();
  });
  $("#listSearchBtn").addEventListener("click", () => {
    const wrap = $("#listSearchWrap");
    wrap.classList.toggle("open");
    if (wrap.classList.contains("open")) $("#listKeyword").focus();
  });
  $("#listKeyword").addEventListener("input", (e) => {
    state.keyword = e.target.value;
    $("#topKeyword").value = e.target.value;
    renderCards();
  });
  $("#topSearch").addEventListener("submit", (e) => {
    e.preventDefault();
    state.keyword = $("#topKeyword").value;
    $("#listKeyword").value = state.keyword;
    if (state.keyword) $("#listSearchWrap").classList.add("open");
    renderCards();
  });
  $("#topKeyword").addEventListener("input", (e) => {
    if (!e.target.value) {
      state.keyword = "";
      $("#listKeyword").value = "";
      renderCards();
    }
  });

  const filters = [["all", "全部"], ["pending", "待人工接手"], ["taken", "人工已接手"], ["ai", "AI 接待中"], ["blocked", "已拦截"]];
  function renderChips() {
    $("#filterChips").innerHTML = filters
      .map(([k, l]) => `<button type="button" class="chip ${state.filter === k ? "on" : ""}" data-filter="${k}">${l}</button>`)
      .join("");
  }
  $("#filterBtn").addEventListener("click", () => {
    const chips = $("#filterChips");
    chips.hidden = !chips.hidden;
    $("#filterBtn").classList.toggle("on", !chips.hidden);
    renderChips();
  });
  $("#filterChips").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-filter]");
    if (!chip) return;
    state.filter = chip.dataset.filter;
    renderChips();
    renderCards();
  });

  /* 设置 */
  const settings = $("#settings");
  $("#openSettings").addEventListener("click", () => {
    settings.hidden = false;
    settings.querySelector(".modal").focus?.();
  });
  settings.addEventListener("click", (e) => {
    if (e.target === settings || e.target.closest("[data-close-settings]")) settings.hidden = true;
    const seg = e.target.closest(".seg button");
    if (seg) {
      seg.parentElement.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === seg));
    }
  });
  $("#saveSettings").addEventListener("click", () => {
    settings.hidden = true;
    toast("配置已保存，新的接待规则将立即生效");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!settings.hidden) settings.hidden = true;
    else if ($("#drawer").classList.contains("open")) closeDrawer();
  });

  renderCards();
})();
