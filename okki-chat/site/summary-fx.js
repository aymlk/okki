// Eye-catching GSAP effects for the "需求摘要" panel.
// Uses the global gsap + plugins loaded from ./vendor (classic scripts).
/* global gsap, SplitText, ScrambleTextPlugin, CustomEase */

const G = /** @type {any} */ (window).gsap;
const W = /** @type {any} */ (window);
if (G) {
  G.registerPlugin(W.SplitText, W.ScrambleTextPlugin, W.CustomEase);
  W.CustomEase.create("pop", "M0,0 C0.2,0 0.25,1.35 0.55,1.08 0.75,0.92 0.85,1 1,1");
}

const reduce = () => !G || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Running loops on the current "asking" card, killed when it is filled or re-rendered. */
let askingTl = /** @type {any} */ (null);

export function fxReset() {
  askingTl?.kill();
  askingTl = null;
}

/** The AI is asking about this item: breathing ring + scanning beam. @param {Element | null} li */
export function fxAsking(li) {
  fxReset();
  if (!li || reduce()) return;
  const beam = document.createElement("i");
  beam.className = "sum-beam";
  li.appendChild(beam);
  askingTl = G.timeline();
  askingTl
    .fromTo(li, { scale: 0.97 }, { scale: 1, duration: 0.5, ease: "back.out(3)" }, 0)
    .fromTo(li, { "--ring": 0 }, { "--ring": 1, duration: 0.9, ease: "sine.inOut", repeat: -1, yoyo: true }, 0)
    .fromTo(beam, { xPercent: -120 }, { xPercent: 320, duration: 1.3, ease: "power2.inOut", repeat: -1, repeatDelay: 0.15 }, 0);
}

