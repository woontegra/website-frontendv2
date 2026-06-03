type Props = {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  id: string;
  labelActive?: string;
  labelInactive?: string;
};

export function CookieConsentToggle({
  checked,
  disabled = false,
  onChange,
  id,
  labelActive = 'Aktif',
  labelInactive = 'İnaktif',
}: Props) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        } ${checked ? 'bg-emerald-600' : 'bg-slate-300'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <span
        className={`text-xs font-semibold sm:text-sm ${
          checked ? 'text-emerald-700' : 'text-slate-400'
        }`}
        aria-hidden
      >
        {checked ? labelActive : labelInactive}
      </span>
    </div>
  );
}
