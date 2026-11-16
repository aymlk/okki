// @ts-check
// Local macOS-style window handoff; no native OS window or generated messages.
const W = /** @type {any} */ (window);
const G = W.gsap;
if (G && W.Flip) G.registerPlugin(W.Flip);
/** @type {(() => void) | null} */ let activeCancel = null;
export function resetMailWaFx() { activeCancel?.(); }
window.addEventListener("resize",resetMailWaFx,{passive:true});
document.addEventListener("visibilitychange",()=>{if(document.hidden)resetMailWaFx();});

/** @param {HTMLElement} original @param {string} className */
function inertCopy(original,className) {
  const copy=/** @type {HTMLElement} */ (original.cloneNode(true));
  copy.hidden=false;copy.classList.add(className);copy.removeAttribute("id");
  Object.assign(copy.style,{opacity:"",visibility:"",transform:"",transformOrigin:"",filter:""});
  copy.querySelectorAll("[id]").forEach(n=>n.removeAttribute("id"));
  copy.querySelectorAll("[aria-live]").forEach(n=>n.removeAttribute("aria-live"));
  copy.querySelectorAll("button,input,textarea,select").forEach(n=>n.setAttribute("disabled",""));
  return copy;
}
/** @param {HTMLElement | null} source @param {HTMLElement | null} destination @param {{name:string,avatar:string,email:string}} profile @param {() => void} openTarget @returns {Promise<boolean>} */
export function fxMailToWhatsApp(source,destination,profile,openTarget) {
  resetMailWaFx();
  const rect=source?.getBoundingClientRect();
  if(!source||!destination||source.hidden||!rect||rect.width<20||document.hidden||!G||!W.Flip||window.matchMedia("(prefers-reduced-motion: reduce)").matches){openTarget();return Promise.resolve(true);}
  return new Promise((resolve,reject)=>{
    let done=false;/** @type {any} */ let tl=null;/** @type {any} */ let flip=null;
    const layer=document.createElement("div");layer.className="mail-wa-transition-layer";layer.setAttribute("aria-hidden","true");layer.setAttribute("inert","");
    Object.assign(layer.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});
    const snapshot=inertCopy(source,"mail-wa-snapshot");layer.append(snapshot);document.body.appendChild(layer);
    const a=source.querySelector(".mail-thread"),b=snapshot.querySelector(".mail-thread");if(a&&b)b.scrollTop=a.scrollTop;
    const mailState=W.Flip.getState(snapshot);
    /** @type {HTMLElement | null} */ let header=null;
    const restore=()=>{layer.remove();destination.classList.remove("mail-wa-entering");G.set(destination,{clearProps:"transform,transformOrigin,opacity,visibility,filter"});if(header)G.set(header,{clearProps:"--mail-wa-focus"});};
    const settle=(success)=>{if(done)return;done=true;restore();if(activeCancel===cancel)activeCancel=null;resolve(success);};
    const cancel=()=>{tl?.kill();flip?.kill();settle(false);};activeCancel=cancel;
    try {
      // Route exactly once immediately; the popup is a visual bridge to the real view.
      openTarget();header=destination.querySelector(".wa-head");destination.classList.add("mail-wa-entering");G.set(destination,{autoAlpha:0});
      const shade=document.createElement("i");shade.className="mac-wa-shade";
      const frame=document.createElement("section");frame.className="mac-wa-window-frame";
      const chrome=document.createElement("header");chrome.className="mac-wa-window-chrome";
      const lights=document.createElement("span");lights.className="mac-wa-lights";for(let n=0;n<3;n++)lights.append(document.createElement("i"));
      const title=document.createElement("b");title.textContent=`WhatsApp · ${profile.name}`;
      const linked=document.createElement("small");linked.textContent="邮件接续";
      chrome.append(lights,title,linked);
      const preview=inertCopy(destination,"mac-wa-preview");frame.append(chrome,preview);layer.append(shade,frame);
      const c=destination.querySelector(".wa-messages"),d=preview.querySelector(".wa-messages");if(c&&d)d.scrollTop=c.scrollTop;
      const visibleLeft=Math.max(0,rect.left),visibleTop=Math.max(0,rect.top);
      const visibleWidth=Math.min(rect.left+rect.width,W.innerWidth||rect.left+rect.width)-visibleLeft;
      const visibleHeight=Math.min(rect.top+rect.height,W.innerHeight||rect.top+rect.height)-visibleTop;
      const width=Math.max(220,visibleWidth-32),height=Math.max(260,visibleHeight-48);
      const left=visibleLeft-rect.left+(visibleWidth-width)/2,top=visibleTop-rect.top+(visibleHeight-height)/2;
      Object.assign(frame.style,{left:`${left}px`,top:`${top}px`,width:`${width}px`,height:`${height}px`});
      if(width<860)frame.classList.add("is-compact");
      Object.assign(snapshot.style,{left:"12px",top:"8px",right:"auto",bottom:"auto",width:`${rect.width-24}px`,height:`${rect.height-16}px`});
      tl=G.timeline({onComplete:()=>settle(true)});flip=W.Flip.from(mailState,{duration:.55,ease:"power2.inOut",absolute:true,scale:false});
      tl.add(flip,0)
        .to(snapshot,{autoAlpha:.30,filter:"blur(3px)",duration:.6,ease:"sine.out"},0)
        .fromTo(shade,{autoAlpha:0},{autoAlpha:1,duration:.45,ease:"sine.out"},0)
        .fromTo(frame,{autoAlpha:0,scale:.78,y:36,filter:"blur(4px)"},{autoAlpha:1,scale:1.028,y:0,filter:"blur(0px)",duration:.64,ease:"power3.out"},.10)
        .to(frame,{scale:1,duration:.44,ease:"sine.out"},.74)
        .to(snapshot,{autoAlpha:0,duration:.45,ease:"sine.out"},1.15)
        .to(shade,{autoAlpha:0,duration:.45,ease:"sine.out"},1.45)
        .to(destination,{autoAlpha:1,duration:.20,ease:"sine.out"},1.76)
        .to(frame,{autoAlpha:0,duration:.24,ease:"sine.out"},1.84);
      if(visibleWidth>=rect.width-2){
        tl.to(frame,{left:0,top:0,width:rect.width,height:rect.height,borderRadius:0,duration:.62,ease:"power2.inOut"},1.20)
          .to(chrome,{height:0,autoAlpha:0,duration:.54,ease:"sine.inOut"},1.22);
      }
      if(header)tl.fromTo(header,{"--mail-wa-focus":0},{"--mail-wa-focus":1,duration:.2,ease:"sine.out"},1.76).to(header,{"--mail-wa-focus":0,duration:.44,ease:"sine.out"},1.98);
    }catch(error){tl?.kill();flip?.kill();done=true;restore();if(activeCancel===cancel)activeCancel=null;reject(error);}
  });
}
