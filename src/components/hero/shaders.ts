/**
 * GLSL for the hero glyph field. Every glyph's position is a pure function of
 * its attributes + a few uniforms (time, formation, scroll), so the graph
 * links can run the exact same function and stay glued to their glyphs.
 */

const noise = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
vec3 snoiseVec3(vec3 x){
  return vec3(snoise(x), snoise(vec3(x.y-19.1,x.z+33.4,x.x+47.2)), snoise(vec3(x.z+74.2,x.x-124.5,x.y+99.4)));
}
vec3 curlNoise(vec3 p){
  const float e=0.1;
  vec3 dx=vec3(e,0.0,0.0); vec3 dy=vec3(0.0,e,0.0); vec3 dz=vec3(0.0,0.0,e);
  vec3 px0=snoiseVec3(p-dx); vec3 px1=snoiseVec3(p+dx);
  vec3 py0=snoiseVec3(p-dy); vec3 py1=snoiseVec3(p+dy);
  vec3 pz0=snoiseVec3(p-dz); vec3 pz1=snoiseVec3(p+dz);
  float x=py1.z-py0.z-pz1.y+pz0.y;
  float y=pz1.x-pz0.x-px1.z+px0.z;
  float z=px1.y-px0.y-py1.x+py0.x;
  return vec3(x,y,z)/(2.0*e);
}
`;

/** Shared uniforms/attributes and the position function. */
const glyphCommon = /* glsl */ `
uniform float uTime;
uniform float uForm;
uniform float uScroll;
uniform float uReveal;
uniform vec2 uHalf;
uniform vec2 uMonoCenter;
uniform float uMonoScale;
uniform vec2 uLineExtent;
uniform vec2 uLineOffset;

attribute vec3 aHome;
attribute vec4 aSeed;
attribute vec2 aMono;
attribute float aMonoW;
attribute vec2 aLine;
attribute float aLineW;
attribute float aDelay;

${noise}

float formMix(){
  float w = min(aMonoW, 1.0);
  return w * smoothstep(0.0, 1.0, clamp(uForm * 1.45 - aSeed.z * 0.45, 0.0, 1.0));
}

float lineMix(){
  return aLineW * smoothstep(0.0, 1.0, clamp((uScroll * 1.3 - aDelay * 0.6) / 0.4, 0.0, 1.0));
}

// Dust drifting in a slow curl-noise current, wrapped inside a volume a bit
// larger than the view. Returns xyz + a fade factor near the wrap edges.
vec4 chaosPos(){
  vec3 b = vec3(uHalf.x * 1.55, uHalf.y * 1.45, 7.0);
  vec3 p = aHome * b;
  p.z -= 3.0;
  p.x += uTime * (0.05 + 0.09 * aSeed.x);
  p.y += uTime * 0.025 * (aSeed.y - 0.35);
  p.x = mod(p.x + b.x, 2.0 * b.x) - b.x;
  p.y = mod(p.y + b.y, 2.0 * b.y) - b.y;
  float edge = smoothstep(b.x, b.x * 0.82, abs(p.x)) * smoothstep(b.y, b.y * 0.82, abs(p.y));
  p += curlNoise(p * 0.15 + vec3(0.0, 0.0, uTime * 0.03)) * 0.3;
  return vec4(p, edge);
}

vec3 glyphPosition(out float fm, out float lm, out float edge){
  vec4 c = chaosPos();
  edge = c.w;
  fm = formMix();
  lm = lineMix();

  vec3 mono = vec3(uMonoCenter + aMono * uMonoScale, 0.0);
  mono += vec3(
    sin(uTime * 0.7 + aSeed.x * 6.2831),
    cos(uTime * 0.6 + aSeed.y * 6.2831),
    sin(uTime * 0.5 + aSeed.z * 6.2831)
  ) * 0.025;

  vec3 line = vec3(uLineOffset + aLine * uLineExtent, 0.0);
  line.y += sin(uTime * 0.8 + aLine.x * 3.0) * 0.006;

  vec3 p = mix(c.xyz, mono, fm);
  p.z += sin(fm * 3.14159) * (aSeed.x - 0.5) * 1.6;
  edge = mix(edge, 1.0, fm);

  p = mix(p, line, lm);
  p.z += sin(lm * 3.14159) * (aSeed.y - 0.5) * 1.4;
  edge = mix(edge, 1.0, lm);

  // glyphs that are not part of the "page" sink back into the dark
  p.z -= (1.0 - aLineW) * smoothstep(0.05, 0.8, uScroll) * 4.0;
  return p;
}
`;

export const pointsVertex = /* glsl */ `
${glyphCommon}
uniform float uPixelScale;
uniform float uLens;
uniform vec2 uMouse;
uniform float uAspect;
uniform float uLineGlyph;
uniform vec3 uGold;
uniform vec3 uGoldLight;
uniform vec3 uGoldDim;
uniform vec3 uTeal;

attribute float aGlyph;
attribute float aEntity;

varying vec3 vColor;
varying float vAlpha;
varying vec2 vCell;
varying float vRot;

