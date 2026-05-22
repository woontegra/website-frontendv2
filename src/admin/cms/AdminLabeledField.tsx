import type { ReactNode } from 'react';
import { FieldGroup } from '@/admin/ui/FieldGroup';

export function AdminLabeledField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <FieldGroup label={label} hint={hint}>
      {children}
    </FieldGroup>
  );
}
