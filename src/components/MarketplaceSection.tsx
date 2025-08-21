import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, Phone, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMarketplace, MarketplaceFormData } from '@/hooks/useMarketplace';

interface MarketplaceSectionProps {
  wallet: { balance: number; locked_balance: number } | null;
  profile: { wallet_address: string; role: string; full_name: string } | null;
}

const MarketplaceSection = ({ wallet, profile }: MarketplaceSectionProps) => {
  const { user } = useAuth();
  const {
    offers,
    activeOffers,
    soldOffers,
    loading,
    createOffer,
    deleteOffer,
    displayPhoneNumber
  } = useMarketplace();
  
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [coinsToSell, setCoinsToSell] = useState('');
  const [pricePerCoin, setPricePerCoin] = useState('1.00');
  const [phoneNumber, setPhoneNumber] = useState('');


  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData: MarketplaceFormData = {
      coinsToSell,
      pricePerCoin,
      phoneNumber
    };

    const success = await createOffer(formData, profile, wallet?.balance || 0);
    
    if (success) {
      // Reset form
      setCoinsToSell('');
      setPricePerCoin('1.00');
      setPhoneNumber('');
      setShowForm(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    await deleteOffer(offerId);
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Marketplace Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {offers.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No coins available for sale
            </div>
          ) : (
            <div className="space-y-2">
              {offers.map((offer) => (
                <div key={offer.id} className="border rounded-md p-2 space-y-1">
                   <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2">
                       <span className="text-sm font-medium">{offer.seller_name}</span>
                       <Badge 
                         variant={offer.status === 'sold' ? 'destructive' : 'default'}
                         className={`text-xs px-1.5 py-0.5 ${offer.status === 'sold' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                       >
                         {offer.status === 'sold' ? 'SOLD' : 'LIVE'}
                       </Badge>
                     </div>
                     {offer.user_id === user?.id && offer.status === 'active' && (
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleDeleteOffer(offer.id)}
                         className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                       >
                         <Trash2 className="w-3 h-3" />
                       </Button>
                     )}
                   </div>
                   
                   {user && offer.phone_number && (
                     <div className="flex items-center text-xs text-muted-foreground">
                       <Phone className="w-3 h-3 mr-1" />
                       {displayPhoneNumber(offer)}
                     </div>
                   )}
                   {!user && (
                     <div className="text-xs text-muted-foreground">
                       Sign in to view contact
                     </div>
                   )}
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Coins</span>
                      <div className="font-medium">{offer.coins_for_sale.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price</span>
                      <div className="font-medium">{offer.price_per_coin} KSH</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total</span>
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