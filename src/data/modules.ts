import {
  Calculator,
  Clock,
  Timer,
  CalendarDays,
  Flag,
  Sun,
  Wallet,
  Receipt,
  Ban,
  UserMinus,
  Hourglass,
  Users,
  Coins,
  Gavel,
  Landmark,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { calculationModulePaths } from '@/data/calculationModulePaths';

export type CalculationModule = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export const calculationModules: CalculationModule[] = [
  {
    id: 'kidem',
    title: 'Kıdem Tazminatı',
    description: 'İşçinin hizmet süresine göre kıdem tazminatı hesabı.',
    href: calculationModulePaths.kidem,
    icon: Calculator,
  },
  {
    id: 'ihbar',
    title: 'İhbar Tazminatı',
    description: 'İhbar süreleri ve ihbar tazminatı hesabı.',
    href: calculationModulePaths.ihbar,
    icon: Clock,
  },
  {
    id: 'fazla-mesai',
    title: 'Fazla Mesai Alacağı',
    description: 'Haftalık ve yıllık fazla çalışma ücret hesabı.',
    href: calculationModulePaths['fazla-mesai'],
    icon: Timer,
  },
  {
    id: 'yillik-izin',
    title: 'Yıllık Ücretli İzin Alacağı',
    description: 'Kullanılmayan yıllık izin ücret alacağı hesabı.',
    href: calculationModulePaths['yillik-izin'],
    icon: CalendarDays,
  },
  {
    id: 'ubgt',
    title: 'UBGT Alacağı',
    description: 'Ulusal bayram ve genel tatil ücreti hesabı.',
    href: calculationModulePaths.ubgt,
    icon: Flag,
  },
  {
    id: 'hafta-tatili',
    title: 'Hafta Tatili Alacağı',
    description: 'Hafta tatili çalışma ücreti hesabı.',
    href: calculationModulePaths['hafta-tatili'],
    icon: Sun,
  },
  {
    id: 'ucret',
    title: 'Ücret Alacağı',
    description: 'Ödenmeyen ücret alacaklarının hesaplanması.',
    href: calculationModulePaths.ucret,
    icon: Wallet,
  },
  {
    id: 'bakiye',
    title: 'Bakiye Ücret Alacağı',
    description: 'Sözleşme süresinden kaynaklanan bakiye ücret hesabı.',
    href: calculationModulePaths.bakiye,
    icon: Receipt,
  },
  {
    id: 'kotu-niyet',
    title: 'Kötü Niyet Tazminatı',
    description: 'İş güvencesi kapsamı dışındaki kötü niyet tazminatı hesabı.',
    href: calculationModulePaths['kotu-niyet'],
    icon: Ban,
  },
  {
    id: 'ise-baslatmama',
    title: 'İşe Başlatmama Tazminatı',
    description: 'İşe iade sonrası işe başlatmama tazminatı hesabı.',
    href: calculationModulePaths['ise-baslatmama'],
    icon: UserMinus,
  },
  {
    id: 'bosta-gecen',
    title: 'Boşta Geçen Süre Ücreti',
    description: 'İşe iade davasında boşta geçen süre ücreti hesabı.',
    href: calculationModulePaths['bosta-gecen'],
    icon: Hourglass,
  },
  {
    id: 'ayrimcilik',
    title: 'Ayrımcılık Tazminatı',
    description: 'Ayrımcılık yasağına aykırılık nedeniyle tazminat hesabı.',
    href: calculationModulePaths.ayrimcilik,
    icon: Users,
  },
  {
    id: 'prim',
    title: 'Prim Alacağı',
    description: 'Prim ve ikramiye niteliğindeki alacakların hesabı.',
    href: calculationModulePaths.prim,
    icon: Coins,
  },
  {
    id: 'haksiz-fesih',
    title: 'Haksız Fesih Tazminatı',
    description: 'Haksız fesih nedeniyle doğan tazminat hesabı.',
    href: calculationModulePaths['haksiz-fesih'],
    icon: Gavel,
  },
  {
    id: 'sendikal',
    title: 'Sendikal Tazminat',
    description: 'Sendikal nedenle fesih veya ayrımcılık tazminatı hesabı.',
    href: calculationModulePaths.sendikal,
    icon: Landmark,
  },
];
