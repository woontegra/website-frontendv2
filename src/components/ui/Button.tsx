import { Link } from 'react-router-dom';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'outline'
  | 'outlineLight'
  | 'ghost'
  | 'ghostLight';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-sky-600 text-white hover:bg-sky-700 shadow-md shadow-sky-900/20 border border-sky-700 font-semibold',
  secondary:
    'bg-slate-800 text-white hover:bg-slate-700 shadow-md border border-slate-600 font-semibold',
  accent:
    'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-900/30 border border-emerald-600 font-semibold',
  outline:
    'bg-white text-slate-900 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-sm font-semibold',
  outlineLight:
    'bg-white text-slate-900 border-2 border-white hover:bg-slate-100 shadow-lg font-semibold',
  ghost:
    'bg-transparent text-slate-800 hover:bg-slate-100 border border-transparent font-medium',
  ghostLight:
    'bg-slate-800/60 text-white border-2 border-slate-500 hover:bg-slate-700 hover:border-slate-400 font-semibold',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined };

type LinkButtonProps = BaseProps & {
  to: string;
  external?: boolean;
  /** `external` true iken varsayılan `_blank`; site içi tam URL’lerde `_self` kullanılabilir. */
  externalTarget?: '_blank' | '_self';
};

export function Button(props: ButtonProps | LinkButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    className = '',
    children,
    ...rest
  } = props;
  const to = 'to' in props ? props.to : undefined;
  const external =
    'to' in props && 'external' in props ? (props as LinkButtonProps).external : undefined;
  const externalTarget: '_blank' | '_self' | undefined =
    'to' in props && 'externalTarget' in props
      ? (props as LinkButtonProps).externalTarget
      : undefined;
  const classes = `inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (to) {
    if (external) {
      const tab = externalTarget ?? '_blank';
      return (
        <a
          href={to}
          className={classes}
          {...(tab === '_blank'
            ? { target: '_blank' as const, rel: 'noopener noreferrer' as const }
            : {})}
        >
          {children}
        </a>
      );
    }
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  const { type = 'button', ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button type={type} className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
