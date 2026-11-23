// The picture finish for the 3D views (level and Ludus courtyard): the render goes to a texture first, a shader then softens or imitates a CRT screen; see docs/ui.md.
// Levels: 0 off, 1 soft, 2 CRT, 3 CRT strong (both flat: the scan lines, mask and glow of a tube without its curved glass),
// 4 smooth pixels (the picture rendered small, then grown back with an edge-directed upscaler that turns stair steps into diagonals and curves),
// 5 painted (a Kuwahara filter: every point takes the colour of its calmest neighbourhood, so surfaces become brush strokes and edges stay sharp).
// The painted level paints only the world: the figures (layer 2, FIGURE_LAYER) are drawn into a second target that shares the world's depth (walls still hide them)
// and laid over the painting unfiltered, so they stay recognisable.
const FIGURE_LAYER=2;
// The figures' own look (option "Figuren", user November 2026: the player's brain fills in what is only hinted at). With a look other than 0 the figures
// are drawn apart from the world, at full resolution, into their own picture (a depth pass of the world first, so walls and props still hide them),
// styled there and laid over the filtered world: the world keeps its filter (and its relief), the figures get theirs.
// 0 like the world (no split; the painted world still keeps them out of its paint), 1 sharp, 2 soft (shrunk and grown back), 3 coarse (big pixels),
// 4 tube (scan lines and a sideways smear, as on a picture tube), 5 layers (coarse inside, the sharp silhouette around it),
// 6 glow (the sharp figure in a soft halo of its own colours). Apart from the look, the sprites themselves can be grown smoothly first (option "Figuren glatt",
// a pixel-art upscaler in view3d.js); that stacks with every look: smooth + soft, smooth + tube ...
// The cells follow each figure's own distance (read from the depth of the figures' picture), so a far figure is not smeared away. The outline (option "Umriss") is a dark line of one screen pixel around the silhouette.
const FIG_LOOKS=[['Wie die Welt',0],['Scharf',1],['Weich',2],['Grob',3],['Röhre',4],['Schichten',5],['Schein',6]];
// relief (bump mapping, docs/ui.md): the height of a pixel texture is the brightness of its pattern (bright = high, dark = low: mortar and cracks sink,
// stones and planks rise); the light then falls on every texel as on a slope. RELIEF_SCALE: the strength of the levels light and strong.
const RELIEF_SCALE=[0,6,14,6];
function bumpCanvasOf(src){
  const c=document.createElement('canvas'); c.width=src.width; c.height=src.height; const g=c.getContext('2d'); g.drawImage(src,0,0);
  const im=g.getImageData(0,0,c.width,c.height), d=im.data;
  for(let i=0;i<d.length;i+=4){ const l=Math.round(0.3*d[i]+0.59*d[i+1]+0.11*d[i+2]); d[i]=d[i+1]=d[i+2]=l; d[i+3]=255; }
  g.putImageData(im,0,0); return c;
}
// parallax occlusion mapping (relief level 3, "deep"): before the texture is read, a short ray steps from the eye into the height map until it meets
// the surface; the texture and the relief are then read where it met. Patterns shift with the angle of view, high stones hide the joints behind them.
// It hooks into three's own Lambert shader (onBeforeCompile): the tangent frame comes from the screen derivatives (no tangents in the geometry needed).
const POM_SCALE=0.07;
const POM_GLSL=`
uniform sampler2D pomMap; uniform float pomScale; vec2 pomUv;
float pomDepth(vec2 uv){ return 1.0-textureLod(pomMap,uv,0.0).r; }
vec2 pomFind(){
  vec3 V=normalize(vViewPosition), p=-vViewPosition, q0=dFdx(p), q1=dFdy(p); vec2 st0=dFdx(vMapUv), st1=dFdy(vMapUv);
  vec3 N=normalize(vNormal); if(!gl_FrontFacing) N=-N;
  vec3 q1p=cross(q1,N), q0p=cross(N,q0), Tg=q1p*st0.x+q0p*st1.x, Bg=q1p*st0.y+q0p*st1.y;
  float det=max(dot(Tg,Tg),dot(Bg,Bg)); if(det<=0.0) return vMapUv;
  float s=inversesqrt(det); Tg*=s; Bg*=s;
  vec3 Vt=vec3(dot(V,Tg),dot(V,Bg),dot(V,N));
  float layers=mix(24.0,8.0,clamp(abs(Vt.z),0.0,1.0)), stepD=1.0/layers;
  vec2 d=Vt.xy/max(Vt.z,0.2)*pomScale/layers, uv=vMapUv; float cur=0.0, dep=pomDepth(uv);
  for(int i=0;i<32;i++){ if(cur>=dep||float(i)>=layers) break; uv-=d; dep=pomDepth(uv); cur+=stepD; }
  vec2 prev=uv+d; float after=dep-cur, before=pomDepth(prev)-cur+stepD; float w=after/(after-before+1e-5);
  return mix(uv,prev,clamp(w,0.0,1.0));
}
`;
function pomInstall(T,m){
  m.onBeforeCompile=sh=>{
    if(!m.defines||m.defines.USE_POM===undefined||!m.userData.bump) return;
    sh.uniforms.pomMap={ value:m.userData.bump }; sh.uniforms.pomScale={ value:POM_SCALE };
    const bump=T.ShaderChunk.bumpmap_pars_fragment.split('texture2D( bumpMap, vBumpMapUv').join('texture2D( bumpMap, pomUv');
    sh.fragmentShader=sh.fragmentShader.replace('#include <bumpmap_pars_fragment>',POM_GLSL+bump)
      .replace('#include <map_fragment>','pomUv=pomFind();\n'+T.ShaderChunk.map_fragment.split('vMapUv').join('pomUv'));
  };
  m.customProgramCacheKey=()=>(m.defines&&m.defines.USE_POM!==undefined)?'pom':'plain';
}
// a material's relief by the level (0 off, 1 light, 2 strong, 3 deep: light bump with parallax occlusion)
function reliefApply(m,level){
  const on=level>0&&m.userData.bump; m.bumpMap=on?m.userData.bump:null; m.bumpScale=RELIEF_SCALE[level]||0;
  m.defines=Object.assign({},m.defines||{}); if(level===3&&on) m.defines.USE_POM=''; else delete m.defines.USE_POM;
  m.needsUpdate=true;
}
function bumpTextureOf(T,canvas,repeat){ const t=new T.CanvasTexture(canvas); t.magFilter=T.LinearFilter; t.minFilter=T.LinearFilter;       /* slopes, not lines */ t.generateMipmaps=false; if(repeat) t.wrapS=t.wrapT=T.RepeatWrapping; return t; }
function createPostFX(T){
  let rt, rtFig, postScene, postCam, postMat, crtMat, smoothMat, paintMat, postMesh, level=1, applied=-1, w=0, h=0, dprNow=1;
  let rtF, figScene, figMat, figLook=0, outline=0, texel=4;       // the figures' own look (see FIG_LOOKS)
  const PASS={ blur:0, bloom:0, vig:0, scale:1 };       // no world filter, while the figures have their own look
  const POST_LEVELS=[null,{ blur:1.0, bloom:0.12, vig:0.16, scale:1 },
    { crt:true, scale:0.5,  smear:1.0, scan:0.4,  mask:0.12, curve:0, vig:0.3,  bloom:0.35, quant:0 },
    { crt:true, scale:0.34, smear:1.35, scan:0.62, mask:0.25, curve:0, vig:0.45, bloom:0.5,  quant:24 },
    { smooth:true, scale:0.5, vig:0.2 },       // rendered at half size; the shader works on a grid of half that again
    { paint:true, split:true, scale:0.5, radius:3, vig:0.25, detail:0.8 }];
  function initPost(){
    rt=new T.WebGLRenderTarget(2,2,{ minFilter:T.LinearFilter, magFilter:T.LinearFilter, depthBuffer:true }); rt.depthTexture=new T.DepthTexture(2,2);
    rtFig=new T.WebGLRenderTarget(2,2,{ minFilter:T.LinearFilter, magFilter:T.LinearFilter, depthBuffer:true }); rtFig.depthTexture=rt.depthTexture;       // the figures see the world's depth
    postCam=new T.OrthographicCamera(-1,1,1,-1,0,1); postScene=new T.Scene();
    postMat=new T.ShaderMaterial({ depthTest:false, depthWrite:false,
      uniforms:{ tDiffuse:{ value:rt.texture }, px:{ value:new T.Vector2(1,1) }, blur:{ value:1 }, bloom:{ value:0.1 }, vig:{ value:0.2 } },
      vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
      fragmentShader:`uniform sampler2D tDiffuse; uniform vec2 px; uniform float blur; uniform float bloom; uniform float vig; varying vec2 vUv;
        vec3 s(vec2 o){ return texture2D(tDiffuse,vUv+o).rgb; }
        void main(){
          vec2 o=px*blur;
          vec3 c=s(vec2(0.0))*0.25 + (s(vec2(o.x,0.0))+s(vec2(-o.x,0.0))+s(vec2(0.0,o.y))+s(vec2(0.0,-o.y)))*0.125 + (s(o)+s(-o)+s(vec2(o.x,-o.y))+s(vec2(-o.x,o.y)))*0.0625;
          vec2 w=o*3.0;
          vec3 wide=(s(vec2(w.x,0.0))+s(vec2(-w.x,0.0))+s(vec2(0.0,w.y))+s(vec2(0.0,-w.y))+s(w)+s(-w)+s(vec2(w.x,-w.y))+s(vec2(-w.x,w.y)))*0.125;
          c+=max(wide-vec3(0.45),vec3(0.0))*bloom*2.0;
          vec2 d=vUv-0.5; c*=1.0-vig*dot(d,d)*2.4;
          gl_FragColor=vec4(c,1.0);
          #include <colorspace_fragment>
        }` });
    postMesh=new T.Mesh(new T.PlaneGeometry(2,2),postMat); postScene.add(postMesh);
    // smooth pixels: for every point of the screen, its pixel of the small picture and where in it the point lies; a corner whose two neighbours agree with each other
    // (and not with the pixel) is cut along the diagonal, softly, as the upscalers of pixel art do; the cut grows rounder where the neighbours of those agree too
    smoothMat=new T.ShaderMaterial({ depthTest:false, depthWrite:false,
      uniforms:{ tDiffuse:{ value:rt.texture }, texSize:{ value:new T.Vector2(2,2) }, vig:{ value:0.2 } },
      vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
      fragmentShader:`uniform sampler2D tDiffuse; uniform vec2 texSize; uniform float vig; varying vec2 vUv;
        // the coarse picture is half the rendered one: each coarse pixel is the mean of four fine ones (one linear read at their shared corner), so textures do not flicker
        vec2 grid(){ return floor(texSize*0.5); }
        vec3 at(vec2 p){ return texture2D(tDiffuse,(p*2.0+1.0)/texSize).rgb; }
        bool same(vec3 a,vec3 b){ vec3 d=a-b; return dot(d,d)<0.006; }
        bool edge(vec3 a,vec3 b){ vec3 d=a-b; return dot(d,d)>0.05; }       // a real edge, not the grain of a texture
        void main(){
          vec2 q=vUv*grid(), p=floor(q), f=q-p-0.5;       // f: -0.5 .. 0.5 inside the coarse pixel
          vec2 s=sign(f+1e-5);                             // the corner the point lies towards
          vec3 C=at(p), H=at(p+vec2(s.x,0.0)), V=at(p+vec2(0.0,s.y)), D=at(p+s);
          vec3 col=C;
          if(same(H,V)&&edge(C,H)){
            // how far the point lies past the diagonal of its corner; a longer edge (the neighbours beyond agree as well) cuts at a flatter angle
            bool longH=same(at(p+vec2(-s.x,s.y)),V), longV=same(at(p+vec2(s.x,-s.y)),H);
            vec2 a=abs(f)*2.0; float t=(longH&&!longV)?a.x*0.5+a.y:((longV&&!longH)?a.x+a.y*0.5:a.x+a.y);
            float cut=smoothstep(0.95,1.25,t);
            col=mix(C,(H+V)*0.5,cut);
          }
          vec2 e=vUv-0.5; col*=1.0-vig*dot(e,e)*2.4;
          gl_FragColor=vec4(col,1.0);
          #include <colorspace_fragment>
        }` });
    // painted: Kuwahara; of the four squares around the point (radius r), the one whose colours vary least gives its mean
    paintMat=new T.ShaderMaterial({ depthTest:false, depthWrite:false,
      uniforms:{ tDiffuse:{ value:rt.texture }, tFig:{ value:rtFig.texture }, useFig:{ value:0 }, px:{ value:new T.Vector2(1,1) }, radius:{ value:3 }, vig:{ value:0.25 }, detail:{ value:0.8 } },
      vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
      fragmentShader:`uniform sampler2D tDiffuse; uniform sampler2D tFig; uniform float useFig; uniform vec2 px; uniform float radius; uniform float vig; uniform float detail; varying vec2 vUv;
        void main(){
          vec3 m[4]; vec3 s2[4];
          for(int k=0;k<4;k++){ m[k]=vec3(0.0); s2[k]=vec3(0.0); }
          float n=0.0;
          for(int j=0;j<=4;j++){ for(int i=0;i<=4;i++){
            if(float(i)>radius||float(j)>radius) continue;
            vec2 o=vec2(float(i),float(j))*px;
            vec3 a=texture2D(tDiffuse,vUv+vec2(-o.x,-o.y)).rgb, b=texture2D(tDiffuse,vUv+vec2(o.x,-o.y)).rgb, c=texture2D(tDiffuse,vUv+vec2(-o.x,o.y)).rgb, d=texture2D(tDiffuse,vUv+o).rgb;
            m[0]+=a; s2[0]+=a*a; m[1]+=b; s2[1]+=b*b; m[2]+=c; s2[2]+=c*c; m[3]+=d; s2[3]+=d*d; n+=1.0; } }
          vec3 col=vec3(0.0); float best=1e9;
          for(int k=0;k<4;k++){ vec3 mu=m[k]/n; vec3 v=s2[k]/n-mu*mu; float sv=v.r+v.g+v.b; if(sv<best){ best=sv; col=mu; } }
          // the paint takes the colour; the fine light and dark (joints, the relief's shading, the parallax) come back on top: the point's brightness against its neighbourhood's
          vec3 here=texture2D(tDiffuse,vUv).rgb, around=(m[0]+m[1]+m[2]+m[3])/(4.0*n); float dl=dot(here-around,vec3(0.3,0.59,0.11));
          col=max(col+dl*detail*(0.6+0.4*col/max(dot(col,vec3(0.333)),0.02)),vec3(0.0));
          if(useFig>0.5){ vec4 fg=texture2D(tFig,vUv); col=mix(col,fg.rgb,fg.a); }       // the figures, unpainted
          vec2 e=vUv-0.5; col*=1.0-vig*dot(e,e)*2.4;
          gl_FragColor=vec4(col,1.0);
          #include <colorspace_fragment>
        }` });
    // the figures' picture: their own colour target at full size with its own depth (filled by a depth pass of the world)
    rtF=new T.WebGLRenderTarget(2,2,{ minFilter:T.LinearFilter, magFilter:T.LinearFilter, depthBuffer:true }); rtF.depthTexture=new T.DepthTexture(2,2);
    figScene=new T.Scene();
    figMat=new T.ShaderMaterial({ depthTest:false, depthWrite:false, transparent:true, blending:T.CustomBlending, blendSrc:T.OneFactor, blendDst:T.OneMinusSrcAlphaFactor,
      uniforms:{ tFig:{ value:rtF.texture }, tDep:{ value:rtF.depthTexture }, cam:{ value:new T.Vector3(0.1,200,0.4) }, size:{ value:new T.Vector2(2,2) }, mode:{ value:1 }, spx0:{ value:4 }, outline:{ value:0 }, ow:{ value:1 }, vig:{ value:0 } },
      vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
      fragmentShader:`uniform sampler2D tFig; uniform sampler2D tDep; uniform vec3 cam; uniform vec2 size; uniform float mode; uniform float spx0; uniform float outline; uniform float ow; uniform float vig; varying vec2 vUv;
        vec4 at(vec2 p){ return texture2D(tFig,p/size); }                       // p in pixels of the figures' picture; colours are premultiplied
        vec4 cm(vec2 c,float k){ vec2 o=c*k; return (at(o+vec2(0.25,0.25)*k)+at(o+vec2(0.75,0.25)*k)+at(o+vec2(0.25,0.75)*k)+at(o+vec2(0.75,0.75)*k))*0.25; }   // a coarse cell's mean
        // how big one pixel of a figure's sprite is here (in pixels of this picture): from the distance of the nearest figure around (the depth of its pixels);
        // cam = near, far, tan(half the vertical field of view); a figure's sprite is 16 pixels to its 0.88 tiles
        float dep(vec2 p){ return texture2D(tDep,p/size).r; }
        float spxAt(vec2 px){
          float d=1.0; if(at(px).a>0.3) d=dep(px);
          for(int r=0;r<3;r++){ float rr=(r==0?3.0:(r==1?8.0:16.0))*ow;
            for(int j=0;j<4;j++){ vec2 q=px+vec2(j==0?rr:(j==1?-rr:0.0),j==2?rr:(j==3?-rr:0.0)); if(at(q).a>0.3) d=min(d,dep(q)); } }
          if(d>=1.0) return spx0;
          float z=cam.x*cam.y/(cam.y-d*(cam.y-cam.x));
          return size.y/(2.0*z*cam.z)*0.88/16.0;
        }
        void main(){
          vec2 px=vUv*size; vec4 c=at(px); float k, spx=mode>1.5&&mode<6.5?spxAt(px):spx0;
          if(mode<1.5){ }
          else if(mode<2.5){       // soft: shrunk to cells of up to one sprite pixel, grown back smoothly
            k=max(1.0,spx*clamp((spx-1.5)/3.0,0.3,1.0)); vec2 g=px/k-0.5, i=floor(g), f=fract(g);       // a small (far) figure is softened less, so it stays readable
            c=mix(mix(cm(i,k),cm(i+vec2(1.0,0.0),k),f.x),mix(cm(i+vec2(0.0,1.0),k),cm(i+1.0,k),f.x),f.y);
          } else if(mode<3.5){     // coarse: cells of two sprite pixels
            k=max(3.0,spx*2.0); c=cm(floor(px/k),k);
          } else if(mode<4.5){     // tube: rows of one sprite pixel, smeared sideways, bright rows fatter beams, the screen's stripes
            k=max(2.0,spx); float row=floor(px.y/k), fy=fract(px.y/k), y=(row+0.5)*k; vec4 a=vec4(0.0); float wsum=0.0;
            for(int j=-3;j<=3;j++){ float fj=float(j), wj=exp(-fj*fj/2.2); a+=at(vec2(px.x+fj*k*0.45,y))*wj; wsum+=wj; }
            c=a/wsum; float lum=dot(c.rgb,vec3(0.3,0.59,0.11))/max(c.a,0.001), d=(fy-0.5)*2.0, beam=exp(-d*d*mix(5.0,1.6,clamp(lum*1.4,0.0,1.0)));
            vec3 tri=0.5+0.5*cos(6.2832*(gl_FragCoord.x/3.0-vec3(0.0,0.3333,0.6667)));
            c.rgb*=(beam*1.2+0.05)*(0.8+0.4*tri); c.a*=mix(1.0,beam,0.35);
          } else if(mode<5.5){     // layers: the coarse colour inside, the sharp silhouette around it
            k=max(3.0,spx*2.0); vec4 q=cm(floor(px/k),k); c=q.a>0.05?vec4(q.rgb/q.a*c.a,c.a):c;
          } else {                 // glow: the sharp figure in a soft halo of its own colours
            k=max(2.0,spx*1.5); vec4 h=vec4(0.0); for(int j=0;j<12;j++){ float an=float(j)*0.5236; h+=at(px+vec2(cos(an),sin(an))*k*1.6)+at(px+vec2(cos(an+0.26),sin(an+0.26))*k*3.2)*0.6; }
            h/=19.2; c=c+h*0.75*(1.0-c.a);
          }
          if((outline>0.5||(mode>4.5&&mode<5.5))&&c.a<0.5){       // a dark line around the silhouette (the layers always have it)
            float n=max(max(at(px+vec2(ow,0.0)).a,at(px-vec2(ow,0.0)).a),max(at(px+vec2(0.0,ow)).a,at(px-vec2(0.0,ow)).a));
            if(n>0.5) c=mix(c,vec4(0.035,0.028,0.03,1.0),0.9);
          }
          if(c.a<0.004) discard;
          vec2 e=vUv-0.5; float v=1.0-vig*dot(e,e)*2.4;
          gl_FragColor=vec4(c.rgb/c.a*v,min(c.a,1.0));
          #include <colorspace_fragment>
          gl_FragColor.rgb*=gl_FragColor.a;
        }` });
    figScene.add(new T.Mesh(new T.PlaneGeometry(2,2),figMat));
    crtMat=new T.ShaderMaterial({ depthTest:false, depthWrite:false,
      uniforms:{ tDiffuse:{ value:rt.texture }, texSize:{ value:new T.Vector2(2,2) }, smear:{ value:1 }, scan:{ value:0.4 }, mask:{ value:0.1 }, curve:{ value:0.06 }, vig:{ value:0.3 }, bloom:{ value:0.3 }, quant:{ value:0 } },
      vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
      fragmentShader:`uniform sampler2D tDiffuse; uniform vec2 texSize; uniform float smear; uniform float scan; uniform float mask; uniform float curve; uniform float vig; uniform float bloom; uniform float quant; varying vec2 vUv;
        vec3 rgb2yiq(vec3 c){ return vec3(dot(c,vec3(0.299,0.587,0.114)), dot(c,vec3(0.596,-0.274,-0.322)), dot(c,vec3(0.211,-0.523,0.312))); }
        vec3 yiq2rgb(vec3 q){ return vec3(q.x+0.956*q.y+0.621*q.z, q.x-0.272*q.y-0.647*q.z, q.x-1.106*q.y+1.703*q.z); }
        float bayer(vec2 p){ vec2 q=mod(floor(p),4.0); float i=q.x+q.y*4.0;
          return (i<0.5?0.0:i<1.5?8.0:i<2.5?2.0:i<3.5?10.0:i<4.5?12.0:i<5.5?4.0:i<6.5?14.0:i<7.5?6.0:i<8.5?3.0:i<9.5?11.0:i<10.5?1.0:i<11.5?9.0:i<12.5?15.0:i<13.5?7.0:i<14.5?13.0:5.0)/16.0; }
        void main(){
          vec2 c=vUv*2.0-1.0; c*=1.0+curve*dot(c,c); vec2 uv=c*0.5+0.5;
          if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0){ gl_FragColor=vec4(0.0,0.0,0.0,1.0); return; }
          float row=floor(uv.y*texSize.y), fy=fract(uv.y*texSize.y); float vy=(row+0.5)/texSize.y;
          float tx=1.0/texSize.x; float y=0.0; vec2 iq=vec2(0.0); float wy=0.0, wc=0.0;
          for(int k=-4;k<=4;k++){ float fk=float(k);
            vec3 q=rgb2yiq(texture2D(tDiffuse,vec2(uv.x+fk*tx*smear*0.7,vy)).rgb);
            float a=exp(-fk*fk/(2.0*0.9*0.9)); float b=exp(-fk*fk/(2.0*2.4*2.4));
            y+=q.x*a; wy+=a; iq+=q.yz*b; wc+=b; }
          vec3 col=yiq2rgb(vec3(y/wy,iq/wc));
          // glow: the bright parts leak into their surroundings
          vec3 g=vec3(0.0); for(int k=1;k<=3;k++){ float fk=float(k)*3.0; g+=texture2D(tDiffuse,vec2(uv.x+fk*tx,vy)).rgb+texture2D(tDiffuse,vec2(uv.x-fk*tx,vy)).rgb+texture2D(tDiffuse,vec2(uv.x,vy+fk/texSize.y)).rgb+texture2D(tDiffuse,vec2(uv.x,vy-fk/texSize.y)).rgb; }
          col+=max(g/12.0-vec3(0.35),vec3(0.0))*bloom;
          // scan lines: a bright row is a fatter beam than a dark one
          float lum=dot(col,vec3(0.3,0.59,0.11)); float d=(fy-0.5)*2.0; float beam=exp(-d*d*mix(7.0,2.0,clamp(lum*1.4,0.0,1.0)));
          col*=mix(1.0,beam*1.15+0.04,scan);
          // the stripes of the screen
          vec3 tri=0.5+0.5*cos(6.2832*(gl_FragCoord.x/3.0-vec3(0.0,0.3333,0.6667)));
          col*=mix(vec3(1.0),0.78+0.44*tri,mask);
          vec2 e=vUv-0.5; col*=1.0-vig*dot(e,e)*2.4;
          if(quant>1.0){ col=floor(col*quant+bayer(gl_FragCoord.xy))/quant; }
          gl_FragColor=vec4(max(col,vec3(0.0)),1.0);
          #include <colorspace_fragment>
        }` });
  }
  let rtScale=1;
  function sizePost(){ if(!w) return; const p=POST_LEVELS[level]||(figLook?PASS:POST_LEVELS[1]), pr=Math.min(2,dprNow||1); rtScale=p.scale; const rtW=Math.max(2,Math.round(w*pr*p.scale)), rtH=Math.max(2,Math.round(h*pr*p.scale)); rt.setSize(rtW,rtH); rtFig.setSize(rtW,rtH); { const fw=Math.max(2,Math.round(w*pr)), fh=Math.max(2,Math.round(h*pr)); rtF.setSize(fw,fh); figMat.uniforms.size.value.set(fw,fh); figMat.uniforms.ow.value=Math.max(1,Math.round(pr)); } postMat.uniforms.px.value.set(1/rtW,1/rtH); crtMat.uniforms.texSize.value.set(rtW,rtH); smoothMat.uniforms.texSize.value.set(rtW,rtH); paintMat.uniforms.px.value.set(1/rtW,1/rtH); }
  function applyPost(){
    const p=POST_LEVELS[level]||(figLook?PASS:null); if(!p) return;
    figMat.uniforms.mode.value=figLook; figMat.uniforms.outline.value=outline; figMat.uniforms.vig.value=p.vig||0;
    if(p.crt){ Object.keys(p).forEach(k=>{ if(crtMat.uniforms[k]) crtMat.uniforms[k].value=p[k]; }); postMesh.material=crtMat; }
    else if(p.smooth){ smoothMat.uniforms.vig.value=p.vig; postMesh.material=smoothMat; }
    else if(p.paint){ paintMat.uniforms.radius.value=p.radius; paintMat.uniforms.detail.value=p.detail||0; paintMat.uniforms.vig.value=p.vig; paintMat.uniforms.useFig.value=p.split&&!figLook?1:0; postMesh.material=paintMat; }
    else { postMat.uniforms.blur.value=p.blur; postMat.uniforms.bloom.value=p.bloom; postMat.uniforms.vig.value=p.vig; postMesh.material=postMat; }
    sizePost(); applied=level;
  }
  initPost();
  return {
    get level(){ return level; }, setLevel(n){ level=Math.max(0,Math.min(POST_LEVELS.length-1,n|0)); applied=-1; },
    get figLook(){ return figLook; }, setFigLook(n,line){ figLook=Math.max(0,Math.min(FIG_LOOKS.length-1,n|0)); outline=line?1:0; applied=-1; },
    // how big one pixel of a figure's sprite is on the screen (in pixels of the picture), so that soft, coarse and tube follow the zoom
    setTexel(v){ texel=v; if(figMat) figMat.uniforms.spx0.value=Math.max(1,v); },
    resize(cssW,cssH,dpr){ w=cssW; h=cssH; dprNow=dpr||1; sizePost(); },
    // true when it drew the picture (the caller draws it plain otherwise)
    render(renderer,scene,camera){
      const own=figLook>0;
      if(!level&&!own) return false; if(applied!==level) applyPost();
      const p=POST_LEVELS[level]||PASS, mask=camera.layers.mask;
      if(p.split&&!own){
        camera.layers.set(0); renderer.setRenderTarget(rt); renderer.render(scene,camera);       // the world, with its depth
        // the figures into their own picture: cleared to nothing (not the depth, which is the world's), no background
        const bg=scene.background, cc=renderer.getClearColor(new T.Color()), ca=renderer.getClearAlpha(), auto=renderer.autoClear;
        scene.background=null; renderer.setClearColor(0x000000,0); renderer.setRenderTarget(rtFig); renderer.clear(true,false,false); renderer.autoClear=false;
        camera.layers.set(FIGURE_LAYER); renderer.render(scene,camera);
        renderer.autoClear=auto; renderer.setClearColor(cc,ca); scene.background=bg;
      } else { if(own) camera.layers.set(0); renderer.setRenderTarget(rt); renderer.render(scene,camera); }
      if(own){
        figMat.uniforms.cam.value.set(camera.near,camera.far,Math.tan((camera.fov||45)*Math.PI/360));
        // the figures' picture: the world's depth only (no colour: the colour mask is locked shut), then the figures in colour
        const bg=scene.background, cc=renderer.getClearColor(new T.Color()), ca=renderer.getClearAlpha(), auto=renderer.autoClear, cb=renderer.state.buffers.color;
        scene.background=null; renderer.setClearColor(0x000000,0); renderer.setRenderTarget(rtF); renderer.clear(true,true,false); renderer.autoClear=false;
        camera.layers.set(0); cb.setMask(false); cb.setLocked(true); renderer.render(scene,camera); cb.setLocked(false); cb.setMask(true);
        camera.layers.set(FIGURE_LAYER); renderer.render(scene,camera);
        renderer.autoClear=auto; renderer.setClearColor(cc,ca); scene.background=bg;
      }
      camera.layers.mask=mask; renderer.setRenderTarget(null); renderer.render(postScene,postCam);
      if(own){ const auto=renderer.autoClear; renderer.autoClear=false; renderer.render(figScene,postCam); renderer.autoClear=auto; }       // the styled figures over the filtered world
      return true;
    }
  };
}
