'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Mountain, Droplet, Trees, Download, Trash2, MapPin, Layers, Hash, ZoomIn, ZoomOut, Move, Circle, Square, Undo, ChevronUp, ChevronDown, Map, HelpCircle } from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const TerrainTypes = {
  OCEAN: { elevation: -100, name: 'Deep Ocean', icon: Droplet, color: '#0c1e47' },
  SHALLOW: { elevation: -20, name: 'Shallow Water', icon: Droplet, color: '#3b82f6' },
  COAST: { elevation: 5, name: 'Coastal', icon: Droplet, color: '#93c5fd' },
  LOWLAND: { elevation: 50, name: 'Lowland', icon: Trees, color: '#86efac' },
  PLAIN: { elevation: 150, name: 'Plains', icon: Trees, color: '#4ade80' },
  HIGHLAND: { elevation: 300, name: 'Highland', icon: Mountain, color: '#fde047' },
  MOUNTAIN: { elevation: 500, name: 'Mountain', icon: Mountain, color: '#d97706' },
  PEAK: { elevation: 800, name: 'Peak', icon: Mountain, color: '#78350f' },
  SNOW: { elevation: 1000, name: 'Snow Peak', icon: Mountain, color: '#f8fafc' }
};

const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 1200;

const MAP_SIZES = {
  extraLarge: { width: 4000, height: 2400, label: 'Extra Large', description: '4000 × 2400' },
  large: { width: 3000, height: 1800, label: 'Large', description: '3000 × 1800' },
  medium: { width: 2000, height: 1200, label: 'Medium', description: '2000 × 1200' },
  small: { width: 1320, height: 792, label: 'Small', description: '1320 × 792' }
};

const BRUSH_CONSTANTS = {
  MIN_SIZE: 20,
  MAX_SIZE: 200,
  DEFAULT_SIZE: 40,
  FALLOFF_STRENGTH: 0.3,
  ELEVATION_BLEND: 0.2,
  SMOOTH_AMOUNT: 0.1,
};

const ELEVATION_CONFIG = {
  CONTOUR_INTERVAL: 25,
  CONTOUR_STEP: 3,
  COASTLINE_LEVEL: 0,
  MAX_ELEVATION: 1000,
  MIN_ELEVATION: -600,
};

const BIOME_TYPES = {
  TEMPERATE: 'temperate',
  DESERT: 'desert',
  TROPICAL: 'tropical',
  ARCTIC: 'arctic',
  VOLCANIC: 'volcanic',
};

const BIOME_COLORS = {
  [BIOME_TYPES.TEMPERATE]: [
    [-600, '#020617'],  // Abyssal trench - almost black
    [-500, '#0a0f29'],  // Deep trench - very dark navy
    [-400, '#0c1435'],  // Deep trench - dark navy
    [-350, '#0c1940'],  // Very deep ocean
    [-300, '#0c1e47'],  // Very deep ocean
    [-250, '#0f2557'],  // Deep ocean
    [-200, '#1a2f6c'],  // Deep ocean
    [-150, '#1e3a8a'],  // Ocean depth
    [-100, '#1e40af'],  // Ocean depth
    [-75, '#2563eb'],   // Mid ocean
    [-50, '#3b82f6'],   // Ocean
    [-25, '#60a5fa'],   // Shallow water
    [0, '#93c5fd'],     // Coastline
    [25, '#bbf7d0'],
    [50, '#86efac'],
    [100, '#4ade80'],
    [150, '#22c55e'],
    [200, '#16a34a'],
    [250, '#a3e635'],
    [300, '#84cc16'],
    [350, '#fde047'],
    [400, '#facc15'],
    [450, '#f59e0b'],
    [500, '#d97706'],
    [550, '#b45309'],
    [600, '#92400e'],
    [650, '#78350f'],
    [700, '#57534e'],
    [750, '#a8a29e'],
    [800, '#d6d3d1'],
    [Infinity, '#f8fafc']
  ],
  [BIOME_TYPES.DESERT]: [
    [-600, '#020617'],  // Abyssal trench
    [-500, '#0a0f29'],  // Deep trench
    [-400, '#0c1435'],  // Deep trench
    [-350, '#0c1940'],  // Very deep ocean
    [-300, '#0c1e47'],  // Very deep ocean
    [-250, '#0f2557'],  // Deep ocean
    [-200, '#1a2f6c'],  // Deep ocean
    [-150, '#1e3a8a'],  // Ocean depth
    [-100, '#1e40af'],  // Ocean depth
    [-75, '#2563eb'],   // Mid ocean
    [-50, '#3b82f6'],   // Ocean
    [-25, '#60a5fa'],   // Shallow water
    [0, '#93c5fd'],     // Coastline
    [25, '#fef3c7'],
    [50, '#fde68a'],
    [100, '#fcd34d'],
    [150, '#fbbf24'],
    [200, '#f59e0b'],
    [250, '#d97706'],
    [300, '#b45309'],
    [350, '#92400e'],
    [400, '#78350f'],
    [450, '#a16207'],
    [500, '#854d0e'],
    [550, '#713f12'],
    [600, '#78350f'],
    [650, '#57534e'],
    [700, '#78716c'],
    [750, '#a8a29e'],
    [800, '#d6d3d1'],
    [Infinity, '#f5f5f4']
  ],
  [BIOME_TYPES.TROPICAL]: [
    [-600, '#021a14'],  // Abyssal trench - very dark teal
    [-500, '#032518'],  // Deep trench - dark teal
    [-400, '#03301f'],  // Deep trench
    [-350, '#043d28'],  // Very deep ocean
    [-300, '#064e3b'],  // Very deep ocean
    [-250, '#065740'],  // Deep ocean
    [-200, '#065f46'],  // Deep ocean
    [-150, '#047857'],  // Ocean depth
    [-100, '#059669'],  // Ocean depth
    [-75, '#0d9488'],   // Mid ocean
    [-50, '#0891b2'],   // Ocean
    [-25, '#22d3ee'],   // Shallow water
    [0, '#67e8f9'],     // Coastline
    [25, '#a7f3d0'],
    [50, '#6ee7b7'],
    [100, '#34d399'],
    [150, '#10b981'],
    [200, '#059669'],
    [250, '#047857'],
    [300, '#065f46'],
    [350, '#064e3b'],
    [400, '#166534'],
    [450, '#14532d'],
    [500, '#365314'],
    [550, '#3f6212'],
    [600, '#4d7c0f'],
    [650, '#78350f'],
    [700, '#57534e'],
    [750, '#a8a29e'],
    [800, '#d6d3d1'],
    [Infinity, '#f8fafc']
  ],
  [BIOME_TYPES.ARCTIC]: [
    [-600, '#021625'],  // Abyssal trench - very dark icy blue
    [-500, '#031e36'],  // Deep trench - dark icy blue
    [-400, '#052947'],  // Deep trench
    [-350, '#073858'],  // Very deep ocean
    [-300, '#0c4a6e'],  // Very deep ocean
    [-250, '#0e5380'],  // Deep ocean
    [-200, '#075985'],  // Deep ocean
    [-150, '#0369a1'],  // Ocean depth
    [-100, '#0891b2'],  // Ocean depth
    [-75, '#06b6d4'],   // Mid ocean
    [-50, '#0284c7'],   // Ocean
    [-25, '#0ea5e9'],   // Shallow water
    [0, '#7dd3fc'],     // Coastline
    [25, '#e0f2fe'],
    [50, '#f0f9ff'],
    [100, '#e2e8f0'],
    [150, '#cbd5e1'],
    [200, '#94a3b8'],
    [250, '#64748b'],
    [300, '#475569'],
    [350, '#334155'],
    [400, '#1e293b'],
    [450, '#334155'],
    [500, '#475569'],
    [550, '#64748b'],
    [600, '#94a3b8'],
    [650, '#cbd5e1'],
    [700, '#e2e8f0'],
    [750, '#f1f5f9'],
    [800, '#f8fafc'],
    [Infinity, '#ffffff']
  ],
  [BIOME_TYPES.VOLCANIC]: [
    [-600, '#0a0908'],  // Abyssal trench - almost black
    [-500, '#0f0e0c'],  // Deep trench - very dark gray
    [-400, '#141210'],  // Deep trench
    [-350, '#1a1815'],  // Very deep ocean
    [-300, '#1c1917'],  // Very deep ocean
    [-250, '#221f1c'],  // Deep ocean
    [-200, '#292524'],  // Deep ocean
    [-150, '#373330'],  // Ocean depth
    [-100, '#44403c'],  // Ocean depth
    [-75, '#4d4743'],   // Mid ocean
    [-50, '#57534e'],   // Ocean
    [-25, '#78716c'],   // Shallow water
    [0, '#a8a29e'],     // Coastline
    [25, '#57534e'],
    [50, '#44403c'],
    [100, '#292524'],
    [150, '#1c1917'],
    [200, '#450a0a'],
    [250, '#7f1d1d'],
    [300, '#991b1b'],
    [350, '#b91c1c'],
    [400, '#dc2626'],
    [450, '#ef4444'],
    [500, '#f87171'],
    [550, '#fca5a5'],
    [600, '#44403c'],
    [650, '#57534e'],
    [700, '#78716c'],
    [750, '#a8a29e'],
    [800, '#d6d3d1'],
    [Infinity, '#e7e5e4']
  ],
};

