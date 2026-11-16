// @ts-check
// Uses local GSAP CustomEase/SplitText; no remote animation services.
const W = /** @type {any} */ (window);
const G = W.gsap;
const flowEase = G && W.CustomEase ? W.CustomEase.create("capture-flow",".30,0,.15,1") : "power2.inOut";
const reduced = () => !G || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** @type {Set<() => void>} */
const cleanups = new Set();

export function resetCaptureFx() {
  [...cleanups].forEach(clean => clean());
}

/**
 * Lights the actual buyer text, then transfers its extracted value to one card.
 * Resolves on arrival (or on interruption), so the data/progress is not premature.
 * @param {HTMLElement | null} source @param {HTMLElement | null} target
 * @param {{id:string,value:string,label?:string}} fact @returns {Promise<boolean>}
 */
export function fxCaptureInfo(source,target,fact) {
  if (!source || !target) return Promise.resolve(false);
  if (reduced()) { source.classList.add("is-captured"); return Promise.resolve(true); }
  return new Promise(resolve => {
    let finished=false;
    const bubble=source.closest(".bubble");
    const related=bubble ? Array.from(bubble.querySelectorAll(".requirement-source")) : [source];
    const layer=document.createElement("div");layer.className="capture-flight-layer";layer.setAttribute("aria-hidden","true");
    const cue=document.createElement("span");cue.className="capture-source-cue";
    const cueText=document.createElement("span");cueText.textContent=`AI 已识别 · ${fact.label || "需求信息"}`;
    cue.appendChild(cueText);layer.appendChild(cue);document.body.appendChild(layer);
    const initial=source.getBoundingClientRect();
    Object.assign(cue.style,{left:`${Math.max(16,initial.left)}px`,top:`${Math.max(80,initial.top-33)}px`});
    /** @type {any} */ let flight=null;
    const tl=G.timeline();
    const finish=(success) => {
      if (finished) return;
      finished=true;tl.kill();flight?.kill();layer.remove();
      G.set(related,{clearProps:"--extract-light"});
      related.forEach(node=>{node.classList.remove("is-lit");if(success)node.classList.add("is-captured");});
      bubble?.classList.remove("capture-source-active");
      target.classList.remove("is-receiving");
      cleanups.delete(cancel);resolve(success);
    };
    const cancel=()=>finish(false);
    cleanups.add(cancel);
    bubble?.classList.add("capture-source-active");
    related.forEach(node=>node.classList.add("is-lit"));
    tl.fromTo(related,{"--extract-light":0},{"--extract-light":1,duration:.32,ease:"power2.out",stagger:.045},0)
      .fromTo(cue,{autoAlpha:0,y:7},{autoAlpha:1,y:0,duration:.30,ease:"power3.out"},.08)
      .to(related,{"--extract-light":.7,duration:.18,ease:"sine.inOut"},.36)
      .call(()=>{
        if (!source.isConnected || !target.isConnected) { finish(false);return; }
        const start=source.getBoundingClientRect();
        const end=target.getBoundingClientRect();
        const slot=target.querySelector(".sum-pending,.sum-value")?.getBoundingClientRect() || end;
        if (!start.width || !end.width) { finish(false);return; }
        const chip=document.createElement("span");chip.className="capture-flight-chip";chip.dataset.field=fact.id;
        const label=document.createElement("small");label.className="capture-flight-label";label.textContent=`${fact.label || "需求信息"} · 已识别`;
        const value=document.createElement("strong");value.textContent=fact.value;chip.append(label,value);
        chip.dataset.phase="lift";
        const sx=start.left+start.width/2,sy=start.top+start.height/2;
        const tx=end.left+end.width/2,ty=slot.top+12;
        const distance=Math.hypot(tx-sx,ty-sy);
        const lift=Math.min(96,Math.max(38,distance*.12));
        const dx=tx-sx,dy=ty-sy;
        const duration=Math.min(1.34,1.04+distance/3000);
        const point=(p)=>{const q=1-p;return {x:3*q*q*p*(dx*.22)+3*q*p*p*(dx*.78)+p*p*p*dx,y:3*q*q*p*(-lift)+3*q*p*p*dy+p*p*p*dy};};
        const ns="http://www.w3.org/2000/svg";
        const svg=document.createElementNS(ns,"svg");svg.classList.add("capture-light-path");
        svg.setAttribute("viewBox",`0 0 ${innerWidth} ${innerHeight}`);
        const d=`M${sx},${sy} C${sx+dx*.22},${sy-lift} ${sx+dx*.78},${ty} ${tx},${ty}`;
        const paths=Array.from({length:3},(_,n)=>{const path=document.createElementNS(ns,"path");path.setAttribute("d",d);path.setAttribute("class",["capture-path-guide","capture-path-bloom","capture-path-core"][n]);svg.appendChild(path);return path;});
        const halo=document.createElement("i");halo.className="capture-landing-glow";
        Object.assign(halo.style,{left:`${end.left-7}px`,top:`${end.top-7}px`,width:`${end.width+14}px`,height:`${end.height+14}px`});
        layer.append(svg,halo,chip);
        const length=paths[2].getTotalLength(),segment=Math.min(140,length*.24);
        paths.slice(1).forEach(path=>{path.style.strokeDasharray=`${segment} ${length+segment}`;path.style.strokeDashoffset=String(segment);});
        // Measure once; keep the typography and aspect ratio unchanged in flight.
        const size=chip.getBoundingClientRect();
        Object.assign(chip.style,{left:`${sx-size.width/2}px`,top:`${sy-size.height/2}px`});
        const moveX=G.quickSetter(chip,"x","px"),moveY=G.quickSetter(chip,"y","px");
        const turn=G.quickSetter(chip,"rotation","deg");
        const progress={value:0};
        flight=G.timeline();
        flight.fromTo(chip,{autoAlpha:0,filter:"blur(2px)"},{autoAlpha:1,filter:"blur(0px)",duration:.24,ease:"power2.out"},0)
          .fromTo(svg,{autoAlpha:0},{autoAlpha:1,duration:.20},.12)
          .to(cue,{autoAlpha:0,y:-4,duration:.28,ease:"sine.inOut"},.20)
          .to(progress,{value:1,duration,ease:flowEase,onUpdate:()=>{
            const p=progress.value,pos=point(p);moveX(pos.x);moveY(pos.y);turn(-1.5*Math.sin(p*Math.PI));
            paths.slice(1).forEach(path=>{path.style.strokeDashoffset=String(segment-p*length);});
          }},0)
          .call(()=>{chip.dataset.phase="travel";},null,.24)
          .call(()=>{chip.dataset.phase="settle";target.classList.add("is-receiving");},null,duration*.67)
          .fromTo(halo,{autoAlpha:0,scale:.97},{autoAlpha:1,scale:1,duration:.25,ease:"power2.out"},duration*.67)
          .to(chip,{autoAlpha:0,filter:"blur(1.5px)",duration:.29,ease:"power1.inOut"},duration*.84)
          .to(svg,{autoAlpha:0,duration:.3,ease:"sine.out"},duration*.82)
          .to(halo,{autoAlpha:0,scale:1.025,duration:.28,ease:"sine.out"},duration*.95)
          .call(()=>finish(true),null,duration+.28);
      },null,.60);
  });
}

