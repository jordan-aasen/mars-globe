'use client';

import dynamic from 'next/dynamic';
import React, { useRef } from 'react';

import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { OrbitControls as OrbitControlsType } from 'three-stdlib';

import './globals.css';

// Dynamically import MarsGlobe to prevent SSR issues
const MarsGlobe = dynamic(() => import('./components/MarsGlobe'), {
  ssr: false,
});

export default function HomePage() {
  const controlsRef = useRef(null);

  const globeRadius = 2.5; // Radius of the globe
  const fov = 75; // Field of view in degrees
  const distance = globeRadius / Math.tan((fov * Math.PI) / 360);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, distance], fov }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <MarsGlobe
          controlsRef={
            controlsRef as unknown as React.MutableRefObject<OrbitControlsType>
          }
          radius={globeRadius}
        />
        <OrbitControls
          ref={controlsRef}
          target={[0, 0, 0]} // Center the globe
          maxDistance={distance * 2} // Allow zooming out
          minDistance={distance / 2} // Allow zooming in
          enableZoom={true}
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.1}
          rotateSpeed={0.1} // Initial rotate speed (updated dynamically)
          zoomSpeed={0.1} // Initial zoom speed (updated dynamically)
        />
      </Canvas>
    </div>
  );
}
