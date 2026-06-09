"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Clock3 } from "lucide-react";
import {
  Button,
  Card,
  CatDot,
  CatSelect,
  Field,
  MonthNav,
  Pill,
  ProgressBar,
  Segmented,
  SoftBanner,
  TextInput,
  Toggle,
} from "@/components/ui";
import type { CategoryKey } from "@/lib/categories";

// Dev-only showcase to review the UI kit in light/dark and mobile/desktop.
// Remove once real feature screens cover these components.
export default function KitPage() {
  const { theme, setTheme } = useTheme();
  const [cat, setCat] = useState<CategoryKey>("essential");
  const [lang, setLang] = useState("fr");
  const [amount, setAmount] = useState("");
  const [notify, setNotify] = useState(true);
  const [month, setMonth] = useState(1);

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col gap-10 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="font-serif text-[28px] text-text">kōza · UI kit</h1>
        <Toggle
          on={theme === "dark"}
          label="Thème sombre"
          onChange={(on) => setTheme(on ? "dark" : "light")}
        />
      </header>

      <MonthNav
        title="Juin 2026"
        subtitle="En cours"
        canPrev={month > 0}
        canNext={month < 2}
        onPrev={() => setMonth((m) => Math.max(0, m - 1))}
        onNext={() => setMonth((m) => Math.min(2, m + 1))}
      />

      <Card className="bg-essential-bg" pad="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CatDot category="essential" />
            <span className="text-[14px] font-medium text-text">Essentiels</span>
          </div>
          <span className="num text-[13px] text-text-secondary">75 %</span>
        </div>
        <div className="num mb-1 text-[28px] font-light text-text">1 050 €</div>
        <div className="num mb-4 text-[12px] text-text-secondary">sur 1 400 €</div>
        <ProgressBar value={1050} max={1400} fillClass="bg-essential" />
      </Card>

      <SoftBanner icon={Clock3} tone="warning" action="Confirmer" onAction={() => {}}>
        Électricité à confirmer
      </SoftBanner>

      <div className="flex flex-wrap items-center gap-3">
        <Button>Primary</Button>
        <Button variant="soft" onClick={() => {}}>
          Soft
        </Button>
        <Button variant="surface">Surface</Button>
        <Button variant="ghost">Ghost</Button>
        <Pill className="bg-leisure-bg text-leisure">Restaurant</Pill>
      </div>

      <Segmented
        options={[
          { value: "fr", label: "Français" },
          { value: "en", label: "English" },
        ]}
        value={lang}
        onChange={setLang}
      />

      <Field label="Montant" hint="En euros">
        <TextInput value={amount} onChange={setAmount} placeholder="24,90 €" type="number" />
      </Field>

      <CatSelect value={cat} onChange={setCat} />

      <label className="flex items-center justify-between">
        <span className="text-[14px] text-text">Notifications</span>
        <Toggle on={notify} label="Notifications" onChange={setNotify} />
      </label>
    </main>
  );
}
