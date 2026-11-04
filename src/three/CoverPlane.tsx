import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Project } from '../data'

// Per-card interaction state, written by DOM pointer handlers
export type CoverState = { hover: number; mx: number; my: number; zoom: number }

const vertex = /* glsl */ `
  uniform vec2 uTilt;
  uniform float uHover;
  uniform float uZoom;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    float s = 0.9 + 0.03 * uHover + 0.1 * uZoom;
    vec3 p = vec3(position.xy * s, 0.0);
    float cy = cos(uTilt.x), sy = sin(uTilt.x);
    p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
    float cx = cos(uTilt.y), sx = sin(uTilt.y);
    p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);
    float persp = 3.2 / (3.2 - p.z);
    gl_Position = vec4(p.xy * persp, 0.0, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uTime;
  uniform float uHover;
  uniform float uZoom;
  uniform vec2 uMouse;
  uniform vec2 uRes;
  uniform vec3 uColor;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  void main() {
    // rounded corners in pixel space
    vec2 px = (vUv - 0.5) * uRes;
    vec2 h = uRes * 0.5 - 18.0;
    float d = length(max(abs(px) - h, 0.0)) - 18.0;
    if (d > 0.0) discard;

    float influence = smoothstep(0.55, 0.0, distance(vUv, uMouse));
    vec2 flow = vec2(
      noise(vUv * 4.0 + vec2(uTime * 0.6, 0.0)),
      noise(vUv * 4.0 + vec2(0.0, uTime * 0.6) + 7.3)
    ) - 0.5;
    float amt = uHover * (0.25 + influence) + uZoom;
    vec2 uv = vUv + flow * 0.05 * amt;
    uv += (uMouse - 0.5) * -0.025 * uHover; // depth parallax
    uv = (uv - 0.5) * (1.0 - 0.04 * uHover) + 0.5;

    float ca = (0.006 + 0.012 * influence) * uHover + 0.02 * uZoom;
    vec2 dir = normalize(vUv - uMouse + 1e-4);
    vec3 col;
    col.r = texture2D(uTex, uv + dir * ca).r;
    col.g = texture2D(uTex, uv).g;
    col.b = texture2D(uTex, uv - dir * ca).b;

    col += uColor * influence * 0.22 * uHover;
    col += uColor * 0.035 * sin((vUv.y + uTime * 0.08) * 160.0) * uHover;
    float edge = smoothstep(-6.0, 0.0, d);
    col += uColor * edge * (0.25 + 0.5 * uHover);
    col = mix(col, vec3(1.0), uZoom * 0.35);
    gl_FragColor = vec4(col, 1.0);
  }
`

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line)
      line = w
    } else line = test
  }
  lines.push(line)
  return lines
}

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}

