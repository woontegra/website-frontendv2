import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { ApiError } from '@/lib/apiClient';
import { useAdminToken } from '@/admin/v2/AdminTokenContext';
import {
  AdminEditToolbar,
  adminInputClass,
  textUsesTextarea,
} from '@/admin/v2/adminV2EditUi';
import { Card } from '@/components/ui/Card';
import type { AdminV2ContentBundle } from '@/lib/adminContentBundle';
import {
  findAdminPageContent,
  heroDraftFromSnapshot,
  saveAdminPageContentSection,
  type PageContentHeroDraft,
} from '@/lib/adminPageContent';

type AdminPageHeroSectionProps = {
  bundle: AdminV2ContentBundle | null;
  pagePath: string;
  sectionKey?: string;
  cardTitle: string;
  cardDescription?: string;
  fieldLabels?: {
    eyebrow?: string;
    title?: string;
    description?: string;
  };
  defaults: PageContentHeroDraft;
  liveUrl?: string;
  editDisabled?: boolean;
  onSaved?: () => void | Promise<void>;
};

export function AdminPageHeroSection({
  bundle,
  pagePath,
  sectionKey = 'hero',
  cardTitle,
  cardDescription,
  fieldLabels,
  defaults,
  liveUrl,
  editDisabled,
  onSaved,
}: AdminPageHeroSectionProps) {
  const section = sectionKey;
  const labels = {
    eyebrow: fieldLabels?.eyebrow ?? 'Üst etiket',
    title: fieldLabels?.title ?? 'Başlık',
    description: fieldLabels?.description ?? 'Açıklama',
  };

  const { tokenPresent, invalidateBundle } = useAdminToken();
  const snapshot = bundle ? findAdminPageContent(bundle, pagePath, section) : null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PageContentHeroDraft>(() =>
    heroDraftFromSnapshot(snapshot, defaults),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(heroDraftFromSnapshot(snapshot, defaults));
    }
  }, [bundle, pagePath, section, editing, snapshot?.title, snapshot?.eyebrow, snapshot?.description]);

  const cancelEdit = () => {
    setEditing(false);
    setDraft(heroDraftFromSnapshot(snapshot, defaults));
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!tokenPresent) return;
    setSaving(true);
    setSaveError(null);
    setSaveOk(null);
    try {
      await saveAdminPageContentSection(
        pagePath,
        section,
        {
          eyebrow: draft.eyebrow.trim(),
          title: draft.title.trim(),
          description: draft.description.trim(),
        },
        snapshot?.id ?? null,
      );
      invalidateBundle();
      setEditing(false);
      setSaveOk('Kaydedildi. Canlı sitede birkaç saniye içinde görünür.');
      await onSaved?.();
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message ?? 'Kayıt güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const display = heroDraftFromSnapshot(snapshot, defaults);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{cardTitle}</h2>
          {cardDescription && (
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{cardDescription}</p>
          )}
        </div>
        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
          >
            Canlı sayfayı aç
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {saveOk && !editing && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {saveOk}
        </p>
      )}

      {editing ? (
        <dl className="mt-4 space-y-3">
          {(['eyebrow', 'title', 'description'] as const).map((key) => (
            <div key={key}>
              <dt className="text-xs font-semibold text-slate-500">{labels[key]}</dt>
              <dd className="mt-1">
                {key === 'description' || textUsesTextarea(draft[key]) ? (
                  <textarea
                    value={draft[key]}
                    onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                    rows={key === 'description' ? 4 : 3}
                    disabled={saving}
                    className={adminInputClass}
                  />
                ) : (
                  <input
                    type="text"
                    value={draft[key]}
                    onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                    disabled={saving}
                    className={adminInputClass}
                  />
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <dl className="mt-4 divide-y divide-slate-100">
          {(['eyebrow', 'title', 'description'] as const).map((key) => (
            <div
              key={key}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4 sm:py-3.5"
            >
              <dt className="w-40 shrink-0 text-sm font-semibold text-slate-600">{labels[key]}</dt>
              <dd className="min-w-0 flex-1 break-words text-sm text-slate-900">
                {display[key] || <span className="italic text-slate-400">(boş)</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <AdminEditToolbar
        isEditing={editing}
        saving={saving}
        tokenPresent={tokenPresent}
        editDisabled={editDisabled}
        saveError={saveError}
        onEdit={() => {
          setSaveOk(null);
          setEditing(true);
          setDraft(heroDraftFromSnapshot(snapshot, defaults));
        }}
        onSave={() => void handleSave()}
        onCancel={cancelEdit}
      />
    </Card>
  );
}
