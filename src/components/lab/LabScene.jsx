import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import Outside from './Outside';
import Habitat from './Habitat';
import FuelSample from './FuelSample';
import Flame from './Flame';
import CoolFlame from './CoolFlame';
import Smoke from './Smoke';
import Oxygen from './Oxygen';
import Spray from './Spray';
import Extinguisher from './Extinguisher';
import SmokeDetector from './SmokeDetector';
import FloatingProps from './FloatingProps';
import ConvectionArrows from './ConvectionArrows';
import SceneLabels from './SceneLabels';
import ResponsiveCamera from './ResponsiveCamera';

/** The full React Three Fiber scene for the Flame Lab. Loaded lazily. */
export default function LabScene({ state, flame, actions, controlsEnabled }) {
  // Live flame geometry written by <Flame/> every frame and read by particles/labels.
  const liveRef = useRef({ intensity: 0, radius: 0.3, center: [0, 0.3, 0], top: 0.6 });

  return (
    <Canvas camera={{ position: [0.6, 1.9, 7.4], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <Suspense fallback={null}>
        <AdaptiveDpr pixelated={false} />
        <ResponsiveCamera />
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 8, 4]} intensity={0.9} />
        <Outside placeId={state.placeId} />
        <Habitat kind={flame.material.kind} />
        <FuelSample state={state} flame={flame} onIgnite={actions.ignite} />
        <Flame state={state} flame={flame} liveRef={liveRef} />
        <CoolFlame active={state.coolFlame} heatVision={state.heatVision} />
        <Smoke state={state} flame={flame} liveRef={liveRef} onAlarm={actions.setAlarm} />
        <Oxygen state={state} flame={flame} liveRef={liveRef} />
        <Spray spraying={state.spraying} liveRef={liveRef} />
        <Extinguisher spraying={state.spraying} onSpray={actions.spray} showLabel={state.status === 'burning' && state.labels} />
        <SmokeDetector alarm={state.alarm} showLabel={state.labels} />
        <FloatingProps gravity={state.gravity} />
        <ConvectionArrows visible={state.labels} gravity={state.gravity} liveRef={liveRef} />
        <SceneLabels state={state} flame={flame} liveRef={liveRef} />
        <OrbitControls
          enabled={controlsEnabled}
          target={[0, 0.9, 0]}
          enablePan={false}
          minDistance={4.5}
          maxDistance={13}
          minPolarAngle={0.35}
          maxPolarAngle={1.62}
          enableDamping
          dampingFactor={0.08}
        />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.55} luminanceSmoothing={0.2} />
          <Vignette eskil={false} offset={0.2} darkness={0.7} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
