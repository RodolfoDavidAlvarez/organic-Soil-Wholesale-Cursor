import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ShoppingCart, X, ChevronDown, Leaf, Sprout, Flower, Droplet, Phone } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Define the main product categories with icons
const PRODUCT_CATEGORIES = [
  { value: "Amendment", label: "Amendment", icon: Leaf },
  { value: "Mulch", label: "Mulch", icon: Sprout },
  { value: "Potting Soil", label: "Potting Soil", icon: Flower },
  { value: "Concentrated Amendment", label: "Concentrated Amendment", icon: Droplet },
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
              <div>
                <span className="text-xl font-heading font-bold">
                  Organic <span className="text-primary">Soil</span> <span className="text-accent font-display italic">Wholesale</span>
                </span>
                <div className="text-xs text-foreground/60 mt-0.5">
                  by{" "}
                  <a href="https://soilseedandwater.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    Soil Seed and Water
                  </a>
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Products Dropdown */}
            <div className="relative group">
              <Link href="/products">
                <div
                  className={`relative font-medium transition-colors duration-200 cursor-pointer flex items-center gap-1 ${
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
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="absolute inset-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 p-2 bg-white/95 backdrop-blur-sm border border-neutral-200/50 shadow-lg rounded-xl"
                >
                  {PRODUCT_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    return (
                      <DropdownMenuItem
                        key={category.value}
                        onClick={() => handleCategorySelect(category.value)}
                        className="flex items-center gap-3 px-4 py-3 text-sm cursor-pointer rounded-lg hover:bg-primary/5 hover:text-primary transition-colors duration-200"
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        <span>{category.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
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
            <div className="flex items-center gap-3">
              <a href="tel:9285501649" className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors duration-200">
                <Phone className="h-4 w-4" />
                <span className="font-medium">(928) 550-1649</span>
              </a>
              <Link href="/order">
                <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <ShoppingCart className="h-4 w-4" />
                  <span>Place Order</span>
                </Button>
              </Link>
            </div>
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

                    <a href="tel:9285501649" className="flex items-center gap-2 py-3 px-4 text-primary">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">(928) 550-1649</span>
                    </a>

                    <Link href="/order">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-md" size="lg">
                        <ShoppingCart className="h-4 w-4 mr-2" />
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
