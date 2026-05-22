import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Phone, Mail, Building2, User, CreditCard } from 'lucide-react';
import PortalLayout from './PortalLayout';

const Profile = () => {
  const { user, signOut } = useAuth();
  const p = user?.profile;

  const fields = [
    { label: 'Name', value: p?.full_name, icon: User },
    { label: 'Email', value: p?.email || user?.email, icon: Mail },
    { label: 'Phone', value: p?.phone, icon: Phone },
    { label: 'Company', value: p?.company_name, icon: Building2 },
  ];

  return (
    <PortalLayout>
      <div className="space-y-5 pb-6">
        <h1 className="text-2xl font-heading font-bold">Profile</h1>

        {/* Account card */}
        <div className="rounded-xl bg-white/70 border border-primary/10 shadow-sm overflow-hidden">
          {/* Header with avatar */}
          <div className="bg-gradient-to-r from-primary/8 to-primary/4 p-5 flex items-center gap-4 border-b border-primary/10">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-heading font-bold text-lg">
              {(p?.full_name || p?.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-heading font-bold">{p?.full_name || p?.email}</p>
              <Badge variant="outline" className="text-[10px] font-medium mt-1 bg-white/60 capitalize">
                <CreditCard className="h-2.5 w-2.5 mr-1" />
                {p?.account_type || 'Account'}
              </Badge>
            </div>
          </div>

          {/* Fields */}
          <div className="divide-y divide-primary/5">
            {fields.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3.5 px-5 py-3.5">
                <Icon className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium truncate">{value || '-'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help card */}
        <div className="rounded-xl bg-white/70 border border-primary/10 shadow-sm p-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Need to update your info? Give us a call at{' '}
            <a href="tel:6027267211" className="text-primary font-medium hover:underline">(602) 726-7211</a> or email{' '}
            <a href="mailto:ralvarez@soilseedandwater.com" className="text-primary font-medium hover:underline">ralvarez@soilseedandwater.com</a>
          </p>
        </div>

        {/* Sign out */}
        <Button
          variant="outline"
          className="w-full text-red-500 border-red-200/60 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </PortalLayout>
  );
};

export default Profile;
