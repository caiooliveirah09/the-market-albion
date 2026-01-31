type LocalizedStrings = Record<"EN-US" | "PT-BR" | string, string>;

type Item = {
  LocalizationNameVariable: string;
  LocalizationDescriptionVariable: string;
  LocalizedNames: LocalizedStrings;
  LocalizedDescriptions: LocalizedStrings;
  Index: string;
  UniqueName: string;
};

type Items = Item[];

export { Item, Items };

/*
 {
    "LocalizationNameVariable": "@ITEMS_T4_BAG",
    "LocalizationDescriptionVariable": "@ITEMS_T4_BAG_DESC",
    "LocalizedNames": {
      "EN-US": "Adept's Bag",
      "DE-DE": "Tasche des Adepten",
      "FR-FR": "Sac de l'adepte",
      "RU-RU": "Сумка (знаток)",
      "PL-PL": "Sakwa Adepta",
      "ES-ES": "Bolsa del iniciado",
      "PT-BR": "Bolsa do Adepto",
      "IT-IT": "Borsa del sapiente",
      "ZH-CN": "老手级背包",
      "KO-KR": "숙련자의 가방",
      "JA-JP": "袋（名人）",
      "ZH-TW": "老手級背包",
      "ID-ID": "Tas Mahir",
      "TR-TR": "Ehil Çantası",
      "AR-SA": "حقيبة البارع"
    },
    "LocalizedDescriptions": {
      "EN-US": "Equipment Item",
      "DE-DE": "Ausrüstungsgegenstand",
      "FR-FR": "Pièce d'équipement",
      "RU-RU": "Снаряжение",
      "PL-PL": "Przedmiot do wyposażenia",
      "ES-ES": "Objeto de equipo",
      "PT-BR": "Item de Equipamento",
      "IT-IT": "Oggetto d'equipaggiamento",
      "ZH-CN": "装备物品",
      "KO-KR": "장비 아이템",
      "JA-JP": "装備アイテム",
      "ZH-TW": "裝備物品",
      "ID-ID": "Item Perlengkapan",
      "TR-TR": "Ekipman Eşyası",
      "AR-SA": "عنصر معدات"
    },
    "Index": "2831",
    "UniqueName": "T4_BAG"
  },*/
