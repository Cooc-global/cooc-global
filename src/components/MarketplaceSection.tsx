import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Textarea import removed as description field is no longer needed
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, Phone, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MarketplaceOffer {
  id: string;
  seller_name: string;
  phone_number: string;
  coins_for_sale: number;
  price_per_coin: number;
  created_at: string;
  user_id: string;
  status: string;
}

interface MarketplaceSectionProps {
  wallet: { balance: number; locked_balance: number } | null;
  profile: { wallet_address: string; role: string; full_name: string } | null;
}

const MarketplaceSection = ({ wallet, profile }: MarketplaceSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [coinsToSell, setCoinsToSell] = useState('');
  const [pricePerCoin, setPricePerCoin] = useState('1.00');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    fetchOffers(); // Fetch offers regardless of authentication status
  }, [user]);

  // Helper function to check if user is fictional and hide their digits
  const isFictionalUser = (offer: MarketplaceOffer): boolean => {
    // Fictional users have phone numbers ending in 999 or specific names
    const fictionalNames = ['Grace Wanjiku', 'Peter Kiprotich', 'Mary Achieng', 'James Mwangi', 
                           'Susan Nyokabi', 'Daniel Ochieng', 'Faith Wambui', 'Michael Kipchoge', 'Catherine Njeri'];
    return fictionalNames.includes(offer.seller_name) || offer.phone_number?.endsWith('999');
  };

  const hidePhoneDigits = (phoneNumber: string): string => {
    if (!phoneNumber || phoneNumber.length < 3) return phoneNumber;
    return phoneNumber.slice(0, -3) + '***';
  };

  const displayPhoneNumber = (offer: MarketplaceOffer): string => {
    if (isFictionalUser(offer)) {
      return hidePhoneDigits(offer.phone_number);
    }
    return offer.phone_number; // Show real users' numbers in full
  };

  const fetchOffers = async () => {
    try {
      // If user is authenticated, get full data including phone numbers
      if (user) {
        const { data, error } = await supabase
          .from('marketplace')
          .select('*')
          .in('status', ['active', 'sold'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOffers(data || []);
      } else {
        // For anonymous users, get both active and sold offers
        const { data: activeData, error: activeError } = await supabase
          .rpc('get_marketplace_offers_public');
        
        const { data: soldData, error: soldError } = await supabase
          .from('marketplace')
          .select('id, user_id, seller_name, coins_for_sale, price_per_coin, description, status, created_at, updated_at')
          .eq('status', 'sold')
          .order('created_at', { ascending: false });

        if (activeError) throw activeError;
        if (soldError) throw soldError;

        // Combine active and sold offers for anonymous users
        const allOffers = [
          ...(activeData || []).map(offer => ({ ...offer, phone_number: '' })),
          ...(soldData || []).map(offer => ({ ...offer, phone_number: '' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setOffers(allOffers);
      }
    } catch (error) {
      console.error('Error fetching marketplace offers:', error);
    }
  };

  // Input validation helper
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone);
  };

  const validateAmount = (amount: string): boolean => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= (wallet?.balance || 0);
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!coinsToSell || !phoneNumber || !pricePerCoin) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number (10-15 digits)",
        variant: "destructive",
      });
      return;
    }

    if (!validateAmount(coinsToSell)) {
      toast({
        title: "Error",
        description: "Invalid coin amount or insufficient balance",
        variant: "destructive",
      });
      return;
    }

    const coinsAmount = parseFloat(coinsToSell);
    const priceAmount = parseFloat(pricePerCoin);
    
    if (priceAmount <= 0) {
      toast({
        title: "Error",
        description: "Price per coin must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('marketplace')
        .insert({
          user_id: user?.id,
          seller_name: profile?.full_name || 'Anonymous',
          phone_number: phoneNumber,
          coins_for_sale: coinsAmount,
          price_per_coin: parseFloat(pricePerCoin)
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your coin sale offer has been posted to the marketplace",
      });

      // Reset form
      setCoinsToSell('');
      setPricePerCoin('1.00');
      setPhoneNumber('');
      setShowForm(false);
      
      fetchOffers();
    } catch (error) {
      console.error('Error creating marketplace offer:', error);
      toast({
        title: "Error",
        description: "Failed to create marketplace offer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace')
        .delete()
        .eq('id', offerId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Offer removed from marketplace",
      });

      fetchOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: "Error",
        description: "Failed to remove offer",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Offer Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Sell Your Coins
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              {showForm ? 'Cancel' : 'Create Offer'}
            </Button>
          </CardTitle>
          <CardDescription>
            Post your coins for sale to other investors
          </CardDescription>
        </CardHeader>
        
        {showForm && (
          <CardContent>
            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coinsToSell">Coins to Sell</Label>
                  <Input
                    id="coinsToSell"
                    type="number"
                    placeholder="Enter number of coins"
                    value={coinsToSell}
                    onChange={(e) => setCoinsToSell(e.target.value)}
                    min="0.01"
                    step="0.01"
                    max={wallet?.balance || 0}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Available: {wallet?.balance?.toLocaleString() || 0} CLC
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pricePerCoin">Price per Coin (KSH)</Label>
                  <Input
                    id="pricePerCoin"
                    type="number"
                    placeholder="1.00"
                    value={pricePerCoin}
                    onChange={(e) => setPricePerCoin(e.target.value)}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Contact Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+254 XXX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  pattern="[+]?[0-9\s\-\(\)]{10,15}"
                  title="Enter a valid phone number (10-15 digits, may include +, spaces, dashes, parentheses)"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Format: +254XXXXXXXXX or 0XXXXXXXXX
                </p>
              </div>


              <div className="text-sm text-muted-foreground">
                Total Value: {coinsToSell && pricePerCoin ? 
                  `${(parseFloat(coinsToSell || '0') * parseFloat(pricePerCoin || '0')).toLocaleString()} KSH` 
                  : '0 KSH'}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Offer...' : 'Post to Marketplace'}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Marketplace Offers */}
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Activity</CardTitle>
          <CardDescription>
            Current and recent coin trading activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {offers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No coins available for sale at the moment
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => (
                <div key={offer.id} className="border rounded-lg p-4 space-y-3">
                   <div className="flex justify-between items-start">
                     <div className="space-y-2">
                       <div className="flex items-center gap-2">
                         <div className="font-semibold">{offer.seller_name}</div>
                         <Badge 
                           variant={offer.status === 'sold' ? 'destructive' : 'default'}
                           className={offer.status === 'sold' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600 text-white'}
                         >
                           {offer.status === 'sold' ? 'SOLD' : 'AVAILABLE'}
                         </Badge>
                       </div>
                       {user && offer.phone_number && (
                         <div className="flex items-center text-sm text-muted-foreground">
                           <Phone className="w-4 h-4 mr-1" />
                           {displayPhoneNumber(offer)}
                         </div>
                       )}
                       {!user && (
                         <div className="text-sm text-muted-foreground">
                           Sign in to view contact details
                         </div>
                       )}
                     </div>
                     {offer.user_id === user?.id && offer.status === 'active' && (
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleDeleteOffer(offer.id)}
                         className="text-destructive hover:text-destructive"
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     )}
                   </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Coins:</span>
                      <div className="font-medium">{offer.coins_for_sale.toLocaleString()} CLC</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <div className="font-medium">{offer.price_per_coin} KSH/coin</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <div className="font-medium">{(offer.coins_for_sale * offer.price_per_coin).toLocaleString()} KSH</div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketplaceSection;