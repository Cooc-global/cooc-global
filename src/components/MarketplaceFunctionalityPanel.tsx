import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useMarketplace } from '@/hooks/useMarketplace';
import { 
  Settings, 
  TrendingUp, 
  Filter, 
  RefreshCw,
  BarChart3,
  Users,
  DollarSign,
  Clock
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MarketplaceFunctionalityPanelProps {
  wallet: { balance: number; locked_balance: number } | null;
  profile: { wallet_address: string; role: string; full_name: string } | null;
}

const MarketplaceFunctionalityPanel = ({ wallet, profile }: MarketplaceFunctionalityPanelProps) => {
  const { user } = useAuth();
  const { activeOffers, soldOffers, loading, fetchOffers } = useMarketplace();
  const [sortBy, setSortBy] = useState('recent');
  const [filterStatus, setFilterStatus] = useState('all');

  // Calculate analytics
  const totalActiveOffers = activeOffers.length;
  const totalSoldOffers = soldOffers.length;
  const userOffers = activeOffers.filter(offer => offer.user_id === user?.id);
  const avgPrice = activeOffers.length > 0 
    ? activeOffers.reduce((sum, offer) => sum + offer.price_per_coin, 0) / activeOffers.length 
    : 0;
  const totalVolume = soldOffers.reduce((sum, offer) => sum + (offer.coins_for_sale * offer.price_per_coin), 0);

  const handleRefresh = () => {
    fetchOffers();
  };

  const getFilteredOffers = () => {
    let offers = filterStatus === 'active' ? activeOffers : 
                 filterStatus === 'sold' ? soldOffers : 
                 [...activeOffers, ...soldOffers];
    
    if (sortBy === 'price_high') {
      offers = offers.sort((a, b) => b.price_per_coin - a.price_per_coin);
    } else if (sortBy === 'price_low') {
      offers = offers.sort((a, b) => a.price_per_coin - b.price_per_coin);
    } else if (sortBy === 'volume') {
      offers = offers.sort((a, b) => (b.coins_for_sale * b.price_per_coin) - (a.coins_for_sale * a.price_per_coin));
    }
    
    return offers;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base">
            <Settings className="w-4 h-4 mr-2" />
            Marketplace Control Panel
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-7 px-2"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
            <TabsTrigger value="management" className="text-xs">Management</TabsTrigger>
            <TabsTrigger value="tools" className="text-xs">Tools</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analytics" className="space-y-3 mt-3">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="border rounded p-2 text-center">
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-primary" />
                  <span className="text-xs font-medium">Active</span>
                </div>
                <div className="text-sm font-bold">{totalActiveOffers}</div>
              </div>
              <div className="border rounded p-2 text-center">
                <div className="flex items-center justify-center mb-1">
                  <BarChart3 className="w-3 h-3 mr-1 text-green-500" />
                  <span className="text-xs font-medium">Sold</span>
                </div>
                <div className="text-sm font-bold">{totalSoldOffers}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="border rounded p-2 text-center">
                <div className="flex items-center justify-center mb-1">
                  <DollarSign className="w-3 h-3 mr-1 text-yellow-500" />
                  <span className="text-xs font-medium">Avg Price</span>
                </div>
                <div className="text-sm font-bold">{avgPrice.toFixed(2)} KSH</div>
              </div>
              <div className="border rounded p-2 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Users className="w-3 h-3 mr-1 text-blue-500" />
                  <span className="text-xs font-medium">My Offers</span>
                </div>
                <div className="text-sm font-bold">{userOffers.length}</div>
              </div>
            </div>
            
            <div className="border rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium flex items-center">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Total Volume
                </span>
                <Badge variant="secondary" className="text-xs">24h</Badge>
              </div>
              <div className="text-lg font-bold">{totalVolume.toLocaleString()} KSH</div>
            </div>
          </TabsContent>
          
          <TabsContent value="management" className="space-y-3 mt-3">
            {/* Filtering and Sorting */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium mb-1 block">Filter by Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Offers</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="sold">Sold Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs font-medium mb-1 block">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="price_high">Price (High)</SelectItem>
                    <SelectItem value="price_low">Price (Low)</SelectItem>
                    <SelectItem value="volume">Volume</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Filtered Results */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Filtered Results</span>
                <Badge variant="outline" className="text-xs">
                  {getFilteredOffers().length} offers
                </Badge>
              </div>
              
              <div className="max-h-32 overflow-y-auto space-y-1">
                {getFilteredOffers().slice(0, 5).map((offer) => (
                  <div key={offer.id} className="border rounded p-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-medium truncate">{offer.seller_name}</span>
                      <Badge 
                        variant={offer.status === 'active' ? 'default' : 'secondary'} 
                        className="text-xs px-1 h-4"
                      >
                        {offer.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground mt-1">
                      <div>{offer.coins_for_sale.toLocaleString()}</div>
                      <div>@{offer.price_per_coin}</div>
                      <div>{(offer.coins_for_sale * offer.price_per_coin).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tools" className="space-y-3 mt-3">
            {/* Quick Actions */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium">Quick Actions</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  Bulk Filter
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Auto Refresh
                </Button>
              </div>
            </div>
            
            {/* Market Insights */}
            <div className="border rounded p-2">
              <h4 className="text-xs font-medium mb-2">Market Insights</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Market Activity:</span>
                  <Badge variant="secondary" className="text-xs">
                    {totalActiveOffers > 5 ? 'High' : totalActiveOffers > 2 ? 'Medium' : 'Low'}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Price Trend:</span>
                  <Badge variant="outline" className="text-xs">
                    {avgPrice > 1.5 ? 'Bullish' : avgPrice > 1.0 ? 'Stable' : 'Bearish'}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* User Performance */}
            {userOffers.length > 0 && (
              <div className="border rounded p-2">
                <h4 className="text-xs font-medium mb-2">Your Performance</h4>
                <div className="text-xs text-muted-foreground">
                  You have {userOffers.length} active offer{userOffers.length !== 1 ? 's' : ''} worth{' '}
                  {userOffers.reduce((sum, offer) => sum + (offer.coins_for_sale * offer.price_per_coin), 0).toLocaleString()} KSH
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MarketplaceFunctionalityPanel;