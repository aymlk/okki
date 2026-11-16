// @ts-check
// High-intent confirmation belongs to reception detail, never the automatic requirements card.
const W = /** @type {any} */ (window);
const G = W.gsap;
/** @type {(() => void) | null} */
let activeCleanup = null;
export function resetDeliveryCardFx() { activeCleanup?.(); }

/** @param {HTMLElement} host */
export function fxDeliveryCard(host) {
  resetDeliveryCardFx();
  const hero = /** @type {HTMLElement | null} */ (host.querySelector(".delivery-hero"));
  if (host.id !== "detail" || !host.classList.contains("open") || !hero || hero.hidden || document.hidden) return;
  if (!G || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    host.dataset.deliveryPhase = "static";
    return;
  }
  const title = hero.querySelector(".intent-label");
  const caption = hero.querySelector(".intent-caption");
  const medal = hero.querySelector(".intent-medal");
  const ring = medal?.querySelector("circle");
  const check = medal?.querySelector("path");
  const explanation = hero.querySelector("p");
  const light = document.createElement("span");
  light.className = "delivery-confirm-light";
  light.setAttribute("aria-hidden","true");
  hero.appendChild(light);
  hero.classList.add("delivery-confirming");
  host.dataset.deliveryPhase = "waiting";
  /** @type {any} */ let split = null;
  /** @type {any} */ let timeline = null;
  let settled = false;
  const targets = [hero,title,caption,medal,ring,check,explanation].filter(Boolean);
  const restore = () => {
    if (settled) return;
    settled = true;
    timeline?.kill();
    split?.revert();
    light.remove();
    G.set(targets,{clearProps:"transform,opacity,visibility,filter,clipPath,strokeDashoffset,--delivery-sheen"});
    hero.classList.remove("delivery-confirming");
    host.dataset.deliveryPhase = "static";
    if (activeCleanup === restore) activeCleanup = null;
  };
  activeCleanup = restore;
  try {
    if (title && W.SplitText) split = W.SplitText.create(title,{type:"chars",tag:"span",charsClass:"delivery-title-char",aria:"none"});
    timeline = G.timeline({delay:.18,onStart:() => {host.dataset.deliveryPhase="playing";},onComplete:restore});
    timeline.fromTo(hero,{opacity:0,y:9},{opacity:1,y:0,duration:.5,ease:"power3.out"},0)
      .fromTo(light,{opacity:0,scale:.93},{opacity:.8,scale:1,duration:.65,ease:"power2.out"},.12)
      .fromTo(hero,{"--delivery-sheen":-1},{"--delivery-sheen":1,duration:1.1,ease:"sine.inOut"},.95)
      .to(light,{opacity:0,scale:1.035,duration:.75,ease:"sine.out"},1.7);
    if (medal) timeline.fromTo(medal,{opacity:0,scale:.5,rotation:-16},{opacity:1,scale:1,rotation:0,duration:.7,ease:"back.out(1.4)"},.14);
    if (ring) timeline.fromTo(ring,{strokeDashoffset:57},{strokeDashoffset:0,duration:.55,ease:"power2.out"},.25);
    if (check) timeline.fromTo(check,{strokeDashoffset:16},{strokeDashoffset:0,duration:.4,ease:"power2.out"},.65);
    if (split) timeline.fromTo(split.chars,{opacity:0,y:12,filter:"blur(2px)"},{opacity:1,y:0,filter:"blur(0px)",duration:.45,stagger:.045,ease:"power2.out"},.35);
    else if (title) timeline.fromTo(title,{opacity:0,y:7},{opacity:1,y:0,duration:.45,ease:"power2.out"},.35);
    if (caption) timeline.fromTo(caption,{opacity:0,y:4},{opacity:1,y:0,duration:.4,ease:"power2.out"},.8);
    if (explanation) timeline.fromTo(explanation,{opacity:0,y:4},{opacity:1,y:0,duration:.4,ease:"power2.out"},1);
  } catch { restore(); }
}
window.addEventListener("resize",resetDeliveryCardFx);
window.addEventListener("pagehide",resetDeliveryCardFx);
document.addEventListener("visibilitychange",() => {if(document.hidden)resetDeliveryCardFx();});
