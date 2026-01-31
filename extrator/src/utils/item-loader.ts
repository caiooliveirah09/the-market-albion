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

let cachedItems: Record<string, string> | null = null;

export function loadItems(): Record<string, string> {
  if (cachedItems) {
    return cachedItems;
  }

  try {
    // Try the new items.json format first
    const itemsPath = path.join(__dirname, 'items.json');
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
