import { CATEGORY_ORDER, type CategoryKey } from "@/lib/categories";

export interface SubcategoryConfig {
  key: string;
  category: CategoryKey;
}

export const SUBCATEGORIES: Record<CategoryKey, SubcategoryConfig[]> = {
  essential: [
    { key: "housing", category: "essential" },
    { key: "food", category: "essential" },
    { key: "transport", category: "essential" },
    { key: "health", category: "essential" },
    { key: "insurance", category: "essential" },
    { key: "bills", category: "essential" },
  ],
  leisure: [
    { key: "restaurants", category: "leisure" },
    { key: "outings", category: "leisure" },
    { key: "vacations", category: "leisure" },
    { key: "sport", category: "leisure" },
    { key: "games", category: "leisure" },
    { key: "culture", category: "leisure" },
  ],
  savings: [
    { key: "savings_account", category: "savings" },
    { key: "etf", category: "savings" },
    { key: "stocks", category: "savings" },
    { key: "real_estate", category: "savings" },
    { key: "emergency_fund", category: "savings" },
  ],
};

export const ALL_SUBCATEGORIES: SubcategoryConfig[] = CATEGORY_ORDER.flatMap(
  (key) => SUBCATEGORIES[key],
);

export const SUBCATEGORY_KEYS: Set<string> = new Set(ALL_SUBCATEGORIES.map((sub) => sub.key));

export function isValidSubcategory(category: CategoryKey, key: string): boolean {
  return SUBCATEGORIES[category].some((sub) => sub.key === key);
}

// Clé de la première sous-catégorie d'une catégorie (chaque catégorie en a au moins une).
export function defaultSubcategory(category: CategoryKey): string {
  const [first] = SUBCATEGORIES[category];
  return first?.key ?? "";
}
