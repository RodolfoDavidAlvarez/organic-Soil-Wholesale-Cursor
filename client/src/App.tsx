import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from 'react-helmet-async';
import NotFound from "@/pages/not-found";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingCTA from "@/components/layout/FloatingCTA";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import MulchDetail from "@/pages/MulchDetail";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import Order from "@/pages/Order";
import SpecialRequest from "@/pages/SpecialRequest";
import Landscapers from "@/pages/Landscapers";
import Wholesale from "@/pages/Wholesale";
import WhyOrganic from "@/pages/WhyOrganic";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import StoreLocator from "@/pages/StoreLocator";
import StoreLocatorMapbox from "@/pages/StoreLocatorMapbox";
import StoreLocatorWithRouting from "@/pages/StoreLocatorWithRouting";
import StoreLocatorEnhanced from "@/pages/StoreLocatorEnhanced";
import QRLanding from "@/pages/QRLanding";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";

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
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/products/mulch/:id" component={MulchDetail} />
      <Route path="/products/:slug" component={ProductDetail} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/faq" component={FAQ} />
      <Route path="/order" component={Order} />
      <Route path="/special-request" component={SpecialRequest} />
      <Route path="/landscapers" component={Landscapers} />
      <Route path="/wholesale" component={Wholesale} />
      <Route path="/why-organic" component={WhyOrganic} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/store-locator" component={StoreLocatorEnhanced} />
      <Route path="/qr" component={QRLanding} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation" component={OrderConfirmation} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isQRLanding = location === '/qr';
  const isCheckoutFlow = location === '/checkout' || location === '/order-confirmation';

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <TooltipProvider>
            <div className="min-h-screen flex flex-col">
              {!isQRLanding && !isCheckoutFlow && <Header />}
              <main className={`flex-grow ${!isQRLanding && !isCheckoutFlow ? 'pt-20' : ''}`}>
                <Router />
              </main>
              {!isQRLanding && !isCheckoutFlow && <Footer />}
              <Toaster />
              <ScrollToTop />
              <Analytics />
              {!isQRLanding && !isCheckoutFlow && <FloatingCTA />}
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
