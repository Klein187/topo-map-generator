import { encode16BitHeightmap, encode8BitBiomeMap } from './pngEncoder';

// Elevation configuration from topo map generator
const ELEVATION_CONFIG = {
  MIN: -600,
  MAX: 1000,
  SEA_LEVEL: 0
};

// Minecraft world configuration
const MINECRAFT_CONFIG = {
  MIN_Y: -64,
  MAX_Y: 320,
  SEA_LEVEL_Y: 62
};

/**
 * Export heightmap for Minecraft import
 * @param {number[][]} elevationData - 2D array [y][x] with elevation values
 * @param {object} options - Export options
 * @returns {Promise<object>} Object with heightmapBlob, metadata, filename
 */
export async function exportMinecraftHeightmap(elevationData, options = {}) {
  const {
    filename = 'minecraft-heightmap',
    includeMetadata = true
  } = options;

  // Validate elevation data
  if (!elevationData || elevationData.length === 0) {
    throw new Error('No elevation data provided');
  }

  // Generate 16-bit PNG
  const blob = await encode16BitHeightmap(
    elevationData,
    ELEVATION_CONFIG.MIN,
    ELEVATION_CONFIG.MAX
  );

  // Generate metadata JSON with import instructions
  const metadata = {
    format: 'minecraft-heightmap',
    version: '1.0',
    generator: 'Topographic Map Generator',
    dimensions: {
      width: elevationData[0].length,
      height: elevationData.length
    },
    elevation: {
      min: ELEVATION_CONFIG.MIN,
      max: ELEVATION_CONFIG.MAX,
      seaLevel: ELEVATION_CONFIG.SEA_LEVEL,
      unit: 'meters'
    },
    minecraft: {
      minY: MINECRAFT_CONFIG.MIN_Y,
      maxY: MINECRAFT_CONFIG.MAX_Y,
      seaLevelY: MINECRAFT_CONFIG.SEA_LEVEL_Y,
      compatibleVersions: '1.18+'
    },
    instructions: [
      '=== MINECRAFT IMPORT INSTRUCTIONS ===',
      '',
      '1. Open Minecraft Java Edition 1.18 or newer',
      '2. Click "Create New World"',
      '3. Click "More World Options"',
      '4. Click "Import Settings"',
      '5. Select the minecraft-heightmap.png file',
      '6. Adjust world height settings if needed:',
      '   - Minimum Y: -64',
      '   - Maximum Y: 320',
      '   - Sea Level: 62',
      '7. Click "Create New World" to generate',
      '',
      '=== WORLDPAINTER IMPORT INSTRUCTIONS ===',
      '',
      '1. Open WorldPainter',
      '2. Go to File → Import → Heightmap',
      '3. Select the minecraft-heightmap.png file',
      '4. In the import dialog, set:',
      '   - Minimum height: -64',
      '   - Maximum height: 320',
      '   - Sea level: 62',
      '5. Click "Import"',
      '6. Your terrain is now loaded in WorldPainter',
      '7. Customize as desired, then export to Minecraft',
      '',
      '=== TECHNICAL DETAILS ===',
      '',
      'File Format: 16-bit grayscale PNG',
      'Color Space: Linear (0-65535 maps to min-max elevation)',
      'Black (0): Lowest elevation (-600m)',
      'White (65535): Highest elevation (1000m)',
      'Gray at ~42%: Sea level (0m)',
      '',
      'The heightmap preserves all elevation detail from your',
      'original map. Minecraft/WorldPainter will scale these',
      'values to fit their Y-level ranges.',
      '',
      '=== TROUBLESHOOTING ===',
      '',
      'If terrain is too flat: The 1600m elevation range maps',
      'to 384 blocks in Minecraft. Consider adjusting world',
      'height multiplier in game settings.',
      '',
      'If terrain is inverted: Some tools interpret black as',
      'high and white as low. Check your import tool settings.',
      '',
      'If ocean appears at wrong level: Ensure sea level is',
      'set to Y=62 during import.',
      '',
      'For support, visit: https://github.com/Klein187/topo-map-generator'
    ]
  };

  return {
    heightmapBlob: blob,
    metadata: includeMetadata ? JSON.stringify(metadata, null, 2) : null,
    filename
  };
}

/**
 * Export WorldPainter-compatible heightmap + biome maps
 * @param {number[][]} elevationData - 2D array [y][x] with elevation values
 * @param {object[][]} biomeData - 2D array [y][x] with biome info
 * @param {object} options - Export options
 * @returns {Promise<object>} Object with all export files
 */
