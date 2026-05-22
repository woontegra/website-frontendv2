import { AlertCircle, Loader2, Pencil } from 'lucide-react';

export { adminInputClass } from '@/admin/ui/adminUiClasses';

export function textUsesTextarea(value: string): boolean {
  return value.length > 80 || value.includes('\n');
}

type AdminEditToolbarProps = {
  isEditing: boolean;
  saving: boolean;
  tokenPresent: boolean;
  editDisabled?: boolean;
  saveError: string | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
};

export function AdminEditToolbar({
  isEditing,
  saving,
  tokenPresent,
  editDisabled,
  saveError,
  onEdit,
  onSave,
  onCancel,
}: AdminEditToolbarProps) {
  return (
    <div className="mt-3 flex flex-col items-end gap-2">
      {isEditing ? (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={!tokenPresent || saving}
            className="rounded-xl bg-slate-900 px-4 py-2 text-[13px] font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Kaydediliyor…
              </span>
            ) : (
              'Kaydet'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Vazgeç
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          disabled={!tokenPresent || saving || editDisabled}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil className="h-3.5 w-3.5" />
          Düzenle
        </button>
      )}
      {saveError && isEditing && (
        <p className="flex max-w-full items-start gap-1.5 text-xs text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {saveError}
        </p>
      )}
    </div>
  );
}

export function AdminActiveCheckbox({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />
      Aktif
    </label>
  );
}
