import { Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingCTA from "@/components/layout/FloatingCTA";
import { lazy, Suspense, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuoteCartProvider } from "@/contexts/QuoteCartContext";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { GrokWidget } from "@/components/GrokWidget";
import { QuoteCartDrawer } from "@/components/QuoteCartDrawer";
import { GROK_ASSISTANT_ENABLED } from "@/config/featureFlags";
import { trackEvent, trackPhoneClick } from "@/lib/analytics";

const Home = lazy(() => import("@/pages/Home"));
const Pickup = lazy(() => import("@/pages/Pickup"));
const Products = lazy(() => import("@/pages/Products"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const MulchDetail = lazy(() => import("@/pages/MulchDetail"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const CreditApplication = lazy(() => import("@/pages/CreditApplication"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Order = lazy(() => import("@/pages/Order"));
const SpecialRequest = lazy(() => import("@/pages/SpecialRequest"));
const Landscapers = lazy(() => import("@/pages/Landscapers"));
const Distributors = lazy(() => import("@/pages/Distributors"));
const Nurseries = lazy(() => import("@/pages/Nurseries"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const StoreLocatorEnhanced = lazy(() => import("@/pages/StoreLocatorEnhanced"));
const YardMap = lazy(() => import("@/pages/YardMap"));
const PayAndPickup = lazy(() => import("@/pages/PayAndPickup"));
const PublicOperationsCalendar = lazy(() => import("@/pages/PublicOperationsCalendar"));
const Classes = lazy(() => import("@/pages/Classes"));
const TriviaGame = lazy(() => import("@/pages/TriviaGame"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const OrderConfirmation = lazy(() => import("@/pages/OrderConfirmation"));
const DriveThruAdmin = lazy(() => import("@/pages/DriveThruAdmin"));
const SignIn = lazy(() => import("@/pages/SignIn"));
const SignUp = lazy(() => import("@/pages/SignUp"));
const SignUpSuccess = lazy(() => import("@/pages/SignUpSuccess"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const GrokAssistant = lazy(() => import("@/pages/GrokAssistant"));
const VideoDemo = lazy(() => import("@/pages/VideoDemo"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Unsubscribe = lazy(() => import("@/pages/Unsubscribe"));

// Admin Pages
const Register = lazy(() => import("@/pages/Register"));
const AdminLogin = lazy(() => import("@/pages/admin/Login"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/Products"));
const AdminProductDetail = lazy(() => import("@/pages/admin/ProductDetail"));
const AdminOrders = lazy(() => import("@/pages/admin/Orders"));
const AdminCustomers = lazy(() => import("@/pages/admin/Customers"));
const AdminInventory = lazy(() => import("@/pages/admin/Inventory"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminNotifications = lazy(() => import("@/pages/admin/AdminNotifications"));
const AdminRepresentatives = lazy(() => import("@/pages/admin/Representatives"));
const AdminRepresentativeContacts = lazy(() => import("@/pages/admin/RepresentativeContacts"));
const AdminOperations = lazy(() => import("@/pages/admin/Operations"));
const AdminCreateBOL = lazy(() => import("@/pages/admin/CreateBOL"));
const AdminEditBOL = lazy(() => import("@/pages/admin/EditBOL"));
const AdminViewBOL = lazy(() => import("@/pages/admin/ViewBOL"));
const AdminOperationsOrders = lazy(() => import("@/pages/admin/OperationsOrders"));
const AdminWorkOrders = lazy(() => import("@/pages/admin/WorkOrders"));
const AdminCreateWorkOrder = lazy(() => import("@/pages/admin/CreateWorkOrder"));
const AdminViewWorkOrder = lazy(() => import("@/pages/admin/ViewWorkOrder"));
const AdminOperationsCalendar = lazy(() => import("@/pages/admin/OperationsCalendar"));
const AdminOperationsResources = lazy(() => import("@/pages/admin/OperationsResources"));
const AdminCODs = lazy(() => import("@/pages/admin/CODs"));
const AdminCreateCOD = lazy(() => import("@/pages/admin/CreateCOD"));
const AdminViewCOD = lazy(() => import("@/pages/admin/ViewCOD"));
const AdminOperationsSettings = lazy(() => import("@/pages/admin/OperationsSettings"));
const AdminTaskBoard = lazy(() => import("@/pages/admin/TaskBoard"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AcceptInvitation = lazy(() => import("@/pages/admin/AcceptInvitation"));
const RepresentativeLanding = lazy(() => import("@/pages/RepresentativeLanding"));
const CRMCapture = lazy(() => import("@/pages/CRMCapture"));
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const ProtectedAdminRoute = lazy(() => import("@/components/admin/ProtectedAdminRoute"));

// ScrollToTop component to handle auto-scrolling
const ScrollToTop = () => {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [location]);

  return null;
};

function Router() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">Loading...</div>}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/pickup" component={Pickup} />
        <Route path="/products/mulch/:id" component={MulchDetail} />
        <Route path="/products/:slug" component={ProductDetail} />
        <Route path="/products" component={Products} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/credit-application" component={CreditApplication} />
        <Route path="/apply" component={CreditApplication} />
        <Route path="/account-form" component={CreditApplication} />
        <Route path="/faq" component={FAQ} />
        <Route path="/order" component={Order} />
        <Route path="/special-request" component={SpecialRequest} />
        <Route path="/landscapers" component={Landscapers} />
        <Route path="/distributors" component={Distributors} />
        <Route path="/wholesale" component={Distributors} />
        <Route path="/nurseries" component={Nurseries} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/store-locator" component={StoreLocatorEnhanced} />
        <Route path="/yard-map" component={YardMap} />
        <Route path="/pay-and-pickup/:step?" component={PayAndPickup} />
        <Route path="/drive-through/:step?" component={PayAndPickup} />
        <Route path="/qr" component={PayAndPickup} />
        <Route path="/check-in" component={PayAndPickup} />
        <Route path="/operations-calendar" component={PublicOperationsCalendar} />
        <Route path="/classes" component={Classes} />
        <Route path="/trivia" component={TriviaGame} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/drive-thru/admin" component={DriveThruAdmin} />
        <Route path="/order-confirmation" component={OrderConfirmation} />
        {GROK_ASSISTANT_ENABLED && <Route path="/grok" component={GrokAssistant} />}
        <Route path="/video-demo" component={VideoDemo} />
        <Route path="/rep/:slug" component={RepresentativeLanding} />
        {/* CRM routes: /crm/:org/:user or /crm/:org */}
        <Route path="/crm/ssw/:user" component={CRMCapture} />
        <Route path="/crm/ufe/:user" component={CRMCapture} />
        <Route path="/crm/ssw" component={CRMCapture} />
        <Route path="/crm/ufe" component={CRMCapture} />
        <Route path="/unsubscribe" component={Unsubscribe} />

        {/* Customer Auth Routes */}
        <Route path="/signin" component={SignIn} />
        <Route path="/signup" component={SignUp} />
        <Route path="/signup-success" component={SignUpSuccess} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password/:token" component={ResetPassword} />
        <Route path="/verify-email/:token" component={VerifyEmail} />

        {/* Admin Routes */}
        <Route path="/register" component={Register} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/invite/:token" component={AcceptInvitation} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/products/:productId" component={AdminProductDetail} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route path="/admin/customers" component={AdminCustomers} />
        <Route path="/admin/inventory" component={AdminInventory} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin/notifications" component={AdminNotifications} />
        <Route path="/admin/representatives" component={AdminRepresentatives} />
        <Route path="/admin/representative-contacts" component={AdminRepresentativeContacts} />
        <Route path="/admin/operations/bols/new" component={AdminCreateBOL} />
        <Route path="/admin/operations/bols/:id/edit" component={AdminEditBOL} />
        <Route path="/admin/operations/bols/:id" component={AdminViewBOL} />
        <Route path="/admin/operations/orders" component={AdminOperationsOrders} />
        <Route path="/admin/operations/work-orders/new" component={AdminCreateWorkOrder} />
        <Route path="/admin/operations/work-orders/:id" component={AdminViewWorkOrder} />
        <Route path="/admin/operations/work-orders" component={AdminWorkOrders} />
        <Route path="/admin/operations/calendar" component={AdminOperationsCalendar} />
        <Route path="/admin/operations/settings" component={AdminOperationsSettings} />
        <Route path="/admin/operations/tasks" component={AdminTaskBoard} />
        <Route path="/admin/operations/resources" component={AdminOperationsResources} />
        <Route path="/admin/operations/cods/new" component={AdminCreateCOD} />
        <Route path="/admin/operations/cods/:id" component={AdminViewCOD} />
        <Route path="/admin/operations/cods" component={AdminCODs} />
        <Route path="/admin/operations" component={AdminOperations} />
        <Route path="/admin/settings" component={AdminSettings} />

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const [location] = useLocation();
  // /qr is the printed-signage URL at the OSW yard main entrance — no global chrome.
  const isPayAndPickup =
    location.startsWith("/pay-and-pickup") ||
    location.startsWith("/drive-through") ||
    location === "/qr" ||
    location.startsWith("/qr/") ||
    location === "/check-in";
  const isTriviaGame = location.startsWith("/trivia");
  const isCheckoutFlow = location.startsWith("/checkout") || location.startsWith("/order-confirmation") || location.startsWith("/quick-order");
  const isQuoteFlow = location.startsWith("/order");
  const isProductFlow = location.startsWith("/products");
  const isDriveThruAdmin = location.startsWith("/drive-thru/admin");
  const isAdminPanel = location.startsWith("/admin");
  const isRepresentativeLanding = location.startsWith("/rep/");
  const isCRMCapture = location.startsWith("/crm");
  const isUnsubscribe = location.startsWith("/unsubscribe");
  const isOperationsCalendar = location.startsWith("/operations-calendar");
  const showStandardLayout = !isPayAndPickup && !isTriviaGame && !isCheckoutFlow && !isDriveThruAdmin && !isAdminPanel && !isRepresentativeLanding && !isCRMCapture && !isUnsubscribe && !isOperationsCalendar;

  useEffect(() => {
    trackEvent("Route Viewed", {
      path: location,
      area: isCheckoutFlow
        ? "checkout"
        : isPayAndPickup
          ? "yard_qr"
          : isProductFlow
            ? "products"
            : isAdminPanel
              ? "admin"
              : "marketing",
    });
  }, [isAdminPanel, isCheckoutFlow, isPayAndPickup, isProductFlow, location]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a[href^="tel:"]') : null;
      if (!target) return;
      const href = target.getAttribute("href") || "";
      trackPhoneClick({ location, phone_href: href });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [location]);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <AuthProvider>
            <QuoteCartProvider>
              <AdminAuthProvider>
                <TooltipProvider>
                  <div className="min-h-screen flex flex-col">
                    {showStandardLayout && <Header />}
                    <main className="flex-grow" style={showStandardLayout ? { paddingTop: "var(--app-header-height, 6.5rem)" } : undefined}>
                      <Router />
                    </main>
                    {showStandardLayout && <Footer />}
                    <Toaster />
                    <ScrollToTop />
                    <Analytics />
                    {showStandardLayout && !isQuoteFlow && !isProductFlow && <FloatingCTA />}
                    {showStandardLayout && <QuoteCartDrawer />}
                    {GROK_ASSISTANT_ENABLED && <GrokWidget />}
                  </div>
                </TooltipProvider>
              </AdminAuthProvider>
            </QuoteCartProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
