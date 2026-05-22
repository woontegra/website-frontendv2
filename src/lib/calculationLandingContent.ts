import legacyByPath from '@/data/calculationPageLegacyContent.json';
import { resolvePublicModulePath } from '@/data/calculationModulePaths';
import type { ContentBundleView } from '@/lib/contentBundle';

export type LandingArticleSection = {
  heading: string;
  paragraphs: string[];
  listItems?: string[];
};

export type LandingModuleTypeCard = {
  title: string;
  description: string;
};

export type LandingProgramBenefit = {
  title: string;
  text: string;
};

export type ModuleLandingContent = {
  intro?: string;
  articleSections: LandingArticleSection[];
  moduleTypes?: {
    title: string;
    cards: LandingModuleTypeCard[];
  };
  programBenefits?: LandingProgramBenefit[];
};

const staticByPath = legacyByPath as Record<string, ModuleLandingContent>;

export function emptyLandingContent(): ModuleLandingContent {
  return { articleSections: [] };
}

export function parseLandingContent(raw: unknown): ModuleLandingContent | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const articleSections = Array.isArray(o.articleSections)
    ? o.articleSections
        .map((section) => {
          if (!section || typeof section !== 'object') return null;
          const s = section as Record<string, unknown>;
          const heading = typeof s.heading === 'string' ? s.heading.trim() : '';
          if (!heading) return null;
          const paragraphs = Array.isArray(s.paragraphs)
            ? s.paragraphs.filter((p): p is string => typeof p === 'string' && p.trim().length > 0).map((p) => p.trim())
            : [];
          const listItems = Array.isArray(s.listItems)
            ? s.listItems.filter((p): p is string => typeof p === 'string' && p.trim().length > 0).map((p) => p.trim())
            : undefined;
          return { heading, paragraphs, ...(listItems?.length ? { listItems } : {}) };
        })
        .filter((s): s is LandingArticleSection => s !== null)
    : [];

  const intro = typeof o.intro === 'string' ? o.intro.trim() : undefined;

  let moduleTypes: ModuleLandingContent['moduleTypes'];
  if (o.moduleTypes && typeof o.moduleTypes === 'object') {
    const mt = o.moduleTypes as Record<string, unknown>;
    const title = typeof mt.title === 'string' ? mt.title.trim() : 'Hesaplama türleri';
    const cards = Array.isArray(mt.cards)
      ? mt.cards
          .map((card) => {
            if (!card || typeof card !== 'object') return null;
            const c = card as Record<string, unknown>;
            const t = typeof c.title === 'string' ? c.title.trim() : '';
            const d = typeof c.description === 'string' ? c.description.trim() : '';
            if (!t) return null;
            return { title: t, description: d };
          })
          .filter((c): c is LandingModuleTypeCard => c !== null)
      : [];
    if (cards.length) moduleTypes = { title, cards };
  }

  let programBenefits: LandingProgramBenefit[] | undefined;
  if (Array.isArray(o.programBenefits)) {
    programBenefits = o.programBenefits
      .map((b) => {
        if (!b || typeof b !== 'object') return null;
        const row = b as Record<string, unknown>;
        const t = typeof row.title === 'string' ? row.title.trim() : '';
        const text = typeof row.text === 'string' ? row.text.trim() : '';
        if (!t) return null;
        return { title: t, text };
      })
      .filter((b): b is LandingProgramBenefit => b !== null);
  }

  if (!intro && !articleSections.length && !moduleTypes && !programBenefits?.length) {
    return null;
  }

  return {
    ...(intro ? { intro } : {}),
    articleSections,
    ...(moduleTypes ? { moduleTypes } : {}),
    ...(programBenefits?.length ? { programBenefits } : {}),
  };
}

export function hasLandingBody(content: ModuleLandingContent | null | undefined): boolean {
  if (!content) return false;
  return (
    Boolean(content.intro?.trim()) ||
    content.articleSections.length > 0 ||
    (content.moduleTypes?.cards.length ?? 0) > 0 ||
    (content.programBenefits?.length ?? 0) > 0
  );
}

export function getStaticLandingContent(pathname: string): ModuleLandingContent | undefined {
  const path = resolvePublicModulePath(pathname);
  return staticByPath[path];
}

export function resolveModuleLandingContent(
  pathname: string,
  content: ContentBundleView,
): ModuleLandingContent | undefined {
  const path = resolvePublicModulePath(pathname);
  const module = content.calculationLandings.find(
    (m) => resolvePublicModulePath(m.slug) === path,
  );
  const fromApi = module?.landingContent ? parseLandingContent(module.landingContent) : null;
  if (hasLandingBody(fromApi)) return fromApi!;
  const fallback = getStaticLandingContent(pathname);
  return fallback && hasLandingBody(fallback) ? fallback : fromApi ?? fallback;
}

