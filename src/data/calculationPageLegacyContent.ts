export type {
  LandingArticleSection as LegacyArticleSection,
  LandingModuleTypeCard as LegacyModuleTypeCard,
  LandingProgramBenefit as LegacyProgramBenefit,
  ModuleLandingContent as CalculationPageLegacyContent,
} from '@/lib/calculationLandingContent';

export {
  getStaticLandingContent as getCalculationPageLegacyContent,
  hasLandingBody as hasLegacyArticleContent,
} from '@/lib/calculationLandingContent';