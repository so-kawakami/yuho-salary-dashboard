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
      accent: "from-blue-600 to-blue-400",
      bg: "bg-blue-50",
    },
    {
      label: "上場企業 平均年収",
      value: stats.averageSalary.toLocaleString(),
      unit: "万円",
      sub: stats.dataYear,
      accent: "from-[var(--color-primary)] to-[var(--color-accent)]",
      bg: "bg-indigo-50",
    },
    {
      label: "中央値",
      value: stats.medianSalary.toLocaleString(),
      unit: "万円",
      sub: "全企業ベース",
      accent: "from-cyan-600 to-teal-400",
      bg: "bg-teal-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="glass rounded-2xl p-6 glass-hover relative overflow-hidden">
          {/* 背景アクセント */}
          <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} rounded-full -translate-y-8 translate-x-8 opacity-60`} />

          <p className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3 relative">
            {card.label}
          </p>
          <div className="flex items-baseline gap-1.5 relative">
            <span className={`text-4xl sm:text-5xl font-extrabold bg-gradient-to-r ${card.accent} bg-clip-text text-transparent`}>
              {card.value}
            </span>
            <span className="text-lg font-medium text-[var(--color-text-secondary)]">
              {card.unit}
            </span>
          </div>
          <p className="mt-2 text-xs font-medium text-[var(--color-text-muted)] relative">
            {card.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
