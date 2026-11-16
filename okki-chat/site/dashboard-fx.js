// @ts-check
// Source recognition stays in the message; the completed dashboard reveals results together.
const G = /** @type {any} */ (window).gsap;
const reduced = () => !G || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** @type {Set<() => void>} */
const sourceCleanups = new Set();
/** @type {HTMLElement | null} */
let dashboardHost = null;
let dashboardTimer = 0;

export function resetDashboardFx() {
  window.clearTimeout(dashboardTimer);
  sourceCleanups.forEach(clean => clean());
  dashboardHost?.classList.remove("dashboard-revealing");
  if (dashboardHost && G) {
    const targets = [dashboardHost, ...Array.from(dashboardHost.querySelectorAll(".summary-list li,.sum-check"))];
    G.killTweensOf(targets);
    G.set(targets, {clearProps:"transform,opacity,visibility"});
  }
  dashboardHost = null;
}

/** @param {HTMLElement | null} source @param {{label:string}} fact @returns {Promise<boolean>} */
export function fxRecognizeSource(source, fact) {
  if (!source) return Promise.resolve(false);
  const bubble = source.closest(".bubble");
  const related = bubble ? Array.from(bubble.querySelectorAll(".requirement-source")) : [source];
  if (reduced()) { related.forEach(node => node.classList.add("is-captured")); return Promise.resolve(true); }
  return new Promise(resolve => {
    const cue = document.createElement("span");
    cue.className = "dashboard-source-cue";
    cue.textContent = `AI 已识别 · ${fact.label}`;
    cue.setAttribute("aria-hidden", "true");
    bubble?.appendChild(cue);
    bubble?.classList.add("capture-source-active");
    related.forEach(node => node.classList.add("is-lit"));
    let settled = false;
    /** @type {any} */ let timeline;
    const finish = () => {
      if (settled) return;
      settled = true;
      timeline?.kill();
      cue.remove();
      G.set(related, {clearProps:"--extract-light"});
      related.forEach(node => {node.classList.remove("is-lit");node.classList.add("is-captured");});
      bubble?.classList.remove("capture-source-active");
      sourceCleanups.delete(finish);
      resolve(true);
    };
    sourceCleanups.add(finish);
    timeline = G.timeline({onComplete:finish});
    timeline.fromTo(related, {"--extract-light":0}, {"--extract-light":1,duration:.3,ease:"power2.out"},0)
      .fromTo(cue,{opacity:0,y:5},{opacity:1,y:0,duration:.25,ease:"power2.out"},0)
      .to(cue,{opacity:0,y:-3,duration:.2,ease:"sine.out"},.65);
  });
}

/** @param {HTMLElement} host */
export function fxCompletedDashboard(host) {
  resetDashboardFx();
  dashboardHost = host;
  if (reduced()) return;
  host.classList.add("dashboard-revealing");
  dashboardTimer = window.setTimeout(() => { if (dashboardHost === host) host.classList.remove("dashboard-revealing"); }, 800);
}

window.addEventListener("resize",resetDashboardFx);
document.addEventListener("visibilitychange",() => {if(document.hidden)resetDashboardFx();});
