import type { ReactNode } from 'react';
import { SectionCard } from '@/admin/ui/SectionCard';

type AdminSectionCardProps = {
  title: string;
  description?: string;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
};

/** Eski sayfalar — SectionCard sarmalayıcı */
export function AdminSectionCard({
  title,
  description,
  hint,
  actions,
  children,
}: AdminSectionCardProps) {
  return (
    <SectionCard
      title={title}
      description={description ?? ''}
      locationNote={hint}
      action={actions}
    >
      {children}
    </SectionCard>
  );
}
