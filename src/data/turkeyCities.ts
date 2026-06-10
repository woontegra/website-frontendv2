/**
 * Türkiye il / ilçe listesi — kaynak: nidea1/Turkey-s-Provinces-Districts (Turkey.json, 81 il, 973 ilçe).
 * Sıralama: Türkçe yerel kurallarına göre (İ/i vb.).
 */
import rawProvinces from './turkey-provinces-districts.json';

export type TurkeyDistrict = { id: number; name: string };
export type TurkeyProvince = { id: number; name: string; districts: TurkeyDistrict[] };

const trSort = new Intl.Collator('tr', { sensitivity: 'base' });

export const TURKEY_PROVINCES: TurkeyProvince[] = (rawProvinces as TurkeyProvince[])
  .map((p) => ({
    ...p,
    districts: [...p.districts].sort((a, b) => trSort.compare(a.name, b.name)),
  }))
  .sort((a, b) => trSort.compare(a.name, b.name));

export function getDistrictsForProvinceName(provinceName: string): TurkeyDistrict[] {
  const p = TURKEY_PROVINCES.find((x) => x.name === provinceName);
  return p?.districts ?? [];
}