/** The item has just been collected. @param {Element | null} li @param {boolean} [gentle] */
export function fxFilled(li, gentle = false) {
  fxReset();
  if (!li || reduce()) return;
  const value = li.querySelector(".sum-value");
  const check = li.querySelector(".sum-check path");
  const ring = li.querySelector(".sum-check circle");
  const finalText = value?.textContent || "";
  const tl = G.timeline();
  if (gentle) {
    li.classList.add("capture-landed");
    tl.eventCallback("onComplete",()=>li.classList.remove("capture-landed"));
    tl.fromTo(li,{scale:.985,rotationX:0},{scale:1,duration:.55,ease:"power3.out"},0)
      .fromTo(li,{"--glow":.65},{"--glow":0,duration:.9,ease:"sine.out"},0)
      .fromTo(li,{"--capture-sweep":-1},{"--capture-sweep":1,duration:.70,ease:"power2.inOut"},.03)
      .fromTo(li.querySelector(".sum-label"),{x:-2,autoAlpha:.7},{x:0,autoAlpha:1,duration:.25},0);
  } else {
    tl.fromTo(li, { scale: 0.9, rotationX: -18, transformPerspective: 600 }, { scale: 1, rotationX: 0, duration: 0.7, ease: "pop" }, 0)
      .fromTo(li, { "--glow": 1 }, { "--glow": 0, duration: 1.2, ease: "power2.out" }, 0)
      .fromTo(li.querySelector(".sum-label"), { x: -10, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.35 }, 0.05);
  }
  if (value) {
    if (gentle) tl.fromTo(value,{autoAlpha:.5,y:4},{autoAlpha:1,y:0,duration:.38,ease:"power3.out"},0);
    else tl.fromTo(value, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.1)
        .to(value, { duration: 0.9, scrambleText: { text: finalText, chars: "▮▯◆◇01#%", revealDelay: 0.15, speed: 0.6 } }, 0.1);
  }
  if (ring && check) {
    if (gentle) {
      tl.fromTo(ring,{strokeDashoffset:57},{strokeDashoffset:0,duration:.3,ease:"power2.out"},0)
        .fromTo(check,{strokeDashoffset:16},{strokeDashoffset:0,duration:.28,ease:"power2.out"},.16)
        .fromTo(li.querySelector(".sum-check"),{scale:.74},{scale:1,duration:.50,ease:"back.out(1.3)"},.05);
    } else {
      tl.fromTo(ring, { strokeDashoffset: 57 }, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" }, 0.25)
        .fromTo(check, { strokeDashoffset: 16 }, { strokeDashoffset: 0, duration: 0.35, ease: "power3.out" }, 0.55)
        .fromTo(li.querySelector(".sum-check"), { scale: 0.4 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.45)" }, 0.25)
        .add(() => burst(/** @type {HTMLElement} */ (li.querySelector(".sum-check")), 12, ["#2d6bff", "#6aa0ff", "#ffd166"], 34), 0.6);
    }
  }
}

/** Animated counter + elastic progress bar. @param {number} done @param {number} total */
export function fxProgress(done, total) {
  const bar = document.getElementById("progressBar");
  const num = document.getElementById("progressNum");
  if (!bar || !num) return;
  const target = total ? done / total : 0;
  const from = Number(num.dataset.v || 0);
  num.dataset.v = String(done);
  if (reduce()) { G?.set(bar, { scaleX: target }); if (!G) bar.style.transform = `scaleX(${target})`; num.textContent = String(done); return; }
  G.to(bar, { scaleX: target, duration: 1, ease: "elastic.out(1, 0.55)", overwrite: true });
  if (done > from) {
    const counter = { v: from };
    G.to(counter, { v: done, duration: 0.5, ease: "power1.out", onUpdate: () => { num.textContent = String(Math.round(counter.v)); } });
    G.fromTo(num, { scale: 1.9, color: "#2d6bff" }, { scale: 1, color: "inherit", duration: 0.6, ease: "back.out(4)" });
    G.fromTo(bar, { "--shine": 0 }, { "--shine": 1, duration: 0.9, ease: "power2.inOut" });
  } else {
    num.textContent = String(done);
  }
}

/** Everything is collected: the green card flips in with confetti. @param {HTMLElement} card */
export function fxHandoff(card) {
  if (!card || reduce()) return;
  const title = card.querySelector("b");
  const btn = card.querySelector(".handoff-open");
  const split = title ? W.SplitText.create(title, { type: "chars" }) : null;
  const tl = G.timeline({ onComplete: () => split?.revert() });
  tl.fromTo(card, { y: 40, rotationX: 70, autoAlpha: 0, transformPerspective: 700, transformOrigin: "50% 100%" },
    { y: 0, rotationX: 0, autoAlpha: 1, duration: 0.8, ease: "back.out(1.6)" }, 0)
    .fromTo(card, { "--sweep": 0 }, { "--sweep": 1, duration: 1.1, ease: "power2.inOut" }, 0.35)
    .from(split?.chars || [], { y: 18, scale: 0.4, autoAlpha: 0, duration: 0.5, ease: "back.out(3)", stagger: 0.05 }, 0.3)
    .from(card.querySelector("span"), { autoAlpha: 0, y: 8, duration: 0.4 }, 0.6)
    .from(btn, { scale: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" }, 0.75)
    .add(() => burst(card, 28, ["#22c55e", "#2d6bff", "#ffd166", "#ff6b9a", "#a78bfa"], 120, true), 0.4)
    .fromTo(btn, { "--pulse": 0 }, { "--pulse": 1, duration: 1.4, ease: "power1.out", repeat: -1, repeatDelay: 0.4 }, 1.2);
}

/**
 * Particle burst from the centre of an element.
 * @param {HTMLElement | null} host @param {number} n @param {string[]} colors @param {number} dist @param {boolean} [confetti]
 */
function burst(host, n, colors, dist, confetti = false) {
  if (!host) return;
  const layer = document.createElement("span");
  layer.className = "fx-burst";
  host.appendChild(layer);
  for (let i = 0; i < n; i++) {
    const p = document.createElement("i");
    p.style.background = colors[i % colors.length];
    if (confetti) { p.style.width = `${4 + Math.random() * 4}px`; p.style.height = `${8 + Math.random() * 6}px`; p.style.borderRadius = "1px"; }
    layer.appendChild(p);
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const d = dist * (0.55 + Math.random() * 0.6);
    G.fromTo(p, { x: 0, y: 0, scale: 1, rotation: 0, autoAlpha: 1 }, {
      x: Math.cos(a) * d,
      y: Math.sin(a) * d + (confetti ? 40 : 0),
      rotation: confetti ? G.utils.random(-360, 360) : 0,
      scale: confetti ? 1 : 0.2,
      autoAlpha: 0,
      duration: confetti ? G.utils.random(1, 1.6) : G.utils.random(0.5, 0.8),
      ease: "power3.out"
    });
  }
  G.delayedCall(1.8, () => layer.remove());
}
