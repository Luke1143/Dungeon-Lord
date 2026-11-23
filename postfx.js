// The picture finish for the 3D views (level and Ludus courtyard): the render goes to a texture first, a shader then softens or imitates a CRT screen; see docs/ui.md.
// Levels: 0 off, 1 soft, 2 CRT, 3 CRT strong (both flat: the scan lines, mask and glow of a tube without its curved glass),
// 4 smooth pixels (the picture rendered small, then grown back with an edge-directed upscaler that turns stair steps into diagonals and curves),
// 5 painted (a Kuwahara filter: every point takes the colour of its calmest neighbourhood, so surfaces become brush strokes and edges stay sharp).
// The painted level paints only the world: the figures (layer 2, FIGURE_LAYER) are drawn into a second target that shares the world's depth (walls still hide them)
// and laid over the painting unfiltered, so they stay recognisable.
const FIGURE_LAYER=2;
function createPostFX(T){
  let rt, rtFig, postScene, postCam, postMat, crtMat, smoothMat, paintMat, postMesh, level=1, applied=-1, w=0, h=0, dprNow=1;
  const POST_LEVELS=[null,{ blur:1.0, bloom:0.12, vig:0.16, scale:1 },
    { crt:true, scale:0.5,  smear:1.0, scan:0.4,  mask:0.12, curve:0, vig:0.3,  bloom:0.35, quant:0 },
    { crt:true, scale:0.34, smear:1.35, scan:0.62, mask:0.25, curve:0, vig:0.45, bloom:0.5,  quant:24 },
    { smooth:true, scale:0.5, vig:0.2 },       // rendered at half size; the shader works on a grid of half that again
    { paint:true, split:true, scale:0.5, radius:3, vig:0.25 }];
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
      uniforms:{ tDiffuse:{ value:rt.texture }, tFig:{ value:rtFig.texture }, useFig:{ value:0 }, px:{ value:new T.Vector2(1,1) }, radius:{ value:3 }, vig:{ value:0.25 } },
      vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
      fragmentShader:`uniform sampler2D tDiffuse; uniform sampler2D tFig; uniform float useFig; uniform vec2 px; uniform float radius; uniform float vig; varying vec2 vUv;
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
          if(useFig>0.5){ vec4 fg=texture2D(tFig,vUv); col=mix(col,fg.rgb,fg.a); }       // the figures, unpainted
          vec2 e=vUv-0.5; col*=1.0-vig*dot(e,e)*2.4;
          gl_FragColor=vec4(col,1.0);
          #include <colorspace_fragment>
        }` });
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
  function sizePost(){ if(!w) return; const p=POST_LEVELS[level]||POST_LEVELS[1], pr=Math.min(2,dprNow||1); rtScale=p.scale; const rtW=Math.max(2,Math.round(w*pr*p.scale)), rtH=Math.max(2,Math.round(h*pr*p.scale)); rt.setSize(rtW,rtH); rtFig.setSize(rtW,rtH); postMat.uniforms.px.value.set(1/rtW,1/rtH); crtMat.uniforms.texSize.value.set(rtW,rtH); smoothMat.uniforms.texSize.value.set(rtW,rtH); paintMat.uniforms.px.value.set(1/rtW,1/rtH); }
  function applyPost(){
    const p=POST_LEVELS[level]; if(!p) return;
    if(p.crt){ Object.keys(p).forEach(k=>{ if(crtMat.uniforms[k]) crtMat.uniforms[k].value=p[k]; }); postMesh.material=crtMat; }
    else if(p.smooth){ smoothMat.uniforms.vig.value=p.vig; postMesh.material=smoothMat; }
    else if(p.paint){ paintMat.uniforms.radius.value=p.radius; paintMat.uniforms.vig.value=p.vig; paintMat.uniforms.useFig.value=p.split?1:0; postMesh.material=paintMat; }
    else { postMat.uniforms.blur.value=p.blur; postMat.uniforms.bloom.value=p.bloom; postMat.uniforms.vig.value=p.vig; postMesh.material=postMat; }
    sizePost(); applied=level;
  }
  initPost();
  return {
    get level(){ return level; }, setLevel(n){ level=Math.max(0,Math.min(POST_LEVELS.length-1,n|0)); applied=-1; },
    resize(cssW,cssH,dpr){ w=cssW; h=cssH; dprNow=dpr||1; sizePost(); },
    // true when it drew the picture (the caller draws it plain otherwise)
    render(renderer,scene,camera){
      if(!level) return false; if(applied!==level) applyPost();
      const p=POST_LEVELS[level], mask=camera.layers.mask;
      if(p&&p.split){
        camera.layers.set(0); renderer.setRenderTarget(rt); renderer.render(scene,camera);       // the world, with its depth
        // the figures into their own picture: cleared to nothing (not the depth, which is the world's), no background
        const bg=scene.background, cc=renderer.getClearColor(new T.Color()), ca=renderer.getClearAlpha(), auto=renderer.autoClear;
        scene.background=null; renderer.setClearColor(0x000000,0); renderer.setRenderTarget(rtFig); renderer.clear(true,false,false); renderer.autoClear=false;
        camera.layers.set(FIGURE_LAYER); renderer.render(scene,camera);
        renderer.autoClear=auto; renderer.setClearColor(cc,ca); scene.background=bg;
      } else { renderer.setRenderTarget(rt); renderer.render(scene,camera); }
      camera.layers.mask=mask; renderer.setRenderTarget(null); renderer.render(postScene,postCam); return true;
    }
  };
}
