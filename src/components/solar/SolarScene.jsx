import { useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, AdaptiveDpr } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import Sun from './Sun';
import Planets from './Planets';
import FlareEvent from './FlareEvent';

function FitCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    const d = aspect < 0.9 ? 26 : aspect < 1.4 ? 19 : 14;
    camera.position.set(1.5, d * 0.24, d);
    camera.lookAt(1.2, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

/** 3D Sun → planets space-weather simulation. */
export default function SolarScene({ flare, risk, phaseId, phaseName, playId, onEvent, sheltered, controlsEnabled }) {
  const flashRef = useRef(0);
  const hitRef = useRef(0);

  return (
    <Canvas camera={{ position: [1.5, 3.4, 14], fov: 45 }} dpr={[1, 2]}>
      <color attach="background" args={['#02030a']} />
      <AdaptiveDpr pixelated={false} />
      <FitCamera />
      <ambientLight intensity={0.12} />
      <Stars radius={90} depth={50} count={4000} factor={3.5} saturation={0} fade speed={0.4} />
      <Sun flashRef={flashRef} />
      <Planets phaseId={phaseId} phaseName={phaseName} hitRef={hitRef} sheltered={sheltered} />
      {flare && <FlareEvent flare={flare} risk={risk} phaseId={phaseId} playId={playId} onEvent={onEvent} flashRef={flashRef} hitRef={hitRef} />}
      <OrbitControls enabled={controlsEnabled} enablePan={false} target={[1.2, 0, 0]} minDistance={7} maxDistance={32} maxPolarAngle={1.75} enableDamping />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.5} luminanceSmoothing={0.25} />
        <Vignette offset={0.25} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
