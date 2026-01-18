import { useState, useEffect } from "react";
import { useLocation, Redirect, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(1, "Full name is required"),
  companyName: z.string().optional(),
  phone: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [, navigate] = useLocation();
  const { admin, loading } = useAdminAuth();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && admin) {
      navigate("/admin");
    }
  }, [admin, loading, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      companyName: "",
      phone: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setStatusMessage("Creating your account...");
    setRegisterError(null);

    try {
      const response = await fetch("/api/admin/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email.trim(),
          password: data.password,
          full_name: data.fullName.trim(),
          company_name: data.companyName?.trim() || null,
          phone: data.phone?.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create account");
      }

      const { token, admin } = await response.json();

      // Store token in localStorage
      localStorage.setItem("adminToken", token);

      setStatusMessage("Account created successfully! Redirecting...");
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });

      // Redirect to admin dashboard
      setTimeout(() => {
        window.location.href = "/admin/contacts";
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create account";
      setStatusMessage(null);
      setRegisterError(message);
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div
          className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50"
          style={{ paddingTop: "var(--app-header-height, 6.5rem)" }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
        <Footer />
      </div>
    );
  }

  // Redirect if already authenticated
  if (admin) {
    return <Redirect to="/admin" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4" style={{ paddingTop: "var(--app-header-height, 6.5rem)" }}>
        <div className="w-full max-w-md">
          {/* Back to Home Link */}
          <Link href="/">
            <Button variant="ghost" className="mb-6 text-foreground/70 hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>

          <Card className="shadow-xl border-2 border-green-100">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl text-center font-heading text-gray-900">Create Account</CardTitle>
              <CardDescription className="text-center text-base mt-2">Get started with your own CRM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
                    autoFocus
                    disabled={isSubmitting}
                    className="h-11"
                    {...register("fullName")}
                  />
                  {errors.fullName && <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    autoComplete="email"
                    disabled={isSubmitting}
                    className="h-11"
                    {...register("email")}
                  />
                  {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="h-11 pr-10"
                      placeholder="Min. 8 characters"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:text-gray-300 transition-colors"
                      disabled={isSubmitting}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                    Company Name <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Acme Inc."
                    autoComplete="organization"
                    disabled={isSubmitting}
                    className="h-11"
                    {...register("companyName")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    autoComplete="tel"
                    disabled={isSubmitting}
                    className="h-11"
                    {...register("phone")}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                {(statusMessage || registerError) && (
                  <div className="space-y-2" aria-live="polite">
                    {statusMessage && (
                      <Alert className="border-green-300 bg-green-50 text-green-800 shadow-sm">
                        <AlertDescription className="font-medium">{statusMessage}</AlertDescription>
                      </Alert>
                    )}
                    {registerError && (
                      <Alert variant="destructive" className="shadow-sm">
                        <AlertDescription className="font-medium">{registerError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </form>

              {/* Login Link */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-center text-gray-600">
                  Already have an account?{" "}
                  <Link href="/admin/login">
                    <a className="font-medium text-green-600 hover:text-green-500 transition-colors">
                      Sign in here
                    </a>
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
