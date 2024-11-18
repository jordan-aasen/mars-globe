import React, { useEffect, useMemo, useState } from 'react';

import { useLoader } from '@react-three/fiber';
import * as h3 from 'h3-js';
import {
  BackSide,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  MeshStandardMaterial,
  TextureLoader,
  Vector3,
} from 'three';

const MarsGlobe = () => {
  const [selectedHexIndex, setSelectedHexIndex] = useState<number | null>(null);
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

  // Function to create flat geometry for non-selected hexagons
  const createFlatGeometry = (vertices: Vector3[]) => {
    const geometry = new BufferGeometry();
    const positions: number[] = [];
    const indices: number[] = [];
    const numVertices = vertices.length;

    // Add vertex positions
    vertices.forEach((vertex) => {
      positions.push(vertex.x, vertex.y, vertex.z);
    });

    // Define indices for triangulation
    for (let i = 1; i < numVertices - 1; i++) {
      indices.push(0, i, i + 1);
    }
    // Close the last triangle
    indices.push(0, numVertices - 1, 1);

    // Add positions and indices to geometry
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);

    // Compute normals for proper lighting
    geometry.computeVertexNormals();

    return geometry;
  };

  // Function to create extruded geometry for selected hexagon
  const createExtrudedGeometry = (vertices: Vector3[]) => {
    const geometry = new BufferGeometry();
    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const numVertices = vertices.length;
    const extrusionDepth = 0.025; // Adjust as needed for thickness

    // Front and back face vertices and normals
    const frontVertices = [];
    const backVertices = [];

    for (let i = 0; i < numVertices; i++) {
      const vertex = vertices[i];

      // Normal vector at this vertex
      const normal = vertex.clone().normalize();

      // Back vertex offset along normal
      const backVertex = vertex
        .clone()
        .add(normal.clone().multiplyScalar(extrusionDepth));

      frontVertices.push(vertex);
      backVertices.push(backVertex);

      // Add front vertex positions and normals
      positions.push(vertex.x, vertex.y, vertex.z);
      normals.push(normal.x, normal.y, normal.z);
    }

    // Add back face vertex positions and normals
    for (let i = 0; i < numVertices; i++) {
      const backVertex = backVertices[i];
      const normal = backVertex.clone().normalize();

      positions.push(backVertex.x, backVertex.y, backVertex.z);
      normals.push(normal.x, normal.y, normal.z);
    }

    // Front face indices
    for (let i = 1; i < numVertices - 1; i++) {
      indices.push(0, i, i + 1);
    }

    // Back face indices (reversed winding order)
    const offset = numVertices;
    for (let i = 1; i < numVertices - 1; i++) {
      indices.push(offset, offset + i + 1, offset + i);
    }

    // Side faces
    for (let i = 0; i < numVertices; i++) {
      const next = (i + 1) % numVertices;

      const a = i;
      const b = next;
      const c = offset + next;
      const d = offset + i;

      // First triangle
      indices.push(a, b, c);

      // Second triangle
      indices.push(a, c, d);
    }

    // Set attributes and indices
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);

    return geometry;
  };

  // Convert hexagons to 3D meshes and precompute geometries
  const hexMeshes = useMemo(() => {
    const hexagonRadius = radius * 1.001; // Slightly larger than the sphere's radius

    return hexagons.map((hex, index) => {
      const boundary = h3.cellToBoundary(hex, true); // Boundary in lat/lng
      const [centerLat, centerLng] = h3.cellToLatLng(hex); // Get centroid
      const shrinkFactor = 0.99; // Adjust as needed

      // Exclude the last point (duplicate of the first)
      const vertices = boundary.slice(0, -1).map(([lng, lat]) => {
        // Shrink the vertex towards the centroid
        const shrunkLat = centerLat + (lat - centerLat) * shrinkFactor;
        const shrunkLng = centerLng + (lng - centerLng) * shrinkFactor;

        const phi = (90 - shrunkLat) * (Math.PI / 180); // Latitude to polar angle
        const theta = (shrunkLng + 180) * (Math.PI / 180); // Longitude to azimuthal angle

        const x = hexagonRadius * Math.sin(phi) * Math.cos(theta);
        const y = hexagonRadius * Math.cos(phi);
        const z = hexagonRadius * Math.sin(phi) * Math.sin(theta);

        return new Vector3(x, y, z);
      });

      // Assign a color to each hexMesh
      const color = ['#ff4141', '#00FF00', '#FFA500', '#808080'][index % 4];

      // Precompute geometries
      const flatGeometry = createFlatGeometry(vertices);
      const extrudedGeometry = createExtrudedGeometry(vertices);

      return { hex, color, flatGeometry, extrudedGeometry };
    });
  }, [hexagons, radius]);

  // Precompute materials
  const materials = useMemo(() => {
    return {
      selected: new MeshStandardMaterial({
        transparent: true,
        opacity: 0.75,
        side: DoubleSide,
      }),
      unselected: new MeshStandardMaterial({
        transparent: true,
        opacity: 0.3,
        side: BackSide,
      }),
    };
  }, []);

  // Dispose of geometries and materials when component unmounts
  useEffect(() => {
    return () => {
      hexMeshes.forEach((hexMesh) => {
        hexMesh.flatGeometry.dispose();
        hexMesh.extrudedGeometry.dispose();
      });
      materials.selected.dispose();
      materials.unselected.dispose();
    };
  }, [hexMeshes, materials]);

  return (
    <group>
      {/* Render Mars sphere */}
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* Render hexagon tiles */}
      {hexMeshes.map((hexMesh, index) => {
        const isSelected = selectedHexIndex === index;
        const geometry = isSelected
          ? hexMesh.extrudedGeometry
          : hexMesh.flatGeometry;

        // Set material properties
        const material = isSelected
          ? materials.selected.clone()
          : materials.unselected.clone();

        material.color.set(hexMesh.color);

        return (
          <mesh
            key={index}
            geometry={geometry}
            material={material}
            onClick={() => {
              setSelectedHexIndex(isSelected ? null : index);
            }}
          />
        );
      })}
    </group>
  );
};

export default MarsGlobe;
