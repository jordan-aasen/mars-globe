import React, { useMemo } from 'react';

import { useLoader } from '@react-three/fiber';
import * as h3 from 'h3-js';
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  TextureLoader,
  Vector3,
} from 'three';

const MarsGlobe = () => {
  const radius = 2; // Radius of the globe
  const resolution = 2; // H3 resolution level
  const texture = useLoader(TextureLoader, '/mars-texture.jpg');

  // Generate hexagon indexes
  const hexagons = useMemo(() => {
    // Fetch base cells (res 0)
    const baseCells = h3.getRes0Cells();

    // Collect all hexagons for the given resolution
    let allHexagons: string[] = [];
    baseCells.forEach((cell) => {
      const children = h3.cellToChildren(cell, resolution);
      allHexagons = allHexagons.concat(children);
    });

    return allHexagons;
  }, [resolution]);

  // Convert hexagons to 3D meshes
  const hexMeshes = useMemo(() => {
    const hexagonRadius = radius * 1.005; // Slightly larger than the sphere's radius
    return hexagons.map((hex) => {
      const boundary = h3.cellToBoundary(hex, true); // Boundary in lat/lng

      // Exclude the last point (duplicate of the first)
      const vertices = boundary.slice(0, -1).map(([lng, lat]) => {
        const phi = (90 - lat) * (Math.PI / 180); // Latitude to polar angle
        const theta = (lng + 180) * (Math.PI / 180); // Longitude to azimuthal angle

        const x = hexagonRadius * Math.sin(phi) * Math.cos(theta);
        const y = hexagonRadius * Math.cos(phi);
        const z = hexagonRadius * Math.sin(phi) * Math.sin(theta);

        return new Vector3(x, y, z);
      });

      return { vertices, hex }; // Return vertices and hex index
    });
  }, [hexagons, radius]);

  return (
    <group>
      {/* Render Mars sphere */}
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* Render hexagon tiles */}
      {hexMeshes.map((hexMesh, index) => {
        const geometry = new BufferGeometry();
        const positions: number[] = [];

        // Add vertex positions
        hexMesh.vertices.forEach((vertex) => {
          positions.push(vertex.x, vertex.y, vertex.z);
        });

        // Add positions to geometry
        geometry.setAttribute(
          'position',
          new Float32BufferAttribute(positions, 3)
        );

        // Define indices for triangulation
        const indices = [];
        const numVertices = hexMesh.vertices.length;
        for (let i = 1; i < numVertices - 1; i++) {
          indices.push(0, i, i + 1);
        }
        // Close the last triangle
        indices.push(0, numVertices - 1, 1);

        geometry.setIndex(indices);

        // Compute normals for proper lighting
        geometry.computeVertexNormals();

        return (
          <mesh
            key={index}
            geometry={geometry}
            // onPointerDown={() => onTileClick(hexMesh.hex)}
          >
            <meshStandardMaterial
              color={`hsla(${(index * 137.508) % 360}, 100%, 70%)`}
              side={DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export default MarsGlobe;
