type MarketInfo = {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
};

type MarketInfos = MarketInfo[];

export { MarketInfo, MarketInfos };


/*  {
    "item_id": "T4_BAG",
    "city": "Caerleon",
    "quality": 1,
    "sell_price_min": 5980,
    "sell_price_min_date": "2026-01-30T15:25:00",
    "sell_price_max": 5980,
    "sell_price_max_date": "2026-01-30T15:25:00",
    "buy_price_min": 50,
    "buy_price_min_date": "2026-01-30T17:15:00",
    "buy_price_max": 3591,
    "buy_price_max_date": "2026-01-30T17:15:00"
  }, */
