import type { CookieInventoryItem } from '@/lib/cookieInventory';

type Props = {
  items: CookieInventoryItem[];
  emptyMessage?: string;
};

export function CookieInventoryList({ items, emptyMessage }: Props) {
  if (items.length === 0) {
    if (!emptyMessage) return null;
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white sm:max-h-60">
      {items.map((item, index) => (
        <div
          key={item.name}
          className={`px-4 py-3 text-sm text-slate-700 ${
            index < items.length - 1 ? 'border-b border-slate-100' : ''
          }`}
        >
          <p className="font-semibold text-slate-900">{item.name}</p>
          <dl className="mt-2 grid gap-1 text-xs sm:text-sm">
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-slate-500">Sağlayıcı:</dt>
              <dd>{item.provider}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-slate-500">Tür:</dt>
              <dd>{item.type}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Amaç:</dt>
              <dd className="mt-0.5 leading-relaxed">{item.purpose}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-slate-500">Saklama süresi:</dt>
              <dd>{item.retention}</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}
