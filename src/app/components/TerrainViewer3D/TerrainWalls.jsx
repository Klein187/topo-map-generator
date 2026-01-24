'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

// Dark gray for all walls
const WALL_COLOR = [0.3, 0.3, 0.3];

export default function TerrainWalls({
  elevationData,
  canvasWidth,
  canvasHeight
}) {
  const geometry = useMemo(() => {
    if (!elevationData || !elevationData.length) return null;

    const heightScale = 0.01;
    const baseLevel = -8;

    const maxSegments = 500;
    const sampleRateX = Math.max(1, Math.ceil(canvasWidth / maxSegments));
    const sampleRateY = Math.max(1, Math.ceil(canvasHeight / maxSegments));
    const segmentsX = Math.floor(canvasWidth / sampleRateX);
    const segmentsY = Math.floor(canvasHeight / sampleRateY);

    const scaleX = 100;
    const scaleY = (canvasHeight / canvasWidth) * scaleX;

    const vertices = [];
    const colors = [];

    // Helper to add a wall quad
    const addWallQuad = (x1, z1, y1Top, x2, z2, y2Top) => {
      // Triangle 1
      vertices.push(x1, y1Top, z1);
      colors.push(WALL_COLOR[0], WALL_COLOR[1], WALL_COLOR[2]);
      vertices.push(x2, y2Top, z2);
      colors.push(WALL_COLOR[0], WALL_COLOR[1], WALL_COLOR[2]);
      vertices.push(x1, baseLevel, z1);
      colors.push(WALL_COLOR[0] * 0.5, WALL_COLOR[1] * 0.5, WALL_COLOR[2] * 0.5);

      // Triangle 2
      vertices.push(x2, y2Top, z2);
      colors.push(WALL_COLOR[0], WALL_COLOR[1], WALL_COLOR[2]);
      vertices.push(x2, baseLevel, z2);
      colors.push(WALL_COLOR[0] * 0.5, WALL_COLOR[1] * 0.5, WALL_COLOR[2] * 0.5);
      vertices.push(x1, baseLevel, z1);
      colors.push(WALL_COLOR[0] * 0.5, WALL_COLOR[1] * 0.5, WALL_COLOR[2] * 0.5);
    };

    const getElevation = (gx, gy) => {
      const dataX = Math.min(Math.floor(gx * sampleRateX), canvasWidth - 1);
      const dataY = Math.min(Math.floor(gy * sampleRateY), canvasHeight - 1);
      const flippedY = canvasHeight - 1 - dataY;
      return (elevationData[flippedY]?.[dataX] ?? 0) * heightScale;
    };

    // Bottom edge
    for (let gx = 0; gx < segmentsX - 1; gx++) {
      const x1 = (gx / segmentsX - 0.5) * scaleX;
      const x2 = ((gx + 1) / segmentsX - 0.5) * scaleX;
      const z = -0.5 * scaleY;
      addWallQuad(x1, z, getElevation(gx, 0), x2, z, getElevation(gx + 1, 0));
    }

    // Top edge
    for (let gx = 0; gx < segmentsX - 1; gx++) {
      const x1 = (gx / segmentsX - 0.5) * scaleX;
      const x2 = ((gx + 1) / segmentsX - 0.5) * scaleX;
      const z = 0.5 * scaleY;
      addWallQuad(x2, z, getElevation(gx + 1, segmentsY - 1), x1, z, getElevation(gx, segmentsY - 1));
    }

    // Left edge
    for (let gy = 0; gy < segmentsY - 1; gy++) {
      const x = -0.5 * scaleX;
      const z1 = (gy / segmentsY - 0.5) * scaleY;
      const z2 = ((gy + 1) / segmentsY - 0.5) * scaleY;
      addWallQuad(x, z2, getElevation(0, gy + 1), x, z1, getElevation(0, gy));
    }

    // Right edge
    for (let gy = 0; gy < segmentsY - 1; gy++) {
      const x = 0.5 * scaleX;
      const z1 = (gy / segmentsY - 0.5) * scaleY;
      const z2 = ((gy + 1) / segmentsY - 0.5) * scaleY;
      addWallQuad(x, z1, getElevation(segmentsX - 1, gy), x, z2, getElevation(segmentsX - 1, gy + 1));
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    return geo;
  }, [elevationData, canvasWidth, canvasHeight]);

  if (!geometry) return null;

  return (
    <mesh>
      <primitive object={geometry} attach="geometry" />
      <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  );
}
