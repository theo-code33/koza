export type CategoryKey = "essential" | "leisure" | "savings";

export interface CategoryConfig {
  key: CategoryKey;
  share: number;
  dotClass: string;
  textClass: string;
  bgClass: string;
}

export const CATEGORIES: Record<CategoryKey, CategoryConfig> = {
  essential: {
    key: "essential",
    share: 0.5,
    dotClass: "bg-essential",
    textClass: "text-essential",
    bgClass: "bg-essential-bg",
  },
  leisure: {
    key: "leisure",
    share: 0.3,
    dotClass: "bg-leisure",
    textClass: "text-leisure",
    bgClass: "bg-leisure-bg",
  },
  savings: {
    key: "savings",
    share: 0.2,
    dotClass: "bg-savings",
    textClass: "text-savings",
    bgClass: "bg-savings-bg",
  },
};

export const CATEGORY_ORDER: CategoryKey[] = ["essential", "leisure", "savings"];
