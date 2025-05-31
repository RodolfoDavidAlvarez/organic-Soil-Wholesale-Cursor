import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Package, X, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Define the main product categories
const PRODUCT_CATEGORIES = [
  { value: "Amendment", label: "Amendment" },
  { value: "Mulch", label: "Mulch" },
  { value: "Potting Soil", label: "Potting Soil" },
  { value: "Concentrated Amendment", label: "Concentrated Amendment" },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleCategorySelect = (category: string) => {
    // Navigate to products page with category parameter
    window.location.href = `/products?category=${category}`;
  };

  const navLinks = [
    { name: "Products", path: "/products" },
    { name: "Landscapers", path: "/landscapers" },
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "FAQ", path: "/faq" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <span className="text-xl font-heading font-bold">
                Organic <span className="text-primary">Soil</span> <span className="text-accent font-display italic">Wholesale</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Products Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  className={`relative font-medium transition-colors duration-200 cursor-pointer group flex items-center gap-1 ${
                    isActive("/products") ? "text-primary" : "text-foreground hover:text-primary"
                  }`}
                >
                  Products
                  <ChevronDown className="h-4 w-4" />
                  <span
                    className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 ${
                      isActive("/products") ? "w-full" : "group-hover:w-full"
                    }`}
                  ></span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {PRODUCT_CATEGORIES.map((category) => (
                  <DropdownMenuItem key={category.value} onClick={() => handleCategorySelect(category.value)} className="cursor-pointer">
                    {category.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

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
            <Link href="/order">
              <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white">
                <Package className="h-4 w-4" />
                <span>Place Order</span>
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <Link href="/">
                      <div className="flex items-center space-x-2 cursor-pointer">
                        <span className="text-lg font-heading font-bold">
                          Organic <span className="text-primary">Soil</span> <span className="text-accent font-display italic">Wholesale</span>
                        </span>
                      </div>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMobileMenuOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <nav className="flex flex-col space-y-2">
                    {/* Products Section with Categories */}
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
                      <div className="pl-4 space-y-1">
                        {PRODUCT_CATEGORIES.map((category) => (
                          <div
                            key={category.value}
                            onClick={() => handleCategorySelect(category.value)}
                            className="py-2 px-4 rounded-md text-sm text-foreground/80 hover:bg-primary/5 hover:text-primary cursor-pointer"
                          >
                            {category.label}
                          </div>
                        ))}
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

                    <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800 my-4"></div>

                    <Link href="/order">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-white" size="lg">
                        <Package className="h-4 w-4 mr-2" />
                        Place Order
                      </Button>
                    </Link>
                  </nav>
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
