/**
 * Currency Context
 * 
 * Provides currency settings throughout the app.
 * 
 * USAGE:
 *   import { useCurrency } from '../context/CurrencyContext';
 *   const { currency, symbol, formatMoney } = useCurrency();
 *   formatMoney(1000) => "Rs. 1,000" or "$1,000"
 */

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import config from '../src/config';

const CurrencyContext = createContext();

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        // Return defaults if not in provider
        return {
            currency: 'USD',
            symbol: '$',
            formatMoney: (amount) => `$${Number(amount || 0).toLocaleString()}`,
            settings: {},
            loading: false,
            refreshSettings: () => { }
        };
    }
    return context;
};

export const CurrencyProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        currency: 'USD',
        currencySymbol: '$',
        absenceDeduction: 0,
        halfDayDeduction: 0,
        lateDeduction: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await axios.get(`${config.API_URL}/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data) {
                setSettings(response.data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    // Format money with currency symbol
    const formatMoney = (amount) => {
        const num = Number(amount || 0);
        const formatted = num.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });

        // Symbol position based on currency
        if (settings.currency === 'USD') {
            return `$${formatted}`;
        } else if (settings.currency === 'INR') {
            return `₹${formatted}`;
        } else {
            return `Rs. ${formatted}`;
        }
    };

    const value = {
        currency: settings.currency,
        symbol: settings.currencySymbol,
        absenceDeduction: settings.absenceDeduction,
        halfDayDeduction: settings.halfDayDeduction,
        lateDeduction: settings.lateDeduction,
        settings,
        formatMoney,
        loading,
        refreshSettings: fetchSettings
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};
