import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { adminAccentBtnClass } from '@/admin/ui/adminUiClasses';

type Variant = 'primary' | 'secondary' | 'ghost';

const variantClass: Record<Variant, string> = {
  primary: adminAccentBtnClass,
  secondary:
    'bg-white text-[#1e2a3a] border border-[#dbe4ea] shadow-[0_1px_2px_rgba(26,36,51,0.04)] hover:border-[#c5d3dc] hover:bg-[#f7faf9]',
  ghost:
    'bg-transparent text-[#5c6b7a] border border-transparent hover:bg-[#e4ebe8]/80 hover:text-[#1e2a3a]',
};

type ActionButtonBase = {
  variant?: Variant;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  size?: 'default' | 'sm';
};

type ActionButtonAsButton = ActionButtonBase & {
  href?: undefined;
  to?: undefined;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
};

type ActionButtonAsLink = ActionButtonBase & {
  href: string;
  external?: boolean;
  to?: undefined;
};

type ActionButtonAsRouter = ActionButtonBase & {
  to: string;
  href?: undefined;
};

export type ActionButtonProps = ActionButtonAsButton | ActionButtonAsLink | ActionButtonAsRouter;

function buttonClasses(variant: Variant, size: 'default' | 'sm', className?: string) {
  const sizeClass =
    size === 'sm'
      ? 'rounded-lg px-3 py-1.5 text-[12px] gap-1.5'
      : 'rounded-xl px-4 py-2 text-[13px] gap-2';
  return `inline-flex w-full items-center justify-center font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 sm:w-auto ${sizeClass} ${variantClass[variant]} ${className ?? ''}`;
}

export function ActionButton(props: ActionButtonProps) {
  const { variant = 'secondary', icon: Icon, children, className, size = 'default' } = props;
  const cls = buttonClasses(variant, size, className);

  if ('to' in props && props.to) {
    return (
      <Link to={props.to} className={cls}>
        {Icon && <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} />}
        {children}
      </Link>
    );
  }

  if ('href' in props && props.href) {
    const external = 'external' in props && props.external;
    return (
      <a
        href={props.href}
        className={cls}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} />}
        {children}
      </a>
    );
  }

  const btn = props as ActionButtonAsButton;
  return (
    <button
      type={btn.type ?? 'button'}
      onClick={btn.onClick}
      disabled={btn.disabled}
      className={cls}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} />}
      {children}
    </button>
  );
}
