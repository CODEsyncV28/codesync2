import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rate: number; // 1 USD = rate units of this currency
  label: string;
}

export type SupportedCurrency = CurrencyInfo;
export type CurrencyCode = string;

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0, label: 'USD ($)' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, label: 'EUR (€)' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79, label: 'GBP (£)' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.5, label: 'INR (₹)' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 155.0, label: 'JPY (¥)' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.52, label: 'AUD (A$)' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rate: 1.36, label: 'CAD (CA$)' },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rate: 3.67, label: 'AED (AED)' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rate: 0.90, label: 'CHF (CHF)' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 1.35, label: 'SGD (S$)' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rate: 5.15, label: 'BRL (R$)' },
  MXN: { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso', rate: 16.8, label: 'MXN (Mex$)' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', rate: 1360.0, label: 'KRW (₩)' },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', rate: 36.5, label: 'THB (฿)' },
};

export interface FormatOptions {
  showCode?: boolean;
  showSymbol?: boolean;
  showDecimal?: boolean;
  compact?: boolean;
  targetCurrency?: string;
}

interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  currencyInfo: CurrencyInfo;
  supportedCurrencies: CurrencyInfo[];
  setCurrency: (code: string) => Promise<void>;
  convert: (usdAmount: number, targetCurrency?: string) => number;
  formatPrice: (usdAmount: number, options?: FormatOptions) => string;
}

const LOCAL_CURRENCY_KEY = 'globetrotter_active_currency';

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserProfile } = useAuth();

  const [currency, setCurrencyState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CURRENCY_KEY);
      if (saved && SUPPORTED_CURRENCIES[saved.toUpperCase()]) {
        return saved.toUpperCase();
      }
      if (user?.preferred_currency && SUPPORTED_CURRENCIES[user.preferred_currency.toUpperCase()]) {
        return user.preferred_currency.toUpperCase();
      }
    } catch {
      // fallback
    }
    return 'USD';
  });

  // Sync with user's preferred currency on login/switch if not manually overridden
  useEffect(() => {
    if (user?.preferred_currency) {
      const clean = user.preferred_currency.toUpperCase();
      if (SUPPORTED_CURRENCIES[clean] && clean !== currency) {
        setCurrencyState(clean);
        localStorage.setItem(LOCAL_CURRENCY_KEY, clean);
      }
    }
  }, [user?.preferred_currency]);

  const currencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD;
  const currencySymbol = currencyInfo.symbol;
  const supportedCurrencies = Object.values(SUPPORTED_CURRENCIES);

  const setCurrency = async (code: string) => {
    const clean = code.toUpperCase();
    if (!SUPPORTED_CURRENCIES[clean]) return;
    
    setCurrencyState(clean);
    try {
      localStorage.setItem(LOCAL_CURRENCY_KEY, clean);
    } catch (err) {
      console.warn('Currency localStorage save note:', err);
    }

    if (user && updateUserProfile) {
      try {
        await updateUserProfile({
          preferred_currency: clean,
          currency_preference: clean,
          home_currency: SUPPORTED_CURRENCIES[clean].label,
        });
      } catch (err) {
        console.warn('User profile currency sync note:', err);
      }
    }
  };

  const convert = (usdAmount: number, targetCurrency?: string): number => {
    const targetCode = (targetCurrency || currency).toUpperCase();
    const info = SUPPORTED_CURRENCIES[targetCode] || SUPPORTED_CURRENCIES.USD;
    const numericAmount = typeof usdAmount === 'number' && !isNaN(usdAmount) ? usdAmount : 0;
    return numericAmount * info.rate;
  };

  const formatPrice = (usdAmount: number, options?: FormatOptions): string => {
    const targetCode = (options?.targetCurrency || currency).toUpperCase();
    const info = SUPPORTED_CURRENCIES[targetCode] || SUPPORTED_CURRENCIES.USD;
    const numericAmount = typeof usdAmount === 'number' && !isNaN(usdAmount) ? usdAmount : 0;
    const converted = numericAmount * info.rate;

    const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'INR', 'IDR'];
    const shouldShowDecimal =
      options?.showDecimal !== undefined
        ? options.showDecimal
        : !noDecimalCurrencies.includes(info.code) && converted < 10 && converted % 1 !== 0;

    let formattedNumber: string;
    if (options?.compact && converted >= 1000000) {
      formattedNumber = (converted / 1000000).toFixed(1) + 'M';
    } else if (options?.compact && converted >= 10000) {
      formattedNumber = (converted / 1000).toFixed(0) + 'K';
    } else if (shouldShowDecimal) {
      formattedNumber = converted.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } else {
      formattedNumber = Math.round(converted).toLocaleString('en-US');
    }

    const symbol = options?.showSymbol === false ? '' : info.symbol;
    const code = options?.showCode ? ` ${info.code}` : '';

    return `${symbol}${formattedNumber}${code}`.trim();
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencySymbol,
        currencyInfo,
        supportedCurrencies,
        setCurrency,
        convert,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
