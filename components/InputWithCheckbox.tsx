import React, { useEffect } from 'react';
import { ManualInput } from '../types.ts';

interface InputWithCheckboxProps {
    value: ManualInput | string;
    onChange: (value: ManualInput) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
    rows?: number; // If rows > 1, render textarea
}

export const InputWithCheckbox: React.FC<InputWithCheckboxProps> = ({
    value,
    onChange,
    placeholder,
    label,
    disabled = false,
    className = "",
    rows = 1
}) => {
    // Normalize value to ManualInput structure
    const inputValue = typeof value === 'string' ? value : value.value;
    const isSelected = typeof value === 'string' ? (value.length > 0) : value.isSelected;

    // Helper to trigger change
    const update = (newValue: string, newSelected: boolean) => {
        onChange({ value: newValue, isSelected: newSelected });
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        update(e.target.value, isSelected);
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        update(inputValue, e.target.checked);
    };

    return (
        <div className={`flex flex-col space-y-1 ${className}`}>
            {label && <label className="text-sm font-medium text-gray-400">{label}</label>}
            <div className="flex items-start space-x-2">
                <div className="pt-2"> {/* Align checkbox with first line of text */}
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={handleCheckboxChange}
                        disabled={disabled}
                        className="w-4 h-4 text-brand-blue bg-gray-700 border-gray-600 rounded focus:ring-brand-blue focus:ring-offset-gray-900"
                    />
                </div>
                {rows > 1 ? (
                    <textarea
                        value={inputValue}
                        onChange={handleTextChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={rows}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue disabled:bg-gray-800 disabled:text-gray-500 resize-y"
                    />
                ) : (
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleTextChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue disabled:bg-gray-800 disabled:text-gray-500"
                    />
                )}
            </div>
        </div>
    );
};
