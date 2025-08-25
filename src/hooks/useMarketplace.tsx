import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PaymentMethod {
  type: 'phone' | 'bank' | 'paypal' | 'crypto' | 'mobile_money';
  details: string;
  label: string;
}

export interface MarketplaceOffer {
  id: string;
  seller_name: string;
  phone_number: string;
  payment_methods?: PaymentMethod[];
  coins_for_sale: number;
  price_per_coin: number;
  created_at: string;
  user_id: string;
  status: string;
}

export interface MarketplaceFormData {
  coinsToSell: string;
  pricePerCoin: string;
  phoneNumber: string;
  paymentMethods: PaymentMethod[];
}

export const useMarketplace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, [user]);

  // Helper functions
  const isFictionalUser = (offer: MarketplaceOffer): boolean => {
    const isCurrentUser = offer.user_id === user?.id;
    const hasSafaricomNumber = offer.phone_number?.includes('+254 07') || offer.phone_number?.startsWith('07');
    return !isCurrentUser && hasSafaricomNumber;
  };

  const hidePhoneDigits = (phoneNumber: string): string => {
    if (!phoneNumber || phoneNumber.length < 3) return phoneNumber;
    return phoneNumber.slice(0, -3) + '***';
  };

  const displayPhoneNumber = (offer: MarketplaceOffer): string => {
    if (isFictionalUser(offer) && offer.status === 'sold') {
      return hidePhoneDigits(offer.phone_number);
    }
    return offer.phone_number;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone);
  };

  const validateAmount = (amount: string, walletBalance: number): boolean => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= walletBalance;
  };

  const fetchOffers = async () => {
    try {
      if (user) {
        const { data, error } = await supabase
          .from('marketplace')
          .select('*')
          .in('status', ['active', 'sold'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        // Convert payment_methods from Json to PaymentMethod[]
        const processedOffers = (data || []).map(offer => ({
          ...offer,
          payment_methods: Array.isArray(offer.payment_methods) ? (offer.payment_methods as unknown) as PaymentMethod[] : []
        }));
        setOffers(processedOffers);
      } else {
        const { data: activeData, error: activeError } = await supabase
          .rpc('get_marketplace_offers_public');
        
        const { data: soldData, error: soldError } = await supabase
          .from('marketplace')
          .select('id, user_id, seller_name, coins_for_sale, price_per_coin, description, status, created_at, updated_at, payment_methods')
          .eq('status', 'sold')
          .order('created_at', { ascending: false });

        if (activeError) throw activeError;
        if (soldError) throw soldError;

        const allOffers = [
          ...(activeData || []).map(offer => ({ 
            ...offer, 
            phone_number: '', 
            payment_methods: Array.isArray(offer.payment_methods) ? (offer.payment_methods as unknown) as PaymentMethod[] : []
          })),
          ...(soldData || []).map(offer => ({ 
            ...offer, 
            phone_number: '', 
            payment_methods: Array.isArray(offer.payment_methods) ? (offer.payment_methods as unknown) as PaymentMethod[] : []
          }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setOffers(allOffers);
      }
    } catch (error) {
      console.error('Error fetching marketplace offers:', error);
    }
  };

  const createOffer = async (
    formData: MarketplaceFormData, 
    profile: { full_name: string } | null,
    walletBalance: number
  ) => {
    const { coinsToSell, pricePerCoin, phoneNumber, paymentMethods } = formData;

    if (!coinsToSell || !pricePerCoin || (paymentMethods.length === 0 && !phoneNumber)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and at least one payment method",
        variant: "destructive",
      });
      return false;
    }

    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number (10-15 digits)",
        variant: "destructive",
      });
      return false;
    }

    if (!validateAmount(coinsToSell, walletBalance)) {
      toast({
        title: "Error",
        description: "Invalid coin amount or insufficient balance",
        variant: "destructive",
      });
      return false;
    }

    const coinsAmount = parseFloat(coinsToSell);
    const priceAmount = parseFloat(pricePerCoin);
    
    if (priceAmount <= 0) {
      toast({
        title: "Error",
        description: "Price per coin must be greater than 0",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      // Add phone number as payment method if provided
      const allPaymentMethods = [...paymentMethods];
      if (phoneNumber && phoneNumber.trim()) {
        allPaymentMethods.push({
          type: 'phone',
          details: phoneNumber,
          label: 'Phone/M-Pesa'
        });
      }

      const { error } = await supabase
        .from('marketplace')
        .insert({
          user_id: user?.id,
          seller_name: profile?.full_name || 'Anonymous',
          phone_number: phoneNumber || '',
          payment_methods: allPaymentMethods as any, // Cast to any to handle Json type
          coins_for_sale: coinsAmount,
          price_per_coin: priceAmount
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your coin sale offer has been posted to the marketplace",
      });

      await fetchOffers();
      return true;
    } catch (error) {
      console.error('Error creating marketplace offer:', error);
      toast({
        title: "Error",
        description: "Failed to create marketplace offer",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteOffer = async (offerId: string) => {
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

      await fetchOffers();
      return true;
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: "Error",
        description: "Failed to remove offer",
        variant: "destructive",
      });
      return false;
    }
  };

  // Computed values
  const activeOffers = offers.filter(offer => offer.status === 'active');
  const soldOffers = offers.filter(offer => offer.status === 'sold');
  const recentSales = soldOffers.slice(0, 3);

  return {
    offers,
    activeOffers,
    soldOffers,
    recentSales,
    loading,
    fetchOffers,
    createOffer,
    deleteOffer,
    displayPhoneNumber,
    validatePhoneNumber,
    validateAmount,
    isFictionalUser
  };
};