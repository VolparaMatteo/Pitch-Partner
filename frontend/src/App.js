import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminProfile from './pages/AdminProfile';
import AdminLeadListPage from './pages/AdminLeadListPage';
import AdminLeadDetail from './pages/AdminLeadDetail';
import AdminLeadForm from './pages/AdminLeadForm';
import AdminClubListPage from './pages/AdminClubListPage';
import AdminClubDetail from './pages/AdminClubDetail';
import AdminClubForm from './pages/AdminClubForm';
import ClubLogin from './pages/ClubLogin';
import ClubDashboard from './pages/ClubDashboard';
import ClubAnalytics from './pages/ClubAnalytics';
import ClubProfile from './pages/ClubProfile';
import SponsorLogin from './pages/SponsorLogin';
import SponsorDashboard from './pages/SponsorDashboard';
import SponsorAnalytics from './pages/SponsorAnalytics';
import SponsorOpportunities from './pages/SponsorOpportunities';
import SponsorClubs from './pages/SponsorClubs';
import ContractDetail from './pages/ContractDetail';
import ContractForm from './pages/ContractForm';
import SponsorForm from './pages/SponsorForm';
import SponsorDetail from './pages/SponsorDetail';
import SponsorListPage from './pages/SponsorListPage';
import SponsorActivityForm from './pages/SponsorActivityForm';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import MatchCalendar from './pages/MatchCalendar';
import MatchDetail from './pages/MatchDetail';
import MatchForm from './pages/MatchForm';
import EventsCalendar from './pages/EventsCalendar';
import CreateEvent from './pages/CreateEvent';
import EventDetail from './pages/EventDetail';
import PublicEventRegistration from './pages/PublicEventRegistration';
import BusinessBoxes from './pages/BusinessBoxes';
import BusinessBoxForm from './pages/BusinessBoxForm';
import BoxInvites from './pages/BoxInvites';
import SponsorNetwork from './pages/SponsorNetwork';
import SponsorProfile from './pages/SponsorProfile';
import SponsorProfileDetail from './pages/SponsorProfileDetail';
import SponsorMessages from './pages/SponsorMessages';
import Partnerships from './pages/Partnerships';
import PressFeed from './pages/PressFeed';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import BestPracticeCalendar from './pages/BestPracticeCalendar';
import BestPracticeEventDetail from './pages/BestPracticeEventDetail';
import Resources from './pages/Resources';
import ResourceDetail from './pages/ResourceDetail';
import ResourcePreview from './pages/ResourcePreview';
import MyLibrary from './pages/MyLibrary';
import ClubProjects from './pages/ClubProjects';
import ClubProjectDetail from './pages/ClubProjectDetail';
import ClubProjectForm from './pages/ClubProjectForm';
import SponsorProjects from './pages/SponsorProjects';
import SponsorProjectTimeline from './pages/SponsorProjectTimeline';
import NotificationsCenter from './pages/NotificationsCenter';
import ClubBudgets from './pages/ClubBudgets';
import ClubBudgetDetail from './pages/ClubBudgetDetail';
import SponsorBudgets from './pages/SponsorBudgets';
import SponsorBudgetDetail from './pages/SponsorBudgetDetail';
import SponsorMarketplace from './pages/SponsorMarketplace';
import MarketplaceOpportunityDetail from './pages/MarketplaceOpportunityDetail';
import CreateOpportunity from './pages/CreateOpportunity';
import ManageOpportunity from './pages/ManageOpportunity';
import ClubMarketplace from './pages/ClubMarketplace';
import ClubCreateOpportunity from './pages/ClubCreateOpportunity';
import ClubManageOpportunity from './pages/ClubManageOpportunity';
import ContractListPage from './pages/ContractListPage';
import SponsorContractList from './pages/SponsorContractList';
import Pitchy from './pages/Pitchy';
import Automations from './pages/Automations';
import AutomationBuilder from './pages/AutomationBuilder';
import Documentazione from './pages/Documentazione';
import Docs from './pages/Docs';
import FAQ from './pages/FAQ';
import CentroAssistenza from './pages/CentroAssistenza';
// Lead Management
import LeadListPage from './pages/LeadListPage';
import LeadDetail from './pages/LeadDetail';
import LeadForm from './pages/LeadForm';
import LeadScoreConfig from './pages/LeadScoreConfig';
// Inventory Management
import InventoryCatalog from './pages/InventoryCatalog';
import InventoryAssetForm from './pages/InventoryAssetForm';
import AssetDetail from './pages/AssetDetail';
import PackageDetail from './pages/PackageDetail';
import PackageForm from './pages/PackageForm';
import InventoryPackages from './pages/InventoryPackages';
import InventoryCalendar from './pages/InventoryCalendar';
import InventoryAllocations from './pages/InventoryAllocations';
import InventoryExclusivities from './pages/InventoryExclusivities';
import AssetCompare from './pages/AssetCompare';
// Rights Management
import RightsCatalog from './pages/RightsCatalog';
import RightDetail from './pages/RightDetail';
import RightForm from './pages/RightForm';
import RightsCalendar from './pages/RightsCalendar';
import RightsConflicts from './pages/RightsConflicts';
// CRM Calendar
import CRMCalendar from './pages/CRMCalendar';
// Proposal Builder
import ProposalList from './pages/ProposalList';
import ProposalBuilder from './pages/ProposalBuilder';
import ProposalDetail from './pages/ProposalDetail';
import ProposalPreview from './pages/ProposalPreview';
import ProposalTemplates from './pages/ProposalTemplates';
import PublicProposal from './pages/PublicProposal';
import BrandSettings from './pages/BrandSettings';
// Catalog Routes
import CatalogList from './pages/CatalogList';
import CatalogBuilder from './pages/CatalogBuilder';
import PublicCatalog from './pages/PublicCatalog';
// Sponsor Invitation
import SponsorJoin from './pages/SponsorJoin';
// Club Activation
import ClubActivation from './pages/ClubActivation';
// New Sponsor Pages
import SponsorActivations from './pages/SponsorActivations';
import SponsorEvents from './pages/SponsorEvents';
import SponsorDrive from './pages/SponsorDrive';
import SponsorTasks from './pages/SponsorTasks';

