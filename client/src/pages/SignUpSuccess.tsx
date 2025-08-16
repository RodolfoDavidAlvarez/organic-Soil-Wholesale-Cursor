import { Link, useLocation } from 'wouter';
import { CheckCircle, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const SignUpSuccess = () => {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const requiresApproval = searchParams.get('approval') === 'true';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            {requiresApproval ? (
              <Clock className="h-16 w-16 text-yellow-500" />
            ) : (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {requiresApproval ? 'Account Pending Approval' : 'Account Created Successfully!'}
          </CardTitle>
          <CardDescription className="mt-2">
            {requiresApproval ? (
              <>
                Your wholesale/commercial account application has been submitted.
                We'll review it within 24 hours and notify you by email.
              </>
            ) : (
              'Welcome to Organic Soil Wholesale! Check your email to verify your account.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span>Verification email sent to your inbox</span>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h3 className="font-medium mb-2">Next Steps:</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li>1. Check your email for verification link</li>
              <li>2. Click the link to verify your email address</li>
              {requiresApproval ? (
                <li>3. Wait for account approval (usually within 24 hours)</li>
              ) : (
                <li>3. Sign in and start shopping!</li>
              )}
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          {!requiresApproval && (
            <Button asChild className="w-full">
              <Link href="/signin">Sign In</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Return to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUpSuccess;