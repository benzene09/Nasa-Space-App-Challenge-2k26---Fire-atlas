import { Grid } from '@react-three/drei';
import { MODULE } from './sceneConfig';

const HEIGHT = MODULE.ceiling - MODULE.floor;
const MID = (MODULE.ceiling + MODULE.floor) / 2;

/** Glass-walled habitat module with metal ribs, floor and test stand. */
export default function Habitat({ kind }) {
  return (
    <group>
      {/* Walls (back faces only, so we can see in from outside) */}
      <mesh position={[0, MID, 0]}>
        <cylinderGeometry args={[MODULE.radius, MODULE.radius, HEIGHT, 64, 1, true]} />
        <meshStandardMaterial color="#9fb4d8" transparent opacity={0.07} side={1} roughness={0.2} metalness={0.3} depthWrite={false} />
      </mesh>
      {/* Ribs */}
      {[MODULE.floor + 0.02, MID - 0.9, MID + 0.9, MODULE.ceiling - 0.02].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[MODULE.radius, 0.035, 10, 96]} />
          <meshStandardMaterial color="#6b7a99" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        return (
          <mesh key={i} position={[Math.cos(a) * MODULE.radius, MID, Math.sin(a) * MODULE.radius]}>
            <cylinderGeometry args={[0.03, 0.03, HEIGHT, 8]} />
            <meshStandardMaterial color="#6b7a99" metalness={0.8} roughness={0.35} />
          </mesh>
        );
      })}
      {/* Ceiling */}
      <mesh position={[0, MODULE.ceiling, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[MODULE.radius, 64]} />
        <meshStandardMaterial color="#1a2236" side={2} transparent opacity={0.55} />
      </mesh>
      {/* Floor */}
      <mesh position={[0, MODULE.floor, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[MODULE.radius, 64]} />
        <meshStandardMaterial color="#141b2c" metalness={0.4} roughness={0.7} />
      </mesh>
      <Grid
        position={[0, MODULE.floor + 0.005, 0]}
        args={[6.6, 6.6]}
        cellSize={0.3}
        cellThickness={0.6}
        cellColor="#2a3756"
        sectionSize={1.2}
        sectionThickness={1}
        sectionColor="#3fd4ff"
        fadeDistance={7}
        fadeStrength={2}
      />

      {/* Test stand */}
      <mesh position={[0, (MODULE.floor - 0.05) / 2, 0]}>
        <cylinderGeometry args={[0.07, 0.1, -0.05 - MODULE.floor, 16]} />
        <meshStandardMaterial color="#8793ad" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.06, 48]} />
        <meshStandardMaterial color="#2b3550" metalness={0.7} roughness={0.3} />
      </mesh>
      {kind === 'droplet' && (
        <group>
          {[-0.5, 0.5].map((x) => (
            <mesh key={x} position={[x, 0.26, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
              <meshStandardMaterial color="#8793ad" metalness={0.9} roughness={0.25} />
            </mesh>
          ))}
          <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.004, 0.004, 1, 6]} />
            <meshStandardMaterial color="#d0d6e6" />
          </mesh>
        </group>
      )}
    </group>
  );
}
