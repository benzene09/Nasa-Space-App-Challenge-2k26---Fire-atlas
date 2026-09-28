import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, AdaptiveDpr } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { QUIET } from '../../utils/earthImpact';
import { SUN_POS } from './earthConfig';
import Driver from './Driver';
import EarthGlobe from './EarthGlobe';
import Magnetosphere from './Magnetosphere';
import SolarWind from './SolarWind';
import Aurora from './Aurora';
import Satellites from './Satellites';
import CMECloud from './CMECloud';
import ProtonRain from './ProtonRain';
import CityMarker from './CityMarker';

function Sun({ liveRef }) {
  const mesh = useRef();
  useFrame(() => {
    if (mesh.current) mesh.current.scale.setScalar(1 + liveRef.current.flash * 1.8);
  });
  return (
    <group position={SUN_POS}>
      <mesh ref={mesh}>
        <sphereGeometry args={[2.4, 48, 48]} />
        <meshBasicMaterial color="#ffc46b" toneMapped={false} />
      </mesh>
      <directionalLight position={[0, 0, 0]} intensity={2.2} />
    </group>
  );
}

function FitCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    const d = aspect < 0.9 ? 22 : aspect < 1.4 ? 17 : 13;
    camera.position.set(4, d * 0.35, d);
    camera.lookAt(-1.5, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

/** 3D Sun → Earth space-weather impact simulation. */
export default function EarthScene({ impact, inputs, launched, playId, onEvent, controlsEnabled }) {
  const liveRef = useRef({ storm: 0, radio: 0, proton: 0, cme: -1, flash: 0, rmp: QUIET.rmp, auroraLat: QUIET.auroraLat, kp: 1, dim: 0, speed: 400 });

  return (
    <Canvas camera={{ position: [4, 4.5, 13], fov: 45 }} dpr={[1, 2]}>
      <color attach="background" args={['#02030a']} />
      <AdaptiveDpr pixelated={false} />
      <FitCamera />
      <ambientLight intensity={0.25} />
      <Stars radius={90} depth={40} count={3500} factor={3} fade speed={0.4} />
      <Driver impact={{ ...impact, speed: inputs.speed }} launched={launched} playId={playId} liveRef={liveRef} onEvent={onEvent} />
      <Sun liveRef={liveRef} />
      <EarthGlobe liveRef={liveRef} />
      <Aurora liveRef={liveRef} />
      <Magnetosphere liveRef={liveRef} />
      <SolarWind liveRef={liveRef} />
      <CMECloud liveRef={liveRef} hit={impact.hit} />
      <ProtonRain liveRef={liveRef} />
      <Satellites liveRef={liveRef} impact={impact} />
      <CityMarker lat={inputs.cityLat} name={inputs.cityName} aurora={impact.aurora} liveRef={liveRef} />
      <OrbitControls enabled={controlsEnabled} enablePan={false} target={[-1.5, 0, 0]} minDistance={3} maxDistance={30} enableDamping />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={1} luminanceThreshold={0.55} luminanceSmoothing={0.25} />
        <Vignette offset={0.25} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