// Procedural cover art: a stylised device mock in the project's accent colour
function drawCover(p: Project, index: number) {
  const W = 1024, H = 640
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  g.fillStyle = '#0a0c13'
  g.fillRect(0, 0, W, H)

  const blob = (x: number, y: number, r: number, col: string, a: number) => {
    const grd = g.createRadialGradient(x, y, 0, x, y, r)
    grd.addColorStop(0, col + Math.round(a * 255).toString(16).padStart(2, '0'))
    grd.addColorStop(1, col + '00')
    g.fillStyle = grd
    g.fillRect(0, 0, W, H)
  }
  blob(W * 0.85, H * 0.15, 520, p.accent, 0.55)
  blob(W * 0.1, H * 1.0, 480, '#7c5cff', 0.35)

  g.strokeStyle = 'rgba(255,255,255,0.05)'
  g.lineWidth = 1
  for (let x = 0; x < W; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke() }
  for (let y = 0; y < H; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke() }

  // device mock
  g.save()
  g.shadowColor = p.accent
  g.shadowBlur = 60
  if (p.platform === 'mobile') {
    const x = 640, y = 90, w = 230, h = 470
    rr(g, x, y, w, h, 34); g.fillStyle = 'rgba(14,16,26,0.92)'; g.fill()
    g.shadowBlur = 0
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2; g.stroke()
    rr(g, x + 85, y + 14, 60, 10, 5); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fill()
    rr(g, x + 20, y + 50, w - 40, 110, 18); g.fillStyle = p.accent + 'cc'; g.fill()
    for (let i = 0; i < 4; i++) { rr(g, x + 20, y + 180 + i * 62, w - 40, 48, 12); g.fillStyle = 'rgba(255,255,255,0.07)'; g.fill() }
  } else if (p.platform === 'ai') {
    const x = 560, y = 110, w = 380, h = 400
    rr(g, x, y, w, h, 24); g.fillStyle = 'rgba(14,16,26,0.92)'; g.fill()
    g.shadowBlur = 0
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2; g.stroke()
    const bubbles = [[0, 220], [1, 160], [0, 260], [1, 120]]
    bubbles.forEach(([side, bw], i) => {
      const bx = side ? x + w - 24 - bw : x + 24
      rr(g, bx, y + 30 + i * 80, bw, 54, 18)
      g.fillStyle = side ? p.accent + 'dd' : 'rgba(255,255,255,0.09)'
      g.fill()
    })
    rr(g, x + 24, y + h - 60, w - 48, 38, 19); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fill()
  } else {
    const x = 500, y = 100, w = 470, h = 380
    rr(g, x, y, w, h, 20); g.fillStyle = 'rgba(14,16,26,0.92)'; g.fill()
    g.shadowBlur = 0
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2; g.stroke()
    ;['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => { g.beginPath(); g.arc(x + 24 + i * 20, y + 22, 6, 0, Math.PI * 2); g.fillStyle = col; g.fill() })
    rr(g, x + 20, y + 50, w - 40, 130, 14); g.fillStyle = p.accent + 'bb'; g.fill()
    for (let i = 0; i < 3; i++) { rr(g, x + 20 + i * 148, y + 200, 134, 150, 12); g.fillStyle = 'rgba(255,255,255,0.07)'; g.fill() }
  }
  g.restore()

  // typography
  g.fillStyle = 'rgba(255,255,255,0.55)'
  g.font = '500 26px "JetBrains Mono", monospace'
  g.fillText(`${String(index + 1).padStart(2, '0')} / ${p.category.toUpperCase()}`, 56, 82)
  g.fillStyle = '#ffffff'
  g.font = '700 74px "Space Grotesk", sans-serif'
  const lines = wrap(g, p.title, 440)
  lines.forEach((l, i) => g.fillText(l, 56, H - 70 - (lines.length - 1 - i) * 78))
  g.fillStyle = p.accent
  g.fillRect(56, H - 48, 80, 6)

  const tex = new THREE.CanvasTexture(c)
  tex.anisotropy = 4
  return tex
}

export function CoverPlane({ project, index, state, track }: { project: Project; index: number; state: CoverState; track: React.RefObject<HTMLElement> }) {
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const uniforms = useMemo(
    () => ({
      uTex: { value: new THREE.Texture() },
      uTime: { value: 0 },
      uHover: { value: 0 },
      uZoom: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTilt: { value: new THREE.Vector2() },
      uRes: { value: new THREE.Vector2(400, 250) },
      uColor: { value: new THREE.Color(project.accent) },
    }),
    [project.accent],
  )

  // Draw once web fonts are ready so the canvas uses the right typefaces
  useEffect(() => {
    let tex: THREE.Texture | null = null
    let alive = true
    document.fonts.ready.then(() => {
      if (!alive) return
      tex = drawCover(project, index)
      uniforms.uTex.value = tex
    })
    return () => {
      alive = false
      tex?.dispose()
    }
  }, [project, index, uniforms])

  useFrame((_, dt) => {
    const u = uniforms
    const k = 1 - Math.exp(-dt * 8)
    u.uTime.value += dt
    u.uHover.value += (state.hover - u.uHover.value) * k
    u.uZoom.value += (state.zoom - u.uZoom.value) * (1 - Math.exp(-dt * 6))
    u.uMouse.value.x += (state.mx - u.uMouse.value.x) * k
    u.uMouse.value.y += (state.my - u.uMouse.value.y) * k
    u.uTilt.value.x += ((state.mx - 0.5) * 0.28 * state.hover - u.uTilt.value.x) * k
    u.uTilt.value.y += (-(state.my - 0.5) * 0.28 * state.hover - u.uTilt.value.y) * k
    const el = track.current
    if (el) u.uRes.value.set(el.clientWidth, el.clientHeight)
  })

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2, 24, 24]} />
      <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} />
    </mesh>
  )
}