export async function exportWorldPainterMaps(elevationData, biomeData, options = {}) {
  const {
    filename = 'worldpainter-terrain',
    includeBiomes = true
  } = options;

  // Validate elevation data
  if (!elevationData || elevationData.length === 0) {
    throw new Error('No elevation data provided');
  }

  // Generate heightmap
  const heightmapBlob = await encode16BitHeightmap(
    elevationData,
    ELEVATION_CONFIG.MIN,
    ELEVATION_CONFIG.MAX
  );

  // Generate biome map if requested
  let biomeBlob = null;
  let biomeMapping = null;

  if (includeBiomes && biomeData) {
    biomeBlob = await encode8BitBiomeMap(biomeData, elevationData);
    biomeMapping = generateBiomeMapping(biomeData, elevationData);
  }

  // Generate metadata with comprehensive instructions
  const metadata = {
    format: 'worldpainter-import-package',
    version: '1.0',
    generator: 'Topographic Map Generator',
    files: {
      heightmap: `${filename}-heightmap.png`,
      biomeMap: includeBiomes ? `${filename}-biomes.png` : null,
      biomeMapping: includeBiomes ? `${filename}-biome-mapping.json` : null,
      metadata: `${filename}-info.json`
    },
    dimensions: {
      width: elevationData[0].length,
      height: elevationData.length
    },
    elevation: {
      min: ELEVATION_CONFIG.MIN,
      max: ELEVATION_CONFIG.MAX,
      seaLevel: ELEVATION_CONFIG.SEA_LEVEL,
      unit: 'meters'
    },
    minecraft: {
      minY: MINECRAFT_CONFIG.MIN_Y,
      maxY: MINECRAFT_CONFIG.MAX_Y,
      seaLevelY: MINECRAFT_CONFIG.SEA_LEVEL_Y
    },
    instructions: [
      '=== WORLDPAINTER IMPORT INSTRUCTIONS ===',
      '',
      'STEP 1: Import Heightmap',
      '1. Open WorldPainter',
      '2. File → Import → Heightmap',
      '3. Select: ' + `${filename}-heightmap.png`,
      '4. Set height values in the dialog:',
      '   - Minimum height: -64',
      '   - Maximum height: 320',
      '   - Sea level: 62',
      '5. Click "Import"',
      '',
      'STEP 2: Apply Biomes (Optional)',
      '1. Open the biome map: ' + `${filename}-biomes.png`,
      '2. Use it as a visual reference for biome placement',
      '3. Select the Biome Paint tool in WorldPainter',
      '4. Refer to: ' + `${filename}-biome-mapping.json`,
      '5. Paint biomes according to the color mapping',
      '',
      'Color Mapping Reference:',
      '- Each color in the biome map represents a specific',
      '  biome + elevation combination',
      '- The biome-mapping.json file lists all color codes',
      '  and their corresponding Minecraft biomes',
      '- Use this to manually paint matching biomes in WorldPainter',
      '',
      'STEP 3: Customize & Export',
      '1. Add custom terrain features as desired',
      '2. File → Export → Export as Minecraft map',
      '3. Choose output directory for your Minecraft world',
      '4. Click "Export"',
      '5. Load the exported world in Minecraft',
      '',
      '=== BIOME MAPPING GUIDE ===',
      '',
      'Our 5 biome types map to Minecraft biomes as follows:',
      '',
      'TEMPERATE (elevation-based):',
      '  Ocean (<0m): minecraft:ocean',
      '  Plains (0-200m): minecraft:plains',
      '  Forest (200-500m): minecraft:forest',
      '  Hills (500-800m): minecraft:windswept_hills',
      '  Peaks (>800m): minecraft:stony_peaks',
      '',
      'DESERT (elevation-based):',
      '  Ocean (<0m): minecraft:warm_ocean',
      '  Desert (0-500m): minecraft:desert',
      '  Badlands (500-800m): minecraft:badlands',
      '  Peaks (>800m): minecraft:eroded_badlands',
      '',
      'TROPICAL (elevation-based):',
      '  Ocean (<0m): minecraft:warm_ocean',
      '  Jungle (0-200m): minecraft:jungle',
      '  Bamboo (200-500m): minecraft:bamboo_jungle',
      '  Hills (500-800m): minecraft:jungle',
      '  Peaks (>800m): minecraft:sparse_jungle',
      '',
      'ARCTIC (elevation-based):',
      '  Ocean (<0m): minecraft:frozen_ocean',
      '  Plains (0-200m): minecraft:snowy_plains',
      '  Taiga (200-500m): minecraft:snowy_taiga',
      '  Slopes (500-800m): minecraft:snowy_slopes',
      '  Peaks (>800m): minecraft:ice_spikes',
      '',
      'VOLCANIC (elevation-based):',
      '  Ocean (<0m): minecraft:deep_ocean',
      '  Badlands (0-200m): minecraft:badlands',
      '  Wooded (200-500m): minecraft:wooded_badlands',
      '  Mountains (500-800m): minecraft:eroded_badlands',
      '  Peaks (>800m): minecraft:basalt_deltas',
      '',
      '=== ADVANCED TIPS ===',
      '',
      '- Use WorldPainter\'s "Custom Terrain" feature to fine-tune',
      '  block placement and add custom structures',
      '- The biome map is a guide - feel free to customize',
      '- Consider adding rivers, lakes, and caves in WorldPainter',
      '- Use the "Populate" feature to add trees and ores',
      '',
      'For support, visit: https://github.com/Klein187/topo-map-generator'
    ]
  };

  return {
    heightmapBlob,
    biomeBlob,
    biomeMapping: biomeMapping ? JSON.stringify(biomeMapping, null, 2) : null,
    metadata: JSON.stringify(metadata, null, 2),
    filename
  };
}

