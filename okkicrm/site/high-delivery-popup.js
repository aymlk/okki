// 本地演示：打开高交付意向采购客户详情 3 秒后，显示带水印的摘要弹窗。
(() => {
  const drawer = document.querySelector('#drawer');
  const drawerBody = document.querySelector('#drawerBody');
  if (!drawer || !drawerBody) return;
  const DELAY_MS = 3000;
  const dialog = document.createElement('dialog');
  dialog.id = 'highDeliveryDialog';
  dialog.className = 'high-delivery-dialog';
  dialog.setAttribute('aria-labelledby', 'highDeliveryTitle');
  dialog.setAttribute('aria-modal', 'true');
  dialog.innerHTML = `<header class="hdp-header">
    <h2 id="highDeliveryTitle">接待详情</h2>
    <button class="link-btn" type="button" data-hdp-detail><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="8" r="3.5"/><path d="M3.5 19a6.5 6.5 0 0 1 13 0M17 11h4M19 9v4"/></svg>客户详情</button>
    <button class="icon-btn" type="button" data-hdp-close aria-label="关闭采购详情弹窗" autofocus><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
  </header><div class="hdp-body"></div>`;
  document.body.append(dialog);
  let timer = null;
  let activeId = null;

  function cancelTimer() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function close() {
    if (dialog.open) dialog.close();
    activeId = null;
  }

  function eligible(id) {
    const c = window.CRM_DATA?.customers.find((item) => item.id === id);
    return c && !c.compact && c.state !== 'blocked' && c.deliveryIntent?.level === 'high';
  }

  function show(id, started) {
    const customer = drawerBody.querySelector('.d-cust');
    const summary = customer?.nextElementSibling;
    if (!customer || customer.dataset.customerId !== id || !summary?.classList.contains('panel')) return;
    const copyCustomer = customer.cloneNode(true);
    const copySummary = summary.cloneNode(true);
    copySummary.classList.add('hdp-summary');
    // 不复制聊天标签或旧意向识别区，不产生重复元素 ID。
    for (const copy of [copyCustomer, copySummary]) {
      copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
      copy.querySelectorAll('.intent-verdict').forEach((node) => node.remove());
    }
    const watermark = document.createElement('span');
    watermark.className = 'hdp-watermark';
    watermark.textContent = '交付高意向客户';
    watermark.setAttribute('aria-label', '交付高意向客户水印');
    copySummary.querySelector('.kv').append(watermark);
    dialog.querySelector('.hdp-body').replaceChildren(copyCustomer, copySummary);
    activeId = id;
    dialog.dataset.customerId = id;
    dialog.dataset.openedAfterMs = String(Math.round(performance.now() - started));
    dialog.showModal();
  }

  document.addEventListener('crm:reception-opened', (event) => {
    cancelTimer();
    close();
    const id = event.detail?.id;
    if (!eligible(id)) return;
    const started = performance.now();
    dialog.dataset.delayMs = String(DELAY_MS);
    dialog.dataset.armedAt = String(started);
    timer = setTimeout(() => {
      timer = null;
      const selected = drawerBody.querySelector('.d-cust')?.dataset.customerId;
      const settingsOpen = document.querySelector('#settings')?.hidden === false;
      if (document.hidden || !drawer.classList.contains('open') || selected !== id || !eligible(id) || settingsOpen || document.querySelector('dialog[open]')) return;
      show(id, started);
    }, DELAY_MS);
  });
  document.addEventListener('crm:reception-closed', () => { cancelTimer(); close(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelTimer(); close(); }
  });

  dialog.addEventListener('click', (event) => {
    if (event.target.closest('[data-hdp-close]')) { close(); return; }
    if (event.target.closest('[data-hdp-detail]')) {
      close();
      document.querySelector('#customerDetail')?.click();
      return;
    }
    const button = event.target.closest('[data-act]');
    if (button) {
      // 复用原详情按钮的处理，不重复实现接待或报价，也不连接真实后台。
      const source = Array.from(drawerBody.querySelectorAll('[data-act]')).find((node) => node.dataset.act === button.dataset.act && node.dataset.id === activeId);
      close();
      source?.click();
    }
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    }
  });
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); });
  // 先截获 Esc，避免现有全局 Esc 同时关闭底下的接待详情抽屉。
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && dialog.open) {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    }
  }, { capture: true });
})();
