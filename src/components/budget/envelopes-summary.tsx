import { Card } from "@/components/ui/card";
import { CatDot } from "@/components/ui/cat-dot";
import { formatEUR } from "@/lib/formatters";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";
import type { Envelopes } from "@/lib/budget";

export function EnvelopesSummary({ envelopes }: { envelopes: Envelopes }) {
  return (
    <div className="flex flex-col gap-3">
      {CATEGORY_ORDER.map((key) => (
        <Card key={key} className={CATEGORIES[key].bgClass} pad="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CatDot category={key} />
              <span className="text-[14px] font-medium text-text">{CATEGORIES[key].label}</span>
            </div>
            <span className="num text-[20px] font-light text-text">
              {formatEUR(envelopes[key])}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
