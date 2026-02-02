import React from 'react';
import { TradePayablesData, TradePayablesAgeingRow } from '../../types.ts';
import { useNumberFormat } from '../../context/NumberFormatContext.tsx';

interface TradePayablesScheduleProps {
    data: TradePayablesData;
    onUpdate: (data: TradePayablesData) => void;
    isFinalized: boolean;
}

const AgeingTable: React.FC<{
    ageingData: TradePayablesAgeingRow[];
    onUpdate: (category: TradePayablesAgeingRow['category'], field: keyof Omit<TradePayablesAgeingRow, 'category'>, value: string) => void;
    isFinalized: boolean;
}> = ({ ageingData, onUpdate, isFinalized }) => {
    const { formatAmount } = useNumberFormat();

    const headers = ['< 1 Year', '1-2 Years', '2-3 Years', '> 3 Years', 'Total'];
    const fields: (keyof Omit<TradePayablesAgeingRow, 'category'>)[] = ['lessThan1Year', '1To2Years', '2To3Years', 'moreThan3Years'];
    const rowConfig = [
        { category: 'msme', label: 'MSME' },
        { category: 'others', label: 'Others' },
        { category: 'disputedMsme', label: 'Disputed Dues - MSME' },
        { category: 'disputedOthers', label: 'Disputed Dues - Others' },
    ] as const;

    const parse = (val: string) => parseFloat(val) || 0;

    return (
        <div>
            <h4 className="font-semibold text-gray-300 mb-2">Trade Payables Ageing Schedule</h4>
            <table className="min-w-full text-sm border-collapse border border-gray-600">
                <thead className="bg-gray-700/50">
                    <tr>
                        <th className="p-2 text-left border border-gray-600">Particulars</th>
                        {headers.map(h => <th key={h} className="p-2 text-right border border-gray-600">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rowConfig.map(config => {
                        const rowData = ageingData.find(r => r.category === config.category);
                        if (!rowData) return null;
                        const total = parse(rowData.lessThan1Year) + parse(rowData['1To2Years']) + parse(rowData['2To3Years']) + parse(rowData.moreThan3Years);
                        return (
                            <tr key={config.category} className="hover:bg-gray-700/30">
                                <td className="p-2 border border-gray-600">{config.label}</td>
                                {fields.map(field => (
                                    <td key={field} className="p-0 border border-gray-600">
                                        <AgeingInput
                                            value={rowData[field]}
                                            onChange={(v) => onUpdate(config.category, field, v)}
                                            disabled={isFinalized}
                                        />
                                    </td>
                                ))}
                                <td className="p-2 border border-gray-600 text-right font-mono bg-gray-800/50">{formatAmount(total)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const AgeingInput: React.FC<{ value: string; onChange: (value: string) => void; disabled: boolean; }> = ({ value, onChange, disabled }) => {
    const { formatAmount, parseAmount } = useNumberFormat();
    const [displayValue, setDisplayValue] = React.useState(formatAmount(value));

    React.useEffect(() => {
        setDisplayValue(formatAmount(value));
    }, [value, formatAmount]);

    return (
        <input
            type="text"
            value={displayValue}
            onChange={(e) => setDisplayValue(e.target.value)}
            onBlur={() => {
                const parsed = parseAmount(displayValue);
                onChange(parsed);
                setDisplayValue(formatAmount(parsed));
            }}
            disabled={disabled}
            className="w-full h-full bg-transparent p-2 text-right border-none focus:ring-0 focus:outline-none focus:bg-gray-700/50 font-mono"
        />
    );
};

export const TradePayablesSchedule: React.FC<TradePayablesScheduleProps> = ({ data, onUpdate, isFinalized }) => {
    const { formatAmount } = useNumberFormat();

    const handleAgeingUpdate = (category: TradePayablesAgeingRow['category'], field: keyof Omit<TradePayablesAgeingRow, 'category'>, value: string) => {
        onUpdate({
            ...data,
            ageing: data.ageing.map(row =>
                row.category === category ? { ...row, [field]: value } : row
            )
        });
    };

    const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
    const totalPayables = data.ageing.reduce((total, row) => {
        return total + parse(row.lessThan1Year) + parse(row['1To2Years']) + parse(row['2To3Years']) + parse(row.moreThan3Years);
    }, 0);

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Trade Payables Schedule</h3>

            <AgeingTable ageingData={data.ageing} onUpdate={handleAgeingUpdate} isFinalized={isFinalized} />

            <div className="mt-4 p-4 bg-gray-900/50 rounded-lg text-sm max-w-sm">
                <h4 className="font-bold text-gray-300">Summary</h4>
                <div className="flex justify-between mt-2 pt-2 border-t border-gray-600">
                    <span className="font-bold">Total Trade Payables:</span>
                    <span className="font-mono font-bold">{formatAmount(totalPayables)}</span>
                </div>
            </div>
        </div>
    );
};