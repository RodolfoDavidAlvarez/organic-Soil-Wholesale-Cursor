import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ShoppingCart, ChevronDown, Phone, User, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useQuoteCart } from "@/contexts/QuoteCartContext";
import { GROK_ASSISTANT_ENABLED } from "@/config/featureFlags";
import { CUSTOMER_SUPPORT_PHONE_DISPLAY, CUSTOMER_SUPPORT_PHONE_TEL } from "@/config/contact";
import { isCallTrackingExcludedPath } from "@/lib/callTracking";
import DealList, { DealRowContent, PROMO_BUNDLES } from "@/components/DealList";

const MENU_PRODUCTS = [
  { name: "PlantPal", type: "All-Stage Potting Mix", path: "/products/plantpal" },
  { name: "Mikey's Worm Poop", type: "Worm Castings", path: "/products/mikeys-worm-poop" },
  { name: "Simon's Gold", type: "Dairy Compost", path: "/products/simons-gold" },
  { name: "Nature's Blanket Premium", type: "Premium Dark Mulch", path: "/products/natures-blanket-premium" },
];

const MORE_LINKS = [
  { name: "About Us", path: "/about" },
  { name: "Contact", path: "/contact" },
  { name: "FAQ", path: "/faq" },
  ...(GROK_ASSISTANT_ENABLED ? [{ name: "AI Assistant", path: "/grok" }] : []),
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDealsMenuOpen, setIsDealsMenuOpen] = useState(false);
  const { isAuthenticated, user, signOut } = useAuth();
  const { totalItems, openDrawer } = useQuoteCart();
  const headerRef = useRef<HTMLElement | null>(null);
  const prevItemCount = useRef(totalItems);
  const [orderBadgePulse, setOrderBadgePulse] = useState(false);

  useEffect(() => {
    if (totalItems > prevItemCount.current) {
      setOrderBadgePulse(true);
      const timer = window.setTimeout(() => setOrderBadgePulse(false), 1000);
      prevItemCount.current = totalItems;
      return () => window.clearTimeout(timer);
    }
    prevItemCount.current = totalItems;
  }, [totalItems]);

  const updateHeaderHeight = useCallback(() => {
    if (!headerRef.current) return;
    window.requestAnimationFrame(() => {
      if (!headerRef.current) return;
      const height = Math.ceil(headerRef.current.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--app-header-height", `${height}px`);
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const isDealsPath = (path: string) =>
    path === "/offers" ||
    path.startsWith("/offers/") ||
    path === "/deals" ||
    path.startsWith("/deals/") ||
    path === "/promos" ||
    path.startsWith("/promos/");

  const isActive = (path: string) => {
    if (path === "/offers") return isDealsPath(location);
    if (path === "/products") return location === "/products" || location.startsWith("/products/");
    return location === path;
  };

  const moreActive = MORE_LINKS.some((link) => isActive(link.path));

  useLayoutEffect(() => {
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    window.addEventListener("orientationchange", updateHeaderHeight);
    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
      window.removeEventListener("orientationchange", updateHeaderHeight);
    };
  }, [updateHeaderHeight]);

  const lockOfficialPhone = isCallTrackingExcludedPath(location);

  useEffect(() => {
    updateHeaderHeight();
  }, [isScrolled, isMobileMenuOpen, updateHeaderHeight]);

  const navLinkClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? "bg-[#183a23] text-white" : "text-[#24362b] hover:bg-[#183a23]/8 hover:text-[#183a23]"
    }`;

  const phoneProps = lockOfficialPhone
    ? {
        "data-callrail-ignore": "true" as const,
        "data-dynamic-number-ignore": "true" as const,
        "data-call-tracking-ignore": "true" as const,
      }
    : {};

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md ${
        isScrolled ? "border-b border-black/8 shadow-sm" : "border-b border-black/5"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/">
          <div className="flex cursor-pointer flex-col leading-tight">
            <span className="text-[15px] font-heading font-bold sm:text-lg">
              Organic <span className="text-primary">Soil</span>{" "}
              <span className="font-display italic text-[#8f7000]">Wholesale</span>
            </span>
            <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-[9px]">
              by Soil Seed &amp; Water
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <div className="flex items-center">
            <Link href="/products">
              <span className={navLinkClass(isActive("/products"))}>Products</span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full p-1.5 text-[#24362b] hover:bg-[#183a23]/8" aria-label="Product menu">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 rounded-2xl border border-black/8 bg-white p-1.5 shadow-lg">
                <DropdownMenuItem onClick={() => setLocation("/products")} className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium">
                  All Products
                </DropdownMenuItem>
                {MENU_PRODUCTS.map((product) => (
                  <DropdownMenuItem
                    key={product.path}
                    onClick={() => setLocation(product.path)}
                    className="cursor-pointer rounded-lg px-3 py-2.5 text-sm"
                  >
                    {product.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => setLocation("/products#request-quote")} className="cursor-pointer rounded-lg px-3 py-2.5 text-sm">
                  Bulk quote catalog
                </DropdownMenuItem>
                <div className="my-1 h-px bg-black/8" />
                <DropdownMenuItem
                  onClick={() => {
                    trackEvent("Segment Link Clicked", { segment: "landscapers", source: "header" });
                    setLocation("/landscapers");
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 text-sm"
                >
                  Landscapers
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    trackEvent("Segment Link Clicked", { segment: "nurseries", source: "header" });
                    setLocation("/nurseries");
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 text-sm"
                >
                  Nurseries
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    trackEvent("Segment Link Clicked", { segment: "distributors", source: "header" });
                    setLocation("/distributors");
                  }}
                  className="cursor-pointer rounded-lg px-3 py-2.5 text-sm"
                >
                  Distributors &amp; Retail
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center">
            <Link href="/offers">
              <span className={navLinkClass(isActive("/offers"))}>Deals</span>
            </Link>
            <DropdownMenu open={isDealsMenuOpen} onOpenChange={setIsDealsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full p-1.5 text-[#24362b] hover:bg-[#183a23]/8" aria-label="Deals menu">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 rounded-2xl border border-black/8 bg-white p-1.5 shadow-lg">
                {PROMO_BUNDLES.map((deal) => (
                  <DropdownMenuItem
                    key={deal.slug}
                    onClick={() => {
                      setIsDealsMenuOpen(false);
                      setLocation(`/offers/${deal.slug}`);
                    }}
                    className="flex cursor-pointer flex-col items-stretch rounded-lg px-3 py-2.5"
                  >
                    <DealRowContent deal={deal} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`${navLinkClass(moreActive)} inline-flex items-center gap-1`}>
                More
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 rounded-2xl border border-black/8 bg-white p-1.5 shadow-lg">
              {MORE_LINKS.map((link) => (
                <DropdownMenuItem
                  key={link.path}
                  onClick={() => setLocation(link.path)}
                  className="cursor-pointer rounded-lg px-3 py-2.5 text-sm"
                >
                  {link.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem asChild>
                <a
                  href="https://weareufe.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer rounded-lg px-3 py-2.5 text-sm"
                >
                  Education
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={CUSTOMER_SUPPORT_PHONE_TEL}
            aria-label={`Call ${CUSTOMER_SUPPORT_PHONE_DISPLAY}`}
            {...phoneProps}
            className={`${lockOfficialPhone ? "no-call-tracking " : ""}flex items-center gap-1.5 text-sm font-medium text-[#183a23]`}
            data-official-support-phone="true"
          >
            <Phone className="h-3.5 w-3.5" />
            <span data-official-support-phone-text="true">{CUSTOMER_SUPPORT_PHONE_DISPLAY}</span>
          </a>
          {false &&
            (isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{user?.email}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders">
                      <a className="flex w-full items-center">Order History</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()} className="flex cursor-pointer items-center text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null)}
          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Open order, ${totalItems} item${totalItems === 1 ? "" : "s"}`}
            className="relative inline-flex h-9 items-center gap-2 rounded-full bg-[#183a23] px-4 text-sm font-semibold text-white transition hover:bg-[#0d2917]"
          >
            <ShoppingCart className="h-4 w-4" />
            Order
            {totalItems > 0 && (
              <span
                className={`absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#e9c66c] px-1 text-[10px] font-bold text-[#183a23] ${
                  orderBadgePulse ? "animate-bounce" : ""
                }`}
              >
                {totalItems}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Open order, ${totalItems} item${totalItems === 1 ? "" : "s"}`}
            className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full touch-manipulation ${
              totalItems > 0 ? "bg-[#183a23] text-white" : "text-[#183a23]"
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span
                className={`absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#e9c66c] px-1 text-[10px] font-bold text-[#183a23] ${
                  orderBadgePulse ? "animate-bounce" : ""
                }`}
              >
                {totalItems}
              </span>
            )}
          </button>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11 touch-manipulation" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex h-[100svh] max-h-[100svh] w-[min(90vw,360px)] flex-col overflow-hidden p-0 sm:w-[400px]">
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-black/8 px-5 pb-4 pr-16 pt-5">
                  <p className="font-heading text-lg font-bold">
                    Organic <span className="text-primary">Soil</span>{" "}
                    <span className="font-display italic text-[#8f7000]">Wholesale</span>
                  </p>
                </div>

                <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5">
                  <div>
                    <Link href="/offers">
                      <div className={`px-2 text-xl font-heading font-bold ${isActive("/offers") ? "text-[#183a23]" : "text-[#24362b]"}`}>
                        Deals
                      </div>
                    </Link>
                    <DealList showCaption onNavigate={() => setIsMobileMenuOpen(false)} className="mt-2" />
                  </div>

                  <div>
                    <Link href="/products">
                      <div className={`px-2 text-xl font-heading font-bold ${isActive("/products") ? "text-[#183a23]" : "text-[#24362b]"}`}>
                        Products
                      </div>
                    </Link>
                    <div className="mt-1">
                      {MENU_PRODUCTS.map((product) => (
                        <Link key={product.path} href={product.path}>
                          <div className="min-h-11 rounded-lg px-3 py-2.5 text-sm font-medium text-[#24362b] hover:bg-[#183a23]/5">
                            {product.name}
                          </div>
                        </Link>
                      ))}
                      <Link href="/products#request-quote">
                        <div className="min-h-11 rounded-lg px-3 py-2.5 text-sm font-medium text-[#24362b] hover:bg-[#183a23]/5">
                          Bulk quote catalog
                        </div>
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-0.5 border-t border-black/8 pt-4">
                    {MORE_LINKS.map((link) => (
                      <Link key={link.path} href={link.path}>
                        <div className="min-h-11 rounded-lg px-3 py-2.5 text-sm text-[#4a5c50] hover:bg-[#183a23]/5">
                          {link.name}
                        </div>
                      </Link>
                    ))}
                    <a
                      href="https://weareufe.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block min-h-11 rounded-lg px-3 py-2.5 text-sm text-[#4a5c50] hover:bg-[#183a23]/5"
                    >
                      Education
                    </a>
                    <Link href="/landscapers" onClick={() => trackEvent("Segment Link Clicked", { segment: "landscapers", source: "header_mobile" })}>
                      <div className="min-h-11 rounded-lg px-3 py-2.5 text-sm text-[#4a5c50] hover:bg-[#183a23]/5">Landscapers</div>
                    </Link>
                    <Link href="/nurseries" onClick={() => trackEvent("Segment Link Clicked", { segment: "nurseries", source: "header_mobile" })}>
                      <div className="min-h-11 rounded-lg px-3 py-2.5 text-sm text-[#4a5c50] hover:bg-[#183a23]/5">Nurseries</div>
                    </Link>
                    <Link href="/distributors" onClick={() => trackEvent("Segment Link Clicked", { segment: "distributors", source: "header_mobile" })}>
                      <div className="min-h-11 rounded-lg px-3 py-2.5 text-sm text-[#4a5c50] hover:bg-[#183a23]/5">Distributors &amp; Retail</div>
                    </Link>
                  </div>
                </nav>

                <div className="shrink-0 border-t border-black/8 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3">
                  <a
                    href={CUSTOMER_SUPPORT_PHONE_TEL}
                    aria-label={`Call ${CUSTOMER_SUPPORT_PHONE_DISPLAY}`}
                    {...phoneProps}
                    className={`${lockOfficialPhone ? "no-call-tracking " : ""}mb-3 flex min-h-[44px] items-center justify-center gap-2 text-[#183a23]`}
                    data-official-support-phone="true"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="font-medium" data-official-support-phone-text="true">
                      {CUSTOMER_SUPPORT_PHONE_DISPLAY}
                    </span>
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
