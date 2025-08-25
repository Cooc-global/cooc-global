import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useCLCPrice } from '@/hooks/useCLCPrice';
import { ShoppingCart, Phone, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMarketplace, MarketplaceFormData } from '@/hooks/useMarketplace';
import { useToast } from '@/hooks/use-toast';

interface MarketplaceSectionProps {
  wallet: { balance: number; locked_balance: number } | null;
  profile: { wallet_address: string; role: string; full_name: string } | null;
}

const MarketplaceSection = ({ wallet, profile }: MarketplaceSectionProps) => {
  const { user } = useAuth();
  const { priceData: clcPrice } = useCLCPrice();
  const { toast } = useToast();
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
  
  // Form state - initialize with current CLC price
  const [coinsToSell, setCoinsToSell] = useState('');
  const [pricePerCoin, setPricePerCoin] = useState(clcPrice.price.toString());
  const [phoneNumber, setPhoneNumber] = useState('');


  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const priceValue = parseFloat(pricePerCoin);
    if (priceValue < 10) {
      toast({
        title: "Price Too Low", 
        description: "Minimum price per CLC is KSH 10.00",
        variant: "destructive",
      });
      return;
    }
    
    const formData: MarketplaceFormData = {
      coinsToSell,
      pricePerCoin,
      phoneNumber
    };

    const success = await createOffer(formData, profile, wallet?.balance || 0);
    
    if (success) {
      // Reset form
      setCoinsToSell('');
      setPricePerCoin(clcPrice.price.toString());
      setPhoneNumber('');
      setShowForm(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    await deleteOffer(offerId);
  };

  return (
    <div className="space-y-4">
      {/* Compact Create Offer Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-sm">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Sell Coins
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="h-7 px-3 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              {showForm ? 'Cancel' : 'Create'}
            </Button>
          </div>
        </CardHeader>
        
        {showForm && (
          <CardContent className="pt-0">
            <form onSubmit={handleCreateOffer} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="coinsToSell" className="text-xs">Coins to Sell</Label>
                  <Input
                    id="coinsToSell"
                    type="number"
                    placeholder="Amount"
                    value={coinsToSell}
                    onChange={(e) => setCoinsToSell(e.target.value)}
                    max={wallet?.balance || 0}
                    className="h-8 text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {wallet?.balance?.toLocaleString() || 0} CLC
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="pricePerCoin" className="text-xs">Price (KSH) - Min: KSH 10.00</Label>
                  <Input
                    id="pricePerCoin"
                    type="number"
                    step="0.01"
                    min="10.00"
                    placeholder={`Current: KSH ${clcPrice.price.toFixed(2)}`}
                    value={pricePerCoin}
                    onChange={(e) => setPricePerCoin(e.target.value)}
                    className="h-8 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phoneNumber" className="text-xs">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+254 XXX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-8 text-sm"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Total: {coinsToSell && pricePerCoin ? 
                    `${(parseFloat(coinsToSell || '0') * parseFloat(pricePerCoin || '0')).toLocaleString()} KSH` 
                    : '0 KSH'}
                </div>
                <Button type="submit" className="h-8 px-4 text-xs" disabled={loading}>
                  {loading ? 'Posting...' : 'Post Offer'}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Compact Marketplace Activity */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Market Activity</CardTitle>
            <Badge variant="outline" className="text-xs px-2 py-0 h-5">
              {offers.length} offers
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {offers.length === 0 ? (
            <div className="text-center py-3 text-xs text-muted-foreground">
              No offers available
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {[...offers].sort((a, b) => a.status === 'active' ? -1 : b.status === 'active' ? 1 : 0).map((offer) => (
                <div key={offer.id} className="border rounded p-3 space-y-2">
                   <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2">
                       <span className="text-sm font-medium">{offer.seller_name}</span>
                       <Badge 
                         variant={offer.status === 'sold' ? 'destructive' : 'default'}
                         className={`text-xs px-1.5 py-0 h-4 ${offer.status === 'sold' ? 'bg-red-500' : 'bg-green-500 text-white'}`}
                       >
                         {offer.status === 'sold' ? 'SOLD' : 'LIVE'}
                       </Badge>
                     </div>
                     {offer.user_id === user?.id && offer.status === 'active' && (
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleDeleteOffer(offer.id)}
                         className="h-6 w-6 p-0 text-destructive"
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
                       Sign in to view contact details
                     </div>
                   )}
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Coins</span>
                      <div className="font-medium">{offer.coins_for_sale.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Price</span>
                      <div className="font-medium">{offer.price_per_coin} KSH</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Total</span>
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