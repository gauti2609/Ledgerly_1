import React, { createContext, useContext, useMemo } from 'react';

interface NumberFormatContextType {
    formatAmount: (value: number | string | undefined | null) => string;
    parseAmount: (value: string) => string;
    decimalPlaces: number;
}

const NumberFormatContext = createContext<NumberFormatContextType>({
    formatAmount: (val) => String(val || '0'),
    parseAmount: (val) => val.replace(/,/g, ''),
    decimalPlaces: 2,
});

export const useNumberFormat = () => useContext(NumberFormatContext);

interface NumberFormatProviderProps {
    children: React.ReactNode;
    decimalPlaces: number;
    formatStyle: 'Indian' | 'European';
}

export const NumberFormatProvider: React.FC<NumberFormatProviderProps> = ({ children, decimalPlaces, formatStyle }) => {
    const formatter = useMemo(() => {
        const locale = formatStyle === 'European' ? 'en-US' : 'en-IN';
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        });
    }, [decimalPlaces, formatStyle]);

    const formatAmount = (value: number | string | undefined | null): string => {
        if (value === undefined || value === null || value === '') return '';

        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) return String(value);

        return formatter.format(num);
    };

    const parseAmount = (value: string): string => {
        return value.replace(/,/g, '');
    };

    return (
        <NumberFormatContext.Provider value={{ formatAmount, parseAmount, decimalPlaces }}>
            {children}
        </NumberFormatContext.Provider>
    );
};
