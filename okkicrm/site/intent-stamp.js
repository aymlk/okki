// 本地演示：只为有明确 deliveryIntent 标记的正常采购客户播放盖章。
(() => {
  const drawer = document.querySelector('#drawer');
  const body = document.querySelector('#drawerBody');
  if (!drawer || !body) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timeline = null;
  let verdict = null;
  let customerId = null;
  let wasOpen = drawer.classList.contains('open');

  const escape = (value) => String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  function stop() {
    if (timeline) timeline.kill();
    timeline = null;
  }

  function settle(root) {
    if (!root) return;
    root.dataset.phase = 'settled';
    root.querySelector('.intent-status').textContent = '已识别明确采购需求 · 本地演示';
    if (window.gsap) {
      gsap.set(root.querySelectorAll('.intent-signal'), { clearProps: 'all' });
      gsap.set(root.querySelector('.intent-stamp'), { clearProps: 'all' });
      gsap.set(root.querySelector('.intent-impact'), { clearProps: 'all' });
      gsap.set(root, { clearProps: 'transform' });
    }
  }

  function play(root = verdict) {
    stop();
    if (!root?.isConnected) return;
    settle(root);
    if (motion.matches || !window.gsap) return;
    const signals = root.querySelectorAll('.intent-signal');
    const stamp = root.querySelector('.intent-stamp');
    const impact = root.querySelector('.intent-impact');
    const status = root.querySelector('.intent-status');
    root.dataset.phase = 'checking';
    status.textContent = '正在识别采购意向…';
    gsap.set(signals, { opacity: 0.32, y: 5 });
    gsap.set(stamp, { autoAlpha: 0, scale: 2.4, rotation: -24, y: -22 });
    gsap.set(impact, { autoAlpha: 0, scale: 0.65 });
    timeline = gsap.timeline({ onComplete: () => settle(root) });
    timeline.to(signals, { opacity: 1, y: 0, duration: 0.25, stagger: 0.16, ease: 'power2.out' }, 0.16)
      .call(() => { root.dataset.phase = 'stamping'; status.textContent = '采购需求明确，正在确认意向…'; }, null, 0.78)
      .to(stamp, { autoAlpha: 1, scale: 0.9, rotation: -9, y: 0, duration: 0.32, ease: 'power3.in' }, 0.84)
      .to(stamp, { scale: 1, duration: 0.28, ease: 'back.out(2)' }, 1.16)
      .fromTo(impact, { autoAlpha: 0.55, scale: 0.65 }, { autoAlpha: 0, scale: 1.32, duration: 0.6, ease: 'power2.out' }, 1.12)
      .fromTo(root, { x: 0 }, { x: 2, duration: 0.045, repeat: 3, yoyo: true, ease: 'power1.inOut' }, 1.14);
  }

  function mount() {
    const id = body.querySelector('.d-cust')?.dataset.customerId;
    const c = window.CRM_DATA?.customers.find((item) => item.id === id);
    const panel = body.querySelector('.d-cust + .panel');
    const changed = customerId !== id;
    stop();
    verdict = null;
    customerId = id || null;
    if (!panel || !c || c.compact || c.state === 'blocked' || c.deliveryIntent?.level !== 'high') return;
    const intent = c.deliveryIntent;
    verdict = document.createElement('section');
    verdict.className = 'intent-verdict';
    verdict.dataset.customerId = c.id;
    verdict.dataset.phase = 'settled';
    verdict.setAttribute('aria-label', '高交付意向判定');
    verdict.innerHTML = `<div class="intent-copy">
      <div class="intent-heading"><span class="intent-eyebrow">AI 意向识别</span>
        <button class="intent-replay" type="button" aria-label="重播高交付意向盖章" title="重播盖章"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.05-4.95M19 4v4h-4"/></svg></button></div>
      <p class="intent-reason">${escape(intent.reason)}</p>
      <div class="intent-signals">${intent.signals.map((signal) => `<span class="intent-signal"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 4 4 8-9"/></svg>${escape(signal)}</span>`).join('')}</div>
      <p class="intent-status" role="status" aria-live="polite">已识别明确采购需求 · 本地演示</p>
    </div><div class="intent-stage" aria-label="${escape(intent.label)}">
      <span class="intent-impact" aria-hidden="true"></span>
      <div class="intent-stamp"><span class="intent-stamp-top">AI · 采购意向</span><strong>${escape(intent.label)}</strong><span class="intent-stamp-bottom">优先跟进</span></div>
    </div>`;
    panel.append(verdict);
    if (wasOpen && changed) play();
  }

  // 只观察抽屉直接子节点的替换；盖章自身的动画不会递归触发挂载。
  new MutationObserver(mount).observe(body, { childList: true });
  new MutationObserver(() => {
    const open = drawer.classList.contains('open');
    if (open && !wasOpen) play();
    if (!open && wasOpen) { stop(); settle(verdict); }
    wasOpen = open;
  }).observe(drawer, { attributes: true, attributeFilter: ['class'] });
  body.addEventListener('click', (event) => {
    if (event.target.closest('.intent-replay')) play();
  });
  motion.addEventListener('change', () => { if (motion.matches) { stop(); settle(verdict); } });
  mount();
})();
