'use client';

import React, { useEffect, useMemo, useRef } from 'react';

import { useLoader } from '@react-three/fiber';
import {
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  Object3D,
  TextureLoader,
} from 'three';

import { latLngToCartesian } from './utils';

const MarsGlobe = ({ onTileClick }) => {
  const texture = useLoader(TextureLoader, '/mars-texture.jpg');
  const radius = 2; // Radius of the globe
  const tileRadius = 0.0115; // Radius of each tile

  // Generate tile data
  const hexTileData = useMemo(() => {
    const tiles = [];
    const tileWidth = tileRadius * Math.sqrt(3); // Width of a hex tile
    let previousNumTilesInRow = null;
    let cumulativeOffsetLng = 0;

    // Loop over latitudes from -90 to 90 degrees
    for (let lat = -90; lat <= 90; lat += 0.5) {
      const latRadians = (lat * Math.PI) / 180; // Convert to radians
      const rowRadius = radius * Math.cos(latRadians); // Adjust radius for curvature

      // Calculate circumference at the current latitude
      const circumference = 2 * Math.PI * rowRadius;

      // Calculate the number of tiles that can fit around this latitude
      const numTilesInRow = Math.max(1, Math.floor(circumference / tileWidth));

      // Calculate angular steps
      const deltaLngCurrRow = (2 * Math.PI) / numTilesInRow;

      if (previousNumTilesInRow !== null) {
        const deltaLngPrevRow = (2 * Math.PI) / previousNumTilesInRow;

        if (numTilesInRow !== previousNumTilesInRow) {
          // Calculate the difference in angular steps
          const deltaTheta = 0.5 * (deltaLngPrevRow - deltaLngCurrRow);

          // Adjust cumulative offset
          cumulativeOffsetLng += deltaTheta;
        } else {
          // Alternate offset to align tiles
          cumulativeOffsetLng += deltaLngCurrRow / 2;
        }

        // Keep offset within 0 to 2π
        cumulativeOffsetLng %= 2 * Math.PI;
      } else {
        cumulativeOffsetLng = 0; // No offset for the first row
      }

      // Generate tiles for the current row
      for (let tileIndex = 0; tileIndex < numTilesInRow; tileIndex++) {
        const lngRadians = tileIndex * deltaLngCurrRow + cumulativeOffsetLng;
        const lngDegrees = (lngRadians * 180) / Math.PI; // Convert to degrees

        const position = latLngToCartesian(lat, lngDegrees, radius);
        tiles.push({
          position,
          data: { lat, lng: lngDegrees },
          color: new Color(`hsl(${Math.random() * 360}, 100%, 50%)`),
        });
      }

      // Update previous row tile count
      previousNumTilesInRow = numTilesInRow;
    }
    return tiles;
  }, [radius, tileRadius]);

  const meshRef = useRef<InstancedMesh>(null);
  const tempObject = new Object3D();

  // Prepare color attribute
  const colors = useMemo(() => {
    const colorArray = new Float32Array(hexTileData.length * 3);
    hexTileData.forEach((tile, i) => {
      tile.color.toArray(colorArray, i * 3);
    });
    return colorArray;
  }, [hexTileData]);

  // Set up the positions and colors of instances
  useEffect(() => {
    if (meshRef.current) {
      const mesh = meshRef.current;

      hexTileData.forEach((tile, i) => {
        const { position } = tile;
        tempObject.position.set(position[0], position[1], position[2]);

        // Orient the tile to face outward from the sphere's center
        tempObject.lookAt(0, 0, 0);
        tempObject.rotateX(Math.PI / 2); // Lay flat on the sphere

        tempObject.updateMatrix();
        mesh.setMatrixAt(i, tempObject.matrix);
      });

      // Add the color attribute
      mesh.geometry.setAttribute(
        'color',
        new InstancedBufferAttribute(colors, 3)
      );

      mesh.instanceMatrix.needsUpdate = true;
    }
  }, [hexTileData, colors]);

  // Handle tile interactions
  const handlePointerDown = (event: any) => {
    event.stopPropagation();
    const instanceId = event.instanceId;
    if (instanceId !== undefined) {
      const tileData = hexTileData[instanceId];
      onTileClick(tileData.data);
    }
  };

  return (
    <group>
      {/* Mars sphere */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* Hex tiles */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, hexTileData.length]}
        onPointerDown={handlePointerDown}
      >
        <cylinderGeometry args={[tileRadius, tileRadius, 0.0001, 6]} />
        <meshStandardMaterial vertexColors />
      </instancedMesh>
    </group>
  );
};

export default MarsGlobe;
