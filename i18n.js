// Languages. The game's texts are written in German in the source; English (the default) is a translation layer on top: the dictionary in
// lang-en.js maps German texts to English ones, and every place where text reaches the screen (DOM, canvas, alerts) is patched to run through Tr().
// Texts with variable parts are patterns: "{0} lässt {1} fallen." matches any such sentence, the captured parts are translated again on their own.
// Choosing German leaves everything untouched. The choice is stored and applied by a page reload (menu, language selector).
const LANG=(()=>{ try{ return localStorage.getItem('dl-lang')==='de'?'de':'en'; }catch(e){ return 'en'; } })();
const I18N_EXACT=new Map(), I18N_PATTERNS=[], I18N_CACHE=new Map(), I18N_MISSES=new Set();
function i18nRegister(map){
  for(const de in map){
    const en=map[de]; if(en==='=') continue;
    if(/\{\d+\}/.test(de)){
      const parts=de.split(/\{\d+\}/), lit=parts.join('').length;
      if(lit<3) continue;
      const re=new RegExp('^'+parts.map(p=>p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('([\\s\\S]*?)')+'$');
      I18N_PATTERNS.push({ re, en, lit });
    } else I18N_EXACT.set(de,en);
  }
  I18N_PATTERNS.sort((a,b)=>b.lit-a.lit);
  I18N_CACHE.clear();
}
const I18N_LETTER=/[A-Za-zÄÖÜäöüß]/;
function Tr(s){
  if(LANG!=='en' || typeof s!=='string' || s.length<2 || !I18N_LETTER.test(s)) return s;
  let r=I18N_CACHE.get(s);
  if(r===undefined){ r=i18nCompute(s); if(I18N_CACHE.size>6000) I18N_CACHE.clear(); I18N_CACHE.set(s,r); }
  return r;
}
function i18nCompute(s){
  const ex=I18N_EXACT.get(s); if(ex!==undefined) return ex;
  if(s.indexOf('\n')>=0) return s.split('\n').map(Tr).join('\n');
  const m0=/^(\s*)([\s\S]*?)(\s*)$/.exec(s);
  if(m0[1].length||m0[3].length){ return m0[1]+Tr(m0[2])+m0[3]; }
  for(const p of I18N_PATTERNS){
    const m=p.re.exec(s);
    if(m) return p.en.replace(/\{(\d+)\}/g,(x,i)=>Tr(m[+i+1]));
  }
  for(const sep of [' · ',' — ',': ',', ','; ','. ']){
    if(s.indexOf(sep)>0){ const parts=s.split(sep), out=parts.map(Tr); if(out.some((o,i)=>o!==parts[i])) return out.join(sep); }
  }
  // a number behind a known text: "Kaserne 6"
  const tail=/^([\s\S]*[^\d\s]) (\d+)$/.exec(s);
  if(tail){ const t=Tr(tail[1]); if(t!==tail[1]) return t+' '+tail[2]; }
  // an icon or a number in front of a known text: "🔒 Teleport (Stufe 10)"
  const lead=/^([^A-Za-zÄÖÜäöüß]+)([\s\S]+)$/.exec(s);
  if(lead && lead[2].length>1){ const t=Tr(lead[2]); if(t!==lead[2]) return lead[1]+t; }
  if(/[äöüßÄÖÜ]|\b(der|die|das|und|ein|eine|nicht|wird|ist|zu|mit|auf|von|den|dem)\b/i.test(s)) I18N_MISSES.add(s);
  return s;
}
function trHTML(html){
  if(LANG!=='en' || typeof html!=='string' || !I18N_LETTER.test(html)) return html;
  return html.replace(/(^|>)([^<>]+)(?=<|$)/g,(m,a,t)=>a+Tr(t)).replace(/\b(title|placeholder|alt)="([^"]*)"/g,(m,k,v)=>k+'="'+Tr(v)+'"');
}
// where the text reaches the screen
(function patchSinks(){
  if(LANG!=='en') return;
  const wrapSetter=(proto,prop,fn)=>{ const d=Object.getOwnPropertyDescriptor(proto,prop); if(!d||!d.set) return; Object.defineProperty(proto,prop,{ configurable:true, enumerable:d.enumerable, get:d.get, set(v){ d.set.call(this, typeof v==='string'?fn(v):v); } }); };
  wrapSetter(Node.prototype,'textContent',Tr);
  wrapSetter(Element.prototype,'innerHTML',trHTML);
  wrapSetter(HTMLElement.prototype,'innerText',Tr);
  wrapSetter(HTMLElement.prototype,'title',Tr);
  wrapSetter(HTMLInputElement.prototype,'placeholder',Tr);
  const sa=Element.prototype.setAttribute; Element.prototype.setAttribute=function(k,v){ return sa.call(this,k,(k==='title'||k==='placeholder'||k==='aria-label')&&typeof v==='string'?Tr(v):v); };
  const iah=Element.prototype.insertAdjacentHTML; Element.prototype.insertAdjacentHTML=function(p,h){ return iah.call(this,p,trHTML(h)); };
  const ctn=Document.prototype.createTextNode; Document.prototype.createTextNode=function(t){ return ctn.call(this,Tr(t)); };
  const C=CanvasRenderingContext2D.prototype;
  ['fillText','strokeText','measureText'].forEach(f=>{ const o=C[f]; C[f]=function(t,...a){ return o.call(this,Tr(String(t)),...a); }; });
  ['alert','confirm','prompt'].forEach(f=>{ const o=window[f]; window[f]=function(t,...a){ return o.call(window,Tr(String(t)),...a); }; });
})();
// the static page: run once the DOM exists (text nodes, titles, placeholders)
function i18nTranslateStatic(root){
  if(LANG!=='en') return;
  const w=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT);
  const nodes=[]; while(w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n=>{ const p=n.parentNode&&n.parentNode.nodeName; if(p==='SCRIPT'||p==='STYLE') return; const t=n.nodeValue; if(t&&t.trim()){ const r=Tr(t); if(r!==t) n.nodeValue=r; } });
  (root||document.body).querySelectorAll('[title],[placeholder]').forEach(e=>{ ['title','placeholder'].forEach(k=>{ const v=e.getAttribute(k); if(v){ const r=Tr(v); if(r!==v) e.setAttribute(k,r); } }); });
  document.title=Tr(document.title);
}
function setLanguage(l){ try{ localStorage.setItem('dl-lang',l); }catch(e){} location.reload(); }
document.documentElement.lang=LANG;
