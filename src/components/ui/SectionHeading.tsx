type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  theme?: 'light' | 'dark' | 'muted';
};

const themeStyles = {
  light: {
    eyebrow: 'text-sky-700',
    title: 'text-slate-900',
    description: 'text-slate-600',
  },
  dark: {
    eyebrow: 'text-emerald-400',
    title: 'text-white',
    description: 'text-slate-200',
  },
  muted: {
    eyebrow: 'text-sky-800',
    title: 'text-slate-900',
    description: 'text-slate-700',
  },
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  theme = 'light',
}: SectionHeadingProps) {
  const styles = themeStyles[theme];
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <div className={`max-w-3xl ${alignClass}`}>
      {eyebrow && (
        <p
          className={`mb-3 text-xs font-bold uppercase tracking-[0.14em] ${styles.eyebrow}`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl ${styles.title}`}
      >
        {title}
      </h2>
      {description && (
        <p className={`mt-4 text-base leading-relaxed sm:text-lg ${styles.description}`}>
          {description}
        </p>
      )}
    </div>
  );
}
