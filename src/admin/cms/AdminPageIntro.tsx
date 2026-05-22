import type { ReactNode } from 'react';
import { PageHeader } from '@/admin/ui/PageHeader';

type AdminPageIntroProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

/** Eski sayfalar — yeni PageHeader ile uyumlu */
export function AdminPageIntro({ title, description, children }: AdminPageIntroProps) {
  return <PageHeader title={title} description={description} actions={children} />;
}