/**
 * Generate biome mapping from color to Minecraft biome
 * @private
 */
function generateBiomeMapping(biomeData, elevationData) {
  const mapping = {
    version: '1.0',
    description: 'Color to Minecraft biome mapping for WorldPainter import',
    colorToBiome: {},
    biomeCategories: {
      temperate: {},
      desert: {},
      tropical: {},
      arctic: {},
      volcanic: {}
    }
  };

  // Track unique biome+elevation combinations
  const uniqueCombos = new Map();

  for (let y = 0; y < biomeData.length; y++) {
    for (let x = 0; x < biomeData[0].length; x++) {
      const biomeInfo = biomeData[y][x];
      const elevation = elevationData[y][x];

      // Create key based on biome and elevation bucket
      const elevationBucket = Math.floor(elevation / 50) * 50;
      const key = `${biomeInfo.primaryBiome}_${elevationBucket}`;

      if (!uniqueCombos.has(key)) {
        const minecraftBiome = determineMinecraftBiome(biomeInfo, elevation);
        uniqueCombos.set(key, {
          primaryBiome: biomeInfo.primaryBiome,
          elevationRange: elevationBucket,
          minecraftBiome
        });
      }
    }
  }

  // Convert to color mapping
  let colorIndex = 0;
  for (const [key, info] of uniqueCombos) {
    const color = indexToRGB(colorIndex++);
    const hexColor = rgbToHex(color);

    mapping.colorToBiome[hexColor] = {
      minecraftBiome: info.minecraftBiome,
      sourceInfo: {
        biome: info.primaryBiome,
        elevationRange: `${info.elevationRange}m to ${info.elevationRange + 50}m`
      }
    };

    // Also categorize by primary biome
    if (!mapping.biomeCategories[info.primaryBiome][hexColor]) {
      mapping.biomeCategories[info.primaryBiome][hexColor] = {
        minecraftBiome: info.minecraftBiome,
        elevationRange: info.elevationRange
      };
    }
  }

  return mapping;
}

/**
 * Determine Minecraft biome based on our biome type and elevation
 * @private
 */
function determineMinecraftBiome(biomeInfo, elevation) {
  const primaryBiome = biomeInfo.primaryBiome;

  // Ocean biomes (below sea level)
  if (elevation < 0) {
    switch (primaryBiome) {
      case 'temperate': return 'minecraft:ocean';
      case 'tropical': return 'minecraft:warm_ocean';
      case 'arctic': return 'minecraft:frozen_ocean';
      case 'desert': return 'minecraft:warm_ocean';
      case 'volcanic': return 'minecraft:deep_ocean';
      default: return 'minecraft:ocean';
    }
  }

  // Land biomes by elevation thresholds
  if (elevation < 200) {
    // Lowlands (0-200m)
    switch (primaryBiome) {
      case 'temperate': return 'minecraft:plains';
      case 'tropical': return 'minecraft:jungle';
      case 'arctic': return 'minecraft:snowy_plains';
      case 'desert': return 'minecraft:desert';
      case 'volcanic': return 'minecraft:badlands';
      default: return 'minecraft:plains';
    }
  } else if (elevation < 500) {
    // Midlands (200-500m)
    switch (primaryBiome) {
      case 'temperate': return 'minecraft:forest';
      case 'tropical': return 'minecraft:bamboo_jungle';
      case 'arctic': return 'minecraft:snowy_taiga';
      case 'desert': return 'minecraft:desert';
      case 'volcanic': return 'minecraft:wooded_badlands';
      default: return 'minecraft:forest';
    }
  } else if (elevation < 800) {
    // Highlands (500-800m)
    switch (primaryBiome) {
      case 'temperate': return 'minecraft:windswept_hills';
      case 'tropical': return 'minecraft:jungle';
      case 'arctic': return 'minecraft:snowy_slopes';
      case 'desert': return 'minecraft:badlands';
      case 'volcanic': return 'minecraft:eroded_badlands';
      default: return 'minecraft:windswept_hills';
    }
  } else {
    // Peaks (>800m)
    switch (primaryBiome) {
      case 'temperate': return 'minecraft:stony_peaks';
      case 'tropical': return 'minecraft:sparse_jungle';
      case 'arctic': return 'minecraft:ice_spikes';
      case 'desert': return 'minecraft:eroded_badlands';
      case 'volcanic': return 'minecraft:basalt_deltas';
      default: return 'minecraft:stony_peaks';
    }
  }
}

/**
 * Generate unique RGB color from index
 * @private
 */
function indexToRGB(index) {
  return {
    r: (index * 67) % 256,
    g: (index * 131) % 256,
    b: (index * 197) % 256
  };
}

/**
 * Convert RGB object to hex string
 * @private
 */
function rgbToHex({r, g, b}) {
  return '#' +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0');
}