/** Admin: makale bölümlerini düzenlenebilir metne çevir */
export function serializeArticleSections(sections: LandingArticleSection[]): string {
  if (!sections.length) return '';
  return sections
    .map((section) => {
      const lines = [`=== ${section.heading} ===`, ...section.paragraphs];
      if (section.listItems?.length) {
        lines.push('', ...section.listItems.map((item) => `* ${item}`));
      }
      return lines.join('\n');
    })
    .join('\n\n');
}

export function parseArticleSectionsText(text: string): LandingArticleSection[] {
  const blocks = text
    .split(/\n===\s*/)
    .map((b) => b.trim())
    .filter(Boolean);

  const sections: LandingArticleSection[] = [];

  for (let block of blocks) {
    if (block.startsWith('===')) block = block.replace(/^===\s*/, '');
    const lines = block.split('\n');
    const headingLine = lines[0]?.replace(/=+\s*$/, '').trim() ?? '';
    if (!headingLine) continue;

    const bodyLines = lines.slice(1);
    const paragraphs: string[] = [];
    const listItems: string[] = [];
    let paraBuffer: string[] = [];

    const flushPara = () => {
      const p = paraBuffer.join('\n').trim();
      if (p) paragraphs.push(p);
      paraBuffer = [];
    };

    for (const line of bodyLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('* ')) {
        flushPara();
        listItems.push(trimmed.slice(2).trim());
      } else if (!trimmed) {
        flushPara();
      } else {
        paraBuffer.push(trimmed);
      }
    }
    flushPara();

    sections.push({
      heading: headingLine,
      paragraphs,
      ...(listItems.length ? { listItems } : {}),
    });
  }

  return sections;
}

export function serializePipeLines(
  rows: { title: string; second: string }[],
  emptyHint: string,
): string {
  if (!rows.length) return emptyHint;
  return rows.map((r) => `${r.title}|${r.second}`).join('\n');
}

export function parsePipeLines(text: string, _mode: 'desc' | 'text'): { title: string; second: string }[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('#'))
    .map((line) => {
      const pipe = line.indexOf('|');
      if (pipe === -1) return { title: line, second: '' };
      return {
        title: line.slice(0, pipe).trim(),
        second: line.slice(pipe + 1).trim(),
      };
    })
    .filter((row) => row.title.length > 0);
}

export function landingContentFromDraft(draft: {
  landingIntro: string;
  articleSectionsText: string;
  moduleTypesTitle: string;
  moduleTypesCardsText: string;
  programBenefitsText: string;
}): ModuleLandingContent {
  const articleSections = parseArticleSectionsText(draft.articleSectionsText);
  const moduleCards = parsePipeLines(draft.moduleTypesCardsText, 'desc').map((r) => ({
    title: r.title,
    description: r.second,
  }));
  const programBenefits = parsePipeLines(draft.programBenefitsText, 'text').map((r) => ({
    title: r.title,
    text: r.second,
  }));

  const content: ModuleLandingContent = { articleSections };
  const intro = draft.landingIntro.trim();
  if (intro) content.intro = intro;
  if (moduleCards.length) {
    content.moduleTypes = {
      title: draft.moduleTypesTitle.trim() || 'Hesaplama türleri',
      cards: moduleCards,
    };
  }
  if (programBenefits.length) content.programBenefits = programBenefits;
  return content;
}

export function draftFieldsFromLandingContent(
  content: ModuleLandingContent | null | undefined,
): {
  landingIntro: string;
  articleSectionsText: string;
  moduleTypesTitle: string;
  moduleTypesCardsText: string;
  programBenefitsText: string;
} {
  const c = content ?? emptyLandingContent();
  return {
    landingIntro: c.intro ?? '',
    articleSectionsText: serializeArticleSections(c.articleSections),
    moduleTypesTitle: c.moduleTypes?.title ?? '',
    moduleTypesCardsText: serializePipeLines(
      (c.moduleTypes?.cards ?? []).map((card) => ({
        title: card.title,
        second: card.description,
      })),
      '# Her satır: Başlık|Açıklama',
    ),
    programBenefitsText: serializePipeLines(
      (c.programBenefits ?? []).map((b) => ({ title: b.title, second: b.text })),
      '# Her satır: Başlık|Metin',
    ),
  };
}
