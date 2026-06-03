import type { CookieInventoryItem } from '@/lib/cookieInventory';

type Props = {
  items: CookieInventoryItem[];
};

export function CookieInventoryTable({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-slate-100 bg-slate-50/80">
      <table className="min-w-[640px] w-full text-left text-xs text-slate-700">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-100/80 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-2.5 py-2">Ad</th>
            <th className="px-2.5 py-2">Sağlayıcı</th>
            <th className="px-2.5 py-2">Tür</th>
            <th className="px-2.5 py-2">Amaç</th>
            <th className="px-2.5 py-2">Saklama</th>
            <th className="px-2.5 py-2">Onay</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.name} className="border-b border-slate-100 last:border-0">
              <td className="px-2.5 py-2 align-top font-mono text-[11px] text-slate-900">{item.name}</td>
              <td className="px-2.5 py-2 align-top">{item.provider}</td>
              <td className="px-2.5 py-2 align-top">{item.type}</td>
              <td className="max-w-[200px] px-2.5 py-2 align-top leading-relaxed">{item.purpose}</td>
              <td className="whitespace-nowrap px-2.5 py-2 align-top">{item.retention}</td>
              <td className="px-2.5 py-2 align-top text-slate-600">{item.consentRequirement}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
