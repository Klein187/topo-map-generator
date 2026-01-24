'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Water3D({ elevationData, canvasWidth, canvasHeight }) {
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

    // Create alpha attribute for transparency (1 = water, 0 = land)
    const alphas = new Float32Array(positions.length / 3);

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
    }

    geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    return geo;
  }, [elevationData, canvasWidth, canvasHeight]);

  // Custom shader material for per-vertex alpha
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        waterColor: { value: new THREE.Color('#1a85ff') }
      },
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        varying vec2 vUv;
        void main() {
          vAlpha = alpha;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 waterColor;
        varying float vAlpha;
        void main() {
          if (vAlpha < 0.01) discard;
          gl_FragColor = vec4(waterColor, vAlpha);
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
