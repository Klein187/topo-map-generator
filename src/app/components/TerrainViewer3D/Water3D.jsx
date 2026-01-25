'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getBlendedElevationColor } from '../../utils/colorUtils';

export default function Water3D({ elevationData, biomeData, canvasWidth, canvasHeight }) {
  const meshRef = useRef();

  const geometry = useMemo(() => {
    if (!elevationData || !elevationData.length) return null;

    // Match terrain mesh resolution
    const maxSegments = 500;
    const sampleRateX = Math.max(1, Math.ceil(canvasWidth / maxSegments));
    const sampleRateY = Math.max(1, Math.ceil(canvasHeight / maxSegments));
    const segmentsX = Math.floor(canvasWidth / sampleRateX);
    const segmentsY = Math.floor(canvasHeight / sampleRateY);

    // Scale to match terrain
    const scaleX = 100;
    const scaleY = (canvasHeight / canvasWidth) * scaleX;

    const geo = new THREE.PlaneGeometry(scaleX, scaleY, segmentsX - 1, segmentsY - 1);
    const positions = geo.attributes.position.array;

    // Create alpha and color attributes
    const alphas = new Float32Array(positions.length / 3);
    const colors = new Float32Array(positions.length);

    for (let i = 0; i < positions.length; i += 3) {
      const vertexIndex = i / 3;
      const gridX = vertexIndex % segmentsX;
      const gridY = Math.floor(vertexIndex / segmentsX);

      const dataX = Math.min(Math.floor(gridX * sampleRateX), canvasWidth - 1);
      const dataY = Math.min(Math.floor(gridY * sampleRateY), canvasHeight - 1);
      const flippedY = canvasHeight - 1 - dataY;
      const elevation = elevationData[flippedY]?.[dataX] ?? 0;

      // Water at sea level
      positions[i + 2] = 0;

      // Alpha: 0.4 for water (elevation < 0), 0 for land
      alphas[vertexIndex] = elevation < 0 ? 0.4 : 0;

      // Get color based on elevation and biome
      if (elevation < 0) {
        const biomeInfo = biomeData?.[flippedY]?.[dataX];
        const biomeWeights = biomeInfo?.weights || [{ biome: 'temperate', weight: 1.0 }];
        const hexColor = getBlendedElevationColor(elevation, biomeWeights);

        // Convert hex to RGB 0-1
        const r = parseInt(hexColor.slice(1, 3), 16) / 255;
        const g = parseInt(hexColor.slice(3, 5), 16) / 255;
        const b = parseInt(hexColor.slice(5, 7), 16) / 255;

        colors[i] = r;
        colors[i + 1] = g;
        colors[i + 2] = b;
      } else {
        // Default for land (not visible)
        colors[i] = 0;
        colors[i + 1] = 0;
        colors[i + 2] = 0;
      }
    }

    geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [elevationData, biomeData, canvasWidth, canvasHeight]);

  // Custom shader material for per-vertex alpha and color
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float alpha;
        attribute vec3 color;
        varying float vAlpha;
        varying vec3 vColor;
        varying vec2 vUv;
        void main() {
          vAlpha = alpha;
          vColor = color;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          if (vAlpha < 0.01) discard;
          gl_FragColor = vec4(vColor, vAlpha);
        }
      `
    });
  }, []);

  // Animate water
  useFrame((state) => {
    if (material) {
      material.uniforms.time.value = state.clock.elapsedTime;
    }
    if (meshRef.current) {
      meshRef.current.position.y = 0.1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
    }
  });

  if (!geometry) return null;

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <primitive object={geometry} attach="geometry" />
    </mesh>
  );
}
