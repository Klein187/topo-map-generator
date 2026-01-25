'use client';

import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { X, Mountain, Layers } from 'lucide-react';
import TerrainMeshTextured from './TerrainMeshTextured';
import TerrainWalls from './TerrainWalls';
import ContourLines3D from './ContourLines3D';
import Water3D from './Water3D';

function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-slate-900/95 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-300 text-lg">Generating 3D terrain...</p>
      </div>
    </div>
  );
}

function TerrainViewer3D({
  elevationData,
  biomeData,
  canvasWidth,
  canvasHeight,
  onClose,
  embedded = false
}) {
  const [showContours, setShowContours] = useState(false);

  // Calculate camera distance based on map aspect ratio
  const cameraDistance = 80;

  return (
    <div
      className={embedded
        ? "relative h-full w-full bg-slate-900"
        : "fixed inset-0 z-50 bg-slate-900"
      }
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Close button - only in full mode */}
      {!embedded && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-slate-800/90 border border-slate-600 text-white hover:bg-slate-700 transition-colors shadow-xl"
          title="Close 3D View"
        >
          <X size={24} />
        </button>
      )}

      {/* Title */}
      <div className={embedded
        ? "absolute top-2 left-2 z-50 flex items-center gap-2 bg-slate-800/90 border border-slate-600 rounded-lg px-3 py-1.5 shadow-xl"
        : "absolute top-4 left-4 z-50 flex items-center gap-3 bg-slate-800/90 border border-slate-600 rounded-lg px-4 py-2 shadow-xl"
      }>
        <Mountain className="text-emerald-400" size={embedded ? 20 : 24} />
        <span className="text-white font-semibold text-sm">{embedded ? 'Live 3D Preview' : '3D Terrain View'}</span>
      </div>

      {/* Contour lines toggle */}
      <div className={embedded ? "absolute top-12 left-2 z-50" : "absolute top-20 left-4 z-50"}>
        <button
          onClick={() => setShowContours(!showContours)}
          className={`flex items-center gap-2 ${embedded ? 'px-3 py-1.5' : 'px-4 py-2'} rounded-lg border shadow-xl transition-colors ${
            showContours
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-slate-800/90 border-slate-600 text-slate-300 hover:bg-slate-700'
          }`}
          title="Toggle Contour Lines"
        >
          <Layers size={embedded ? 16 : 18} />
          <span className={`${embedded ? 'text-xs' : 'text-sm'} font-medium`}>Contour Lines</span>
        </button>
      </div>

      {/* Controls hint */}
      <div className={embedded
        ? "absolute bottom-2 left-1/2 -translate-x-1/2 z-50 bg-slate-800/90 border border-slate-600 rounded-lg px-3 py-1.5 shadow-xl"
        : "absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800/90 border border-slate-600 rounded-lg px-4 py-2 shadow-xl"
      }>
        <p className={`text-slate-400 ${embedded ? 'text-xs' : 'text-sm'}`}>
          <span className="text-slate-200">Drag</span> to rotate &nbsp;|&nbsp;
          <span className="text-slate-200">Scroll</span> to zoom &nbsp;|&nbsp;
          <span className="text-slate-200">Right-drag</span> to pan
        </p>
      </div>

      {/* Three.js Canvas */}
      <Suspense fallback={<LoadingSpinner />}>
        <Canvas
          camera={{
            position: [cameraDistance * 0.7, cameraDistance * 0.5, cameraDistance * 0.7],
            fov: 45,
            near: 0.1,
            far: 1000
          }}
          gl={{ antialias: true }}
          flat
        >
          {/* Sky background */}
          <color attach="background" args={['#1e293b']} />

          {/* Lighting */}
          <ambientLight intensity={1.2} />
          <directionalLight
            position={[50, 100, 50]}
            intensity={1.0}
          />
          <directionalLight
            position={[-30, 60, -30]}
            intensity={0.5}
          />

          {/* Water surface at sea level - only over ocean areas */}
          <Water3D
            elevationData={elevationData}
            biomeData={biomeData}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />

          {/* Terrain mesh */}
          <TerrainMeshTextured
            elevationData={elevationData}
            biomeData={biomeData}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />

          {/* Solid walls around terrain edges */}
          <TerrainWalls
            elevationData={elevationData}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />

          {/* Contour lines */}
          {showContours && (
            <ContourLines3D
              elevationData={elevationData}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
          )}

          {/* Camera controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={20}
            maxDistance={200}
            maxPolarAngle={Math.PI / 2.1}
            target={[0, 0, 0]}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default React.memo(TerrainViewer3D);
