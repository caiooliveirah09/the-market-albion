import fs from 'fs';
import path from 'path';

interface ItemData {
  UniqueName: string;
  LocalizedNames: {
    'PT-BR': string;
    [key: string]: string;
  };
  [key: string]: any;
}

interface WorldData {
  Index: string;
  UniqueName: string;
}

let cachedItems: Record<string, string> | null = null;
let cachedLocations: Record<string, string> | null = null;

export function loadItems(): Record<string, string> {
  if (cachedItems) {
    return cachedItems;
  }

  try {
    // Try the new items.json format first
    const itemsPath = path.join(__dirname, '../../../files/items.json');
    const data = fs.readFileSync(itemsPath, 'utf-8');
    const items: ItemData[] = JSON.parse(data);

    cachedItems = {};
    for (const item of items) {
      if (item.UniqueName && item.LocalizedNames && item.LocalizedNames['PT-BR']) {
        cachedItems[item.UniqueName] = item.LocalizedNames['PT-BR'];
      }
    }

    console.log(`📚 Loaded ${Object.keys(cachedItems).length} item names in PT-BR`);
    return cachedItems;
  } catch (error) {
    console.warn('Failed to load items.json, using fallback');
    return {};
  }
}

export function loadLocations(): Record<string, string> {
  if (cachedLocations) {
    return cachedLocations;
  }

  try {
    const worldPath = path.join(__dirname, '../../../files/world.json');
    const data = fs.readFileSync(worldPath, 'utf-8');
    const locations: WorldData[] = JSON.parse(data);

    cachedLocations = {};
    for (const location of locations) {
      if (location.Index && location.UniqueName) {
        cachedLocations[location.Index] = location.UniqueName;
      }
    }

    console.log(`🗺️  Loaded ${Object.keys(cachedLocations).length} locations`);
    return cachedLocations;
  } catch (error) {
    console.warn('Failed to load world.json, using fallback');
    return {};
  }
}
