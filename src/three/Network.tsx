import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { device, motion } from '../motion'

const LAYER_COLORS = ['#7c5cff', '#22d3ee', '#34d399'].map((c) => new THREE.Color(c))
const LAYER_Y = [1.75, 0, -1.75]
const GOLDEN = 2.399963

const smooth = (t: number) => t * t * (3 - 2 * t)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

function makeDotTexture() {
  const s = 64
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.25, 'rgba(255,255,255,0.8)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, s, s)
  return new THREE.CanvasTexture(c)
}

function buildGraph(count: number) {
  const cluster = new Float32Array(count * 3)
  const layered = new Float32Array(count * 3)
  const layer = new Uint8Array(count)
  const phase = new Float32Array(count)
  const size = new Float32Array(count)
  const perLayerTotal = [0, 0, 0]
  for (let i = 0; i < count; i++) perLayerTotal[i % 3]++
  const perLayer = [0, 0, 0]

  for (let i = 0; i < count; i++) {
    const L = i % 3
    layer[i] = L
    phase[i] = Math.random() * Math.PI * 2
    size[i] = 0.7 + Math.random() * 0.8

    // Cluster: jittered fibonacci sphere
    const y = 1 - ((i + 0.5) / count) * 2
    const r = Math.sqrt(1 - y * y)
    const th = i * GOLDEN
    const radius = 1.25 + Math.random() * 1.05
    cluster.set([Math.cos(th) * r * radius, y * radius, Math.sin(th) * r * radius], i * 3)

    // Layered: sunflower disc per architecture layer
    const idx = perLayer[L]++
    const rr = 2.6 * Math.sqrt((idx + 0.5) / perLayerTotal[L])
    const a = idx * GOLDEN + L
    layered.set([Math.cos(a) * rr, LAYER_Y[L], Math.sin(a) * rr], i * 3)
  }

  // Edges: connect each node to its nearest neighbours in the cluster shape
  const edges: [number, number][] = []
  const seen = new Set<string>()
  const v = (arr: Float32Array, i: number) => new THREE.Vector3(arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2])
  for (let i = 0; i < count; i++) {
    const pi = v(cluster, i)
    const near = Array.from({ length: count }, (_, j) => j)
      .filter((j) => j !== i)
      .sort((a, b) => pi.distanceToSquared(v(cluster, a)) - pi.distanceToSquared(v(cluster, b)))
      .slice(0, 3)
    for (const j of near) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (!seen.has(key)) {
        seen.add(key)
        edges.push([i, j])
      }
    }
  }
  const adj: number[][] = Array.from({ length: count }, () => [])
  edges.forEach(([a, b], e) => {
    adj[a].push(e)
    adj[b].push(e)
  })
  return { cluster, layered, layer, phase, size, edges, adj }
}

