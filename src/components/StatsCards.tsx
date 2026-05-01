"use client";

interface StatsData {
  totalCompanies: number;
  listedCompanies: number;
  averageSalary: number;
  medianSalary: number;
  dataYear: string;
}

export function StatsCards({ stats }: { stats: StatsData }) {
  const cards = [
    {
      label: "収録企業数",
      value: stats.totalCompanies.toLocaleString(),
      unit: "社",
      sub: `うち上場 ${stats.listedCompanies.toLocaleString()}社`,
      icon: "🏢",
    },
    {
      label: "上場企業 平均年収",
      value: stats.averageSalary.toLocaleString(),
      unit: "万円",
      sub: stats.dataYear,
      icon: "💰",
    },
    {
      label: "中央値",
      value: stats.medianSalary.toLocaleString(),
      unit: "万円",
      sub: "全企業ベース",
      icon: "📊",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="glass rounded-xl p-5 glass-hover">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{card.icon}</span>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              {card.label}
            </p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-[var(--color-text-primary)]">
              {card.value}
            </span>
            <span className="text-base text-[var(--color-text-secondary)]">
              {card.unit}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {card.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
