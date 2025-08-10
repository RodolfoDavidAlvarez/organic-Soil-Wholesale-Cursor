import { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    // Verify the email token
    fetch(`/api/auth/verify-email/${token}`, {
      method: 'POST',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email');
        }
      })
      .catch((error) => {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription className="mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'success' && (
            <p className="text-gray-600">
              Your email has been successfully verified. You can now sign in to your account.
            </p>
          )}
          {status === 'error' && (
            <p className="text-gray-600">
              The verification link may have expired or is invalid. Please try signing in and request a new verification email.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          {status !== 'loading' && (
            <>
              <Button asChild className="w-full">
                <Link href="/signin">Sign In</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Return to Home</Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyEmail;