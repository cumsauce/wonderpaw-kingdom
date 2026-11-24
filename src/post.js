import * as THREE from 'three';

// Renders the scene small, then blows it up with grain, dither and a vignette.
export function makePost(renderer, lowHeight = 450) {
  const rt = new THREE.WebGLRenderTarget(16, 16, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: true,
  });
  const uniforms = {
    tD: { value: rt.texture },
    res: { value: new THREE.Vector2(16, 16) },
    time: { value: 0 },
    staticAmt: { value: 0 },
    fade: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    depthTest: false,
    depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      precision highp float;
      uniform sampler2D tD; uniform vec2 res; uniform float time; uniform float staticAmt; uniform float fade;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      float bayer(vec2 p){
        vec2 q = mod(p, 4.0);
        float i = q.x + q.y * 4.0;
        if (i < 0.5) return 0.0;   if (i < 1.5) return 8.0;   if (i < 2.5) return 2.0;   if (i < 3.5) return 10.0;
        if (i < 4.5) return 12.0;  if (i < 5.5) return 4.0;   if (i < 6.5) return 14.0;  if (i < 7.5) return 6.0;
        if (i < 8.5) return 3.0;   if (i < 9.5) return 11.0;  if (i < 10.5) return 1.0;  if (i < 11.5) return 9.0;
        if (i < 12.5) return 15.0; if (i < 13.5) return 7.0;  if (i < 14.5) return 13.0; return 5.0;
      }
      void main(){
        vec2 uv = vUv;
        float row = floor(uv.y * res.y);
        float tear = step(1.0 - staticAmt * 0.06, hash(vec2(row, floor(time * 20.0))));
        uv.x += tear * (hash(vec2(row, time)) - 0.5) * 0.06;
        vec2 c = uv - 0.5;
        float r2 = dot(c, c);
        vec2 off = c * (0.004 + r2 * 0.014 + staticAmt * 0.01);
        vec3 col = vec3(texture2D(tD, uv + off).r, texture2D(tD, uv).g, texture2D(tD, uv - off).b);
        col = pow(max(col, 0.0), vec3(1.0 / 2.2));
        float l = dot(col, vec3(0.299, 0.587, 0.114));
        col = mix(vec3(l), col, 0.8);
        col *= vec3(1.04, 1.0, 0.93);
        vec2 px = floor(uv * res);
        float g = hash(px + fract(time) * 173.0) - 0.5;
        col += g * (0.085 + staticAmt * 0.3);
        col *= 1.0 - r2 * 1.35;
        float d = (bayer(px) / 16.0 - 0.5) / 28.0;
        col = floor((col + d) * 28.0 + 0.5) / 28.0;
        col *= fade;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  const qScene = new THREE.Scene();
  qScene.add(quad);
  const qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  return {
    uniforms,
    setSize(w, h) {
      const lh = Math.min(lowHeight, h);
      const lw = Math.max(2, Math.round((lh * w) / h));
      rt.setSize(lw, lh);
      uniforms.res.value.set(lw, lh);
    },
    render(scene, camera) {
      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(qScene, qCam);
    },
  };
}