void main(){
  float fm; float lm; float edge;
  vec3 p = glyphPosition(fm, lm, edge);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;
  vec2 ndc = clip.xy / clip.w;
  vec2 dd = (ndc - uMouse) * vec2(uAspect, 1.0);
  float d = length(dd);
  float lens = uLens * (1.0 - smoothstep(0.0, 0.34, d)) * (1.0 - lm);

  // lens magnification: glyphs bulge away from the pointer
  mv.xy += (dd / max(d, 1e-4)) * lens * 0.1 * (-mv.z / 10.0) * smoothstep(0.0, 0.12, d);
  gl_Position = projectionMatrix * mv;

  float depth = -mv.z;
  float size = mix(aSeed.w, 0.075, fm);
  size = mix(size, uLineGlyph * (1.0 + aEntity * 0.2), lm);
  gl_PointSize = size * uPixelScale / depth * (1.0 + lens * 0.75);

  float fog = 1.0 - smoothstep(8.0, 20.0, depth) * 0.9;
  float nearFade = smoothstep(2.0, 5.0, depth);
  float settled = max(fm, lm);
  float twinkle = 0.6 + 0.4 * sin(uTime * (0.5 + aSeed.x * 1.2) + aSeed.y * 6.2831);
  twinkle = mix(twinkle, 1.0, settled);
  float recede = 1.0 - (1.0 - aLineW) * smoothstep(0.05, 0.7, uScroll) * 0.82;
  float reveal = smoothstep(0.0, 1.0, clamp(uReveal * 1.6 - aSeed.x * 0.6, 0.0, 1.0));
  vAlpha = fog * nearFade * twinkle * recede * reveal * edge * mix(0.78, 0.95, settled);

  float isTeal = step(0.935, aSeed.z) * (1.0 - fm) * (1.0 - lm);
  vec3 col = mix(uGoldDim, uGold, fog);
  col = mix(col, uTeal, isTeal * 0.85);
  col = mix(col, uTeal * 1.25, step(1.5, aMonoW) * fm);
  col = mix(col, uGold * 0.78, lm * (1.0 - aEntity));
  col = mix(col, uGoldLight, lm * aEntity);
  col *= 1.0 + lens * 1.9 + fm * 0.35 + lm * aEntity * 1.1;
  col += uTeal * lens * 0.25;
  vColor = col;

  vCell = vec2(mod(aGlyph, 8.0), floor(aGlyph / 8.0));
  float settle = (1.0 - fm * 0.85) * (1.0 - lm) * (1.0 - lens);
  vRot = ((aSeed.y * 2.0 - 1.0) * 3.14159 + sin(uTime * 0.2 + aSeed.x * 6.2831) * 0.3) * settle;
}
`;

export const pointsFragment = /* glsl */ `
uniform sampler2D uAtlas;
varying vec3 vColor;
varying float vAlpha;
varying vec2 vCell;
varying float vRot;

void main(){
  vec2 uv = gl_PointCoord - 0.5;
  float c = cos(vRot);
  float s = sin(vRot);
  uv = mat2(c, -s, s, c) * uv + 0.5;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) discard;
  float m = texture2D(uAtlas, (vCell + uv) / 8.0).r;
  float a = m * vAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor, a);
  #include <colorspace_fragment>
}
`;

export const linksVertex = /* glsl */ `
${glyphCommon}
attribute float aEnd;
attribute float aEdgeSeed;
varying float vAlpha;
varying float vEnd;
varying float vSeed;

void main(){
  float fm; float lm; float edge;
  vec3 p = glyphPosition(fm, lm, edge);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  float show = smoothstep(0.5 + aEdgeSeed * 0.22, 0.82 + aEdgeSeed * 0.12, uScroll);
  vAlpha = show * lm * uReveal;
  vEnd = aEnd;
  vSeed = aEdgeSeed;
}
`;

export const linksFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uTeal;
varying float vAlpha;
varying float vEnd;
varying float vSeed;

void main(){
  float t = fract(uTime * 0.22 + vSeed * 3.7);
  float pulse = exp(-pow((t - vEnd) * 6.0, 2.0));
  vec3 col = uTeal * (0.7 + pulse * 1.8);
  gl_FragColor = vec4(col, vAlpha * (0.35 + 0.65 * pulse));
  #include <colorspace_fragment>
}
`;

export const ringVertex = /* glsl */ `
uniform vec2 uRingPos;
uniform float uAspect;
uniform float uRingSize;
varying vec2 vUv;
void main(){
  vUv = position.xy;
  gl_Position = vec4(uRingPos + position.xy * vec2(uRingSize / uAspect, uRingSize), 0.0, 1.0);
}
`;

export const ringFragment = /* glsl */ `
uniform float uTime;
uniform float uRingOpacity;
uniform vec3 uTeal;
varying vec2 vUv;

void main(){
  float r = length(vUv);
  if (r > 1.0) discard;
  float a = atan(vUv.y, vUv.x);
  float aa = fwidth(r) * 1.5;
  float ring = 1.0 - smoothstep(0.0, aa, abs(r - 0.78));
  float outer = (1.0 - smoothstep(0.0, aa, abs(r - 0.92))) * 0.3;
  float ticks = step(0.8, fract(a / 6.28318 * 64.0)) * step(0.84, r) * step(r, 0.88);
  float sweep = fract(a / 6.28318 - uTime * 0.16);
  float arc = smoothstep(0.72, 1.0, sweep) * (1.0 - smoothstep(0.0, aa * 3.0, abs(r - 0.78)));
  float halo = exp(-pow((r - 0.78) * 10.0, 2.0)) * 0.22;
  float inside = 1.0 - smoothstep(0.74, 0.78, r);
  float scanY = fract(uTime * 0.35) * 1.5 - 0.75;
  float scan = exp(-pow((vUv.y - scanY) * 38.0, 2.0)) * inside * 0.32;
  float core = 1.0 - smoothstep(0.015, 0.035, r);
  float v = ring * 0.65 + outer + ticks * 0.45 + arc * 1.2 + halo + scan + core * 0.7;
  gl_FragColor = vec4(uTeal * (1.0 + arc * 0.8), v * uRingOpacity);
  #include <colorspace_fragment>
}
`;
