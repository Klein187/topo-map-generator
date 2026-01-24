'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { getBlendedElevationColor } from '../../utils/colorUtils';

// Convert hex to RGB 0-255
const hexToRgb255 = (hex) => {
  const cleanHex = hex.replace('#', '');
  return [
    parseInt(cleanHex.substring(0, 2), 16),
    parseInt(cleanHex.substring(2, 4), 16),
    parseInt(cleanHex.substring(4, 6), 16)
  ];
};

export default function TerrainMeshTextured({
  elevationData,
  biomeData,
  canvasWidth,
  canvasHeight
}) {
  const { geometry, texture } = useMemo(() => {
    if (!elevationData || !elevationData.length) return { geometry: null, texture: null };

    // Texture resolution - higher = smoother colors
    const texWidth = Math.min(canvasWidth, 2048);
    const texHeight = Math.min(canvasHeight, Math.floor(2048 * (canvasHeight / canvasWidth)));

    // Mesh resolution - moderate for good terrain shape
    const maxSegments = 500;
    const sampleRateX = Math.max(1, Math.ceil(canvasWidth / maxSegments));
    const sampleRateY = Math.max(1, Math.ceil(canvasHeight / maxSegments));
    const segmentsX = Math.floor(canvasWidth / sampleRateX);
    const segmentsY = Math.floor(canvasHeight / sampleRateY);

    // Scale to reasonable 3D dimensions
    const scaleX = 100;
    const scaleY = (canvasHeight / canvasWidth) * scaleX;
    const heightScale = 0.01;

    // Create geometry
    const geo = new THREE.PlaneGeometry(scaleX, scaleY, segmentsX - 1, segmentsY - 1);
    const positions = geo.attributes.position.array;

    // Modify vertices based on elevation data
    for (let i = 0; i < positions.length; i += 3) {
      const vertexIndex = i / 3;
      const gridX = vertexIndex % segmentsX;
      const gridY = Math.floor(vertexIndex / segmentsX);

      const dataX = Math.min(Math.floor(gridX * sampleRateX), canvasWidth - 1);
      const dataY = Math.min(Math.floor(gridY * sampleRateY), canvasHeight - 1);
      const flippedY = canvasHeight - 1 - dataY;
      const elevation = elevationData[flippedY]?.[dataX] ?? 0;

      positions[i + 2] = elevation * heightScale;
    }

    geo.computeVertexNormals();

    // Create texture from elevation/biome data
    const texData = new Uint8Array(texWidth * texHeight * 4);
    const texSampleX = canvasWidth / texWidth;
    const texSampleY = canvasHeight / texHeight;

    for (let ty = 0; ty < texHeight; ty++) {
      for (let tx = 0; tx < texWidth; tx++) {
        const dataX = Math.min(Math.floor(tx * texSampleX), canvasWidth - 1);
        const dataY = Math.min(Math.floor(ty * texSampleY), canvasHeight - 1);
        const flippedY = canvasHeight - 1 - dataY;

        const elevation = elevationData[flippedY]?.[dataX] ?? 0;
        const biomeInfo = biomeData[flippedY]?.[dataX];
        const biomeWeights = biomeInfo?.weights || [{ biome: 'temperate', weight: 1.0 }];
        const color = getBlendedElevationColor(elevation, biomeWeights);
        const [r, g, b] = hexToRgb255(color);

        // Flip Y for texture coordinates
        const texY = texHeight - 1 - ty;
        const idx = (texY * texWidth + tx) * 4;
        texData[idx] = r;
        texData[idx + 1] = g;
        texData[idx + 2] = b;
        texData[idx + 3] = 255;
      }
    }

    const tex = new THREE.DataTexture(texData, texWidth, texHeight, THREE.RGBAFormat);
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    return { geometry: geo, texture: tex };
  }, [elevationData, biomeData, canvasWidth, canvasHeight]);

  if (!geometry || !texture) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <primitive object={geometry} attach="geometry" />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}
