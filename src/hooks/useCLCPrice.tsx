import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CLCPriceData {
  price: number;
  change: number;
  changePercent: number;
}

export const useCLCPrice = () => {
  const [priceData, setPriceData] = useState<CLCPriceData>({
    price: 10.00,
    change: 0,
    changePercent: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchCurrentPrice = async () => {
    try {
      const { data, error } = await supabase.rpc('get_current_clc_price');
      
      if (error) {
        console.error('Error fetching CLC price:', error);
        return;
      }

      const currentPrice = data ? parseFloat(data.toString()) : 10.00;
      
      // Get price history for change calculation
      const { data: priceHistory, error: historyError } = await supabase
        .from('exchange_rates')
        .select('rate, created_at')
        .eq('currency_pair', 'CLC/KSH')
        .eq('active', false)
        .order('created_at', { ascending: false })
        .limit(1);

      let change = 0;
      let changePercent = 0;

      if (!historyError && priceHistory && priceHistory.length > 0) {
        const previousPrice = parseFloat(priceHistory[0].rate.toString());
        change = currentPrice - previousPrice;
        changePercent = (change / previousPrice) * 100;
      }

      setPriceData({
        price: currentPrice,
        change,
        changePercent
      });
    } catch (error) {
      console.error('Error in fetchCurrentPrice:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentPrice();

    // Set up real-time subscription for price changes
    const channel = supabase
      .channel('clc-price-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'exchange_rates',
          filter: 'currency_pair=eq.CLC/KSH'
        },
        () => {
          fetchCurrentPrice();
        }
      )
      .subscribe();

    // Refresh price every 30 seconds
    const interval = setInterval(fetchCurrentPrice, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return { priceData, loading, refreshPrice: fetchCurrentPrice };
};