// Catalog Builder Components - Version 2.0 (Area/Component Architecture)

// Templates and configuration
export {
  TEMPLATES,
  COMPONENT_TYPES,
  DEFAULT_GLOBAL_STYLES,
  DEFAULT_AREA_SETTINGS,
  getTemplateById,
  generateId,
  createArea,
  createComponent
} from './templates';

// Renderers
export { default as AreaRenderer } from './AreaRenderer';
export {
  renderComponent,
  COMPONENT_RENDERERS,
  HeadingComponent,
  ParagraphComponent,
  ButtonComponent,
  ImageComponent,
  LogoComponent,
  VideoComponent,
  SpacerComponent,
  DividerComponent,
  ContactInfoComponent,
  SocialLinksComponent,
  StatsComponent,
  AssetGridComponent,
  AssetCarouselComponent
} from './ComponentRenderer';

// Legacy exports for backward compatibility (if sections are still used)
export * from './sections';
