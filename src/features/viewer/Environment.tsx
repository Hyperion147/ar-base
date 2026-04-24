import type { ScenePreset } from '../../types';

interface EnvironmentProps {
  scenePreset: ScenePreset;
  dimmed?: boolean;
}

const SCENE_THEME = {
  gallery: {
    wall: '#efe4d0',
    trim: '#705745',
    floor: '#b88c65',
    glass: '#d7f1ff',
  },
  sunset: {
    wall: '#c98267',
    trim: '#58392f',
    floor: '#8b6849',
    glass: '#fde4d1',
  },
  midnight: {
    wall: '#243243',
    trim: '#d4d1cb',
    floor: '#4d3b34',
    glass: '#9ebad6',
  },
} satisfies Record<ScenePreset, { wall: string; trim: string; floor: string; glass: string }>;

export function Environment({ scenePreset, dimmed = false }: EnvironmentProps) {
  const theme = SCENE_THEME[scenePreset];
  const lightOpacity = dimmed ? 0.15 : 0.3;

  return (
    <group position={[0, 0, -3]}>
      <mesh receiveShadow>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial color={theme.wall} roughness={0.92} metalness={0.08} />
      </mesh>

      <Window trim={theme.trim} glass={theme.glass} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 3]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color={theme.floor} roughness={0.86} metalness={0.08} />
      </mesh>

      <mesh position={[0, -5.85, 0.1]}>
        <boxGeometry args={[20, 0.3, 0.2]} />
        <meshStandardMaterial color={theme.trim} roughness={0.48} />
      </mesh>

      <mesh position={[-4.8, 0.2, 0.4]} rotation={[0, Math.PI / 9, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 3.2, 24]} />
        <meshStandardMaterial color={theme.trim} roughness={0.7} />
      </mesh>

      <mesh position={[-4.8, 1.95, 0.4]} castShadow>
        <sphereGeometry args={[0.55, 28, 28]} />
        <meshStandardMaterial color="#f4e6bf" emissive="#f2c88b" emissiveIntensity={lightOpacity} />
      </mesh>
    </group>
  );
}

function Window({ trim, glass }: { trim: string; glass: string }) {
  return (
    <group position={[0, 0.5, 0.1]}>
      <mesh>
        <boxGeometry args={[4.2, 3.2, 0.15]} />
        <meshStandardMaterial color={trim} roughness={0.48} metalness={0.08} />
      </mesh>

      <mesh position={[0, 0, 0.08]}>
        <planeGeometry args={[3.8, 2.8]} />
        <meshPhysicalMaterial
          color={glass}
          transparent
          opacity={0.34}
          roughness={0.08}
          metalness={0.02}
          transmission={0.92}
          thickness={0.5}
        />
      </mesh>

      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[0.08, 2.8, 0.05]} />
        <meshStandardMaterial color={trim} roughness={0.5} />
      </mesh>

      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[3.8, 0.08, 0.05]} />
        <meshStandardMaterial color={trim} roughness={0.5} />
      </mesh>

      <mesh position={[0, -1.7, 0.15]}>
        <boxGeometry args={[4.4, 0.15, 0.3]} />
        <meshStandardMaterial color={trim} roughness={0.5} />
      </mesh>
    </group>
  );
}
