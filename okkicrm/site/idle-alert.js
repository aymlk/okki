// 本地演示：页面加载后连续 10 秒无操作，提醒已有的拦截记录。
(() => {
  const alert = document.querySelector("#interceptAlert");
  if (!alert || typeof alert.showModal !== "function") return;

  const IDLE_DELAY = 10_000;
  const activityEvents = ["pointerdown", "pointermove", "click", "keydown", "input", "wheel", "scroll", "touchstart"];
  const activityOptions = { capture: true, passive: true };
  let timer = null;
  let ready = false;
  let shown = false;
  let customerId = null;
  let previousFocus = null;

  function pause() {
    window.clearTimeout(timer);
    timer = null;
  }

  function arm() {
    pause();
    if (ready && !shown && !document.hidden) timer = window.setTimeout(showAlert, IDLE_DELAY);
  }

  function cleanup() {
    pause();
    activityEvents.forEach((type) => document.removeEventListener(type, arm, true));
    document.removeEventListener("visibilitychange", arm);
    window.removeEventListener("pagehide", pause);
    window.removeEventListener("pageshow", arm);
    window.removeEventListener("load", start);
  }

  function start() {
    ready = true;
    arm();
  }

  function showAlert() {
    timer = null;
    if (shown || document.hidden) return;
    // 不打断已打开的详情或设置，关闭面板并再次空闲十秒后再提醒。
    const settings = document.querySelector("#settings");
    if ((settings && !settings.hidden) || document.querySelector(".drawer.open, dialog[open]")) {
      arm();
      return;
    }
    const c = window.CRM_DATA?.customers.find((item) => item.compact && item.state === "blocked");
    if (!c) {
      cleanup();
      return;
    }
    customerId = c.id;
    previousFocus = document.activeElement;
    document.querySelector("#interceptAlertName").textContent = c.name;
    document.querySelector("#interceptAlertOwner").textContent = c.owner;
    document.querySelector("#interceptAlertAvatar").className = `avatar ${c.avatar || "initials"}`;
    if (!c.avatar) document.querySelector("#interceptAlertAvatar").textContent = c.name.split(" ").map((part) => part[0]).join("");
    // summary 来自同站 data.js 的既有演示内容，而非外部查询结果。
    document.querySelector("#interceptAlertSummary").innerHTML = c.summary;
    // 只保留拦截告警，不自动打开右侧详情；原生模态提供遮罩与焦点约束。
    alert.classList.add("standalone");
    alert.setAttribute("aria-modal", "true");
    alert.showModal();
    shown = true;
    cleanup();
  }

  function closeAlert() {
    if (!alert.open) return;
    alert.close();
    alert.classList.remove("standalone");
    const target = previousFocus?.isConnected && previousFocus !== document.body
      ? previousFocus
      : document.querySelector("#drawer.open #closeDrawer, #filterBtn");
    target?.focus({ preventScroll: true });
  }

  document.addEventListener("crm:dismiss-intercept-alert", closeAlert);
  document.querySelector("#closeInterceptAlert").addEventListener("click", closeAlert);
  document.querySelector("#dismissInterceptAlert").addEventListener("click", closeAlert);
  document.querySelector("#restoreInterceptAlert").addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("crm:restore-reception", { detail: { id: customerId } }));
    closeAlert();
  });
  alert.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeAlert();
  });
  alert.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    closeAlert();
  });
  alert.addEventListener("click", (e) => {
    if (e.target !== alert) return;
    const rect = alert.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) closeAlert();
  });

  activityEvents.forEach((type) => document.addEventListener(type, arm, activityOptions));
  document.addEventListener("visibilitychange", arm);
  window.addEventListener("pagehide", pause);
  window.addEventListener("pageshow", arm);
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
})();
