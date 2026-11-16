// @ts-check
// SplitText is already registered by summary-fx.js; no remote services.
const W=/** @type {any} */ (window),G=W.gsap;
/** @type {Map<string,string>} */ const previous=new Map();
/** @type {(() => void) | null} */ let activeCleanup=null;
/** @param {boolean} [clearHistory] */
export function resetDetailFx(clearHistory=false){activeCleanup?.();if(clearHistory)previous.clear();}
window.addEventListener("resize",()=>resetDetailFx(),{passive:true});
document.addEventListener("visibilitychange",()=>{if(document.hidden)resetDetailFx();});

/** @param {HTMLElement | null} root @param {boolean} [onlyChanged] */
export function fxDetailText(root,onlyChanged=false){
  resetDetailFx();
  if(!root||!root.classList.contains("open"))return;
  const selectors='.drawer-head h2,.buyer-info b,.buyer-info .sub,.handoff-badge .rule-tag,.handoff-badge p > b,.handoff-badge .owner,#reqGrid dt,#reqGrid dd,#aiSummary,#aiAdvice';
  const all=Array.from(root.querySelectorAll(selectors));
  const nodes=all.filter((node,i)=>{
    const key=node.id||`${node.tagName}:${i}`,text=(node.textContent||"").trim();
    const changed=!onlyChanged||previous.get(key)!==text;previous.set(key,text);return changed&&!!text;
  });
  if(!nodes.length||!G||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  /** @type {any[]} */ const splits=[];
  /** @type {any} */ let tl=null;
  let finished=false;
  const finish=()=>{
    if(finished)return;finished=true;
    splits.reverse().forEach(split=>split.revert());
    G.set(nodes,{clearProps:"opacity,visibility,transform,filter"});
    root.classList.remove("detail-revealing");
    if(activeCleanup===cancel)activeCleanup=null;
  };
  const cancel=()=>{tl?.kill();finish();};activeCleanup=cancel;
  try{
    root.classList.add("detail-revealing");tl=G.timeline({onComplete:finish});
    let field=0;
    nodes.forEach((node,i)=>{
      const element=/** @type {HTMLElement} */ (node);
      let at=.12+Math.min(i,5)*.035;
      if(element.matches("#reqGrid dt,#reqGrid dd")){at=.36+Math.floor(field/2)*.09+(field%2)*.025;field++;}
      if(element.id==="aiSummary")at=.83;
      if(element.id==="aiAdvice")at=.97;
      // Keep flex metadata in its original markup; split only stable text leaves.
      if(W.SplitText&&!element.matches(".buyer-info .sub")){
        const split=W.SplitText.create(element,{type:"words,chars",smartWrap:true,charsClass:"detail-text-char",aria:"auto"});splits.push(split);
        tl.fromTo(split.chars,{y:12,autoAlpha:0,filter:"blur(2px)"},{y:0,autoAlpha:1,filter:"blur(0px)",duration:.46,stagger:{amount:Math.min(.27,split.chars.length*.012)},ease:"power2.out",clearProps:"transform,opacity,visibility,filter"},at);
      }else{
        tl.fromTo(element,{y:7,autoAlpha:0},{y:0,autoAlpha:1,duration:.42,ease:"power2.out",clearProps:"transform,opacity,visibility"},at);
      }
    });
  }catch(error){cancel();throw error;}
}
