import { useState, useEffect } from "react";
import { useLocation, Redirect, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [, navigate] = useLocation();
  const { signIn, admin, loading } = useAdminAuth();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && admin) {
      // Operations users go directly to Operations page
      if (admin.role === 'operations') {
        navigate("/admin/operations");
      } else {
        navigate("/admin");
      }
    }
  }, [admin, loading, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setStatusMessage("Signing you in...");
    setLoginError(null);

    try {
      const normalizedEmail = data.email.trim();
      const result = await signIn(normalizedEmail, data.password);
      setStatusMessage("Login successful! Redirecting...");

      // Check if operations user and redirect accordingly
      if (result?.role === 'operations') {
        navigate("/admin/operations");
      } else {
        navigate("/admin");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid credentials";
      setStatusMessage(null);
      setLoginError(message);
      toast({
        title: "Login failed",
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
    return <Redirect to={admin.role === 'operations' ? "/admin/operations" : "/admin"} />;
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
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl text-center font-heading text-gray-900">Admin Login</CardTitle>
              <CardDescription className="text-center text-base mt-2">Enter your credentials to access the admin panel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    autoComplete="email"
                    autoFocus
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
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      className="h-11 pr-10"
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

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                {(statusMessage || loginError) && (
                  <div className="space-y-2" aria-live="polite">
                    {statusMessage && (
                      <Alert className="border-green-300 bg-green-50 text-green-800 shadow-sm">
                        <AlertDescription className="font-medium">{statusMessage}</AlertDescription>
                      </Alert>
                    )}
                    {loginError && (
                      <Alert variant="destructive" className="shadow-sm">
                        <AlertDescription className="font-medium">{loginError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </form>

              {/* Create Account Link */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-center text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/register">
                    <a className="font-medium text-green-600 hover:text-green-500 transition-colors">
                      Create one here
                    </a>
                  </Link>
                </p>
              </div>

              {/* Security Notice */}
              <div className="pt-2">
                <p className="text-xs text-center text-gray-500">🔒 This is a secure admin area. Unauthorized access is prohibited.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