/**
 * Header-only intent reveal; never creates a lower floating card.
 * @param {HTMLElement | null} host @param {{name:string,avatar:string}} profile
 * @param {HTMLElement | null} badge @returns {Promise<boolean>}
 */
export function fxHighIntent(host,profile,badge) {
  if (!host || !badge || reduced()) return Promise.resolve(true);
  const header=badge.closest(".chat-head,.wa-head");
  const name=host.querySelector(".chat-head h1,#waName");
  if (!header) return Promise.resolve(true);
  return new Promise(resolve=>{
    let settled=false;
    badge.setAttribute("aria-label",`${profile.name} 已标记为高交付意向用户`);
    const label=badge.querySelector(".intent-label") || badge;
    const medal=badge.querySelector(".intent-medal");
    const ring=medal?.querySelector("circle"),check=medal?.querySelector("path");
    const caption=badge.querySelector(".intent-caption");
    const split=W.SplitText ? W.SplitText.create(label,{type:"chars",tag:"span",charsClass:"intent-char",aria:"none"}) : null;
    const rect=badge.getBoundingClientRect(),parent=header.getBoundingClientRect();
    const layer=document.createElement("span");layer.className="intent-upgrade-fx";layer.setAttribute("aria-hidden","true");
    Object.assign(layer.style,{left:`${rect.left-parent.left}px`,top:`${rect.top-parent.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});
    const aura=document.createElement("i");aura.className="intent-upgrade-aura";layer.appendChild(aura);
    const pulse=document.createElement("i");pulse.className="intent-upgrade-ring";layer.appendChild(pulse);
    const sparks=Array.from({length:8},(_,n)=>{const dot=document.createElement("i");dot.className="intent-upgrade-spark";dot.style.background=n%2 ? "#4fa977" : "#d4a54e";layer.appendChild(dot);return dot;});
    header.appendChild(layer);
    header.classList.add("intent-header-active");
    badge.classList.add("intent-badge-active");
    const restore=()=>{
      split?.revert();
      layer.remove();
      G.set(badge,{clearProps:"opacity,visibility,transform,clipPath,--intent-sheen,--intent-confirm"});
      G.set(header,{clearProps:"--intent-header-light"});
      if(caption)G.set(caption,{clearProps:"opacity,visibility,transform"});
      if(medal)G.set(medal,{clearProps:"transform,opacity,visibility"});
      if(ring)G.set(ring,{clearProps:"strokeDashoffset"});
      if(check)G.set(check,{clearProps:"strokeDashoffset"});
      if(name)G.set(name,{clearProps:"color,textShadow,transform"});
      header.classList.remove("intent-header-active");badge.classList.remove("intent-badge-active");
    };
    const finish=()=>{restore();cleanups.delete(cancel);if(!settled){settled=true;resolve(true);}};
    const tl=G.timeline({onComplete:finish});
    const cancel=()=>{tl.kill();restore();cleanups.delete(cancel);if(!settled){settled=true;resolve(false);}};
    cleanups.add(cancel);
    tl.fromTo(header,{"--intent-header-light":0},{"--intent-header-light":1,duration:.38,ease:"sine.out"},0)
      .fromTo(aura,{autoAlpha:0,scale:.84},{autoAlpha:1,scale:1.03,duration:.65,ease:"power3.out"},0)
      .fromTo(badge,{autoAlpha:0,y:-8,scale:.90,clipPath:"inset(0 82% 0 0 round 13px)"},{autoAlpha:1,y:0,scale:1.045,clipPath:"inset(0 0% 0 0 round 13px)",duration:.72,ease:"power3.out"},.12)
      .to(badge,{scale:1,duration:.65,ease:"sine.out"},.84)
      .from(split?.chars || [],{autoAlpha:0,y:13,filter:"blur(2px)",duration:.52,ease:"power3.out",stagger:.055},.40)
      .fromTo(pulse,{autoAlpha:.8,scale:.94},{autoAlpha:0,scale:1.16,duration:1.0,ease:"power2.out"},.73)
      .fromTo(badge,{"--intent-sheen":-1},{"--intent-sheen":1,duration:1.25,ease:"sine.inOut"},1.05)
      .fromTo(badge,{"--intent-confirm":0},{"--intent-confirm":1,duration:.45,ease:"sine.out"},.60)
      .to(badge,{"--intent-confirm":0,duration:1.0,ease:"sine.inOut"},2.05)
      .to(aura,{autoAlpha:0,scale:1.09,duration:.9,ease:"sine.out"},2.0)
      .to(header,{"--intent-header-light":0,duration:1.0,ease:"sine.inOut"},2.10);
    if(caption)tl.fromTo(caption,{autoAlpha:0,y:5},{autoAlpha:1,y:0,duration:.45,ease:"power2.out"},.98);
    if(medal)tl.fromTo(medal,{scale:.35,rotation:-24,autoAlpha:0},{scale:1,rotation:0,autoAlpha:1,duration:.76,ease:"back.out(1.5)"},.18);
    if(ring)tl.fromTo(ring,{strokeDashoffset:57},{strokeDashoffset:0,duration:.6,ease:"power2.out"},.32);
    if(check)tl.fromTo(check,{strokeDashoffset:16},{strokeDashoffset:0,duration:.42,ease:"power2.out"},.73);
    sparks.forEach((dot,n)=>{const angle=n*Math.PI/4;tl.fromTo(dot,{x:24,y:rect.height/2,rotation:n*45,autoAlpha:0,scale:0},{x:24+Math.cos(angle)*27,y:rect.height/2+Math.sin(angle)*19,autoAlpha:.9,scale:1,duration:.48,ease:"power2.out"},.76+n*.018).to(dot,{autoAlpha:0,scale:.15,duration:.62,ease:"sine.out"},1.3+n*.018);});
    if(name)tl.fromTo(name,{color:"#157b4a",textShadow:"0 0 18px rgba(45,169,105,.32)",y:-1},{color:"#1f2329",textShadow:"0 0 0px rgba(45,169,105,0)",y:0,duration:2.6,ease:"sine.out"},.10);
  });
}