export function Network() {
  const count = device.mobile || device.lowPower ? 42 : 78
  const interactive = !device.mobile
  const graph = useMemo(() => buildGraph(count), [count])
  const pulseCount = Math.round(count * 0.6)

  const group = useRef<THREE.Group>(null!)
  const nodes = useRef<THREE.InstancedMesh>(null!)
  const halos = useRef<THREE.InstancedMesh>(null!)
  const lineMat = useRef<THREE.LineBasicMaterial>(null!)
  const plates = useRef<THREE.Group>(null!)

  const state = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const off = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    const glow = new Float32Array(count)
    const pulses = Array.from({ length: pulseCount }, () => {
      const e = Math.floor(Math.random() * graph.edges.length)
      return { e, t: Math.random(), dir: Math.random() > 0.5 ? 1 : -1, speed: 0.35 + Math.random() * 0.6 }
    })
    return { pos, off, vel, glow, pulses }
  }, [count, pulseCount, graph])

  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const E = graph.edges.length
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(E * 6), 3))
    const col = new Float32Array(E * 6)
    graph.edges.forEach(([a, b], e) => {
      LAYER_COLORS[graph.layer[a]].toArray(col, e * 6)
      LAYER_COLORS[graph.layer[b]].toArray(col, e * 6 + 3)
    })
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return g
  }, [graph])

  const pulseGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pulseCount * 3), 3))
    return g
  }, [pulseCount])

  const dot = useMemo(makeDotTexture, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tmp = useMemo(
    () => ({ ray: new THREE.Raycaster(), plane: new THREE.Plane(), hit: new THREE.Vector3(), n: new THREE.Vector3(), local: new THREE.Vector3(), color: new THREE.Color(), billboard: new THREE.Quaternion() }),
    [],
  )

  useFrame(({ camera, clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30)
    const t = clock.elapsedTime
    const ex = smooth(clamp01(motion.explode))
    const exit = smooth(clamp01(motion.exit))
    const g = group.current
    const px = motion.pointer.x
    const py = motion.pointer.y

    // --- Choreography: placement and rotation driven by scroll state
    const baseX = device.mobile ? 0 : THREE.MathUtils.lerp(1.9, 1.55, ex)
    const targetX = THREE.MathUtils.lerp(baseX, 0, exit)
    const targetY = device.mobile ? THREE.MathUtils.lerp(0.9, 0, motion.heroOut) : 0
    g.position.x += (targetX - g.position.x) * 0.08
    g.position.y += (targetY - g.position.y) * 0.08
    g.position.z += (-exit * 3.5 - g.position.z) * 0.08
    const spin = device.reducedMotion ? 0 : t * 0.06
    const ry = spin * (1 - ex) + ex * (Math.PI / 2 + 0.35) + px * 0.18
    const rx = ex * 0.38 + py * 0.1
    g.rotation.y += (ry - g.rotation.y) * 0.06
    g.rotation.x += (rx - g.rotation.x) * 0.06
    const sc = device.mobile ? 0.78 : 1
    g.scale.setScalar(sc * (1 + ex * 0.06))
    g.updateMatrixWorld()
    // halo sprites face the camera: camera rotation expressed in group space
    g.getWorldQuaternion(tmp.billboard).invert().multiply(camera.quaternion)

    // --- Cursor collider: project pointer onto a plane through the network
    let hasHit = false
    if (interactive && motion.pointer.active) {
      tmp.ray.setFromCamera(new THREE.Vector2(px, py), camera)
      camera.getWorldDirection(tmp.n)
      tmp.plane.setFromNormalAndCoplanarPoint(tmp.n.negate(), g.position)
      if (tmp.ray.ray.intersectPlane(tmp.plane, tmp.hit)) {
        tmp.local.copy(tmp.hit)
        g.worldToLocal(tmp.local)
        hasHit = true
      }
    }

    const { pos, off, vel, glow } = state
    const R = 1.15
    const k = 1 - Math.exp(-dt * 60)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const f = Math.sin(t * 0.7 + graph.phase[i]) * 0.06
      const bx = THREE.MathUtils.lerp(graph.cluster[i3], graph.layered[i3], ex)
      const by = THREE.MathUtils.lerp(graph.cluster[i3 + 1], graph.layered[i3 + 1], ex) + f
      const bz = THREE.MathUtils.lerp(graph.cluster[i3 + 2], graph.layered[i3 + 2], ex)

      let tx = 0, ty = 0, tz = 0
      if (hasHit) {
        const dx = bx + off[i3] - tmp.local.x
        const dy = by + off[i3 + 1] - tmp.local.y
        const dz = bz + off[i3 + 2] - tmp.local.z
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-4
        if (d < R) {
          const push = Math.pow(1 - d / R, 2) * 0.9
          tx = (dx / d) * push
          ty = (dy / d) * push
          tz = (dz / d) * push
        }
      }
      // spring towards the displaced target
      for (let a = 0; a < 3; a++) {
        const target = a === 0 ? tx : a === 1 ? ty : tz
        vel[i3 + a] += (target - off[i3 + a]) * 0.09 * k
        vel[i3 + a] *= 0.86
        off[i3 + a] += vel[i3 + a]
      }
      pos[i3] = bx + off[i3]
      pos[i3 + 1] = by + off[i3 + 1]
      pos[i3 + 2] = bz + off[i3 + 2]

      glow[i] *= 0.94
      const s = 0.065 * graph.size[i] * (1 + glow[i] * 0.6)
      dummy.position.set(pos[i3], pos[i3 + 1], pos[i3 + 2])
      dummy.rotation.set(t * 0.2 + graph.phase[i], t * 0.15, 0)
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      nodes.current.setMatrixAt(i, dummy.matrix)
      dummy.quaternion.copy(tmp.billboard)
      dummy.scale.setScalar(s * 3.2 * (0.6 + glow[i]))
      dummy.updateMatrix()
      halos.current.setMatrixAt(i, dummy.matrix)
      tmp.color.copy(LAYER_COLORS[graph.layer[i]]).multiplyScalar(0.25 + glow[i] * 0.9)
      halos.current.setColorAt(i, tmp.color)
    }
    nodes.current.instanceMatrix.needsUpdate = true
    halos.current.instanceMatrix.needsUpdate = true
    if (halos.current.instanceColor) halos.current.instanceColor.needsUpdate = true

    // --- Connections
    const lp = lineGeo.attributes.position.array as Float32Array
    graph.edges.forEach(([a, b], e) => {
      lp[e * 6] = pos[a * 3]
      lp[e * 6 + 1] = pos[a * 3 + 1]
      lp[e * 6 + 2] = pos[a * 3 + 2]
      lp[e * 6 + 3] = pos[b * 3]
      lp[e * 6 + 4] = pos[b * 3 + 1]
      lp[e * 6 + 5] = pos[b * 3 + 2]
    })
    lineGeo.attributes.position.needsUpdate = true
    lineMat.current.opacity = (0.22 + ex * 0.12) * (1 - exit * 0.55)

    // --- Data pulses travelling along connections, hopping node to node
    const pp = pulseGeo.attributes.position.array as Float32Array
    const speedMul = device.reducedMotion ? 0.25 : 1
    state.pulses.forEach((p, i) => {
      p.t += dt * p.speed * speedMul
      if (p.t >= 1) {
        const [a, b] = graph.edges[p.e]
        const arrived = p.dir === 1 ? b : a
        glow[arrived] = Math.min(1.4, glow[arrived] + 0.8)
        const options = graph.adj[arrived].filter((e) => e !== p.e)
        p.e = options.length ? options[Math.floor(Math.random() * options.length)] : p.e
        p.dir = graph.edges[p.e][0] === arrived ? 1 : -1
        p.t = 0
      }
      const [a, b] = graph.edges[p.e]
      const from = p.dir === 1 ? a : b
      const to = p.dir === 1 ? b : a
      for (let c = 0; c < 3; c++) pp[i * 3 + c] = THREE.MathUtils.lerp(pos[from * 3 + c], pos[to * 3 + c], p.t)
    })
    pulseGeo.attributes.position.needsUpdate = true

    // --- Layer plates fade in with the exploded view
    plates.current.children.forEach((m) => {
      const mat = (m as THREE.Mesh).material as THREE.MeshBasicMaterial
      mat.opacity = ex * (m.userData.base as number) * (1 - exit * 0.6)
      m.visible = ex > 0.01
    })
  })

  return (
    <group ref={group}>
      <instancedMesh ref={nodes} args={[undefined, undefined, count]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#1a1d29" metalness={0.85} roughness={0.32} envMapIntensity={1.4} />
      </instancedMesh>
      <instancedMesh ref={halos} args={[undefined, undefined, count]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={dot} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </instancedMesh>
      <lineSegments geometry={lineGeo} frustumCulled={false}>
        <lineBasicMaterial ref={lineMat} vertexColors transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </lineSegments>
      <points geometry={pulseGeo} frustumCulled={false}>
        <pointsMaterial map={dot} size={0.14} sizeAttenuation transparent depthWrite={false} blending={THREE.AdditiveBlending} color="#e0f7ff" toneMapped={false} />
      </points>
      <group ref={plates}>
        {LAYER_Y.map((y, i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ base: 0.07 }}>
            <circleGeometry args={[3, 64]} />
            <meshBasicMaterial color={LAYER_COLORS[i]} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        ))}
        {LAYER_Y.map((y, i) => (
          <mesh key={`r${i}`} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ base: 0.55 }}>
            <ringGeometry args={[2.96, 3, 96]} />
            <meshBasicMaterial color={LAYER_COLORS[i]} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
