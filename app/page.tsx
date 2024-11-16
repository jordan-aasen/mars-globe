'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// import { TileInfoModal } from '@components/TileInfoModal';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

import './globals.css';

// Dynamically import MarsGlobe to prevent SSR issues
const MarsGlobe = dynamic(() => import('./components/MarsGlobe'), {
  ssr: false,
});

export default function HomePage() {
  // const [selectedTile, setSelectedTile] = useState(null);

  // const handleTileClick = (data: any) => {
  //   setSelectedTile(data);
  // };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <MarsGlobe />
        <OrbitControls
          target={[0, 0, 0]} // Set the target point for the camera
          maxDistance={3.5} // Prevent zooming out too far
          minDistance={2} // Prevent zooming in too close
          enableZoom={true}
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.1}
          rotateSpeed={0.1}
          zoomSpeed={0.1}
        />
      </Canvas>
      {/* {selectedTile && (
        <TileInfoModal
          data={selectedTile}
          onClose={() => setSelectedTile(null)}
        />
      )} */}
    </div>
  );
}
