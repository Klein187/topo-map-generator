// ============================================================================
// BIOME TYPES AND COLOR MAPPING
// Extracted for shared use between 2D canvas and 3D terrain viewer
// ============================================================================

export const BIOME_TYPES = {
  TEMPERATE: 'temperate',
  DESERT: 'desert',
  TROPICAL: 'tropical',
  ARCTIC: 'arctic',
  VOLCANIC: 'volcanic',
};

export const BIOME_COLORS = {
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
    [-600, '#020617'],
    [-500, '#0a0f29'],
    [-400, '#0c1435'],
    [-350, '#0c1940'],
    [-300, '#0c1e47'],
    [-250, '#0f2557'],
    [-200, '#1a2f6c'],
    [-150, '#1e3a8a'],
    [-100, '#1e40af'],
    [-75, '#2563eb'],
    [-50, '#3b82f6'],
    [-25, '#60a5fa'],
    [0, '#93c5fd'],
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
    [-600, '#0a1628'],
    [-500, '#0c1e3d'],
    [-400, '#0f2952'],
    [-350, '#123366'],
    [-300, '#1a4480'],
    [-250, '#1d5a9e'],
    [-200, '#2563eb'],
    [-150, '#3b82f6'],
    [-100, '#60a5fa'],
    [-75, '#7dd3fc'],
    [-50, '#38bdf8'],
    [-25, '#22d3ee'],
    [0, '#e0f2fe'],
    [15, '#fefce8'],
    [35, '#fef9c3'],
    [55, '#fef08a'],
    [75, '#fde047'],
    [100, '#facc15'],
    [130, '#6ee7b7'],
    [170, '#34d399'],
    [220, '#10b981'],
    [280, '#059669'],
    [350, '#047857'],
    [420, '#065f46'],
    [500, '#064e3b'],
    [600, '#4a5568'],
    [700, '#718096'],
    [800, '#a0aec0'],
    [600, '#4d7c0f'],
    [650, '#78350f'],
    [700, '#57534e'],
    [750, '#a8a29e'],
    [800, '#d6d3d1'],
    [Infinity, '#f8fafc']
  ],
  [BIOME_TYPES.ARCTIC]: [
    [-600, '#021625'],
    [-500, '#031e36'],
    [-400, '#052947'],
    [-350, '#073858'],
    [-300, '#0c4a6e'],
    [-250, '#0e5380'],
    [-200, '#075985'],
    [-150, '#0369a1'],
    [-100, '#0891b2'],
    [-75, '#06b6d4'],
    [-50, '#0284c7'],
    [-25, '#0ea5e9'],
    [0, '#7dd3fc'],
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
    [-600, '#0a0908'],
    [-500, '#0f0e0c'],
    [-400, '#141210'],
    [-350, '#1a1815'],
    [-300, '#1c1917'],
    [-250, '#221f1c'],
    [-200, '#292524'],
    [-150, '#373330'],
    [-100, '#44403c'],
    [-75, '#4d4743'],
    [-50, '#57534e'],
    [-25, '#78716c'],
    [0, '#a8a29e'],
    [50, '#78716c'],
    [100, '#57534e'],
    [150, '#44403c'],
    [200, '#292524'],
    [250, '#1c1917'],
    [300, '#1a0a0a'],
    [350, '#2d0a0a'],
    [400, '#450a0a'],
    [450, '#7f1d1d'],
    [500, '#991b1b'],
    [550, '#b91c1c'],
    [600, '#dc2626'],
    [650, '#ef4444'],
    [700, '#f97316'],
    [Infinity, '#fb923c']
  ],
};

export const getElevationColor = (elevation, biome = BIOME_TYPES.TEMPERATE) => {
  const colorStops = BIOME_COLORS[biome] || BIOME_COLORS[BIOME_TYPES.TEMPERATE];

  for (const [threshold, color] of colorStops) {
    if (elevation < threshold) return color;
  }
  return colorStops[colorStops.length - 1][1];
};

export const getBlendedElevationColor = (elevation, biomeWeights) => {
  if (!biomeWeights || biomeWeights.length === 0) {
    return getElevationColor(elevation, BIOME_TYPES.TEMPERATE);
  }

  if (biomeWeights.length === 1) {
    return getElevationColor(elevation, biomeWeights[0].biome);
  }

  const colors = biomeWeights.map(({ biome, weight }) => ({
    color: getElevationColor(elevation, biome),
    weight
  }));

  const blendedRGB = { r: 0, g: 0, b: 0 };

  colors.forEach(({ color, weight }) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    blendedRGB.r += r * weight;
    blendedRGB.g += g * weight;
    blendedRGB.b += b * weight;
  });

  const finalR = Math.round(blendedRGB.r);
  const finalG = Math.round(blendedRGB.g);
  const finalB = Math.round(blendedRGB.b);

  const toHex = (n) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(finalR)}${toHex(finalG)}${toHex(finalB)}`;
};

// Convert hex color to RGB array [r, g, b] normalized to 0-1
export const hexToRgb = (hex) => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return [r, g, b];
};
