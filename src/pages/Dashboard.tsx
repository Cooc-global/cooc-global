import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Coins, TrendingUp, Wallet, History, LogOut, Settings, Users, ShoppingCart } from 'lucide-react';
import WalletSection from '@/components/WalletSection';
import InvestmentSection from '@/components/InvestmentSection';
import TransactionHistory from '@/components/TransactionHistory';
import DeveloperPanel from '@/components/DeveloperPanel';
import ReferralSection from '@/components/ReferralSection';
import PriceTicker from '@/components/PriceTicker';
import MarketplacePanel from '@/components/MarketplacePanel';
import CurrencyConverter from '@/components/CurrencyConverter';

interface Profile {
  full_name: string;
  wallet_address: string;
  role: string;
  referral_code: string;
  referred_by: string | null;
}

interface WalletData {
  balance: number;
  locked_balance: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
      } else {
        setProfile(profileData);
      }

      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (walletError) {
        console.error('Wallet error:', walletError);
      } else {
        setWallet(walletData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Coins className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Professional Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-primary to-primary/80 rounded-lg p-2">
                  <Coins className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Cooc Global</h1>
                  <p className="text-xs text-muted-foreground">Investment Platform</p>
                </div>
              </div>
              
              {/* Compact Balance Display */}
              <div className="hidden md:flex items-center space-x-4 ml-8">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Available</p>
                  <p className="text-sm font-semibold text-primary">
                    {wallet?.balance?.toLocaleString() || '0'} CLC
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Locked</p>
                  <p className="text-sm font-semibold text-orange-500">
                    {wallet?.locked_balance?.toLocaleString() || '0'} CLC
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground">Welcome back</p>
                <p className="text-sm font-medium">{profile?.full_name}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                  {profile?.role === 'developer' ? 'Developer' : 'Investor'}
                </span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Price Ticker - Compact */}
        <div className="mb-6">
          <PriceTicker />
        </div>
        
        {/* Mobile Balance Card - Only show on small screens */}
        <Card className="mb-6 md:hidden bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Available Balance</p>
                <p className="text-xl font-bold text-primary">
                  {wallet?.balance?.toLocaleString() || '0'} CLC
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Locked Balance</p>
                <p className="text-xl font-bold text-orange-500">
                  {wallet?.locked_balance?.toLocaleString() || '0'} CLC
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center truncate">
              {profile?.wallet_address}
            </p>
          </CardContent>
        </Card>

        {/* Professional Navigation */}
        <Tabs defaultValue="wallet" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <TabsList className={`inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground ${profile?.role === 'developer' ? 'grid-cols-6' : 'grid-cols-5'}`}>
              <TabsTrigger value="wallet" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium">
                <Wallet className="w-4 h-4 mr-2" />
                Wallet
              </TabsTrigger>
              <TabsTrigger value="invest" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium">
                <TrendingUp className="w-4 h-4 mr-2" />
                Invest
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Market
              </TabsTrigger>
              <TabsTrigger value="referrals" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium">
                <Users className="w-4 h-4 mr-2" />
                Referrals
              </TabsTrigger>
              <TabsTrigger value="history" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium">
                <History className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
              {profile?.role === 'developer' && (
                <TabsTrigger value="developer" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </TabsTrigger>
              )}
            </TabsList>

            {/* Quick Stats - Desktop Only */}
            <div className="hidden lg:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Online</span>
              </div>
              <div className="text-muted-foreground">
                Wallet: {profile?.wallet_address?.slice(0, 8)}...{profile?.wallet_address?.slice(-4)}
              </div>
            </div>
          </div>

          <TabsContent value="wallet" className="mt-0">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3">
                <WalletSection wallet={wallet} profile={profile} onWalletUpdate={fetchUserData} />
              </div>
              <div className="xl:col-span-1 space-y-4">
                <CurrencyConverter />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invest" className="mt-0">
            <InvestmentSection wallet={wallet} onInvestmentUpdate={fetchUserData} />
          </TabsContent>

          <TabsContent value="marketplace" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MarketplacePanel wallet={wallet} profile={profile} />
              </div>
              <div className="lg:col-span-1">
                <CurrencyConverter />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="referrals" className="mt-0">
            <ReferralSection />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <TransactionHistory />
          </TabsContent>

          {profile?.role === 'developer' && (
            <TabsContent value="developer" className="mt-0">
              <DeveloperPanel />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;