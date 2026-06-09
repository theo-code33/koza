import { CATEGORY_ORDER, type CategoryKey } from "@/lib/categories";

export interface SubcategoryConfig {
  key: string;
  label: string;
  category: CategoryKey;
}

export const SUBCATEGORIES: Record<CategoryKey, SubcategoryConfig[]> = {
  essential: [
    { key: "housing", label: "Logement", category: "essential" },
    { key: "food", label: "Alimentation", category: "essential" },
    { key: "transport", label: "Transports", category: "essential" },
    { key: "health", label: "Santé", category: "essential" },
    { key: "insurance", label: "Assurances", category: "essential" },
    { key: "bills", label: "Factures", category: "essential" },
  ],
  leisure: [
    { key: "restaurants", label: "Restaurants", category: "leisure" },
    { key: "outings", label: "Sorties", category: "leisure" },
    { key: "vacations", label: "Vacances", category: "leisure" },
    { key: "sport", label: "Sport", category: "leisure" },
    { key: "games", label: "Jeux vidéo", category: "leisure" },
    { key: "culture", label: "Culture", category: "leisure" },
  ],
  savings: [
    { key: "savings_account", label: "Livret d'épargne", category: "savings" },
    { key: "etf", label: "ETF", category: "savings" },
    { key: "stocks", label: "Actions", category: "savings" },
    { key: "real_estate", label: "Immobilier", category: "savings" },
    { key: "emergency_fund", label: "Fonds d'urgence", category: "savings" },
  ],
};

export const ALL_SUBCATEGORIES: SubcategoryConfig[] = CATEGORY_ORDER.flatMap(
  (key) => SUBCATEGORIES[key],
);

export const SUBCATEGORY_KEYS: Set<string> = new Set(ALL_SUBCATEGORIES.map((sub) => sub.key));

export function isValidSubcategory(category: CategoryKey, key: string): boolean {
  return SUBCATEGORIES[category].some((sub) => sub.key === key);
}

// Label FR d'une sous-catégorie (repli sur la clé si inconnue).
export function subcategoryLabel(key: string): string {
  return ALL_SUBCATEGORIES.find((sub) => sub.key === key)?.label ?? key;
}
