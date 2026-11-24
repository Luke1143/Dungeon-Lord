// The options dialog: everything about view and graphics in one place (opened from the main menu, the gear button in a level, or the key O).
// A row is a table entry: { group (its tab), label, hint, choices:[[text,value]], get(), set(value) }. New settings are new rows.
const OPTION_ROWS=[
  { group:'Ansicht', label:'Ansicht', hint:'3D mit drehbarer Kamera (Q/E) oder die flache Karte. Taste V wechselt.', choices:[['3D',true],['2D',false]], get:()=>view3dOn, set:v=>setView3d(v) },
  { group:'Ansicht', label:'Hand als Zeiger', hint:'In der 3D-Ansicht folgt die schwebende Hand des Dungeon Lords dem Mauszeiger und wirft Licht (und die Kreaturen Schatten).', choices:[['An',true],['Aus',false]], get:()=>OPTIONS.hand!==false, set:v=>setOption('hand',v) },
  { group:'Licht', label:'Stimmungslicht', hint:'Fackeln und Feuer leuchten warm, der Rest ist dunkler, der Bildrand dunkelt ab (nur 3D).', choices:[['An',true],['Aus',false]], get:()=>OPTIONS.mood, set:v=>setOption('mood',v) },
  { group:'Licht', label:'Schatten unter Kreaturen', hint:'Ein weicher Schatten am Boden; die Figuren werfen zudem einen Schatten weg vom nächsten Licht (nur 3D).', choices:[['An',true],['Aus',false]], get:()=>OPTIONS.shadows, set:v=>setOption('shadows',v) },
  { group:'Licht', label:'Relief', hint:'Wände und Böden bekommen Tiefe: Fugen und Risse liegen tiefer, Steine und Bretter höher, das Licht fällt darauf. „Tief“ verschiebt die Muster zudem mit dem Blickwinkel (nur 3D).', choices:[['Aus',0],['Leicht',1],['Stark',2],['Tief',3]], get:()=>OPTIONS.relief, set:v=>setOption('relief',v) },
  { group:'Bild', label:'Bildeffekt', hint:'Ein Filter über dem 3D-Bild: weich, Röhrenmonitor, geglättete Pixel oder gemalt. Taste F wechselt.', choices:[['Aus',0],['Weich',1],['Röhre',2],['Röhre stark',3],['Pixel glatt',4],['Gemalt',5]], get:()=>View3D.post||0, set:v=>setPostLevel(v) },
  { group:'Bild', label:'Filter der Figuren', hint:'Wie die Figuren gezeichnet werden, unabhängig vom Bildeffekt der Umgebung: scharf, weich, in groben Pixeln, wie auf einer Röhre, grob mit scharfem Umriss oder mit einem Schein (nur 3D).', choices:FIG_LOOKS, get:()=>OPTIONS.figLook, set:v=>setOption('figLook',v) },
  { group:'Bild', label:'Figuren glatt', hint:'Die Pixel der Figuren werden vor dem Zeichnen kantengerichtet hochgerechnet: Treppen werden zu Schrägen und Rundungen, die Kanten bleiben scharf. Lässt sich mit jedem Figuren-Stil kombinieren (nur 3D).', choices:[['Aus',false],['An',true]], get:()=>OPTIONS.figSmooth, set:v=>setOption('figSmooth',v) },
  { group:'Bild', label:'Umriss der Figuren', hint:'Eine dunkle Linie um jede Figur, damit sie sich vom Boden abhebt (nur 3D, mit einem eigenen Figuren-Stil).', choices:[['Aus',false],['An',true]], get:()=>OPTIONS.outline, set:v=>setOption('outline',v) },
  { group:'Kreaturen', label:'Darstellung', hint:'Wie Kreaturen gezeichnet werden: als Figuren aus beweglichen Teilen (bisher der Imp; die anderen folgen) oder als die alten Pixel-Sprites.', choices:[['Figuren',"svg"],['Pixel (alt)',"pixel"]], get:()=>OPTIONS.figures, set:v=>setOption('figures',v) },
  { group:'Kreaturen', label:'Tiefe der alten Pixel-Sprites', hint:'Eine dunkle Kopie hinter jeder Figur lässt sie dicker wirken.', choices:[['An',true],['Aus',false]], get:()=>OPTIONS.depth, set:v=>setOption('depth',v) },
];
const OPTION_GROUPS=['Ansicht','Licht','Bild','Kreaturen'];       // the tabs of the dialog, in this order
let optionsTab='Ansicht';
function optionsRender(){
  const body=document.getElementById('optionsBody'); if(!body||document.getElementById('optionsDlg').hidden) return;
  const rows=OPTION_ROWS.map((r,i)=>[r,i]).filter(([r])=>r.group===optionsTab);
  body.innerHTML=`<div class="optTabs">${OPTION_GROUPS.map(g=>`<button data-otab="${g}" class="${g===optionsTab?'on':''}">${g}</button>`).join('')}</div>`
    +rows.map(([r,i])=>`<div class="optRow${r.choices.length>3?' optWide':''}"><div><b>${r.label}</b><small>${r.hint}</small></div><div class="optBtns">${r.choices.map((c,j)=>`<button data-opt="${i}:${j}" class="${r.get()===c[1]?'on':''}">${c[0]}</button>`).join('')}</div></div>`).join('');
  body.querySelectorAll('[data-otab]').forEach(b=>b.addEventListener('click',()=>{ optionsTab=b.dataset.otab; optionsRender(); }));
  body.querySelectorAll('[data-opt]').forEach(b=>b.addEventListener('click',()=>{ const [i,j]=b.dataset.opt.split(':').map(Number); OPTION_ROWS[i].set(OPTION_ROWS[i].choices[j][1]); if(typeof LudusHub!=='undefined') LudusHub.setLook({ post:View3D.post||0, relief:OPTIONS.relief, mood:OPTIONS.mood, shadows:OPTIONS.shadows, figLook:OPTIONS.figLook, outline:OPTIONS.outline, figSmooth:OPTIONS.figSmooth }); optionsRender(); }));
}
function optionsOpen(){ document.getElementById('optionsDlg').hidden=false; optionsRender(); }
function optionsClose(){ document.getElementById('optionsDlg').hidden=true; }
document.getElementById('optionsBtn').addEventListener('click',optionsOpen);
document.getElementById('menuOptions').addEventListener('click',optionsOpen);
document.getElementById('optionsClose').addEventListener('click',optionsClose);
document.getElementById('optionsDlg').addEventListener('click',e=>{ if(e.target.id==='optionsDlg') optionsClose(); });
