import { PNG } from 'pngjs';

/**
 * Encode 2D elevation data as 16-bit grayscale PNG for Minecraft import
 * @param {number[][]} elevationData - 2D array [y][x] with elevation values
 * @param {number} minElevation - Minimum elevation in data (-600)
 * @param {number} maxElevation - Maximum elevation in data (1000)
 * @returns {Promise<Blob>} PNG blob ready for download
 */
export async function encode16BitHeightmap(elevationData, minElevation, maxElevation) {
  const height = elevationData.length;
  const width = elevationData[0]?.length || 0;

  if (height === 0 || width === 0) {
    throw new Error('Invalid elevation data: empty array');
  }

  // Create PNG with 16-bit grayscale
  const png = new PNG({
    width,
    height,
    colorType: 0,  // Grayscale
    bitDepth: 16   // 16-bit (0-65535)
  });

  const range = maxElevation - minElevation;

  if (range === 0) {
    throw new Error('Invalid elevation range: min and max are equal');
  }

  // Fill pixel data
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const elevation = elevationData[y][x];

      // Normalize elevation to 0-65535 range
      const normalized = (elevation - minElevation) / range;
      const value16bit = Math.floor(Math.max(0, Math.min(65535, normalized * 65535)));

      // Store 16-bit value as two bytes (big-endian)
      const idx = (y * width + x) * 2;
      png.data[idx] = (value16bit >> 8) & 0xFF;     // High byte
      png.data[idx + 1] = value16bit & 0xFF;        // Low byte
    }
  }

  // Encode to buffer
  const buffer = PNG.sync.write(png);

  // Convert to blob for browser download
  return new Blob([buffer], { type: 'image/png' });
}

/**
 * Encode biome data as 8-bit RGB PNG for WorldPainter import
 * @param {object[][]} biomeData - 2D array [y][x] with biome info
 * @param {number[][]} elevationData - 2D array [y][x] with elevation values
 * @returns {Promise<Blob>} PNG blob ready for download
 */
export async function encode8BitBiomeMap(biomeData, elevationData) {
  const height = biomeData.length;
  const width = biomeData[0]?.length || 0;

  if (height === 0 || width === 0) {
    throw new Error('Invalid biome data: empty array');
  }

  // Create PNG with 8-bit RGB
  const png = new PNG({
    width,
    height,
    colorType: 2,  // RGB (easier than indexed for now)
    bitDepth: 8
  });

  // Generate biome color mapping
  const biomeColorMap = generateBiomeColorMap(biomeData, elevationData);

  // Fill pixel data
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const biomeInfo = biomeData[y][x];
      const elevation = elevationData[y][x];
      const color = getBiomeColor(biomeInfo, elevation, biomeColorMap);

      const idx = (y * width + x) * 3;
      png.data[idx] = color.r;
      png.data[idx + 1] = color.g;
      png.data[idx + 2] = color.b;
    }
  }

  // Encode to buffer
  const buffer = PNG.sync.write(png);

  // Convert to blob for download
  return new Blob([buffer], { type: 'image/png' });
}

/**
 * Generate unique color mapping for each biome+elevation combination
 * @private
 */
function generateBiomeColorMap(biomeData, elevationData) {
  const uniqueCombos = new Map();
  let colorIndex = 0;

  for (let y = 0; y < biomeData.length; y++) {
    for (let x = 0; x < biomeData[0].length; x++) {
      const biomeInfo = biomeData[y][x];
      const elevation = elevationData[y][x];

      // Create key based on biome and elevation range (50m buckets)
      const elevationBucket = Math.floor(elevation / 50) * 50;
      const key = `${biomeInfo.primaryBiome}_${elevationBucket}`;

      if (!uniqueCombos.has(key)) {
        uniqueCombos.set(key, {
          biome: biomeInfo.primaryBiome,
          elevationRange: elevationBucket,
          color: indexToRGB(colorIndex++)
        });
      }
    }
  }

  return uniqueCombos;
}

/**
 * Get color for a specific biome+elevation combination
 * @private
 */
function getBiomeColor(biomeInfo, elevation, colorMap) {
  const elevationBucket = Math.floor(elevation / 50) * 50;
  const key = `${biomeInfo.primaryBiome}_${elevationBucket}`;

  const entry = colorMap.get(key);
  if (entry) {
    return entry.color;
  }

  // Fallback color (shouldn't happen)
  return { r: 128, g: 128, b: 128 };
}

/**
 * Generate unique RGB color from index
 * @private
 */
function indexToRGB(index) {
  // Use prime number multiplication to spread colors across spectrum
  return {
    r: (index * 67) % 256,
    g: (index * 131) % 256,
    b: (index * 197) % 256
  };
}
