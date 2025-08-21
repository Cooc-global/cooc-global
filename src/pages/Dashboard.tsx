import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Coins, TrendingUp, Wallet, History, LogOut, Settings, Users } from 'lucide-react';
import WalletSection from '@/components/WalletSection';
import InvestmentSection from '@/components/InvestmentSection';
import TransactionHistory from '@/components/TransactionHistory';
import DeveloperPanel from '@/components/DeveloperPanel';
import ReferralSection from '@/components/ReferralSection';
import PriceTicker from '@/components/PriceTicker';
import MarketplacePanel from '@/components/MarketplacePanel';
import MarketplaceFunctionalityPanel from '@/components/MarketplaceFunctionalityPanel';

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
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-primary rounded-full p-2">
              <Coins className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Cooc Global</h1>
              <p className="text-sm text-muted-foreground">Welcome, {profile?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
              {profile?.role === 'developer' ? 'Developer' : 'Investor'}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Price Ticker */}
        <PriceTicker />
        
        {/* Wallet Balance Card */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-brand-secondary/10">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="w-5 h-5 mr-2" />
              Your CLC Wallet
            </CardTitle>
            <CardDescription>Wallet Address: {profile?.wallet_address}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold text-primary">
                  {wallet?.balance?.toLocaleString() || '0'} CLC
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Locked in Investments</p>
                <p className="text-2xl font-semibold text-warning">
                  {wallet?.locked_balance?.toLocaleString() || '0'} CLC
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="wallet" className="space-y-6">
          <TabsList className={`grid w-full ${profile?.role === 'developer' ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="wallet" className="flex items-center">
              <Wallet className="w-4 h-4 mr-2" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="invest" className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Invest
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            {profile?.role === 'developer' && (
              <TabsTrigger value="developer" className="flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Developer
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="wallet">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <WalletSection wallet={wallet} profile={profile} onWalletUpdate={fetchUserData} />
              </div>
              <div className="space-y-6">
                <MarketplacePanel wallet={wallet} profile={profile} />
                <MarketplaceFunctionalityPanel wallet={wallet} profile={profile} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invest">
            <InvestmentSection wallet={wallet} onInvestmentUpdate={fetchUserData} />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralSection />
          </TabsContent>

          <TabsContent value="history">
            <TransactionHistory />
          </TabsContent>

          {profile?.role === 'developer' && (
            <TabsContent value="developer">
              <DeveloperPanel />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;