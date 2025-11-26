export const TH = ({ children }: { children: React.ReactNode }) => (
  <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-[#A3A3A3]">
    {children}
  </th>
);

export const TD = ({ children }: { children: React.ReactNode }) => (
  <td className="py-2 px-3 text-sm text-[#E5E5E5]">{children}</td>
);
