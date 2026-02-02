import React, { useState, useEffect } from 'react';
import { useNumberFormat } from '../context/NumberFormatContext.tsx';

interface FormattedInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export const FormattedInput: React.FC<FormattedInputProps> = ({ value, onChange, placeholder, disabled, className }) => {
    const { formatAmount, parseAmount } = useNumberFormat();
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        // Sync display value when prop value changes or formatter changes
        setDisplayValue(formatAmount(value));
    }, [value, formatAmount]);

    const handleBlur = () => {
        const parsed = parseAmount(displayValue);
        // Clean up: remove commas, ensure it's a valid number string
        const cleanValue = parsed === '' ? '' : parsed;

        onChange(cleanValue);
        // Re-format display value to ensure consistency (e.g. adding decimals)
        setDisplayValue(formatAmount(cleanValue));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayValue(e.target.value);
    };

    return (
        <input
            type="text"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
        />
    );
};
