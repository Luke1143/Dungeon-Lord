// The picture finish for the 3D views (level and Ludus courtyard): the render goes to a texture first, a shader then softens or imitates a CRT screen; see docs/ui.md.
// Levels: 0 off, 1 soft, 2 CRT, 3 CRT strong.
function createPostFX(T){
  let rt, postScene, postCam, postMat, crtMat, postMesh, level=1, applied=-1, w=0, h=0, dprNow=1;
  const POST_LEVELS=[null,{ blur:1.0, bloom:0.12, vig:0.16, scale:1 },
    { crt:true, scale:0.5,  smear:1.0, scan:0.4,  mask:0.12, curve:0.06, vig:0.3,  bloom:0.35, quant:0 },
    { crt:true, scale:0.34, smear:1.35, scan:0.62, mask:0.25, curve:0.11, vig:0.45, bloom:0.5,  quant:24 }];
  function initPost(){
    rt=new T.WebGLRenderTarget(2,2,{ minFilter:T.LinearFilter, magFilter:T.LinearFilter, depthBuffer:true });
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
  function sizePost(){ if(!w) return; const p=POST_LEVELS[level]||POST_LEVELS[1], pr=Math.min(2,dprNow||1); rtScale=p.scale; const rtW=Math.max(2,Math.round(w*pr*p.scale)), rtH=Math.max(2,Math.round(h*pr*p.scale)); rt.setSize(rtW,rtH); postMat.uniforms.px.value.set(1/rtW,1/rtH); crtMat.uniforms.texSize.value.set(rtW,rtH); }
  function applyPost(){
    const p=POST_LEVELS[level]; if(!p) return;
    if(p.crt){ Object.keys(p).forEach(k=>{ if(crtMat.uniforms[k]) crtMat.uniforms[k].value=p[k]; }); postMesh.material=crtMat; }
    else { postMat.uniforms.blur.value=p.blur; postMat.uniforms.bloom.value=p.bloom; postMat.uniforms.vig.value=p.vig; postMesh.material=postMat; }
    sizePost(); applied=level;
  }
  initPost();
  return {
    get level(){ return level; }, setLevel(n){ level=Math.max(0,Math.min(3,n|0)); applied=-1; },
    resize(cssW,cssH,dpr){ w=cssW; h=cssH; dprNow=dpr||1; sizePost(); },
    // true when it drew the picture (the caller draws it plain otherwise)
    render(renderer,scene,camera){ if(!level) return false; if(applied!==level) applyPost(); renderer.setRenderTarget(rt); renderer.render(scene,camera); renderer.setRenderTarget(null); renderer.render(postScene,postCam); return true; }
  };
}
