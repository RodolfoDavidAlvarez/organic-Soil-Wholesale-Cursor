import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ShoppingCart, ChevronDown, Phone, User, LogOut, ArrowRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useQuoteCart } from "@/contexts/QuoteCartContext";
import { GROK_ASSISTANT_ENABLED } from "@/config/featureFlags";
import { CUSTOMER_SUPPORT_PHONE_DISPLAY, CUSTOMER_SUPPORT_PHONE_TEL } from "@/config/contact";
import { isCallTrackingExcludedPath } from "@/lib/callTracking";

const MENU_PRODUCTS = [
  {
    name: "PlantPal",
    type: "All-Stage Potting Mix",
    path: "/products/plantpal",
  },
  {
    name: "Mikey's Worm Poop",
    type: "Worm Castings",
    path: "/products/mikeys-worm-poop",
  },
  {
    name: "Simon's Gold",
    type: "Dairy Compost",
    path: "/products/simons-gold",
  },
  {
    name: "Nature's Blanket Premium",
    type: "Premium Dark Mulch",
    path: "/products/natures-blanket-premium",
  },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    if (!headerRef.current) {
      return;
    }

    window.requestAnimationFrame(() => {
      if (!headerRef.current) {
        return;
      }

      const height = Math.ceil(headerRef.current.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--app-header-height", `${height}px`);
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const isActive = (path: string) => {
    return location === path;
  };

  const navLinks = [
    { name: "Products", path: "/products" },
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "FAQ", path: "/faq" },
    ...(GROK_ASSISTANT_ENABLED ? [{ name: "AI Assistant", path: "/grok" }] : []),
  ];

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

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${
        isScrolled ? "shadow-sm border-b border-border" : "border-b border-border/50"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-heading font-bold sm:text-2xl">
                  Organic <span className="text-primary">Soil</span> <span className="text-[#8f7000] font-display italic">Wholesale</span>
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-[10px]">
                  by Soil Seed &amp; Water
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {/* Products Dropdown */}
            <div className="relative group flex items-center">
              <Link href="/products">
                <div
                  className={`relative font-medium transition-colors duration-200 cursor-pointer flex items-center ${
                    isActive("/products") ? "text-primary" : "text-foreground hover:text-primary"
                  }`}
                >
                  Products
                  <span
                    className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 ${
                      isActive("/products") ? "w-full" : "group-hover:w-full"
                    }`}
                  ></span>
                </div>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`p-1 ml-1 rounded hover:bg-primary/10 transition-colors duration-200 ${
                      isActive("/products") ? "text-primary" : "text-foreground hover:text-primary"
                    }`}
                    aria-label="Product categories dropdown"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-72 p-2 bg-white border border-border shadow-lg rounded-xl"
                >
                  <DropdownMenuItem
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setLocation("/products");
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-sm cursor-pointer rounded-lg hover:bg-primary/5 hover:text-primary transition-colors duration-200 font-medium"
                  >
                    <span>All Products</span>
                  </DropdownMenuItem>
                  <div className="h-px w-full bg-border my-1"></div>
                  <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Pay &amp; pick up
                  </div>
                  {MENU_PRODUCTS.map((product) => (
                    <DropdownMenuItem
                      key={product.path}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setLocation(product.path);
                      }}
                      className="flex cursor-pointer flex-col items-start gap-0.5 rounded-lg px-4 py-3 text-sm transition-colors duration-200 hover:bg-primary/5 hover:text-primary"
                    >
                      <span className="font-semibold">{product.name}</span>
                      <span className="text-xs text-muted-foreground">{product.type}</span>
                    </DropdownMenuItem>
                  ))}
                  <div className="h-px w-full bg-border my-1"></div>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setLocation("/products#request-quote");
                    }}
                    className="flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium cursor-pointer hover:bg-primary/5 hover:text-primary transition-colors duration-200"
                  >
                    <span>Bulk quote catalog</span>
                    <ArrowRight className="h-4 w-4" />
                  </DropdownMenuItem>
                  <div className="h-px w-full bg-border my-1"></div>
                  <div className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    For your business
                  </div>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      trackEvent("Segment Link Clicked", { segment: "landscapers", source: "header" });
                      setLocation("/landscapers");
                    }}
                    className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-primary/5 hover:text-primary"
                  >
                    Landscapers
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      trackEvent("Segment Link Clicked", { segment: "nurseries", source: "header" });
                      setLocation("/nurseries");
                    }}
                    className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-primary/5 hover:text-primary"
                  >
                    Nurseries
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      trackEvent("Segment Link Clicked", { segment: "distributors", source: "header" });
                      setLocation("/distributors");
                    }}
                    className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-primary/5 hover:text-primary"
                  >
                    Distributors & Retail
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Other Navigation Links */}
            {navLinks.slice(1).map((link) => (
              <Link key={link.path} href={link.path}>
                <div
                  className={`relative font-medium transition-colors duration-200 cursor-pointer group ${
                    isActive(link.path) ? "text-primary" : "text-foreground hover:text-primary"
                  }`}
                >
                  {link.name}
                  <span
                    className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 ${
                      isActive(link.path) ? "w-full" : "group-hover:w-full"
                    }`}
                  ></span>
                </div>
              </Link>
            ))}
            <a
              href="https://weareufe.org"
              target="_blank"
              rel="noopener noreferrer"
              className="relative font-medium text-foreground transition-colors duration-200 hover:text-primary"
            >
              Our Education Platform
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all duration-300 hover:w-full"></span>
            </a>
            <div className="flex items-center gap-3">
              <a
                href={CUSTOMER_SUPPORT_PHONE_TEL}
                aria-label={`Call ${CUSTOMER_SUPPORT_PHONE_DISPLAY}`}
                {...(lockOfficialPhone
                  ? {
                      "data-callrail-ignore": "true",
                      "data-dynamic-number-ignore": "true",
                      "data-call-tracking-ignore": "true",
                      className:
                        "no-call-tracking flex items-center gap-1 text-primary hover:text-primary/80 transition-colors duration-200",
                    }
                  : {
                      className:
                        "flex items-center gap-1 text-primary hover:text-primary/80 transition-colors duration-200",
                    })}
                data-official-support-phone="true"
              >
                <Phone className="h-4 w-4" />
                <span className="font-medium" data-official-support-phone-text="true">{CUSTOMER_SUPPORT_PHONE_DISPLAY}</span>
              </a>
              {/* Authentication buttons temporarily hidden */}
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
                          <a className="flex items-center w-full">Order History</a>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/profile">
                          <a className="flex items-center w-full">My Profile</a>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => signOut()} className="flex items-center cursor-pointer text-red-600">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/signin">
                      <Button variant="outline" className="border-gray-600 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button>Sign Up</Button>
                    </Link>
                  </div>
                ))}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openDrawer}
                  aria-label={`Open order, ${totalItems} item${totalItems === 1 ? "" : "s"}`}
                  className={`relative flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-all duration-300 hover:shadow ${
                    totalItems > 0
                      ? "border-primary bg-primary/5 text-primary hover:bg-primary/10"
                      : "border-primary/50 text-primary hover:bg-primary/10 hover:text-primary/90"
                  }`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Order</span>
                  {totalItems > 0 && (
                    <span
                      className={`absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ${
                        orderBadgePulse ? "animate-bounce" : ""
                      }`}
                    >
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </nav>

          {/* Mobile + iPad portrait Cart + Menu (desktop nav kicks in at lg/1024px) */}
          <div className="lg:hidden flex items-center gap-1">
            {/* Visible cart icon so customers don't have to dig through the menu */}
            <button
              type="button"
              onClick={openDrawer}
              aria-label={`Open order, ${totalItems} item${totalItems === 1 ? "" : "s"}`}
              className={`relative inline-flex h-11 w-11 items-center justify-center rounded-md touch-manipulation ${
                totalItems > 0 ? "bg-primary/10 text-primary" : "text-primary hover:bg-primary/10 active:bg-primary/20"
              }`}
            >
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span
                  className={`absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white ${
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
                  <div className="flex flex-col gap-2 border-b border-border/70 px-5 pb-4 pr-16 pt-5">
                    <Link href="/">
                      <div className="flex flex-col leading-tight cursor-pointer">
                        <span className="text-lg font-heading font-bold">
                          Organic <span className="text-primary">Soil</span> <span className="text-[#8f7000] font-display italic">Wholesale</span>
                        </span>
                        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          by Soil Seed &amp; Water
                        </span>
                      </div>
                    </Link>
                  </div>

                  <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4">
                    {/* Products Section */}
                    <div className="space-y-1">
                      <Link href="/products">
                        <div
                          className={`py-3 px-4 rounded-md font-medium transition-all duration-200 cursor-pointer ${
                            isActive("/products")
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-foreground hover:bg-primary/5 hover:text-primary"
                          }`}
                        >
                          Products
                        </div>
                      </Link>
                      <div className="space-y-2 pl-3">
                        {MENU_PRODUCTS.map((product) => (
                          <Link key={product.path} href={product.path}>
                            <div className="rounded-lg border border-border/70 bg-white px-4 py-3 text-foreground shadow-sm transition-colors duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-semibold leading-snug">{product.name}</div>
                                  <div className="mt-0.5 text-xs leading-snug text-muted-foreground">{product.type}</div>
                                </div>
                                <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                                  Pickup
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                        <Link href="/products#request-quote">
                          <div
                            className="flex items-center justify-between rounded-md px-4 py-3 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary/5"
                          >
                            <span>Bulk quote catalog</span>
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </Link>
                        <div className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          For your business
                        </div>
                        <Link
                          key="/landscapers"
                          href="/landscapers"
                          onClick={() => trackEvent("Segment Link Clicked", { segment: "landscapers", source: "header_mobile" })}
                        >
                          <div className="rounded-md px-4 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-primary/5 hover:text-primary">
                            Landscapers
                          </div>
                        </Link>
                        <Link
                          key="/nurseries"
                          href="/nurseries"
                          onClick={() => trackEvent("Segment Link Clicked", { segment: "nurseries", source: "header_mobile" })}
                        >
                          <div className="rounded-md px-4 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-primary/5 hover:text-primary">
                            Nurseries
                          </div>
                        </Link>
                        <Link
                          key="/distributors"
                          href="/distributors"
                          onClick={() => trackEvent("Segment Link Clicked", { segment: "distributors", source: "header_mobile" })}
                        >
                          <div className="rounded-md px-4 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-primary/5 hover:text-primary">
                            Distributors & Retail
                          </div>
                        </Link>
                      </div>
                    </div>

                    {/* Other Navigation Links */}
                    {navLinks.slice(1).map((link) => (
                      <Link key={link.path} href={link.path}>
                        <div
                          className={`py-3 px-4 rounded-md font-medium transition-all duration-200 cursor-pointer ${
                            isActive(link.path) ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-primary/5 hover:text-primary"
                          }`}
                        >
                          {link.name}
                        </div>
                      </Link>
                    ))}

                    <a
                      href="https://weareufe.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded-md font-medium text-foreground transition-all duration-200 hover:bg-primary/5 hover:text-primary"
                    >
                      Our Education Platform
                    </a>

                    {/* Auth section in mobile menu - temporarily hidden */}
                    {false &&
                      (isAuthenticated ? (
                        <div className="space-y-2">
                          <div className="py-3 px-4 text-sm text-gray-600">Signed in as: {user?.email}</div>
                          <Link href="/account/orders">
                            <div className="py-3 px-4 rounded-md text-foreground hover:bg-primary/5 hover:text-primary">Order History</div>
                          </Link>
                          <Link href="/account/profile">
                            <div className="py-3 px-4 rounded-md text-foreground hover:bg-primary/5 hover:text-primary">My Profile</div>
                          </Link>
                          <div
                            onClick={() => {
                              signOut();
                              setIsMobileMenuOpen(false);
                            }}
                            className="py-3 px-4 rounded-md text-red-600 hover:bg-red-50 cursor-pointer flex items-center"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Link href="/signin">
                            <Button
                              variant="outline"
                              className="w-full border-gray-600 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                              size="lg"
                            >
                              Sign In
                            </Button>
                          </Link>
                          <Link href="/signup">
                            <Button className="w-full" size="lg">
                              Sign Up
                            </Button>
                          </Link>
                        </div>
                      ))}
                  </nav>

                  <div className="shrink-0 border-t border-border/80 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.06)]">
                    <a
                      href={CUSTOMER_SUPPORT_PHONE_TEL}
                      aria-label={`Call ${CUSTOMER_SUPPORT_PHONE_DISPLAY}`}
                      {...(lockOfficialPhone
                        ? {
                            "data-callrail-ignore": "true",
                            "data-dynamic-number-ignore": "true",
                            "data-call-tracking-ignore": "true",
                            className:
                              "no-call-tracking mb-3 flex min-h-[44px] items-center justify-center gap-2 rounded-md text-primary",
                          }
                        : {
                            className:
                              "mb-3 flex min-h-[44px] items-center justify-center gap-2 rounded-md text-primary",
                          })}
                      data-official-support-phone="true"
                    >
                      <Phone className="h-4 w-4" />
                      <span className="font-medium" data-official-support-phone-text="true">{CUSTOMER_SUPPORT_PHONE_DISPLAY}</span>
                    </a>

                    <Button
                      className="relative h-12 w-full bg-primary text-white shadow-md hover:bg-primary/90"
                      size="lg"
                      onClick={() => { setIsMobileMenuOpen(false); openDrawer(); }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Cart
                      {totalItems > 0 && (
                        <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-primary">
                          {totalItems}
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
