// @ts-check
// The reception detail owns its reveal; this never changes customer intent or routing.
const W = /** @type {any} */ (window);
const G = W.gsap;
/** @type {(() => void) | null} */
let activeCleanup = null;

export function resetDetailIntentFx() { activeCleanup?.(); }

/** @param {HTMLElement} root @param {HTMLElement} row @param {HTMLElement} badge */
export function fxDetailIntentOpen(root, row, badge) {
  resetDetailIntentFx();
  if (!root.classList.contains("open") || row.hidden || document.hidden) return;
  if (!G || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    row.dataset.intentFxPhase = "static";
    return;
  }
  const label = badge.querySelector(".intent-label");
  const medal = badge.querySelector(".intent-medal");
  const caption = badge.querySelector(".intent-caption");
  const ring = medal?.querySelector("circle");
  const check = medal?.querySelector("path");
  const description = row.querySelector("p");
  const layer = document.createElement("span");
  layer.className = "detail-intent-fx";
  layer.setAttribute("aria-hidden", "true");
  const aura = document.createElement("i");
  aura.className = "detail-intent-aura";
  const pulse = document.createElement("i");
  pulse.className = "detail-intent-pulse";
  layer.append(aura, pulse);
  row.appendChild(layer);
  row.dataset.intentFxPhase = "waiting";
  badge.classList.add("intent-badge-active");
  /** @type {any} */ let split = null;
  /** @type {any} */ let timeline = null;
  let finished = false;
  const targets = [badge, label, medal, caption, ring, check, description].filter(Boolean);
  const cleanup = () => {
    if (finished) return;
    finished = true;
    timeline?.kill();
    split?.revert();
    layer.remove();
    G.set(targets, {clearProps:"transform,opacity,visibility,filter,clipPath,strokeDashoffset,--intent-sheen,--intent-confirm"});
    badge.classList.remove("intent-badge-active");
    row.dataset.intentFxPhase = "static";
    if (activeCleanup === cleanup) activeCleanup = null;
  };
  activeCleanup = cleanup;
  try {
    if (label && W.SplitText) split = W.SplitText.create(label, {type:"chars",tag:"span",charsClass:"detail-intent-char",aria:"none"});
    timeline = G.timeline({delay:.35,onStart:() => {row.dataset.intentFxPhase = "playing";},onComplete:cleanup});
    timeline.fromTo(badge,{opacity:0,y:7,scale:.94,clipPath:"inset(0 82% 0 0 round 13px)"},{opacity:1,y:0,scale:1.025,clipPath:"inset(0 0% 0 0 round 13px)",duration:.65,ease:"power3.out"},0)
      .to(badge,{scale:1,duration:.5,ease:"sine.out"},.65)
      .fromTo(aura,{opacity:0,scale:.95},{opacity:1,scale:1,duration:.6,ease:"power2.out"},.1)
      .fromTo(pulse,{opacity:.75,scale:.94},{opacity:0,scale:1.035,duration:1.1,ease:"power2.out"},.65)
      .fromTo(badge,{"--intent-sheen":-1,"--intent-confirm":0},{"--intent-sheen":1,"--intent-confirm":1,duration:1.1,ease:"sine.inOut"},.85)
      .to(badge,{"--intent-confirm":0,duration:.7,ease:"sine.out"},1.95)
      .to(aura,{opacity:0,duration:.7,ease:"sine.out"},1.95);
    if (medal) timeline.fromTo(medal,{opacity:0,scale:.45,rotation:-20},{opacity:1,scale:1,rotation:0,duration:.65,ease:"back.out(1.5)"},.15);
    if (ring) timeline.fromTo(ring,{strokeDashoffset:57},{strokeDashoffset:0,duration:.5,ease:"power2.out"},.3);
    if (check) timeline.fromTo(check,{strokeDashoffset:16},{strokeDashoffset:0,duration:.35,ease:"power2.out"},.6);
    if (split) timeline.fromTo(split.chars,{opacity:0,y:10,filter:"blur(2px)"},{opacity:1,y:0,filter:"blur(0px)",duration:.42,stagger:.05,ease:"power2.out"},.42);
    else if (label) timeline.fromTo(label,{opacity:0,y:5},{opacity:1,y:0,duration:.45,ease:"power2.out"},.42);
    if (caption) timeline.fromTo(caption,{opacity:0,y:4},{opacity:1,y:0,duration:.35,ease:"power2.out"},.85);
    if (description) timeline.fromTo(description,{opacity:0,y:4},{opacity:1,y:0,duration:.4,ease:"power2.out"},1);
  } catch {
    // A missing plugin must not hide a genuine completed state.
    cleanup();
  }
}

window.addEventListener("resize",resetDetailIntentFx);
window.addEventListener("pagehide",resetDetailIntentFx);
document.addEventListener("visibilitychange",() => {if(document.hidden)resetDetailIntentFx();});
