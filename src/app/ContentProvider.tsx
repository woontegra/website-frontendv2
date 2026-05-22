import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getContentBundleWithFallback,
  getStaticContentBundle,
  type ContentBundleView,
} from '@/lib/contentBundle';

type ContentContextValue = {
  content: ContentBundleView;
  source: 'api' | 'static';
};

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ContentBundleView>(getStaticContentBundle);
  const [source, setSource] = useState<'api' | 'static'>('static');

  useEffect(() => {
    let cancelled = false;

    getContentBundleWithFallback().then((result) => {
      if (cancelled) return;
      setContent(result.data);
      setSource(result.source);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ content, source }), [content, source]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContentBundle(): ContentContextValue {
  const ctx = useContext(ContentContext);
  if (!ctx) {
    return { content: getStaticContentBundle(), source: 'static' };
  }
  return ctx;
}
