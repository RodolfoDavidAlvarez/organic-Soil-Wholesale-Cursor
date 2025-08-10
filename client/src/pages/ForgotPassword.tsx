import { useState } from 'react';
import { Link } from 'wouter';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'If the email exists, a reset link has been sent.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to process request');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Forgot Password?</CardTitle>
          <CardDescription className="text-center">
            Enter your email and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        {status === 'success' ? (
          <CardContent className="space-y-4">
            <div className="text-center">
              <Mail className="h-16 w-16 text-primary mx-auto mb-4" />
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <p className="text-sm text-gray-600 mt-4">
                Check your email inbox and follow the instructions to reset your password.
              </p>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {status === 'error' && (
                <Alert variant="destructive">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={status === 'loading'}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
              
              <div className="text-sm text-center text-gray-600">
                Remember your password?{' '}
                <Link href="/signin" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;