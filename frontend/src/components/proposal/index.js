// Proposal Builder Components - Version 2.0 (Area/Component Architecture)

// Templates and configuration
export {
  TEMPLATES,
  COMPONENT_TYPES,
  COMPONENT_CATEGORIES,
  DEFAULT_GLOBAL_STYLES,
  DEFAULT_AREA_SETTINGS,
  getTemplateById,
  generateId,
  createArea,
  createComponent
} from './templates';

// Renderers
export { default as ProposalAreaRenderer } from './ProposalAreaRenderer';
export {
  renderProposalComponent,
  COMPONENT_RENDERERS,
  ProposalHeaderComponent,
  ProposalTitleComponent,
  RecipientCardComponent,
  RecipientInlineComponent,
  HeadingComponent,
  ParagraphComponent,
  IntroMessageComponent,
  ValuePropositionComponent,
  ItemsTableComponent,
  ItemsListComponent,
  PricingSummaryComponent,
  TotalHighlightComponent,
  TermsConditionsComponent,
  ValidityInfoComponent,
  PaymentTermsComponent,
  CtaAcceptComponent,
  ContactCtaComponent,
  DividerComponent,
  SpacerComponent,
  ImageComponent
} from './ProposalComponentRenderer';