const DrawMode = {
  PAINT_LAND: 'paint_land',
  PAINT_OCEAN: 'paint_ocean',
  FLATTEN: 'flatten',
};

// ============================================================================
// ELEVATION COLOR MAPPING
// ============================================================================

const getElevationColor = (elevation, biome = BIOME_TYPES.TEMPERATE) => {
  const colorStops = BIOME_COLORS[biome] || BIOME_COLORS[BIOME_TYPES.TEMPERATE];

  for (const [threshold, color] of colorStops) {
    if (elevation < threshold) return color;
  }
  return colorStops[colorStops.length - 1][1];
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TopographicMapCreator() {
  // Refs
  const canvasRef = useRef(null);
  const contourRef = useRef(null);
  const containerRef = useRef(null);
  const elevationDataRef = useRef([]);
  const isDrawingRef = useRef(false);
  const flattenElevationRef = useRef(null);
  const drawModeRef = useRef(DrawMode.PAINT_LAND);
  const oceanDepthRef = useRef(-100);
  const landElevationRef = useRef(100);
  const panStartRef = useRef({ x: 0, y: 0 });
  const drawingBiomeRef = useRef(null);
  const undoHistoryRef = useRef([]);

  // State
  const [brushSize, setBrushSize] = useState(BRUSH_CONSTANTS.DEFAULT_SIZE);
  const [brushShape, setBrushShape] = useState('circle');
  const [labels, setLabels] = useState([]);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [showContours, setShowContours] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [showElevationNumbers, setShowElevationNumbers] = useState(false);
  const [cursorElevation, setCursorElevation] = useState(null);
  const [cursorScreenPos, setCursorScreenPos] = useState({ x: 0, y: 0 });
  const [drawMode, setDrawMode] = useState(DrawMode.PAINT_LAND);
  const [oceanDepth, setOceanDepth] = useState(-100);
  const [landElevation, setLandElevation] = useState(100);
  const [canUndo, setCanUndo] = useState(false);
  const [previousBrushSize, setPreviousBrushSize] = useState(BRUSH_CONSTANTS.DEFAULT_SIZE);
  const [brushOutlinePos, setBrushOutlinePos] = useState({ x: 0, y: 0, visible: false });
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [labelDialog, setLabelDialog] = useState(null);
  const [editingLabelIndex, setEditingLabelIndex] = useState(null);
  const [labelText, setLabelText] = useState('');
  const [labelFontSize, setLabelFontSize] = useState(20);
  const [labelFontFamily, setLabelFontFamily] = useState('Georgia');
  const [labelBold, setLabelBold] = useState(false);
  const [labelItalic, setLabelItalic] = useState(false);
  const [labelCurve, setLabelCurve] = useState(0);
  const [labelRotation, setLabelRotation] = useState(0);
  const [dialogOffset, setDialogOffset] = useState({ x: 0, y: 0 });
  const [isDraggingDialog, setIsDraggingDialog] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredLabelIndex, setHoveredLabelIndex] = useState(null);
  const [draggingLabelIndex, setDraggingLabelIndex] = useState(null);
  const [labelDragOffset, setLabelDragOffset] = useState({ x: 0, y: 0 });
  const [justDraggedLabel, setJustDraggedLabel] = useState(false);
  const isEditingLabelEdgeRef = useRef(false);
  const [drawingContours, setDrawingContours] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(true);
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [helpMode, setHelpMode] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [mapSize, setMapSize] = useState(null);
  const [drawingBiome, setDrawingBiome] = useState(null); // null means use blend, or specific biome
  const [canvasWidth, setCanvasWidth] = useState(CANVAS_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(CANVAS_HEIGHT);
  const [selectedBiomes, setSelectedBiomes] = useState([BIOME_TYPES.TEMPERATE]);

  // Handle map size selection
  const handleSizeSelection = useCallback((size) => {
    const selectedSize = MAP_SIZES[size];
    setCanvasWidth(selectedSize.width);
    setCanvasHeight(selectedSize.height);
    setMapSize(size);
    setShowSizeModal(false);
    setShowControlsModal(true);
    
    // Initialize canvas after size selection
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      canvas.width = selectedSize.width;
      canvas.height = selectedSize.height;
      
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = getElevationColor(-100, selectedBiomes[0]);
      ctx.fillRect(0, 0, selectedSize.width, selectedSize.height);
      
      const data = [];
      for (let y = 0; y < selectedSize.height; y++) {
        data[y] = [];
        for (let x = 0; x < selectedSize.width; x++) {
          data[y][x] = -100;
        }
      }
      elevationDataRef.current = data;

      // Also resize contour canvas
      const contourCanvas = contourRef.current;
      if (contourCanvas) {
        contourCanvas.width = selectedSize.width;
        contourCanvas.height = selectedSize.height;
      }
    }, 0);
  }, [selectedBiomes]);

  // Toggle biome selection
  const toggleBiome = useCallback((biome) => {
    setSelectedBiomes(prev => {
      if (prev.includes(biome)) {
        // Don't allow deselecting the last biome
        if (prev.length === 1) return prev;
        return prev.filter(b => b !== biome);
      } else {
        return [...prev, biome];
      }
    });
  }, []);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    // Only initialize if map size has been selected
    if (!mapSize) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = getElevationColor(-100, selectedBiomes[0]);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const data = [];
    for (let y = 0; y < canvas.height; y++) {
      data[y] = [];
      for (let x = 0; x < canvas.width; x++) {
        data[y][x] = -100;
      }
    }
    elevationDataRef.current = data;
  }, [mapSize, selectedBiomes]);

  useEffect(() => {
    drawModeRef.current = drawMode;
  }, [drawMode]);

  useEffect(() => {
    oceanDepthRef.current = oceanDepth;
  }, [oceanDepth]);

  useEffect(() => {
    landElevationRef.current = landElevation;
  }, [landElevation]);

  useEffect(() => {
    drawingBiomeRef.current = drawingBiome;
  }, [drawingBiome]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // ============================================================================
  // ELEVATION & DRAWING
  // ============================================================================

  const elevationLevels = useMemo(
    () => Object.values(TerrainTypes)
      .map(t => t.elevation)
      .sort((a, b) => a - b),
    []
  );

  const getCanvasCoordinates = useCallback((e) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };

    let clientX, clientY;
    if (e.type?.includes('touch')) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const containerRect = container.getBoundingClientRect();
    let displayX = clientX - containerRect.left;
    let displayY = clientY - containerRect.top;

    // Account for zoom and pan transforms
    const canvasX = (displayX / zoom) - pan.x;
    const canvasY = (displayY / zoom) - pan.y;

    return {
      x: canvasX,
      y: canvasY
    };
  }, [pan, zoom]);

  const applyBrushFalloff = useCallback((dist, radius) => {
    return Math.max(0, 1 - (dist / radius));
  }, []);

  const updateElevationData = useCallback((centerX, centerY) => {
    const data = elevationDataRef.current;
    const radius = brushSize / 2;

    if (brushShape === 'circle') {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            const py = Math.floor(centerY + dy);
            const px = Math.floor(centerX + dx);
            if (py >= 0 && py < data.length && px >= 0 && px < data[0].length) {
              const falloff = applyBrushFalloff(dist, radius);
              const currentElev = data[py][px];

              if (drawModeRef.current === DrawMode.PAINT_LAND) {
                const targetElev = landElevationRef.current;
                data[py][px] = currentElev + (targetElev - currentElev) * falloff * BRUSH_CONSTANTS.ELEVATION_BLEND;
              } else if (drawModeRef.current === DrawMode.PAINT_OCEAN) {
                const targetDepth = oceanDepthRef.current;
                data[py][px] = currentElev + (targetDepth - currentElev) * falloff * BRUSH_CONSTANTS.ELEVATION_BLEND;
              } else if (drawModeRef.current === DrawMode.FLATTEN) {
                if (flattenElevationRef.current !== null) {
                  const targetElev = flattenElevationRef.current;
                  data[py][px] = currentElev + (targetElev - currentElev) * falloff * BRUSH_CONSTANTS.ELEVATION_BLEND;
                }
              }
            }
          }
        }
      }
    } else if (brushShape === 'square') {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const py = Math.floor(centerY + dy);
          const px = Math.floor(centerX + dx);
          if (py >= 0 && py < data.length && px >= 0 && px < data[0].length) {
            const distX = Math.abs(dx) / radius;
            const distY = Math.abs(dy) / radius;
            const falloff = applyBrushFalloff(Math.max(distX, distY), 1);
            const currentElev = data[py][px];

            if (drawModeRef.current === DrawMode.PAINT_LAND) {
              const targetElev = landElevationRef.current;
              data[py][px] = currentElev + (targetElev - currentElev) * falloff * BRUSH_CONSTANTS.ELEVATION_BLEND;
            } else if (drawModeRef.current === DrawMode.PAINT_OCEAN) {
              const targetDepth = oceanDepthRef.current;
              data[py][px] = currentElev + (targetDepth - currentElev) * falloff * BRUSH_CONSTANTS.ELEVATION_BLEND;
            } else if (drawModeRef.current === DrawMode.FLATTEN) {
              if (flattenElevationRef.current !== null) {
                const targetElev = flattenElevationRef.current;
                data[py][px] = currentElev + (targetElev - currentElev) * falloff * BRUSH_CONSTANTS.ELEVATION_BLEND;
              }
            }
          }
        }
      }
    }
  }, [brushSize, brushShape, elevationLevels, applyBrushFalloff]);

  const redrawCanvasArea = useCallback((centerX, centerY) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const data = elevationDataRef.current;
    const radius = brushSize / 2 + 2;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.floor(centerX + dx);
        const py = Math.floor(centerY + dy);
        if (py >= 0 && py < data.length && px >= 0 && px < data[0].length) {
          const elev = data[py][px];
          const color = getElevationColor(elev, selectedBiomes[0]);
          ctx.fillStyle = color;
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
  }, [brushSize, selectedBiomes]);

  const drawContourLines = useCallback(() => {
    const contourCanvas = contourRef.current;
    if (!contourCanvas || elevationDataRef.current.length === 0) return;

    const ctx = contourCanvas.getContext('2d');
    ctx.clearRect(0, 0, contourCanvas.width, contourCanvas.height);

    const data = elevationDataRef.current;
    const height = data.length;
    const width = data[0].length;
    
    // Step size for performance (smaller = smoother but slower)
    const CONTOUR_STEP = 4;
    const CONTOUR_INTERVAL = 30; // More contour lines
    const MIN_ELEVATION = -300;
    const MAX_ELEVATION = 1000;

    // Group contour levels by style for batch rendering
    const coastlineLevel = 0;
    const majorLevels = []; // Every 150m
    const minorLevels = []; // Everything else

    for (let level = MIN_ELEVATION; level <= MAX_ELEVATION; level += CONTOUR_INTERVAL) {
      if (level === coastlineLevel) continue; // Handle separately
      if (level % 150 === 0) {
        majorLevels.push(level);
      } else {
        minorLevels.push(level);
      }
    }

    // Helper function to draw contours for a set of levels
    const drawContourSet = (levels, strokeStyle, lineWidth) => {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      for (const contourLevel of levels) {
        for (let y = 0; y < height - CONTOUR_STEP; y += CONTOUR_STEP) {
          const row = data[y];
          const rowBelow = data[y + CONTOUR_STEP];
          if (!row || !rowBelow) continue;

          for (let x = 0; x < width - CONTOUR_STEP; x += CONTOUR_STEP) {
            const e = row[x];
            const eRight = row[x + CONTOUR_STEP];
            const eDown = rowBelow[x];

            // Check horizontal edge
            if ((e <= contourLevel) !== (eRight <= contourLevel)) {
              ctx.moveTo(x, y);
              ctx.lineTo(x + CONTOUR_STEP, y);
            }

            // Check vertical edge
            if ((e <= contourLevel) !== (eDown <= contourLevel)) {
              ctx.moveTo(x, y);
              ctx.lineTo(x, y + CONTOUR_STEP);
            }
          }
        }
      }

      ctx.stroke();
    };

    // Draw in order: minor (back), major (middle), coastline (front)
    drawContourSet(minorLevels, 'rgba(30, 30, 30, 0.9)', 1.5);
    drawContourSet(majorLevels, 'rgba(20, 20, 20, 1)', 2.5);
    drawContourSet([coastlineLevel], 'rgba(0, 0, 0, 1)', 3.5);

  }, []);

  // ============================================================================
  // UNDO SYSTEM
  // ============================================================================

  const saveStateForUndo = useCallback(() => {
    const currentElevationData = elevationDataRef.current;

    // Deep copy the elevation data
    const elevationCopy = currentElevationData.map(row => [...row]);

    // Add to history, keeping only last 3 states
    undoHistoryRef.current.push({
      elevationData: elevationCopy
    });

    // Keep only last 3 states
    if (undoHistoryRef.current.length > 3) {
      undoHistoryRef.current.shift();
    }

    // Update undo availability
    setCanUndo(true);
  }, []);

  const undo = useCallback(() => {
    if (undoHistoryRef.current.length === 0) return;

    // Pop the last saved state
    const previousState = undoHistoryRef.current.pop();

    // Restore the state
    elevationDataRef.current = previousState.elevationData;

    // Redraw the entire canvas
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = elevationDataRef.current;

    for (let y = 0; y < data.length; y++) {
      for (let x = 0; x < data[0].length; x++) {
        const elev = data[y][x];
        const color = getElevationColor(elev, selectedBiomes[0]);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Redraw contours if enabled
    if (showContours) {
      drawContourLines();
    }

    // Update undo availability
    setCanUndo(undoHistoryRef.current.length > 0);
  }, [selectedBiomes, showContours, drawContourLines]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const draw = useCallback((e) => {
    if (!isDrawingRef.current && !['mousedown', 'touchstart'].includes(e.type)) return;

    const { x, y } = getCanvasCoordinates(e);
    const radius = brushSize / 2;

    if (x < -radius || x >= canvasWidth + radius || y < -radius || y >= canvasHeight + radius) {
      return;
    }

    updateElevationData(x, y);
    redrawCanvasArea(x, y);
  }, [brushSize, getCanvasCoordinates, updateElevationData, redrawCanvasArea, canvasWidth, canvasHeight]);

  const startDrawing = useCallback((e) => {
    if (isAddingLabel) return;

    if (isPanMode || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX - pan.x * zoom,
        y: e.clientY - pan.y * zoom
      };
      return;
    }

    if (e.button === 0) {
      if (e.shiftKey) {
        setDrawMode(DrawMode.FLATTEN);
      } else {
        setDrawMode(DrawMode.PAINT_LAND);
      }
    } else if (e.button === 2) {
      e.preventDefault();
      setDrawMode(DrawMode.PAINT_OCEAN);
    }

    // Save state for undo before drawing
    saveStateForUndo();

    isDrawingRef.current = true;

    if (drawMode === DrawMode.FLATTEN || (e.button === 0 && e.shiftKey)) {
      const { x, y } = getCanvasCoordinates(e);
      const data = elevationDataRef.current;
      const py = Math.floor(y);
      const px = Math.floor(x);
      if (py >= 0 && py < data.length && px >= 0 && px < data[0].length) {
        flattenElevationRef.current = data[py][px];
      }
    }

    draw(e);
  }, [isAddingLabel, isPanMode, pan, zoom, drawMode, getCanvasCoordinates, draw, saveStateForUndo]);

  const stopDrawing = useCallback(() => {
    isDrawingRef.current = false;
    setIsPanning(false);
    if (draggingLabelIndex !== null) {
      setJustDraggedLabel(true);
      setTimeout(() => setJustDraggedLabel(false), 100);
    }
    setDraggingLabelIndex(null);
    if (showContours) {
      setTimeout(() => drawContourLines(), 0);
    }
  }, [showContours, drawContourLines]);

  const handleMouseMove = useCallback((e) => {
    // Handle label dragging - but only if mouse button is actually pressed
    if (draggingLabelIndex !== null && isAddingLabel && e.buttons === 1) {
      const { x, y } = getCanvasCoordinates(e);
      setLabels(prev => {
        const updated = [...prev];
        updated[draggingLabelIndex] = {
          ...updated[draggingLabelIndex],
          x: x,
          y: y
        };
        return updated;
      });
      return;
    } else if (draggingLabelIndex !== null && e.buttons !== 1) {
      // Mouse button released, stop dragging
      setDraggingLabelIndex(null);
      return;
    }

    if (isPanning) {
      const newPanX = (e.clientX - panStartRef.current.x) / zoom;
      const newPanY = (e.clientY - panStartRef.current.y) / zoom;
      setPan({ x: newPanX, y: newPanY });
      return;
    }

    if (isDrawingRef.current) {
      draw(e);
    }

    // Update elevation display and cursor position
    if (showElevationNumbers) {
      const { x, y } = getCanvasCoordinates(e);
      const data = elevationDataRef.current;
      const py = Math.floor(y);
      const px = Math.floor(x);
      if (py >= 0 && py < data.length && px >= 0 && px < data[0].length) {
        setCursorElevation(Math.round(data[py][px]));
        setCursorScreenPos({ x: e.clientX, y: e.clientY });
      }
    }

    // Update brush outline position - simplified math
    const container = containerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const isOverMap = e.clientX >= containerRect.left && e.clientX <= containerRect.right &&
                        e.clientY >= containerRect.top && e.clientY <= containerRect.bottom;
      
      if (isOverMap) {
        const relX = e.clientX - containerRect.left;
        const relY = e.clientY - containerRect.top;
        const canvasX = ((relX - pan.x * zoom) / zoom) * 2;
        const canvasY = ((relY - pan.y * zoom) / zoom) * 2;
        setBrushOutlinePos({ x: canvasX, y: canvasY, visible: true });

        // Check hover over labels when in label adding mode
        if (isAddingLabel && !labelDialog && draggingLabelIndex === null) {
          const hovered = labels.findIndex(label => {
            const distance = Math.sqrt(
              Math.pow(label.x - canvasX, 2) + Math.pow(label.y - canvasY, 2)
            );
            return distance < 30;
          });
          setHoveredLabelIndex(hovered !== -1 ? hovered : null);
        } else {
          setHoveredLabelIndex(null);
        }
      } else {
        setBrushOutlinePos(prev => ({ ...prev, visible: false }));
        setHoveredLabelIndex(null);
      }
    }
  }, [isPanning, pan, zoom, showElevationNumbers, getCanvasCoordinates, draw, isAddingLabel, labelDialog, labels, draggingLabelIndex]);

  const handleCanvasClick = useCallback((e) => {
    if (!isAddingLabel || labelDialog) return;
    
    // If we're editing a label edge, skip creating new label
    if (isEditingLabelEdgeRef.current) {
      isEditingLabelEdgeRef.current = false;
      return;
    }

    const { x, y } = getCanvasCoordinates(e);
    
    // Check if clicking on an existing label (within 30px radius)
    const clickedLabelIndex = labels.findIndex(label => {
      const distance = Math.sqrt(
        Math.pow(label.x - x, 2) + Math.pow(label.y - y, 2)
      );
      return distance < 30;
    });

    if (clickedLabelIndex !== -1) {
      // Edit existing label
      const label = labels[clickedLabelIndex];
      setLabelDialog({ x: label.x, y: label.y });
      setEditingLabelIndex(clickedLabelIndex);
      setLabelText(label.text);
      setLabelFontSize(label.fontSize || 20);
      setLabelFontFamily(label.fontFamily || 'Georgia');
      setLabelBold(label.bold || false);
      setLabelItalic(label.italic || false);
      setLabelCurve(label.curve || 0);
      setLabelRotation(label.rotation || 0);
    } else {
      // Create new label
      setLabelDialog({ x, y });
      setEditingLabelIndex(null);
      setLabelText('');
      setLabelFontSize(20);
      setLabelFontFamily('Georgia');
      setLabelBold(false);
      setLabelItalic(false);
      setLabelCurve(0);
      setLabelRotation(0);
    }
  }, [isAddingLabel, labelDialog, labels, getCanvasCoordinates]);

  const handleSaveLabel = useCallback(() => {
    if (labelText.trim() && labelDialog) {
      if (editingLabelIndex !== null) {
        // Update existing label
        setLabels(prev => {
          const updated = [...prev];
          updated[editingLabelIndex] = {
            x: labelDialog.x,
            y: labelDialog.y,
            text: labelText,
            fontSize: labelFontSize,
            fontFamily: labelFontFamily,
            bold: labelBold,
            italic: labelItalic,
            curve: labelCurve,
            rotation: labelRotation
          };
          return updated;
        });
      } else {
        // Create new label
        setLabels(prev => [...prev, {
          x: labelDialog.x,
          y: labelDialog.y,
          text: labelText,
          fontSize: labelFontSize,
          fontFamily: labelFontFamily,
          bold: labelBold,
          italic: labelItalic,
          curve: labelCurve,
          rotation: labelRotation
        }]);
      }
      setLabelDialog(null);
      setEditingLabelIndex(null);
      setLabelText('');
      setDialogOffset({ x: 0, y: 0 });
    }
  }, [labelDialog, editingLabelIndex, labelText, labelFontSize, labelFontFamily, labelBold, labelItalic, labelCurve, labelRotation]);

  const handleDialogMouseDown = (e) => {
    setIsDraggingDialog(true);
    setDragStart({
      x: e.clientX - dialogOffset.x,
      y: e.clientY - dialogOffset.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingDialog) {
        setDialogOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingDialog(false);
    };

    if (isDraggingDialog) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingDialog, dragStart]);

  const handleToggleElevationNumbers = useCallback(() => {
    if (!showElevationNumbers) {
      setPreviousBrushSize(brushSize);
      setBrushSize(20);
    } else {
      setBrushSize(previousBrushSize);
    }
    setShowElevationNumbers(!showElevationNumbers);
  }, [showElevationNumbers, brushSize, previousBrushSize]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = getElevationColor(-100, selectedBiomes[0]);
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const data = [];
    for (let y = 0; y < canvasHeight; y++) {
      data[y] = [];
      for (let x = 0; x < canvasWidth; x++) {
        data[y][x] = -100;
      }
    }
    elevationDataRef.current = data;

    // Clear undo history when clearing canvas
    undoHistoryRef.current = [];
    setCanUndo(false);

    setLabels([]);
    setZoom(1);
    setPan({ x: 0, y: 0 });

    const contourCanvas = contourRef.current;
    const contourCtx = contourCanvas.getContext('2d');
    contourCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  }, [canvasWidth, canvasHeight, selectedBiomes]);

  const downloadMap = useCallback((option = 'default') => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    setShowDownloadModal(false);

    const downloadFile = (opts, fileName) => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');

      // Always draw the base map
      tempCtx.drawImage(canvas, 0, 0);

      // Draw contours if requested
      if (opts === 'with-contours' && contourRef.current) {
        tempCtx.drawImage(contourRef.current, 0, 0);
      }

      // Draw labels
      tempCtx.font = 'bold 20px Georgia, serif';
      tempCtx.textAlign = 'center';
      tempCtx.strokeStyle = 'white';
      tempCtx.lineWidth = 4;
      tempCtx.fillStyle = 'black';

      labels.forEach(label => {
        tempCtx.strokeText(label.text, label.x, label.y);
        tempCtx.fillText(label.text, label.x, label.y);
      });

      // Convert to blob and download
      tempCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    };

    if (option === 'both') {
      setDownloadProgress('Drawing contours...');
      
      setTimeout(() => {
        drawContourLines();
        
        setTimeout(() => {
          // Update progress to show both files
          setDownloadProgress('topographic-map-default.png\ntopographic-map-with-contours.png');
          
          // Download first file
          downloadFile('default', 'topographic-map-default');
          
          // Download second file with delay
          setTimeout(() => {
            downloadFile('with-contours', 'topographic-map-with-contours');
            
            // Clear progress after both downloads
            setTimeout(() => {
              setDownloadProgress(null);
            }, 300);
          }, 500);
        }, 500);
      }, 100);
    } else if (option === 'with-contours') {
      setDownloadProgress('Drawing contours...');
      
      setTimeout(() => {
        drawContourLines();
        
        setTimeout(() => {
          setDownloadProgress('topographic-map-with-contours.png');
          downloadFile('with-contours', 'topographic-map-with-contours');
          setTimeout(() => {
            setDownloadProgress(null);
          }, 500);
        }, 500);
      }, 100);
    } else {
      setDownloadProgress('topographic-map-default.png');
      downloadFile('default', 'topographic-map-default');
      setTimeout(() => {
        setDownloadProgress(null);
      }, 500);
    }
  }, [labels, drawContourLines]);

  const handleZoom = useCallback((delta) => {
    setZoom(prev => Math.max(0.5, Math.min(5, prev + delta)));
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-black" style={{ cursor: helpMode ? 'help' : 'default' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Merriweather:wght@300;400&display=swap');
        body { font-family: 'Merriweather', serif; }
      `}</style>

      {/* Full-screen map container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{
          cursor: helpMode ? 'help' : (isAddingLabel ? 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI4IiBjeT0iOCIgcj0iNiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=") 8 8, auto' : (isPanMode || isPanning ? 'grab' : 'crosshair')),
          touchAction: 'none',
          overflow: 'hidden'
        }}
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const direction = e.deltaY > 0 ? -1 : 1;
          handleZoom(direction * 0.2);
        }}
        onMouseDown={(e) => {
          if (isAddingLabel && draggingLabelIndex === null && labelDialog === null) {
            handleCanvasClick(e);
          } else if (!isAddingLabel) {
            startDrawing(e);
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onContextMenu={(e) => e.preventDefault()}
        onTouchStart={startDrawing}
        onTouchMove={handleMouseMove}
        onTouchEnd={stopDrawing}
      >
        {/* Map canvas at full transform */}
        <div
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{ touchAction: 'none', display: 'block', pointerEvents: 'auto' }}
          />
          
          <canvas
            ref={contourRef}
            width={canvasWidth}
            height={canvasHeight}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ display: showContours ? 'block' : 'none' }}
          />

          {/* SVG Brush Outline */}
          {brushOutlinePos.visible && (
            <svg
              className="absolute top-0 left-0 pointer-events-none"
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                overflow: 'visible'
              }}
            >
              <g transform={`translate(${brushOutlinePos.x / 2}, ${brushOutlinePos.y / 2})`}>
                {brushShape === 'circle' ? (
                  <circle r={brushSize / 2} stroke="rgba(34, 197, 94, 0.8)" strokeWidth={2} fill="none" />
                ) : (
                  <rect x={-(brushSize / 2)} y={-(brushSize / 2)} width={brushSize} height={brushSize} stroke="rgba(34, 197, 94, 0.8)" strokeWidth={2} fill="none" />
                )}
                <line x1={-8} y1={0} x2={8} y2={0} stroke="rgba(34, 197, 94, 1)" strokeWidth={1} />
                <line x1={0} y1={-8} x2={0} y2={8} stroke="rgba(34, 197, 94, 1)" strokeWidth={1} />
              </g>
            </svg>
          )}

          {/* Interactive Label Hover Areas (only visible in Add Label mode) */}
          {isAddingLabel && (
            <svg
              className="absolute top-0 left-0"
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                pointerEvents: labels.length > 0 ? 'auto' : 'none'
              }}
            >
              {labels.map((label, idx) => {
                const fontSize = label.fontSize || 20;
                const textLength = label.text.length;
                const approximateWidth = fontSize * textLength * 0.5;
                const approximateHeight = fontSize * 1.2;
                const recognitionRadius = Math.max(approximateWidth / 2, approximateHeight / 2);
                const edgeWidth = recognitionRadius * 0.25;
                
                const openLabelEditor = (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  isEditingLabelEdgeRef.current = true;
                  setEditingLabelIndex(idx);
                  setLabelDialog({ x: label.x, y: label.y });
                  setLabelText(label.text);
                  setLabelFontSize(label.fontSize || 20);
                  setLabelFontFamily(label.fontFamily || 'Georgia');
                  setLabelBold(label.bold || false);
                  setLabelItalic(label.italic || false);
                  setLabelCurve(label.curve || 0);
                  setLabelRotation(label.rotation || 0);
                };
                
                return (
                <g key={`label-interactive-${idx}`}>
                  <ellipse 
                    cx={label.x - recognitionRadius + edgeWidth} 
                    cy={label.y} 
                    rx={edgeWidth} 
                    ry={recognitionRadius} 
                    fill="transparent" 
                    style={{cursor: 'text', pointerEvents: 'auto'}} 
                    onMouseEnter={() => setHoveredLabelIndex(idx)} 
                    onMouseLeave={() => setHoveredLabelIndex(null)} 
                    onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                    onClick={openLabelEditor}
                  />
                  <ellipse 
                    cx={label.x + recognitionRadius - edgeWidth} 
                    cy={label.y} 
                    rx={edgeWidth} 
                    ry={recognitionRadius} 
                    fill="transparent" 
                    style={{cursor: 'text', pointerEvents: 'auto'}} 
                    onMouseEnter={() => setHoveredLabelIndex(idx)} 
                    onMouseLeave={() => setHoveredLabelIndex(null)} 
                    onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                    onClick={openLabelEditor}
                  />
                  <circle 
                    cx={label.x} 
                    cy={label.y} 
                    r={recognitionRadius - edgeWidth * 2} 
                    fill="transparent" 
                    style={{cursor: draggingLabelIndex === idx ? 'grabbing' : 'grab', pointerEvents: 'auto'}} 
                    onMouseEnter={() => setHoveredLabelIndex(idx)}
                    onMouseLeave={() => setHoveredLabelIndex(null)} 
                    onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setDraggingLabelIndex(idx); }} 
                    onMouseUp={(e) => { e.stopPropagation(); }} 
                  />
                </g>
              );
              })}
            </svg>
          )}

          {/* Labels */}
          <svg className="absolute top-0 left-0 pointer-events-none" style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}>
            {labels.map((label, idx) => {
              const fontSize = label.fontSize || 20;
              const fontFamily = label.fontFamily || 'Georgia';
              const fontWeight = label.bold ? 'bold' : 'normal';
              const fontStyle = label.italic ? 'italic' : 'normal';
              const curve = label.curve || 0;
              const rotation = label.rotation || 0;
              const isHovered = hoveredLabelIndex === idx;
              
              return (
                <g key={idx} transform={`translate(${label.x}, ${label.y}) rotate(${rotation}) translate(-${label.x}, -${label.y})`}>
                  {/* Hover indicator circle */}
                  {isHovered && isAddingLabel && (
                    <circle
                      cx={label.x}
                      cy={label.y}
                      r={Math.max(fontSize * label.text.length * 0.25, fontSize * 0.6)}
                      fill="none"
                      stroke="rgba(59, 130, 246, 0.8)"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  )}
                  
                  {/* Edit icon indicator */}
                  {isHovered && isAddingLabel && (
                    <g>
                      <circle
                        cx={label.x + 35}
                        cy={label.y - 35}
                        r="12"
                        fill="rgba(59, 130, 246, 0.95)"
                      />
                      <text
                        x={label.x + 35}
                        y={label.y - 30}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fontSize: '16px',
                          fill: 'white',
                          fontWeight: 'bold',
                          pointerEvents: 'none'
                        }}
                      >
                        ✎
                      </text>
                    </g>
                  )}
                  
                  {/* Label text */}
                  <text
                    x={label.x}
                    y={label.y}
                    textAnchor="middle"
                    style={{
                      fontSize: `${fontSize}px`,
                      fill: 'white',
                      stroke: 'black',
                      strokeWidth: isHovered && isAddingLabel ? '4px' : '3px',
                      paintOrder: 'stroke',
                      fontFamily: `${fontFamily}, serif`,
                      fontWeight: fontWeight,
                      fontStyle: fontStyle,
                      letterSpacing: `${curve}px`,
                      filter: isHovered && isAddingLabel ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.9))' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {label.text}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Top Left - Title & Generation */}
        <div className="fixed top-4 left-4 z-50 max-w-sm">
          <h1 className="text-3xl font-bold text-slate-100 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Topographic Map</h1>
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-md rounded-lg p-4 border border-slate-600 shadow-lg">
            <div className="flex gap-2 mb-3">
              <div
                className="relative flex-1"
                onMouseEnter={() => setHoveredButton('clear')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <button
                  onClick={clearCanvas}
                  className="w-full px-3 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded font-medium text-sm flex items-center justify-center gap-1"
                  style={{ cursor: helpMode ? 'help' : 'pointer' }}
                >
                  <Trash2 size={14} /> Clear
                </button>
                {hoveredButton === 'clear' && (
                  <div className="absolute left-0 top-12 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl w-48 z-50 pointer-events-none">
                    <div className="text-slate-100 font-medium text-sm">Clear Canvas</div>
                    <div className="text-slate-400 text-xs">Erase all terrain and start with a blank ocean map.</div>
                  </div>
                )}
              </div>
              <div
                className="relative flex-1"
                onMouseEnter={() => setHoveredButton('download')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <button
                  onClick={() => setShowDownloadModal(true)}
                  className="w-full px-3 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded font-medium text-sm flex items-center justify-center gap-1"
                  style={{ cursor: helpMode ? 'help' : 'pointer' }}
                >
                  <Download size={14} /> Download
                </button>
                {hoveredButton === 'download' && (
                  <div className="absolute right-0 top-12 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl w-48 z-50 pointer-events-none">
                    <div className="text-slate-100 font-medium text-sm">Download Map</div>
                    <div className="text-slate-400 text-xs">Save your map as a PNG image file.</div>
                  </div>
                )}
              </div>
            </div>
            <div
              className="relative mb-3"
              onMouseEnter={() => setHoveredButton('newMap')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <button
                onClick={() => {
                  clearCanvas();
                  setMapSize(null);
                  setShowSizeModal(true);
                }}
                className="w-full px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-sm flex items-center justify-center gap-1"
                style={{ cursor: helpMode ? 'help' : 'pointer' }}
              >
                <Map size={14} /> New Map
              </button>
              {hoveredButton === 'newMap' && (
                <div className="absolute left-0 top-12 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl w-56 z-50 pointer-events-none">
                  <div className="text-slate-100 font-medium text-sm">New Map</div>
                  <div className="text-slate-400 text-xs">Start fresh with new biome and size selection.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Right - Controls */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
          <div
            className="relative"
            onMouseEnter={() => setHoveredButton('pan')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { setIsPanMode(!isPanMode); setIsAddingLabel(false); }}
              className={`w-10 h-10 flex items-center justify-center rounded shadow-lg border ${isPanMode ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-700 border-slate-600'} text-white hover:bg-slate-600`}
              style={{ cursor: helpMode ? 'help' : 'pointer' }}
              title="Pan"
            >
              <Move size={18} />
            </button>
            {hoveredButton === 'pan' && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl w-48 z-50 pointer-events-none">
                <div className="text-slate-100 font-medium text-sm">Pan Mode</div>
                <div className="text-slate-400 text-xs">Click and drag to navigate around the map.</div>
              </div>
            )}
          </div>
          <div
            className="relative"
            onMouseEnter={() => setHoveredButton('zoomIn')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => handleZoom(0.2)}
              className="w-10 h-10 flex items-center justify-center rounded bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 shadow-lg"
              style={{ cursor: helpMode ? 'help' : 'pointer' }}
            >
              <ZoomIn size={18} />
            </button>
            {hoveredButton === 'zoomIn' && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl w-48 z-50 pointer-events-none">
                <div className="text-slate-100 font-medium text-sm">Zoom In</div>
                <div className="text-slate-400 text-xs">Increase the zoom level to see more detail.</div>
              </div>
            )}
          </div>
          <div
            className="relative"
            onMouseEnter={() => setHoveredButton('zoomOut')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => handleZoom(-0.2)}
              className="w-10 h-10 flex items-center justify-center rounded bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 shadow-lg"
              style={{ cursor: helpMode ? 'help' : 'pointer' }}
            >
              <ZoomOut size={18} />
            </button>
            {hoveredButton === 'zoomOut' && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl w-48 z-50 pointer-events-none">
                <div className="text-slate-100 font-medium text-sm">Zoom Out</div>
                <div className="text-slate-400 text-xs">Decrease the zoom level to see more of the map.</div>
              </div>
            )}
          </div>
          <div
            className="relative"
            onMouseEnter={() => setHoveredButton('undo')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={undo}
              disabled={!canUndo}
              className="w-10 h-10 flex items-center justify-center rounded bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ cursor: helpMode ? 'help' : (!canUndo ? 'not-allowed' : 'pointer') }}
            >
              <Undo size={18} />
            </button>
            {hoveredButton === 'undo' && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl w-48 z-50 pointer-events-none">
                <div className="text-slate-100 font-medium text-sm">Undo</div>
                <div className="text-slate-400 text-xs">Undo your last drawing action (up to 3 actions).</div>
              </div>
            )}
          </div>
          <div
            className="relative"
            onMouseEnter={() => setHoveredButton('contours')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => {
                if (!showContours) {
                  setDrawingContours(true);
                  setTimeout(() => {
                    drawContourLines();
                    setShowContours(true);
                    setDrawingContours(false);
                  }, 100);
                } else {
                  setShowContours(false);
                }
              }}
              className={`w-10 h-10 flex items-center justify-center rounded shadow-lg border ${showContours ? 'bg-blue-600 border-blue-500' : 'bg-slate-700 border-slate-600'} text-white hover:bg-slate-600`}
              style={{ cursor: helpMode ? 'help' : 'pointer' }}
            >
              <Layers size={18} />
            </button>
            {hoveredButton === 'contours' && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl w-48 z-50 pointer-events-none">
                <div className="text-slate-100 font-medium text-sm">Contour Lines</div>
                <div className="text-slate-400 text-xs">Toggle topographic contour lines showing elevation changes.</div>
              </div>
            )}
          </div>
          <div
            className="relative"
            onMouseEnter={() => setHoveredButton('elevation')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleToggleElevationNumbers}
              className={`w-10 h-10 flex items-center justify-center rounded shadow-lg border ${showElevationNumbers ? 'bg-cyan-600 border-cyan-500' : 'bg-slate-700 border-slate-600'} text-white hover:bg-slate-600`}
              style={{ cursor: helpMode ? 'help' : 'pointer' }}
            >
              <Hash size={18} />
            </button>
            {hoveredButton === 'elevation' && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl w-48 z-50 pointer-events-none">
                <div className="text-slate-100 font-medium text-sm">Elevation Display</div>
                <div className="text-slate-400 text-xs">Show elevation in meters at your cursor position.</div>
              </div>
            )}
          </div>
          <div
            className="relative"
            onMouseEnter={() => setHoveredButton('label')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setIsAddingLabel(!isAddingLabel)}
              className={`w-10 h-10 flex items-center justify-center rounded shadow-lg border transition-all ${
                isAddingLabel
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
              }`}
              style={{ cursor: helpMode ? 'help' : 'pointer' }}
              title={isAddingLabel ? 'Cancel Labeling' : 'Add Label'}
            >
              <MapPin size={18} />
            </button>
            {hoveredButton === 'label' && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl w-48 z-50 pointer-events-none">
                <div className="text-slate-100 font-medium text-sm">Add Labels</div>
                <div className="text-slate-400 text-xs">Click on the map to add place names and annotations.</div>
              </div>
            )}
          </div>
          <div
            className="relative"
            onMouseEnter={() => setHoveredButton('help')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setHelpMode(!helpMode)}
              className={`w-10 h-10 flex items-center justify-center rounded shadow-lg border transition-all ${
                helpMode
                  ? 'bg-amber-600 border-amber-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
              }`}
              style={{ cursor: helpMode ? 'help' : 'pointer' }}
              title="Help Mode"
            >
              <HelpCircle size={18} />
            </button>
            {hoveredButton === 'help' && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl w-48 z-50 pointer-events-none">
                <div className="text-slate-100 font-medium text-sm">Help Mode</div>
                <div className="text-slate-400 text-xs">Hover over buttons to see what they do. Click again to exit.</div>
              </div>
            )}
          </div>

          <div
            className="relative w-32 p-2 bg-slate-700/50 backdrop-blur rounded border border-slate-600"
            onMouseEnter={() => setHoveredButton('brushSize')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{ cursor: helpMode ? 'help' : 'default' }}
          >
            <label className="text-xs font-bold text-slate-300 block mb-1">Size: {brushSize}px</label>
            <input type="range" min={BRUSH_CONSTANTS.MIN_SIZE} max={BRUSH_CONSTANTS.MAX_SIZE} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-slate-600 rounded" style={{ cursor: helpMode ? 'help' : 'pointer' }} />
            {hoveredButton === 'brushSize' && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl w-48 z-50 pointer-events-none">
                <div className="text-slate-100 font-medium text-sm">Brush Size</div>
                <div className="text-slate-400 text-xs">Adjust how large your terrain brush is when painting.</div>
              </div>
            )}
          </div>

          <div
            className="relative w-28 p-2 bg-slate-700/50 backdrop-blur rounded border border-slate-600"
            onMouseEnter={() => setHoveredButton('brushShape')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{ cursor: helpMode ? 'help' : 'default' }}
          >
            <label className="text-xs font-bold text-slate-300 block mb-1">Shape</label>
            <div className="flex gap-2">
              {['circle', 'square'].map((s) => (
                <button key={s} onMouseDown={(e) => e.stopPropagation()} onClick={() => setBrushShape(s)} className={`flex-1 px-2 py-1 rounded text-lg ${brushShape === s ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-slate-300'}`} style={{ cursor: helpMode ? 'help' : 'pointer' }}>
                  {s === 'circle' ? '●' : '■'}
                </button>
              ))}
            </div>
            {hoveredButton === 'brushShape' && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl w-48 z-50 pointer-events-none">
                <div className="text-slate-100 font-medium text-sm">Brush Shape</div>
                <div className="text-slate-400 text-xs">Choose between circular or square brush for painting terrain.</div>
              </div>
            )}
          </div>

          <div
            className="relative w-32 p-2 bg-slate-700/50 backdrop-blur rounded border border-slate-600"
            onMouseEnter={() => setHoveredButton('oceanDepth')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{ cursor: helpMode ? 'help' : 'default' }}
          >
            <label className="text-xs font-bold text-slate-300 block mb-1">Ocean: {oceanDepth}m</label>
            <input
              type="range"
              min="-600"
              max="0"
              step="25"
              value={oceanDepth}
              onChange={(e) => setOceanDepth(Number(e.target.value))}
              className="w-full h-2 bg-slate-600 rounded accent-blue-500"
              style={{ cursor: helpMode ? 'help' : 'pointer' }}
            />
            {hoveredButton === 'oceanDepth' && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl w-48 z-50 pointer-events-none">
                <div className="text-slate-100 font-medium text-sm">Ocean Depth</div>
                <div className="text-slate-400 text-xs">Right-click to paint ocean depths. Drag the slider to select depth level from shallow (-0m) to abyssal trenches (-600m).</div>
              </div>
            )}
          </div>

          <div
            className="relative w-32 p-2 bg-slate-700/50 backdrop-blur rounded border border-slate-600"
            onMouseEnter={() => setHoveredButton('landElevation')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{ cursor: helpMode ? 'help' : 'default' }}
          >
            <label className="text-xs font-bold text-slate-300 block mb-1">Land: {landElevation}m</label>
            <input
              type="range"
              min="0"
              max="800"
              step="25"
              value={landElevation}
              onChange={(e) => setLandElevation(Number(e.target.value))}
              className="w-full h-2 bg-slate-600 rounded accent-green-500"
              style={{ cursor: helpMode ? 'help' : 'pointer' }}
            />
            {hoveredButton === 'landElevation' && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl w-48 z-50 pointer-events-none">
                <div className="text-slate-100 font-medium text-sm">Land Elevation</div>
                <div className="text-slate-400 text-xs">Left-click to paint land elevations. Drag the slider to select elevation level from sea level (0m) to mountain peaks (800m).</div>
              </div>
            )}
          </div>

          {/* Biome Selection for Drawing */}
          {selectedBiomes.length > 1 && (
            <div
              className="relative w-40 p-3 bg-slate-700/50 backdrop-blur rounded border border-slate-600"
              onMouseEnter={() => setHoveredButton('drawBiome')}
              onMouseLeave={() => setHoveredButton(null)}
              style={{ cursor: helpMode ? 'help' : 'default' }}
            >
              <label className="text-xs font-bold text-slate-300 block mb-2">Draw Biome</label>
              <select
                value={drawingBiome || 'blend'}
                onChange={(e) => setDrawingBiome(e.target.value === 'blend' ? null : e.target.value)}
                className="w-full px-2 py-1 bg-slate-600 text-slate-100 border border-slate-500 rounded text-xs"
                style={{ cursor: helpMode ? 'help' : 'pointer' }}
              >
                <option value="blend">Auto Blend</option>
                {selectedBiomes.map((biome) => (
                  <option key={biome} value={biome} className="capitalize">{biome}</option>
                ))}
              </select>
              {hoveredButton === 'drawBiome' && (
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl w-48 z-50 pointer-events-none">
                  <div className="text-slate-100 font-medium text-sm">Drawing Biome</div>
                  <div className="text-slate-400 text-xs">Choose which biome colors to use when painting terrain.</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Left - Legend */}
        <div
          className="fixed bottom-3 left-3 z-50 bg-slate-800/50 backdrop-blur rounded px-2 py-1.5 border border-slate-600/50"
          onMouseEnter={() => setHoveredButton('legend')}
          onMouseLeave={() => setHoveredButton(null)}
          style={{ cursor: helpMode ? 'help' : 'default', width: 'fit-content' }}
        >
          <div className="flex flex-col gap-0.5">
            {selectedBiomes.map((biome) => (
              <div key={biome} className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 capitalize" style={{ width: '48px' }}>{biome}</span>
                <div className="flex rounded-sm overflow-hidden border border-slate-700/50" style={{ width: '80px', height: '10px' }}>
                  {[-150, -50, 0, 50, 150, 300, 450, 600, 800].map((elev, idx) => (
                    <div key={idx} style={{ flex: 1, backgroundColor: getElevationColor(elev, biome) }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {hoveredButton === 'legend' && (
            <div className="absolute left-0 bottom-full mb-2 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 shadow-xl z-50 pointer-events-none" style={{ width: '180px' }}>
              <div className="text-slate-100 font-medium text-sm">Elevation Legend</div>
              <div className="text-slate-400 text-xs">Ocean (left) to peaks (right).</div>
            </div>
          )}
        </div>

        {/* Bottom Right - Zoom */}
        <div className="fixed bottom-4 right-4 z-50 text-center">
          <div className="bg-slate-900/50 backdrop-blur px-4 py-2 rounded border border-slate-600 text-slate-300 text-sm font-medium mb-2">
            {(zoom * 100).toFixed(0)}%
          </div>
        </div>

        {/* Elevation Display - Following Cursor */}
        {showElevationNumbers && cursorElevation !== null && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: `${cursorScreenPos.x + 20}px`,
              top: `${cursorScreenPos.y + 20}px`
            }}
          >
            <div className="bg-cyan-600/50 backdrop-blur px-3 py-1.5 rounded border border-cyan-400 text-white font-mono text-sm shadow-lg">
              {cursorElevation}m
            </div>
          </div>
        )}

        {/* Bottom Center - Help */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 text-center text-slate-400 text-sm">
          {isAddingLabel ? '📍 Click to label' : isPanMode ? '🖱️ Drag to pan' : '🗺️ Left: land • Right: ocean • Shift: flatten'}
        </div>

        {/* Version Number */}
        <div className="fixed bottom-1 right-2 z-40 text-slate-600 text-xs font-mono">
          v1.2.0
        </div>

        {/* Map Size Selection Modal */}
        {showSizeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-8 shadow-2xl max-w-lg w-full mx-4">
              <h2 className="text-2xl font-bold text-slate-100 mb-2 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
                Topographic Map Creator
              </h2>
              <p className="text-slate-400 text-sm mb-6 text-center">Select your map size and biomes to get started</p>
              
              {/* Biome Selection */}
              <div className="mb-6">
                <label className="text-xs font-bold text-slate-300 block mb-2">Biomes <span className="text-slate-500 font-normal">(select one or more)</span></label>
                <div className="grid grid-cols-5 gap-2">
                  <button
                    onClick={() => toggleBiome(BIOME_TYPES.TEMPERATE)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedBiomes.includes(BIOME_TYPES.TEMPERATE)
                        ? 'bg-green-600 text-white ring-2 ring-green-400'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    🌲 Temperate
                  </button>
                  <button
                    onClick={() => toggleBiome(BIOME_TYPES.DESERT)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedBiomes.includes(BIOME_TYPES.DESERT)
                        ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    🏜️ Desert
                  </button>
                  <button
                    onClick={() => toggleBiome(BIOME_TYPES.TROPICAL)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedBiomes.includes(BIOME_TYPES.TROPICAL)
                        ? 'bg-teal-600 text-white ring-2 ring-teal-400'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    🌴 Tropical
                  </button>
                  <button
                    onClick={() => toggleBiome(BIOME_TYPES.ARCTIC)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedBiomes.includes(BIOME_TYPES.ARCTIC)
                        ? 'bg-cyan-600 text-white ring-2 ring-cyan-400'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    ❄️ Arctic
                  </button>
                  <button
                    onClick={() => toggleBiome(BIOME_TYPES.VOLCANIC)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedBiomes.includes(BIOME_TYPES.VOLCANIC)
                        ? 'bg-red-600 text-white ring-2 ring-red-400'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    🌋 Volcanic
                  </button>
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  Selected: {selectedBiomes.length} biome{selectedBiomes.length !== 1 ? 's' : ''}
                  {selectedBiomes.length > 1 && ' - regions will blend across your map'}
                </p>
              </div>
              
              {/* Size Selection */}
              <div className="mb-6">
                <label className="text-xs font-bold text-slate-300 block mb-3">Map Size</label>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleSizeSelection('extraLarge')}
                    className="px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-amber-500/25"
                  >
                    <div className="text-lg font-bold">Extra Large</div>
                    <div className="text-amber-200 text-sm">4000 × 2400 pixels</div>
                  </button>
                  <button
                    onClick={() => handleSizeSelection('large')}
                    className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-emerald-500/25"
                  >
                    <div className="text-lg font-bold">Large</div>
                    <div className="text-emerald-200 text-sm">3000 × 1800 pixels</div>
                  </button>
                  <button
                    onClick={() => handleSizeSelection('medium')}
                    className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-blue-500/25"
                  >
                    <div className="text-lg font-bold">Medium</div>
                    <div className="text-blue-200 text-sm">2000 × 1200 pixels</div>
                  </button>
                  <button
                    onClick={() => handleSizeSelection('small')}
                    className="px-6 py-4 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-violet-500/25"
                  >
                    <div className="text-lg font-bold">Small</div>
                    <div className="text-violet-200 text-sm">1320 × 792 pixels</div>
                  </button>
                </div>
              </div>
              
              <p className="text-slate-500 text-xs text-center mb-4">
                Larger maps offer more detail but may be slower on some devices
              </p>

              {/* Patch Notes */}
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400">Patch Notes</span>
                  <span className="text-xs text-emerald-400 font-mono">v1.2.0</span>
                </div>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• Added Land Elevation slider (Ctrl+Click to paint heights)</li>
                  <li>• Natural biome blending when painting between biomes</li>
                  <li>• Middle mouse button pan instructions in controls</li>
                  <li>• Help mode (?) with hover tooltips for all controls</li>
                  <li>• Random terrain: land coverage %, continent count</li>
                  <li>• Improved biome blending with smoother transitions</li>
                  <li>• Draw Biome selector for multi-biome maps</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Controls Explanation Modal */}
        {showControlsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-8 shadow-2xl max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-slate-100 mb-2 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
                Controls
              </h2>
              <p className="text-slate-400 text-sm mb-6 text-center">Here&apos;s how to create your map</p>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ChevronUp size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-slate-100 font-medium text-sm">Left Click</div>
                    <div className="text-slate-400 text-xs">Paint land elevations (use slider to select height)</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ChevronDown size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-slate-100 font-medium text-sm">Right Click</div>
                    <div className="text-slate-400 text-xs">Paint ocean depths (use slider to select depth)</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">⇧</span>
                  </div>
                  <div>
                    <div className="text-slate-100 font-medium text-sm">Shift + Click</div>
                    <div className="text-slate-400 text-xs">Flatten terrain to clicked elevation</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Move size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-slate-100 font-medium text-sm">Pan Mode</div>
                    <div className="text-slate-400 text-xs">Click the hand icon to drag and navigate the map, or hold middle mouse button</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-slate-100 font-medium text-sm">Labels</div>
                    <div className="text-slate-400 text-xs">Add place names and annotations to your map</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowControlsModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-emerald-500/25"
              >
                Got it, let&apos;s create!
              </button>
            </div>
          </div>
        )}

        {/* Download Modal */}
        {showDownloadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 shadow-2xl max-w-sm">
              <h2 className="text-xl font-bold text-slate-100 mb-4">Download Map</h2>
              <p className="text-slate-400 text-sm mb-6">Choose download format:</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => downloadMap('default')}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
                >
                  Default
                </button>
                <button
                  onClick={() => downloadMap('with-contours')}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
                >
                  With Contours
                </button>
                <button
                  onClick={() => downloadMap('both')}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
                >
                  Both
                </button>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="px-4 py-3 bg-slate-600 hover:bg-slate-500 text-slate-300 rounded-lg font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Label Dialog */}
        {labelDialog && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div
              className="absolute bg-slate-800 border-2 border-slate-600 rounded-lg shadow-2xl pointer-events-auto"
              style={{
                left: `${labelDialog.x * zoom + pan.x * zoom + dialogOffset.x}px`,
                top: `${labelDialog.y * zoom + pan.y * zoom + dialogOffset.y}px`,
                transform: 'translate(-50%, -50%)',
                width: '380px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              {/* Draggable Header */}
              <div
                className="flex items-center justify-between bg-slate-700 px-4 py-3 border-b border-slate-600 rounded-t-lg cursor-move"
                onMouseDown={handleDialogMouseDown}
              >
                <h2 className="text-sm font-bold text-slate-100">
                  {editingLabelIndex !== null ? 'Edit Label' : 'Add Location Label'}
                </h2>
                <button
                  onClick={() => {
                    setLabelDialog(null);
                    setEditingLabelIndex(null);
                    setDialogOffset({ x: 0, y: 0 });
                  }}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                  title="Close"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Text Input */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Text</label>
                  <input
                    type="text"
                    value={labelText}
                    onChange={(e) => setLabelText(e.target.value)}
                    placeholder="Enter location name..."
                    autoFocus
                    className="w-full px-3 py-2 bg-slate-700 text-slate-100 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>

                {/* Font Size */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Size: {labelFontSize}px</label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={labelFontSize}
                    onChange={(e) => setLabelFontSize(Number(e.target.value))}
                    className="w-full h-2 bg-slate-600 rounded cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Font Family */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Font</label>
                  <select
                    value={labelFontFamily}
                    onChange={(e) => setLabelFontFamily(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-slate-100 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  >
                    <option value="Georgia">Georgia</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier">Courier</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>

                {/* Bold & Italic */}
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => setLabelBold(!labelBold)}
                    className={`flex-1 px-3 py-2 rounded text-xs font-bold transition-all ${
                      labelBold ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Bold
                  </button>
                  <button
                    onClick={() => setLabelItalic(!labelItalic)}
                    className={`flex-1 px-3 py-2 rounded text-xs italic transition-all ${
                      labelItalic ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Italic
                  </button>
                </div>

                {/* Curve (Letter Spacing) */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Spacing: {labelCurve}px</label>
                  <input
                    type="range"
                    min="-5"
                    max="10"
                    value={labelCurve}
                    onChange={(e) => setLabelCurve(Number(e.target.value))}
                    className="w-full h-2 bg-slate-600 rounded cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Rotation */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Rotation: {labelRotation}°</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={labelRotation}
                    onChange={(e) => setLabelRotation(Number(e.target.value))}
                    className="w-full h-2 bg-slate-600 rounded cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Preview */}
                <div className="mb-4 p-4 bg-slate-700/50 rounded border border-slate-600 min-h-24 flex items-center justify-center">
                  <p
                    style={{
                      fontSize: `${labelFontSize}px`,
                      fontFamily: `${labelFontFamily}, serif`,
                      fontWeight: labelBold ? 'bold' : 'normal',
                      fontStyle: labelItalic ? 'italic' : 'normal',
                      letterSpacing: `${labelCurve}px`,
                      color: '#f8fafc',
                      textAlign: 'center',
                      wordBreak: 'break-word',
                      maxWidth: '100%',
                      transform: `rotate(${labelRotation}deg)`,
                      transformOrigin: 'center',
                      display: 'inline-block'
                    }}
                  >
                    {labelText || 'Preview'}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveLabel}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all text-sm"
                  >
                    {editingLabelIndex !== null ? 'Save Changes' : 'Add Label'}
                  </button>
                  {editingLabelIndex !== null && (
                    <button
                      onClick={() => {
                        setLabels(prev => prev.filter((_, idx) => idx !== editingLabelIndex));
                        setLabelDialog(null);
                        setEditingLabelIndex(null);
                        setDialogOffset({ x: 0, y: 0 });
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all text-sm"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setLabelDialog(null);
                      setEditingLabelIndex(null);
                      setDialogOffset({ x: 0, y: 0 });
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-all text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Drawing Contours Progress Box */}
        {drawingContours && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 rounded-lg p-8 shadow-2xl max-w-sm">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-100 font-medium">Drawing Topography...</p>
              </div>
            </div>
          </div>
        )}

        {/* Download Progress Box */}
        {downloadProgress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 rounded-lg p-8 shadow-2xl max-w-sm">
              <div className="text-center">
                {downloadProgress === 'Drawing contours...' ? (
                  <>
                    <div className="mb-4 flex justify-center">
                      <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-slate-100 font-medium">{downloadProgress}</p>
                  </>
                ) : (
                  <>
                    <p className="text-slate-100 font-medium mb-3">Downloading:</p>
                    <div className="space-y-2">
                      {downloadProgress.split('\n').map((filename, idx) => (
                        <p key={idx} className="text-blue-400 font-mono text-sm">{filename}</p>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
