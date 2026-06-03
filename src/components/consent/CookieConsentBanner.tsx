import { Link } from 'react-router-dom';

type Props = {
  onManage: () => void;
  onRejectAll: () => void;
  onAcceptAll: () => void;
};

export function CookieConsentBanner({ onManage, onRejectAll, onAcceptAll }: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-slate-700/50 bg-slate-800 text-slate-100 shadow-[0_-12px_40px_rgba(0,0,0,0.25)]"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      data-cookie-consent="banner"
    >
      <div className="container-page flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-5">
        <div className="min-w-0 flex-1">
          <p id="cookie-banner-title" className="sr-only">
            Çerez bilgilendirmesi
          </p>
          <p className="text-sm leading-relaxed text-slate-200 sm:text-[15px]">
            Sitemizde deneyiminizi iyileştirmek ve hizmetlerimizi güvenli şekilde sunmak için çerezler
            ve benzeri teknolojiler kullanılmaktadır. Tercihlerinizi{' '}
            <strong className="font-semibold text-white">Tercihleri Yönet</strong> üzerinden
            düzenleyebilir; tümünü kabul edebilir veya yalnızca zorunlu çerezlerle devam
            edebilirsiniz. Ayrıntılı bilgi için{' '}
            <Link
              to="/cerez-politikasi"
              className="font-semibold text-emerald-300 underline decoration-emerald-400/50 hover:text-emerald-200"
            >
              Çerez ve Benzeri Teknolojiler Politikası
            </Link>{' '}
            ve{' '}
            <Link
              to="/kvkk-aydinlatma-metni"
              className="font-semibold text-emerald-300 underline decoration-emerald-400/50 hover:text-emerald-200"
            >
              KVKK Aydınlatma Metni
            </Link>{' '}
            sayfalarını inceleyebilirsiniz. Bu tercih paneli yalnızca tanıtım web sitesi çerezlerini
            kapsar; program oturumu ayrıdır. Tercihleriniz en fazla 12 ay saklanır.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-stretch">
          <button
            type="button"
            className="rounded-md border border-slate-500 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-slate-400 hover:bg-slate-700/80"
            onClick={onManage}
          >
            Tercihleri Yönet
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-500 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-slate-400 hover:bg-slate-700/80"
            onClick={onRejectAll}
          >
            Tüm Çerezleri Reddet
          </button>
          <button
            type="button"
            className="rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-500"
            onClick={onAcceptAll}
          >
            Tüm Çerezlere İzin Ver
          </button>
        </div>
      </div>
    </div>
  );
}
