import { Worlds } from "../types/world.type";
import { Items } from "../types/item.type";

import worldsData from "../files/world.json";
import itemsData from "../files/items.json";
import { BAGS } from "../files/favorite_items";
import fs from "fs";
import { MarketInfos, MarketInfo } from "../types/market_info.type";

const WORLDS: Worlds = worldsData as Worlds;
const ITEMS: Items = itemsData as Items;

const ALBION_ONLINE_DATA_BASE_URL =
  "https://west.albion-online-data.com/api/v2";

const CITYS_NAME_IDS = {
  blackmarket: "Black Market",
  caerleon: "Caerleon",
};

async function getBestFlipItemsOnBlackMarket({ data }: { data: MarketInfos }) {
  const cityKeyMap: Record<string, "caerleon" | "blackmarket"> = {};
  for (const [key, value] of Object.entries(CITYS_NAME_IDS)) {
    cityKeyMap[value] = key as "caerleon" | "blackmarket";
  }

  const grouped: Record<
    string,
    { caerleon?: MarketInfo; blackmarket?: MarketInfo }
  > = {};

  for (const item of data) {
    const key = `${item.item_id}_${item.quality}`;
    if (!grouped[key]) grouped[key] = {};
    const cityKey = cityKeyMap[item.city];
    grouped[key][cityKey] = item;
  }

  let flips: Array<{
    item_id: string;
    buy_quality: number;
    sell_quality: number;
    buy_price: number;
    sell_price: number;
    profit: number;
    city_buy: string;
    city_sell: string;
    buy_date: string;
    sell_date: string;
    item_name: string;
  }> = [];

  for (const key in grouped) {
    const { caerleon, blackmarket } = grouped[key];
    if (
      caerleon &&
      blackmarket &&
      caerleon.sell_price_min &&
      blackmarket.buy_price_max &&
      caerleon.quality >= blackmarket.quality
    ) {
      const profit = blackmarket.buy_price_max * 0.96 - caerleon.sell_price_min;
      if (profit > 0) {
        const itemName =
          ITEMS.find((item) => item.UniqueName === caerleon.item_id)
            ?.LocalizedNames["PT-BR"] || "Unknown";
        flips.push({
          item_id: caerleon.item_id,
          item_name: itemName,
          buy_quality: caerleon.quality,
          sell_quality: blackmarket.quality,
          buy_price: caerleon.sell_price_min,
          sell_price: blackmarket.buy_price_max,
          buy_date: caerleon.sell_price_min_date,
          sell_date: blackmarket.buy_price_max_date,
          profit,
          city_buy: "Caerleon",
          city_sell: "Black Market",
        });
      }
    }
  }

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  flips = flips.filter(
    (flip) =>
      new Date(flip.sell_date) >= twentyFourHoursAgo &&
      new Date(flip.buy_date) >= twentyFourHoursAgo,
  );

  flips.sort((a, b) => {
    if (b.profit !== a.profit) {
      return b.profit - a.profit;
    }
    return new Date(b.sell_date).getTime() - new Date(a.sell_date).getTime();
  });

  fs.writeFileSync(`flip-data-1.json`, JSON.stringify(flips, null, 2));
  console.log(`Flip data saved to flip-data-1.json`);
}

async function main() {
  const marketsToCheck = "blackmarket, caerleon";

  const uniqueNames = ITEMS.map((item) => item.UniqueName);
  //const uniqueNames = BAGS;

  const base = `${ALBION_ONLINE_DATA_BASE_URL}/stats/prices/`;
  const suffix = `.json?locations=${marketsToCheck}`;

  const MAX_URL_LENGTH = 4096;

  const chunks: string[][] = [];
  let current: string[] = [];

  for (const name of uniqueNames) {
    const temp = [...current, name];
    const tempStr = temp.join(",");
    const fullUrl = base + tempStr + suffix;
    if (fullUrl.length <= MAX_URL_LENGTH) {
      current = temp;
    } else {
      if (current.length > 0) {
        chunks.push(current);
        current = [name];
      } else {
        chunks.push([name]);
        current = [];
      }
    }
  }
  if (current.length > 0) {
    chunks.push(current);
  }

  const numRequests = chunks.length;
  console.log(`Total de requisições que precisam: ${numRequests}`);

  if (numRequests > 81 || numRequests > 179) {
    throw new Error("Muitas requisições...");
  }

  const finalData: MarketInfos = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const itemIds = chunk.join(",");
    const url = base + itemIds + suffix;

    const response = await fetch(url);

    const data = (await response.json()) as MarketInfos;
    finalData.push(...data);

    console.log("Terminei a requisição ", i + 1, "de", chunks.length);
    // fs.writeFileSync(`data-${i + 1}.json`, JSON.stringify(data, null, 2));
  }

  await getBestFlipItemsOnBlackMarket({ data: finalData });
}

main();
