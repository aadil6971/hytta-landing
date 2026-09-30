/* ==========================================================================
   HYTTA — the fjord, drawn in a fragment shader.
   One full-screen pass: sky, four ridge layers, rising mist, still water
   with reflections, a cabin on a headland, stars and aurora. A single number
   (0..1, "how far through the day") drives everything.
   ========================================================================== */
(function () {
  'use strict';

  var VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 uRes;',
    'uniform float uTime,uSeed,uSnow,uNight,uAur,uWin,uCam;',
    'uniform vec2 uMouse,uMist;',
    'uniform vec3 uZenith,uHorizon,uSunCol,uLight,uSun;',
    'const float HZ=.36;',
    'const float WL=.105;',
    'float K;float VW;float SQ;',

    'float h11(float p){p=fract(p*.1031);p*=p+33.33;p*=p+p;return fract(p);}',
    'float h21(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}',
    'float n1(float x){float i=floor(x);float f=fract(x);f=f*f*(3.-2.*f);return mix(h11(i),h11(i+1.),f);}',
    'float n2(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}',
    'float fbm1(float x){float v=0.;float a=.5;for(int i=0;i<5;i++){v+=a*n1(x);x=x*2.02+11.7;a*=.5;}return v;}',
    'float fbm2(vec2 p){float v=0.;float a=.5;for(int i=0;i<4;i++){v+=a*n2(p);p=p*2.03+vec2(7.1,3.3);a*=.5;}return v;}',
    'float inv(float a,float b,float x){return 1.-smoothstep(a,b,x);}',

    /* aurora: three curtains, sharp bright lower edge, long soft fade upward */
    'vec3 aurora(vec2 p,float y){',
    ' float t=uTime*.05;vec3 acc=vec3(0.);',
    ' for(int i=0;i<3;i++){',
    '  float fi=float(i);',
    '  float x=p.x*(1.1+fi*.3)+fi*4.7;',
    '  float curve=.6+fi*.07+.085*sin(x*1.7+t*2.+fi)+.06*sin(x*3.1-t*1.3)+.22*(fbm1(x*.8+t+fi*3.)-.5);',
    '  float d=y-curve;',
    '  float rays=.42+.58*n1(p.x/SQ*(26.+fi*9.)+t*6.+fi*9.);',
    '  rays*=.5+.5*n1(p.x*5.-t*3.+fi*2.);',
    '  float below=exp(-max(-d,0.)*(24.+fi*6.));',
    '  float above=exp(-max(d,0.)*(3.4+fi*1.1));',
    '  vec3 col=mix(vec3(.12,1.,.52),vec3(.55,.32,1.),smoothstep(0.,.32,d));',
    '  col=mix(col,vec3(.1,.85,.8),.22*fi);',
    '  acc+=col*below*above*rays*(.62-fi*.14);',
    ' }',
    ' return acc*uAur;',
    '}',

    'vec3 sky(vec2 p,float y){',
    ' float h=clamp((y-HZ)/(1.-HZ),0.,1.);',
    ' vec3 c=mix(uHorizon,uZenith,pow(h,.5));',
    ' float sx=uSun.x*K;',
    ' float d=length(vec2(p.x-sx,y-uSun.y));',
    ' float I=uSun.z;',
    ' c+=uSunCol*I*(exp(-d*6.)*.26+exp(-d*24.)*.3+(1.-smoothstep(.006,.011,d))*1.1);',
    ' c+=uSunCol*I*exp(-abs(y-HZ)*10.)*exp(-abs(p.x-sx)*1.4)*.25;',
    ' if(uNight>.01){',
    '  vec2 q=vec2(p.x/SQ+4.3,y)*110.;vec2 id=floor(q);vec2 f=fract(q);float r=h21(id);',
    '  if(r>.962){vec2 ctr=vec2(h21(id+3.1),h21(id+8.7))*.6+.2;float dd=length(f-ctr);',
    '   float b=(1.-smoothstep(0.,.22,dd))*(.4+.6*h21(id+5.))*(.72+.28*sin(uTime*1.7+r*80.));',
    '   c+=vec3(.85,.92,1.)*b*uNight*smoothstep(HZ+.03,.6,y);}',
    ' }',
    ' if(uAur>.01)c+=aurora(p,y);',
    ' return c;',
    '}',

    'vec3 ridge(vec3 col,vec2 p,float y,float par,float cx,float hw,float steep,float hgt,float fr,float sd,float base,float fog,float sw,float pines,vec3 bc){',
    ' float x=p.x+uCam*par+uMouse.x*par*.03;',
    ' float d=max(abs(x-cx*K)-hw*K,0.);',
    ' float wall=1.-exp(-d*steep/K);',
    ' float n=fbm1(x*fr+sd+uSeed);',
    ' float ry=base+hgt*wall*(.42+1.1*n);',
    ' if(pines>0.){float xs2=x/SQ;float t1=abs(fract(xs2*pines*3.+sd)-.5)*2.;float t2=abs(fract(xs2*pines*4.7+sd*1.7)-.5)*2.;float sw2=max(pow(1.-t1,1.6),.75*pow(1.-t2,1.6));ry+=.0115*sw2*smoothstep(0.,.25,wall)*(.35+n);}',
    ' float m=1.-smoothstep(ry-.0016,ry+.002,y);',
    ' if(m<=.001)return col;',
    ' float alt=y-HZ;',
    ' float depth=clamp((ry-y)/(hgt*.8+.001),0.,1.);',
    ' vec3 c=bc*mix(1.3,.7,depth)*(.86+.28*n2(vec2(x/SQ*38.,y*70.)));',
    ' float sl=mix(.27,.11,uSnow);',
    ' float sn=smoothstep(sl-.03,sl+.05,alt+.06*(n2(vec2(x/SQ*13.,y*13.))-.5));',
    ' c=mix(c,vec3(.93,.95,.99)*.94,sn*clamp(sw+uSnow*.85,0.,1.));',
    ' c*=uLight;',
    ' float rim=exp(-(ry-y)*58.)*uSun.z;',
    ' c+=uSunCol*rim*.22*(1.-fog*.5);',
    ' c+=vec3(.02,.04,.075)*uNight*(1.-depth)*.7;',
    ' c=mix(c,uHorizon*.98+uSunCol*uSun.z*.05,fog);',
    ' return mix(col,c,m);',
    '}',

    'vec3 mist(vec3 col,vec2 p,float y,float i,float hgt){',
    ' float lift=uMist.y;float amt=uMist.x;',
    ' if(amt<.004)return col;',
    ' float cy=HZ+hgt+lift*(.2+i*.06);',
    ' float w=.085+i*.022+lift*.05;',
    ' float dy=(y-cy)/w;',
    ' float n=fbm2(vec2(p.x/SQ*2.2+uTime*(.005+.002*i)+i*9.,y*9.+uTime*.002));',
    ' float dens=exp(-dy*dy)*(.3+1.15*n)*amt;',
    ' vec3 mc=mix(uHorizon,vec3(1.),.32)+uSunCol*uSun.z*.06;',
    ' return mix(col,mc,clamp(dens,0.,.9));',
    '}',

    'vec3 scene(vec2 uv){',
    ' vec2 p=vec2((uv.x-.5)*VW,uv.y);float y=uv.y;',
    ' vec3 col=sky(p,y);',
    ' col=ridge(col,p,y,.02,.10,.03,2.4,.44,2.7,1.3,HZ+.012,.74,1.,0.,vec3(.50,.60,.65));',
    ' col=mist(col,p,y,0.,.012);',
    ' col=ridge(col,p,y,.05,.02,.12,2.8,.52,2.2,7.9,HZ+.006,.5,.7,0.,vec3(.30,.43,.42));',
    ' col=mist(col,p,y,1.,.02);',
    ' col=ridge(col,p,y,.10,-.04,.26,3.4,.62,1.9,13.4,HZ,.27,.35,46.,vec3(.15,.28,.23));',
    ' col=mist(col,p,y,2.,.03);',
    ' col=ridge(col,p,y,.20,0.,.5,4.2,.76,1.5,21.7,HZ-.012,.07,0.,34.,vec3(.06,.15,.11));',
    ' return col;',
    '}',

    /* headland + trees + cabin, returned as colour + coverage so it can be mirrored in the water */
    'float rockTop(float x){float e=smoothstep(.10*K,.80*K,x);return WL+.085*pow(e,.85)+.01*(n1(x/SQ*14.)-.5)*e;}',
    'float bx(vec2 q,vec2 c,vec2 h,float aa){vec2 d=abs(q-c)-h;return 1.-smoothstep(-aa,aa,max(d.x,d.y));}',
    'vec4 fg(vec2 p,float y){',
    ' float x=p.x;float aa=1.5/uRes.y;',
    ' float rt=rockTop(x);',
    ' float cx=.44*K;',
    ' float xs=x/SQ;float cxs=cx/SQ;',
    ' float above=smoothstep(WL-aa,WL+aa,y);',
    ' float has=smoothstep(WL+.002,WL+.012,rt);',
    ' float landM=(1.-smoothstep(rt-aa,rt+aa,y))*above*has;',
    ' float e2=smoothstep(.3*K,.56*K,x);',
    ' float th=(.03+.06*n1(xs*6.+3.))*e2*mix(.2,1.,smoothstep(.07,.24,abs(xs-cxs)));',
    ' float sp=th*pow(1.-abs(fract(xs*34.)-.5)*2.,1.5);',
    ' float treeM=(1.-smoothstep(rt+sp-aa,rt+sp+aa,y))*above*has;',
    ' vec3 rockC=(vec3(.11,.13,.11)+vec3(.03,.05,.02)*n1(xs*40.))*uLight+uSunCol*uSun.z*.05;',
    ' vec3 treeC=vec3(.03,.07,.052)*(.45+.55*uLight)+vec3(.012,.02,.03)*uNight;',
    ' vec3 c=mix(treeC,rockC,landM);',
    ' float a=treeM;',
    /* cabin */
    ' float gy=rockTop(cx)-.004;',
    ' float CS=clamp(uRes.x/uRes.y*.8+.05,.7,1.45);vec2 q=vec2((x-cx)/SQ,y-gy)/CS;aa=aa/CS;',
    ' float sl=q.x*.028;',
    ' float body=bx(q,vec2(0.,.026),vec2(.088,.026),aa);',
    ' float roof=bx(q,vec2(0.,.058+sl),vec2(.102,.004),aa);',
    ' float sedge=bx(q,vec2(0.,.0655+sl),vec2(.102,.0035),aa);',
    ' float chim=bx(q,vec2(.055,.085),vec2(.006,.02),aa);',
    ' float glass=bx(q,vec2(-.042,.026),vec2(.036,.02),aa);',
    ' float door=bx(q,vec2(.045,.017),vec2(.011,.017),aa);',
    ' vec3 wood=vec3(.085,.08,.075)*(.55+.45*uLight);',
    ' vec3 gl=mix(mix(uZenith*.55,uHorizon*.7,1.-smoothstep(0.,.05,q.y))*uLight+vec3(.03),vec3(1.,.6,.28)*(1.05+.25*q.y*20.),uWin);',
    ' vec3 cab=wood;',
    ' cab=mix(cab,vec3(.055,.08,.06)*(.5+.5*uLight)+uSunCol*uSun.z*.05,max(roof,chim));',
    ' cab=mix(cab,vec3(.22,.3,.17)*(.45+.55*uLight),sedge);',
    ' cab=mix(cab,vec3(.47,.36,.2)*(.4+.6*uLight)+vec3(.3,.15,.05)*uWin*.4,door);',
    ' cab=mix(cab,gl,glass);',
    ' float cm=max(max(body,roof),max(max(sedge,chim),0.));',
    ' c=mix(c,cab,cm);a=max(a,cm);',
    ' float glow=exp(-length(vec2(q.x+.042,(q.y-.026)*1.2))*10./1.)*uWin*.4;',
    ' c+=vec3(1.,.55,.24)*glow*(1.-glass)*(a>.01?1.:0.);',
    ' return vec4(c,a);',
    '}',

    'void main(){',
    ' float asp=uRes.x/uRes.y;',
    ' VW=max(asp,1.35);K=VW/1.78;SQ=VW/asp;',
    ' vec2 uv=gl_FragCoord.xy/uRes;',
    ' vec2 p=vec2((uv.x-.5)*VW,uv.y);',
    ' vec3 col;',
    ' if(uv.y>=HZ){col=scene(uv);}',
    ' else{',
    '  float dep=clamp((HZ-uv.y)/HZ,0.,1.);',
    '  float rp=fbm2(vec2(p.x/SQ*5.+uTime*.03,uv.y*55.-uTime*.18))-.5;',
    '  float amp=.0015+dep*.012;',
    '  vec2 ruv=vec2(uv.x+rp*amp*4.,HZ+(HZ-uv.y)+rp*.006*dep);',
    '  vec3 refl=scene(ruv);',
    '  vec3 deep=vec3(.045,.10,.105)*uLight*1.2+uZenith*.10;',
    '  float fres=mix(.95,.72,pow(dep,.8));',
    '  col=mix(deep,refl*.92,fres);',
    '  col*=mix(1.,.74,dep);',
    '  float sx=uSun.x*K;',
    '  col+=uSunCol*uSun.z*exp(-abs(p.x-sx)*7.)*pow(clamp(rp*2.4+.5,0.,1.),4.)*.3*(1.-dep*.4);',
    '  col=mix(col,uHorizon+vec3(.03),exp(-dep*7.)*.5*uMist.x);',
    '  if(uv.y<WL){',
    '   vec2 pr=vec2(p.x+rp*.03,2.*WL-uv.y);',
    '   vec4 fr=fg(pr,pr.y);',
    '   col=mix(col,fr.rgb*.68,fr.a*.8);',
    '  }',
    ' }',
    ' vec4 f=fg(p,uv.y);',
    ' col=mix(col,f.rgb,f.a);',
    ' col*=1.-.24*pow(length((uv-.5)*vec2(1.,.9)),2.2);',
    ' col+=(h21(gl_FragCoord.xy+fract(uTime)*91.)-.5)*.02;',
    ' gl_FragColor=vec4(clamp(col,0.,1.),1.);',
    '}'
  ].join('\n');

  /* ---- palette: keyframes across the day ---------------------------------- */
  var STOPS = [0, 0.2, 0.42, 0.62, 0.8, 1];
  var Z = [[.72,.79,.84],[.62,.76,.87],[.46,.68,.86],[.50,.58,.76],[.11,.16,.31],[.015,.03,.075]];
  var H = [[.96,.87,.78],[.91,.92,.89],[.84,.91,.93],[.97,.76,.56],[.52,.46,.56],[.05,.10,.17]];
  var L = [[.86,.82,.78],[.98,.98,.94],[1.02,1.02,1.0],[1.06,.84,.64],[.40,.43,.58],[.09,.13,.23]];
  var SC = [[1,.72,.5],[1,.9,.74],[1,.97,.9],[1,.6,.3],[.85,.42,.4],[.6,.5,.6]];

  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function sstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function lerp3(A, i, j, t) { return [A[i][0] + (A[j][0] - A[i][0]) * t, A[i][1] + (A[j][1] - A[i][1]) * t, A[i][2] + (A[j][2] - A[i][2]) * t]; }

  function palette(prog) {
    var i = 0;
    while (i < STOPS.length - 2 && prog > STOPS[i + 1]) i++;
    var t = clamp((prog - STOPS[i]) / (STOPS[i + 1] - STOPS[i]), 0, 1);
    t = t * t * (3 - 2 * t);
    var sunT = clamp(prog / 0.66, 0, 1);
    var alt = Math.sin(sunT * Math.PI) * 0.4;
    var sunY = 0.36 + 0.012 + alt - (prog > 0.66 ? (prog - 0.66) * 0.4 : 0);
    return {
      zenith: lerp3(Z, i, i + 1, t),
      horizon: lerp3(H, i, i + 1, t),
      light: lerp3(L, i, i + 1, t),
      sunCol: lerp3(SC, i, i + 1, t),
      sun: [-0.68 + 1.38 * sunT, sunY, prog < 0.66 ? 1 : 1 - sstep(0.66, 0.86, prog)],
      night: sstep(0.74, 0.92, prog),
      aur: sstep(0.8, 0.97, prog),
      win: sstep(0.6, 0.86, prog),
      mist: [clamp((1 - sstep(0.03, 0.33, prog)) + 0.18 * sstep(0.55, 0.78, prog) * (1 - sstep(0.85, 1, prog)), 0, 1), sstep(0, 0.34, prog)],
      cam: (prog - 0.5) * 0.3
    };
  }

  /* ---- renderer ------------------------------------------------------------ */
  function FjordGL(canvas, opts) {
    this.canvas = canvas;
    this.o = Object.assign({ seed: 0, snow: 0, fixed: null, dprCap: 1.5, scale: 0.85, mouse: true }, opts || {});
    this.ok = false;
    this.active = false;
    this.raf = 0;
    this.target = this.o.fixed != null ? this.o.fixed : 0;
    this.p = this.target;
    this.mouse = [0, 0];
    this.mouseT = [0, 0];
    this.t0 = performance.now();
    this.last = this.t0;
    this.slow = 0;
    this.scale = this.o.scale;
    this.dirty = true;
    var self = this;

    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
    if (!gl) return;
    this.gl = gl;

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { self.err = gl.getShaderInfoLog(s); return null; }
      return s;
    }
    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { console.warn('[fjord] shader failed:', this.err); return; }
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn('[fjord] link failed:', gl.getProgramInfoLog(prog)); return; }
    gl.useProgram(prog);
    this.prog = prog;

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var names = ['uRes', 'uTime', 'uSeed', 'uSnow', 'uNight', 'uAur', 'uWin', 'uCam', 'uMouse', 'uMist', 'uZenith', 'uHorizon', 'uSunCol', 'uLight', 'uSun'];
    this.u = {};
    names.forEach(function (n) { self.u[n] = gl.getUniformLocation(prog, n); });

    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); self.ok = false; self.stop(); }, false);

    this.ro = new ResizeObserver(function () { self.resize(); });
    this.ro.observe(canvas);
    this.resize();

    if (this.o.mouse && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      window.addEventListener('pointermove', function (e) {
        self.mouseT = [(e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1];
      }, { passive: true });
    }
    this.ok = true;
    this.frame = this.frame.bind(this);
  }

  FjordGL.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, this.o.dprCap);
    var w = Math.max(2, Math.round(this.canvas.clientWidth * dpr * this.scale));
    var h = Math.max(2, Math.round(this.canvas.clientHeight * dpr * this.scale));
    if (w !== this.canvas.width || h !== this.canvas.height) {
      this.canvas.width = w; this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
    this.dirty = true;
  };

  FjordGL.prototype.setTarget = function (p) { this.target = clamp(p, 0, 1); };

  FjordGL.prototype.draw = function (time) {
    var gl = this.gl, u = this.u, pal = palette(this.p);
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uSeed, this.o.seed);
    gl.uniform1f(u.uSnow, this.o.snow);
    gl.uniform1f(u.uNight, pal.night);
    gl.uniform1f(u.uAur, pal.aur);
    gl.uniform1f(u.uWin, pal.win);
    gl.uniform1f(u.uCam, pal.cam);
    gl.uniform2f(u.uMouse, this.mouse[0], this.mouse[1]);
    gl.uniform2f(u.uMist, pal.mist[0], pal.mist[1]);
    gl.uniform3fv(u.uZenith, pal.zenith);
    gl.uniform3fv(u.uHorizon, pal.horizon);
    gl.uniform3fv(u.uSunCol, pal.sunCol);
    gl.uniform3fv(u.uLight, pal.light);
    gl.uniform3fv(u.uSun, pal.sun);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  FjordGL.prototype.frame = function (now) {
    if (!this.active) return;
    this.raf = requestAnimationFrame(this.frame);
    var dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    var k = 1 - Math.exp(-dt * 4.2);
    this.p += (this.target - this.p) * k;
    if (Math.abs(this.target - this.p) < 0.00008) this.p = this.target;
    this.mouse[0] += (this.mouseT[0] - this.mouse[0]) * (1 - Math.exp(-dt * 2.4));
    this.mouse[1] += (this.mouseT[1] - this.mouse[1]) * (1 - Math.exp(-dt * 2.4));
    this.draw((now - this.t0) / 1000);

    // adapt resolution if the GPU struggles
    if (dt > 0.034) { this.slow++; } else { this.slow = Math.max(0, this.slow - 1); }
    if (this.slow > 40 && this.scale > 0.42) { this.scale *= 0.86; this.slow = 0; this.resize(); }
  };

  FjordGL.prototype.start = function () {
    if (!this.ok || this.active) return;
    this.active = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  };
  FjordGL.prototype.stop = function () {
    this.active = false;
    cancelAnimationFrame(this.raf);
  };
  /* draw one still frame at the current progress (reduced motion, or paused) */
  FjordGL.prototype.still = function (p) {
    if (!this.ok) return;
    if (p != null) { this.p = this.target = clamp(p, 0, 1); }
    this.resize();
    this.draw(12.0);
  };

  FjordGL.STOPS = STOPS;
  FjordGL.palette = palette;
  window.FjordGL = FjordGL;
})();
