interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className={`border p-4 ${accent ? "border-white bg-white text-black" : "border-gray-700 bg-gray-900"}`}>
      <p className={`text-xs uppercase tracking-widest mb-2 ${accent ? "text-gray-500" : "text-gray-400"}`}>
        {label}
      </p>
      <p className={`text-3xl font-light tabular-nums ${accent ? "text-black" : "text-white"}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-1 ${accent ? "text-gray-400" : "text-gray-500"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}
