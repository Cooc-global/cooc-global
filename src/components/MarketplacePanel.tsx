import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, Phone, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMarketplace, MarketplaceFormData } from '@/hooks/useMarketplace';

interface MarketplacePanelProps {
  wallet: { balance: number; locked_balance: number } | null;
  profile: { wallet_address: string; role: string; full_name: string } | null;
}

const MarketplacePanel = ({ wallet, profile }: MarketplacePanelProps) => {
  const { user } = useAuth();
  const {
    activeOffers,
    recentSales,
    loading,
    createOffer,
    deleteOffer,
    displayPhoneNumber
  } = useMarketplace();
  
  const [showForm, setShowForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
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
    <Card className="w-full">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-xs">
            <ShoppingCart className="w-3 h-3 mr-1" />
            Marketplace
            <Badge variant="outline" className="ml-1 text-xs px-1 h-4">
              {activeOffers.length}
            </Badge>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="h-5 px-1 text-xs"
          >
            <Plus className="w-2 h-2 mr-1" />
            Sell
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-2">
        {showForm && (
          <div className="border rounded-sm p-2 bg-muted/30">
            <form onSubmit={handleCreateOffer} className="space-y-1">
              <div className="grid grid-cols-2 gap-1">
                <Input
                  type="number"
                  placeholder="Coins"
                  value={coinsToSell}
                  onChange={(e) => setCoinsToSell(e.target.value)}
                  className="h-6 text-xs"
                  required
                />
                <Input
                  type="number"
                  placeholder="Price KSH"
                  value={pricePerCoin}
                  onChange={(e) => setPricePerCoin(e.target.value)}
                  className="h-6 text-xs"
                  required
                />
              </div>
              <Input
                type="tel"
                placeholder="+254 XXX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-6 text-xs"
                required
              />
              <Button type="submit" className="w-full h-6 text-xs" disabled={loading}>
                {loading ? 'Posting...' : 'Post'}
              </Button>
            </form>
          </div>
        )}

        {/* Active Offers - Compact */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted-foreground">Active</h4>
            {activeOffers.length > 1 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-4 px-1 text-xs"
              >
                {isExpanded ? <ChevronUp className="w-2 h-2" /> : <ChevronDown className="w-2 h-2" />}
              </Button>
            )}
          </div>
          
          {activeOffers.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">No offers</p>
          ) : (
            <div className="space-y-1">
              {/* Show only first offer by default */}
              <div className="border rounded-sm p-1.5 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium truncate text-xs">{activeOffers[0].seller_name}</span>
                  <Badge variant="default" className="text-xs px-1 h-3 bg-green-500">•</Badge>
                </div>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div className="truncate">{activeOffers[0].coins_for_sale.toLocaleString()}</div>
                  <div className="truncate">@{activeOffers[0].price_per_coin}</div>
                  <div className="truncate">{(activeOffers[0].coins_for_sale * activeOffers[0].price_per_coin).toLocaleString()}</div>
                </div>
              </div>
              
              {/* Collapsible additional offers */}
              {isExpanded && activeOffers.slice(1).map((offer) => (
                <div key={offer.id} className="border rounded-sm p-1.5 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium truncate text-xs">{offer.seller_name}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="default" className="text-xs px-1 h-3 bg-green-500">•</Badge>
                      {offer.user_id === user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="h-3 w-3 p-0 text-destructive"
                        >
                          <Trash2 className="w-2 h-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="truncate">{offer.coins_for_sale.toLocaleString()}</div>
                    <div className="truncate">@{offer.price_per_coin}</div>
                    <div className="truncate">{(offer.coins_for_sale * offer.price_per_coin).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales - Minimized */}
        {recentSales.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">Recent</h4>
            <div className="border rounded-sm p-1.5 text-xs bg-muted/20">
              <div className="flex justify-between items-center">
                <span className="font-medium truncate text-xs">{recentSales[0].seller_name}</span>
                <Badge variant="secondary" className="text-xs px-1 h-3">✓</Badge>
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                <div>{recentSales[0].coins_for_sale.toLocaleString()}</div>
                <div>@{recentSales[0].price_per_coin}</div>
                <div>{(recentSales[0].coins_for_sale * recentSales[0].price_per_coin).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketplacePanel;