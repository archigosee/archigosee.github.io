import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, PerspectiveCamera, Sparkles, View } from '@react-three/drei'
import { device } from '../motion'
import { Network } from './Network'

// A DOM-side <View> renders (and tracks) its own element, so the className
// positions it as a fixed full-screen layer.
export function BackgroundView() {
  return (
    <>
      <View className="bg-track" index={1} frames={Infinity} aria-hidden>
        <color attach="background" args={['#06070b']} />
        <fog attach="fog" args={['#06070b', 7, 14]} />
        <PerspectiveCamera makeDefault position={[0, 0, 7.5]} fov={42} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[4, 6, 5]} intensity={1.4} color="#c7d2fe" />
        <pointLight position={[-4, -2, 3]} intensity={18} color="#7c5cff" distance={12} />
        <pointLight position={[4, 2, 2]} intensity={14} color="#22d3ee" distance={12} />
        {/* Local studio environment for metallic reflections — no network fetch */}
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={2.2} color="#c4b5fd" position={[0, 4, -6]} scale={[10, 2, 1]} />
          <Lightformer form="rect" intensity={1.6} color="#67e8f9" position={[-6, 0, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
          <Lightformer form="ring" intensity={1.2} color="#ffffff" position={[5, 1, 4]} scale={3} />
        </Environment>
        <Network />
        {!device.lowPower && <Sparkles count={device.mobile ? 40 : 90} scale={[14, 9, 6]} size={1.6} speed={0.25} opacity={0.35} color="#a5b4fc" />}
      </View>
    </>
  )
}

export function GLCanvas({ eventSource }: { eventSource: React.MutableRefObject<HTMLElement> }) {
  return (
    <Canvas
      className="gl"
      eventSource={eventSource}
      dpr={device.mobile || device.lowPower ? [1, 1.5] : [1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <View.Port />
    </Canvas>
  )
}
