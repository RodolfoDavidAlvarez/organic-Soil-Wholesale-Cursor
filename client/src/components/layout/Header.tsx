import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, X } from "lucide-react";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

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
    { name: "Landscapers", path: "/landscapers" },
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "FAQ", path: "/faq" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-b border-neutral-200"
          : "bg-white/90 backdrop-blur-sm shadow-[0_1px_4px_rgba(0,0,0,0.03)]"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer group">
              <div>
                <span className="text-2xl md:text-3xl font-heading font-extrabold text-foreground">
                  Organic <span className="text-primary font-extrabold">Soil</span>{" "}
                  <span className="text-accent font-display font-extrabold italic">Wholesale</span>
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
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
            {user ? (
              <div className="flex items-center pl-2 space-x-4 border-l border-neutral-200">
                <Link href="/dashboard">
                  <div className="flex items-center space-x-1 text-primary font-medium cursor-pointer transition-colors duration-200 hover:text-primary/80">
                    <User className="h-4 w-4" />
                    <span>Dashboard</span>
                  </div>
                </Link>
                <Button variant="outline" size="sm" className="text-secondary border-secondary hover:bg-secondary/5" onClick={logout}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center pl-2 border-l border-neutral-200">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="flex items-center gap-1 text-primary border-primary hover:bg-primary/5">
                    <User className="h-4 w-4" />
                    <span>Login</span>
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden" aria-label="Menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white dark:bg-neutral-900">
              <div className="pt-6 pb-10">
                <div className="flex items-center justify-between mb-8">
                  <Link href="/">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                        <div className="text-white text-xl font-bold">OSW</div>
                      </div>
                      <span className="text-xl font-heading font-bold">
                        Organic <span className="text-primary">Soil</span>
                      </span>
                    </div>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <nav className="flex flex-col space-y-2">
                  {navLinks.map((link) => (
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

                  {user ? (
                    <>
                      <Link href="/dashboard">
                        <div className="flex items-center space-x-2 py-3 px-4 rounded-md font-medium text-primary bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors duration-200">
                          <User className="h-5 w-5" />
                          <span>Dashboard</span>
                        </div>
                      </Link>
                      <Button variant="outline" className="mt-2 w-full border-secondary text-secondary hover:bg-secondary/5" onClick={logout}>
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Link href="/login">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-white" size="lg">
                        <User className="h-4 w-4 mr-2" />
                        Login
                      </Button>
                    </Link>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