import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';

function App() {
        return (
                <Router>
                        <ScrollToTop />
                        <Layout>
                                <Routes>
                                        {/* Admin Routes */}
                                        <Route path="/" element={<AdminLogin />} />
                                        <Route path="/admin/login" element={<AdminLogin />} />
                                        <Route path="/admin/dashboard" element={<Navigate to="/admin/leads" replace />} />
                                        <Route path="/admin/profile" element={<AdminProfile />} />
                                        <Route path="/admin/leads" element={<AdminLeadListPage />} />
                                        <Route path="/admin/leads/new" element={<AdminLeadForm />} />
                                        <Route path="/admin/leads/:leadId" element={<AdminLeadDetail />} />
                                        <Route path="/admin/leads/:leadId/edit" element={<AdminLeadForm />} />

                                        {/* Admin Club Management */}
                                        <Route path="/admin/clubs" element={<AdminClubListPage />} />
                                        <Route path="/admin/clubs/new" element={<AdminClubForm />} />
                                        <Route path="/admin/clubs/:clubId" element={<AdminClubDetail />} />
                                        <Route path="/admin/clubs/:clubId/edit" element={<AdminClubForm />} />

                                        {/* Club Routes */}
                                        <Route path="/club/login" element={<ClubLogin />} />
                                        <Route path="/club/dashboard" element={<ClubDashboard />} />
                                        <Route path="/club/analytics" element={<ClubAnalytics />} />
                                        <Route path="/club/profile" element={<ClubProfile />} />
                                        <Route path="/club/sponsors" element={<SponsorListPage />} />
                                        <Route path="/club/sponsors/new" element={<SponsorForm />} />
                                        <Route path="/club/sponsors/:id" element={<SponsorDetail />} />
                                        <Route path="/club/sponsors/:id/edit" element={<SponsorForm />} />
                                        <Route path="/club/sponsors/:sponsorId/activities/new" element={<SponsorActivityForm />} />
                                        <Route path="/club/sponsors/:sponsorId/activities/:activityId/edit" element={<SponsorActivityForm />} />
                                        {/* CRM Calendar */}
                                        <Route path="/club/calendar" element={<CRMCalendar />} />
                                        {/* Lead Management Routes */}
                                        <Route path="/club/leads" element={<LeadListPage />} />
                                        <Route path="/club/leads/new" element={<LeadForm />} />
                                        <Route path="/club/leads/settings" element={<LeadScoreConfig />} />
                                        <Route path="/club/leads/:leadId" element={<LeadDetail />} />
                                        <Route path="/club/leads/:leadId/edit" element={<LeadForm />} />
                                        {/* Automations */}
                                        <Route path="/club/automations" element={<Automations />} />
                                        <Route path="/club/automations/new" element={<AutomationBuilder />} />
                                        <Route path="/club/automations/:id" element={<AutomationBuilder />} />
                                        <Route path="/club/automations/:id/edit" element={<AutomationBuilder />} />
                                        <Route path="/club/contracts" element={<ContractListPage />} />
                                        <Route path="/club/contracts/new" element={<ContractForm />} />
                                        <Route path="/club/contracts/:id" element={<ContractDetail />} />
                                        <Route path="/club/contracts/:id/edit" element={<ContractForm />} />
                                        <Route path="/club/projects" element={<ClubProjects />} />
                                        <Route path="/club/projects/new" element={<ClubProjectForm />} />
                                        <Route path="/club/projects/:id" element={<ClubProjectDetail />} />
                                        <Route path="/club/budgets" element={<ClubBudgets />} />
                                        <Route path="/club/budgets/:id" element={<ClubBudgetDetail />} />
                                        <Route path="/club/marketplace" element={<ClubMarketplace />} />
                                        <Route path="/club/marketplace/create" element={<ClubCreateOpportunity />} />
                                        <Route path="/club/marketplace/opportunities/:id" element={<MarketplaceOpportunityDetail />} />
                                        <Route path="/club/marketplace/manage/:id" element={<ClubManageOpportunity />} />
                                        <Route path="/club/business-boxes" element={<BusinessBoxes />} />
                                        <Route path="/club/business-boxes/new" element={<BusinessBoxForm />} />
                                        <Route path="/club/business-boxes/:id" element={<BusinessBoxForm />} />
                                        <Route path="/club/business-boxes/:id/invites" element={<BoxInvites />} />
                                        <Route path="/club/press-area" element={<PressFeed />} />
                                        {/* Inventory Management Routes */}
                                        <Route path="/club/inventory" element={<InventoryCatalog />} />
                                        <Route path="/club/inventory/assets/new" element={<InventoryAssetForm />} />
                                        <Route path="/club/inventory/assets/:id" element={<AssetDetail />} />
                                        <Route path="/club/inventory/assets/:id/edit" element={<InventoryAssetForm />} />
                                        <Route path="/club/inventory/packages" element={<InventoryPackages />} />
                                        <Route path="/club/inventory/packages/new" element={<PackageForm />} />
                                        <Route path="/club/inventory/packages/:id" element={<PackageDetail />} />
                                        <Route path="/club/inventory/packages/:id/edit" element={<PackageForm />} />
                                        <Route path="/club/inventory/calendar" element={<InventoryCalendar />} />
                                        <Route path="/club/inventory/allocations" element={<InventoryAllocations />} />
                                        <Route path="/club/inventory/exclusivities" element={<InventoryExclusivities />} />
                                        <Route path="/club/inventory/compare" element={<AssetCompare />} />
                                        {/* Rights Management Routes */}
                                        <Route path="/club/rights" element={<RightsCatalog />} />
                                        <Route path="/club/rights/new" element={<RightForm />} />
                                        <Route path="/club/rights/calendar" element={<RightsCalendar />} />
                                        <Route path="/club/rights/conflicts" element={<RightsConflicts />} />
                                        <Route path="/club/rights/:id" element={<RightDetail />} />
                                        <Route path="/club/rights/:id/edit" element={<RightForm />} />
                                        {/* Proposal Builder Routes */}
                                        <Route path="/club/proposals" element={<ProposalList />} />
                                        <Route path="/club/proposals/new" element={<ProposalBuilder />} />
                                        <Route path="/club/proposals/templates" element={<ProposalTemplates />} />
                                        <Route path="/club/proposals/brand" element={<BrandSettings />} />
                                        <Route path="/club/proposals/:id" element={<ProposalDetail />} />
                                        <Route path="/club/proposals/:id/edit" element={<ProposalBuilder />} />
                                        <Route path="/club/proposals/:id/preview" element={<ProposalPreview />} />
                                        {/* Catalog Routes */}
                                        <Route path="/club/catalogs" element={<CatalogList />} />
                                        <Route path="/club/catalogs/new" element={<CatalogBuilder />} />
                                        <Route path="/club/catalogs/:id" element={<CatalogBuilder />} />

                                        {/* Sponsor Routes */}
                                        <Route path="/sponsor/login" element={<SponsorLogin />} />
                                        <Route path="/sponsor/dashboard" element={<SponsorDashboard />} />
                                        <Route path="/sponsor/analytics" element={<SponsorAnalytics />} />
                                        <Route path="/sponsor/profile" element={<SponsorProfile />} />
                                        <Route path="/sponsor/opportunities" element={<SponsorOpportunities />} />
                                        <Route path="/sponsor/clubs" element={<SponsorClubs />} />
                                        <Route path="/sponsor/contracts" element={<SponsorContractList />} />
                                        <Route path="/sponsor/contracts/:id" element={<ContractDetail />} />
                                        <Route path="/sponsor/projects" element={<SponsorProjects />} />
                                        <Route path="/sponsor/projects/:id" element={<SponsorProjectTimeline />} />
                                        <Route path="/sponsor/budgets" element={<SponsorBudgets />} />
                                        <Route path="/sponsor/budgets/:id" element={<SponsorBudgetDetail />} />
                                        <Route path="/sponsor/marketplace" element={<SponsorMarketplace />} />
                                        <Route path="/sponsor/marketplace/create" element={<CreateOpportunity />} />
                                        <Route path="/sponsor/marketplace/opportunities/:id" element={<MarketplaceOpportunityDetail />} />
                                        <Route path="/sponsor/marketplace/manage/:id" element={<ManageOpportunity />} />
                                        <Route path="/sponsor/activations" element={<SponsorActivations />} />
                                        <Route path="/sponsor/events" element={<SponsorEvents />} />
                                        <Route path="/sponsor/drive" element={<SponsorDrive />} />
                                        <Route path="/sponsor/tasks" element={<SponsorTasks />} />
                                        <Route path="/sponsor-network" element={<SponsorNetwork />} />
                                        <Route path="/sponsor-network/profile/:id" element={<SponsorProfileDetail />} />
                                        <Route path="/sponsor-messages" element={<SponsorMessages />} />
                                        <Route path="/partnerships" element={<Partnerships />} />

                                        {/* Shared Routes */}
                                        <Route path="/messages" element={<Messages />} />
                                        <Route path="/notifications" element={<NotificationsCenter />} />
                                        <Route path="/pitchy" element={<Pitchy />} />
                                        <Route path="/matches" element={<MatchCalendar />} />
                                        <Route path="/matches/new" element={<MatchForm />} />
                                        <Route path="/matches/:id" element={<MatchDetail />} />
                                        <Route path="/matches/:id/edit" element={<MatchForm />} />
                                        <Route path="/events" element={<EventsCalendar />} />
                                        <Route path="/events/new" element={<CreateEvent />} />
                                        <Route path="/events/:id" element={<EventDetail />} />
                                        <Route path="/events/:id/edit" element={<CreateEvent />} />
                                        <Route path="/events/:id/register" element={<PublicEventRegistration />} />
                                        <Route path="/resources" element={<Resources />} />
                                        <Route path="/resources/:id" element={<ResourceDetail />} />
                                        <Route path="/resources/:id/preview" element={<ResourcePreview />} />
                                        <Route path="/my-library" element={<MyLibrary />} />
                                        <Route path="/best-practice-events" element={<BestPracticeCalendar />} />
                                        <Route path="/best-practice-events/:id" element={<BestPracticeEventDetail />} />

                                        {/* Admin Specific Routes - TODO: da ricostruire */}

                                        {/* Public Pages */}
                                        <Route path="/p/:link" element={<PublicProposal />} />
                                        <Route path="/catalog/:token" element={<PublicCatalog />} />
                                        <Route path="/join/sponsor/:token" element={<SponsorJoin />} />
                                        <Route path="/activate/:token" element={<ClubActivation />} />
                                        <Route path="/documentazione" element={<Documentazione />} />
                                        <Route path="/docs" element={<Docs />} />
                                        <Route path="/faq" element={<FAQ />} />
                                        <Route path="/centro-assistenza" element={<CentroAssistenza />} />

                                        {/* Fallback */}
                                        <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                        </Layout>
                </Router>
        );


}

export default App;
