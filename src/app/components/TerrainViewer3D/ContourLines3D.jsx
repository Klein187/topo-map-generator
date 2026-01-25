'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const CONTOUR_INTERVAL = 30; // Match 2D view
const HEIGHT_SCALE = 0.01;

export default function ContourLines3D({
  elevationData,
  canvasWidth,
  canvasHeight
}) {
  const oceanGroupRef = useRef();

  const { minorGeometry, majorGeometry, coastlineGeometry, oceanGeometry } = useMemo(() => {
    if (!elevationData || !elevationData.length) {
      return { minorGeometry: null, majorGeometry: null, coastlineGeometry: null, oceanGeometry: null };
    }

    const maxSegments = 250;
    const sampleRateX = Math.max(1, Math.ceil(canvasWidth / maxSegments));
    const sampleRateY = Math.max(1, Math.ceil(canvasHeight / maxSegments));

    const segmentsX = Math.floor(canvasWidth / sampleRateX);
    const segmentsY = Math.floor(canvasHeight / sampleRateY);

    const scaleX = 100;
    const scaleY = (canvasHeight / canvasWidth) * scaleX;

    let minElev = Infinity;
    let maxElev = -Infinity;
    for (let gy = 0; gy < segmentsY; gy++) {
      const dataY = canvasHeight - 1 - Math.min(gy * sampleRateY, canvasHeight - 1);
      for (let gx = 0; gx < segmentsX; gx++) {
        const dataX = Math.min(gx * sampleRateX, canvasWidth - 1);
        const elev = elevationData[dataY]?.[dataX] ?? 0;
        minElev = Math.min(minElev, elev);
        maxElev = Math.max(maxElev, elev);
      }
    }

    const startLevel = Math.ceil(minElev / CONTOUR_INTERVAL) * CONTOUR_INTERVAL;
    const endLevel = Math.floor(maxElev / CONTOUR_INTERVAL) * CONTOUR_INTERVAL;

    const minorVertices = []; // Every 30m (not major)
    const majorVertices = []; // Every 150m
    const coastlineVertices = []; // 0m
    const oceanVertices = []; // Below 0m

    const elevGrid = new Float32Array(segmentsX * segmentsY);
    for (let gy = 0; gy < segmentsY; gy++) {
      const dataY = canvasHeight - 1 - Math.min(gy * sampleRateY, canvasHeight - 1);
      for (let gx = 0; gx < segmentsX; gx++) {
        const dataX = Math.min(gx * sampleRateX, canvasWidth - 1);
        elevGrid[gy * segmentsX + gx] = elevationData[dataY]?.[dataX] ?? 0;
      }
    }

    const getElev = (gx, gy) => elevGrid[gy * segmentsX + gx];

    for (let level = startLevel; level <= endLevel; level += CONTOUR_INTERVAL) {
      const isOcean = level < 0;
      const isCoastline = level === 0;
      const isMajor = level % 150 === 0 && level !== 0;

      // Ocean contours at y=0 (will be animated), land at their elevation
      const y3d = isOcean ? 0 : level * HEIGHT_SCALE + 0.05;

      // Choose target array based on type
      let targetVertices;
      if (isOcean) {
        targetVertices = oceanVertices;
      } else if (isCoastline) {
        targetVertices = coastlineVertices;
      } else if (isMajor) {
        targetVertices = majorVertices;
      } else {
        targetVertices = minorVertices;
      }

      for (let gy = 0; gy < segmentsY - 1; gy++) {
        for (let gx = 0; gx < segmentsX - 1; gx++) {
          const e00 = getElev(gx, gy);
          const e10 = getElev(gx + 1, gy);
          const e01 = getElev(gx, gy + 1);
          const e11 = getElev(gx + 1, gy + 1);

          let caseIndex = 0;
          if (e00 >= level) caseIndex |= 1;
          if (e10 >= level) caseIndex |= 2;
          if (e11 >= level) caseIndex |= 4;
          if (e01 >= level) caseIndex |= 8;

          if (caseIndex === 0 || caseIndex === 15) continue;

          const x0 = (gx / segmentsX - 0.5) * scaleX;
          const x1 = ((gx + 1) / segmentsX - 0.5) * scaleX;
          const z0 = (gy / segmentsY - 0.5) * scaleY;
          const z1 = ((gy + 1) / segmentsY - 0.5) * scaleY;

          const lerp = (a, b, t) => a + (b - a) * t;
          const getT = (e1, e2) => (e2 === e1) ? 0.5 : (level - e1) / (e2 - e1);

          const bottom = [lerp(x0, x1, getT(e00, e10)), z0];
          const right = [x1, lerp(z0, z1, getT(e10, e11))];
          const top = [lerp(x0, x1, getT(e01, e11)), z1];
          const left = [x0, lerp(z0, z1, getT(e00, e01))];

          const addSeg = (p1, p2) => {
            targetVertices.push(p1[0], y3d, p1[1], p2[0], y3d, p2[1]);
          };

          switch (caseIndex) {
            case 1: case 14: addSeg(bottom, left); break;
            case 2: case 13: addSeg(bottom, right); break;
            case 3: case 12: addSeg(left, right); break;
            case 4: case 11: addSeg(right, top); break;
            case 5: addSeg(bottom, left); addSeg(right, top); break;
            case 6: case 9: addSeg(bottom, top); break;
            case 7: case 8: addSeg(left, top); break;
            case 10: addSeg(bottom, right); addSeg(left, top); break;
          }
        }
      }
    }

    let minorGeo = null;
    if (minorVertices.length > 0) {
      minorGeo = new THREE.BufferGeometry();
      minorGeo.setAttribute('position', new THREE.Float32BufferAttribute(minorVertices, 3));
    }

    let majorGeo = null;
    if (majorVertices.length > 0) {
      majorGeo = new THREE.BufferGeometry();
      majorGeo.setAttribute('position', new THREE.Float32BufferAttribute(majorVertices, 3));
    }

    let coastlineGeo = null;
    if (coastlineVertices.length > 0) {
      coastlineGeo = new THREE.BufferGeometry();
      coastlineGeo.setAttribute('position', new THREE.Float32BufferAttribute(coastlineVertices, 3));
    }

    let oceanGeo = null;
    if (oceanVertices.length > 0) {
      oceanGeo = new THREE.BufferGeometry();
      oceanGeo.setAttribute('position', new THREE.Float32BufferAttribute(oceanVertices, 3));
    }

    return { minorGeometry: minorGeo, majorGeometry: majorGeo, coastlineGeometry: coastlineGeo, oceanGeometry: oceanGeo };
  }, [elevationData, canvasWidth, canvasHeight]);

  // Animate ocean contours to follow water motion - always stay above water
  useFrame((state) => {
    if (oceanGroupRef.current) {
      // Match water position + offset to stay above
      const waterY = 0.1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
      oceanGroupRef.current.position.y = waterY + 0.03;
    }
  });

  return (
    <group>
      {/* Minor contours (every 30m, not major) - thin, semi-transparent */}
      {minorGeometry && (
        <lineSegments geometry={minorGeometry}>
          <lineBasicMaterial color="#1e1e1e" transparent opacity={0.9} linewidth={1} />
        </lineSegments>
      )}

      {/* Major contours (every 150m) - medium thickness */}
      {majorGeometry && (
        <lineSegments geometry={majorGeometry}>
          <lineBasicMaterial color="#141414" opacity={1.0} linewidth={2} />
        </lineSegments>
      )}

      {/* Coastline (0m) - thick, black */}
      {coastlineGeometry && (
        <lineSegments geometry={coastlineGeometry}>
          <lineBasicMaterial color="#000000" opacity={1.0} linewidth={3} />
        </lineSegments>
      )}

      {/* Ocean contours - animated with water, white */}
      {oceanGeometry && (
        <group ref={oceanGroupRef}>
          <lineSegments geometry={oceanGeometry}>
            <lineBasicMaterial color="#ffffff" transparent opacity={0.7} linewidth={1} />
          </lineSegments>
        </group>
      )}
    </group>
  );
}
