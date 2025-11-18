import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock, Eye, EyeOff, CheckCircle, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const signupSchema = z
  .object({
    full_name: z.string().min(2, "Full name must be at least 2 characters").optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function AcceptInvitation() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [invitation, setInvitation] = useState<{ email: string; full_name: string | null; role: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Extract token from URL path using window.location for reliability
  const token = useMemo(() => {
    const pathname = window.location.pathname;
    console.log("Current pathname:", pathname);

    if (!pathname.startsWith("/admin/invite/")) {
      console.log("Pathname doesn't start with /admin/invite/");
      return null;
    }

    const pathAfterInvite = pathname.replace("/admin/invite/", "");
    // Remove any query parameters or hash if present
    const tokenOnly = pathAfterInvite.split("?")[0].split("#")[0].trim();

    console.log("Extracted token:", tokenOnly, "Length:", tokenOnly.length);

    if (!tokenOnly || tokenOnly.length === 0) {
      console.log("Token is empty after extraction");
      return null;
    }

    return tokenOnly;
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Verify invitation token on mount
  useEffect(() => {
    const verifyInvitation = async () => {
      console.log("Verifying invitation, token:", token);
      if (!token) {
        console.log("No token found, setting error");
        setError("No token provided");
        setVerifying(false);
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching invitation verification for token:", token);
        const response = await fetch(`/api/admin/invitations/verify/${token}`);

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || "Invalid or expired invitation");
          setVerifying(false);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setInvitation(data.invitation);
        if (data.invitation.full_name) {
          setValue("full_name", data.invitation.full_name);
        }
      } catch (error) {
        console.error("Error verifying invitation:", error);
        setError("Failed to verify invitation. Please try again.");
      } finally {
        setVerifying(false);
        setLoading(false);
      }
    };

    verifyInvitation();
  }, [token, setValue]);

  // Handle countdown and redirect when account is created
  useEffect(() => {
    if (!accountCreated) return;

    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => navigate("/admin/login"), 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [accountCreated, navigate]);

  const onSubmit = async (data: SignupFormData) => {
    if (!token) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/admin/invitations/accept/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: data.password,
          full_name: data.full_name || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || "Failed to create account";
        console.error("Account creation failed:", errorMessage);
        setError(errorMessage);
        toast({
          title: "Account Creation Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Show success state
      setAccountCreated(true);
      
      toast({
        title: "Account created successfully!",
        description: "You can now log in with your email and password.",
      });

      // Start countdown - the useEffect will handle the redirect
      setRedirectCountdown(5);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create account. Please try again.";
      console.error("Account creation error:", error);
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (loading || verifying) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <Header />
        <div className="flex-1 flex items-center justify-center" style={{ paddingTop: "var(--app-header-height, 6.5rem)" }}>
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Verifying invitation...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Success state - show after account creation
  if (accountCreated) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <Header />
        <div className="flex-1 flex items-center justify-center py-12 px-4" style={{ paddingTop: "var(--app-header-height, 6.5rem)" }}>
          <Card className="w-full max-w-md shadow-xl border-2 border-green-200">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  {/* Animated success circle */}
                  <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg animate-scale-in">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                  {/* Pulsing ring animation */}
                  <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20"></div>
                </div>
              </div>
              <CardTitle className="text-3xl text-center font-heading text-gray-900 animate-fade-in">
                Account Created Successfully!
              </CardTitle>
              <CardDescription className="text-center text-base mt-2 animate-fade-in-delay">
                Thank you for creating your account. You're all set!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-gray-600">
                  Redirecting you to the login page in <span className="font-bold text-green-600 text-lg">{redirectCountdown}</span> seconds...
                </p>
                <p className="text-sm text-gray-500">
                  You can now log in with your email and password.
                </p>
              </div>
              
              <div className="pt-4">
                <Button 
                  className="w-full h-11 text-base font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all"
                  onClick={() => navigate("/admin/login")}
                >
                  Go to Login Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <Header />
        <div className="flex-1 flex items-center justify-center py-12 px-4" style={{ paddingTop: "var(--app-header-height, 6.5rem)" }}>
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Invalid Invitation</CardTitle>
              <CardDescription className="text-center mt-2">{error || "This invitation link is invalid or has expired."}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate("/admin/login")}>
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4" style={{ paddingTop: "var(--app-header-height, 6.5rem)" }}>
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-2 border-green-100">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl text-center font-heading text-gray-900">Create Your Account</CardTitle>
              <CardDescription className="text-center text-base mt-2">Complete your admin account setup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Invitation Info */}
              <Alert className="bg-green-50 border-green-200">
                <Mail className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Email:</strong> {invitation.email}
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                    Full Name {invitation.full_name && "(Optional)"}
                  </Label>
                  <Input id="full_name" type="text" placeholder="John Doe" disabled={isSubmitting} className="h-11" {...register("full_name")} />
                  {errors.full_name && <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>}
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
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="h-11 pr-10"
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:text-gray-300 transition-colors"
                      disabled={isSubmitting}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>}
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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-5 w-5" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="w-4 h-4" />
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}

              {/* Security Notice */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-center text-gray-500">
                  🔒 Your password will be securely encrypted. Make sure to choose a strong password.
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
