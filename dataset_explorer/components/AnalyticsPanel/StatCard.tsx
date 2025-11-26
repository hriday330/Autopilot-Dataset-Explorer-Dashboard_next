export const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: any;
}) => (
  <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-4">
    <div className="text-xs text-[#A3A3A3] uppercase tracking-wider mb-1">
      {label}
    </div>
    <div className="text-3xl text-[#E5E5E5]">{value}</div>
  </div>
);
