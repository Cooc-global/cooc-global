import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CurrencyRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  active: boolean;
  created_at: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'KSH', name: 'Kenyan Shilling', symbol: 'KSH', flag: '🇰🇪' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', flag: '🇹🇿' }
];

export const useCurrency = () => {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('currency_rates')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRates(data || []);
    } catch (error) {
      console.error('Error fetching currency rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;

    // Find direct conversion rate
    const directRate = rates.find(
      rate => rate.from_currency === fromCurrency && rate.to_currency === toCurrency
    );

    if (directRate) {
      return amount * directRate.rate;
    }

    // If no direct rate, convert through USD
    const fromToUSD = rates.find(
      rate => rate.from_currency === fromCurrency && rate.to_currency === 'USD'
    );
    const usdToTarget = rates.find(
      rate => rate.from_currency === 'USD' && rate.to_currency === toCurrency
    );

    if (fromToUSD && usdToTarget) {
      return amount * fromToUSD.rate * usdToTarget.rate;
    }

    // Fallback: return original amount if no conversion possible
    return amount;
  };

  const formatCurrency = (amount: number, currencyCode: string): string => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    const symbol = currency?.symbol || currencyCode;
    
    // Format with appropriate decimal places based on currency
    const decimals = ['UGX', 'TZS', 'NGN'].includes(currencyCode) ? 0 : 2;
    
    return `${symbol} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  };

  const getCurrencySymbol = (currencyCode: string): string => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  const getExchangeRate = (fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return 1;

    const rate = rates.find(
      r => r.from_currency === fromCurrency && r.to_currency === toCurrency
    );

    return rate?.rate || 1;
  };

  return {
    rates,
    loading,
    convertCurrency,
    formatCurrency,
    getCurrencySymbol,
    getExchangeRate,
    fetchRates,
    supportedCurrencies: SUPPORTED_CURRENCIES
  };
};