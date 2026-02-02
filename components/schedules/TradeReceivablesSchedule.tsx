// components/schedules/TradeReceivablesSchedule.tsx

import React from 'react';
import { TradeReceivablesData, TradeReceivablesAgeingRow } from '../../types.ts';
import { useNumberFormat } from '../../context/NumberFormatContext.tsx';

interface TradeReceivablesScheduleProps {
    title: string;
    data: TradeReceivablesData;
    onUpdate: (data: TradeReceivablesData) => void;
    isFinalized: boolean;
}

const InputField: React.FC<{ label: string; value: string; onChange: (value: string) => void; disabled: boolean; }> =
    ({ label, value, onChange, disabled }) => {
        const { formatAmount, parseAmount } = useNumberFormat();
        const [displayValue, setDisplayValue] = React.useState(formatAmount(value));

        React.useEffect(() => {
            setDisplayValue(formatAmount(value));
        }, [value, formatAmount]);

        return (
            <div>
                <label className="block text-sm font-medium text-gray-400">{label}</label>
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
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-800 disabled:cursor-not-allowed font-mono"
                />
            </div>
        );
    };

const AgeingTable: React.FC<{
    ageingData: TradeReceivablesAgeingRow[];
    onUpdate: (category: TradeReceivablesAgeingRow['category'], field: keyof Omit<TradeReceivablesAgeingRow, 'category'>, value: string) => void;
    isFinalized: boolean;
}> = ({ ageingData, onUpdate, isFinalized }) => {
    const { formatAmount } = useNumberFormat();

    const headers = ['< 6 Months', '6-12 Months', '1-2 Years', '2-3 Years', '> 3 Years', 'Total'];
    const fields: (keyof Omit<TradeReceivablesAgeingRow, 'category'>)[] = ['lessThan6Months', '6MonthsTo1Year', '1To2Years', '2To3Years', 'moreThan3Years'];
    const rowConfig = [
        { category: 'undisputedGood', label: 'Undisputed - Considered Good' },
        { category: 'undisputedDoubtful', label: 'Undisputed - Considered Doubtful' },
        { category: 'disputedGood', label: 'Disputed - Considered Good' },
        { category: 'disputedDoubtful', label: 'Disputed - Considered Doubtful' },
    ] as const;

    const parse = (val: string) => parseFloat(val) || 0;

    return (
        <div>
            <h4 className="font-semibold text-gray-300 mb-2">Trade Receivables Ageing Schedule</h4>
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
                        const total = parse(rowData.lessThan6Months) + parse(rowData['6MonthsTo1Year']) + parse(rowData['1To2Years']) + parse(rowData['2To3Years']) + parse(rowData.moreThan3Years);
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
                        )
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

export const TradeReceivablesSchedule: React.FC<TradeReceivablesScheduleProps> = ({ title, data, onUpdate, isFinalized }) => {

    const handleFieldUpdate = (field: keyof Omit<TradeReceivablesData, 'ageing'>, value: string) => {
        onUpdate({ ...data, [field]: value });
    };

    const handleAgeingUpdate = (category: TradeReceivablesAgeingRow['category'], field: keyof Omit<TradeReceivablesAgeingRow, 'category'>, value: string) => {
        onUpdate({
            ...data,
            ageing: data.ageing.map(row =>
                row.category === category ? { ...row, [field]: value } : row
            )
        });
    };


    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">{title} Schedule</h3>

            <div className="p-4 bg-gray-900/50 rounded-lg">
                <h4 className="font-semibold text-gray-300 mb-2">Classification</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <InputField label="Secured, considered good" value={data.securedGood} onChange={(v) => handleFieldUpdate('securedGood', v)} disabled={isFinalized} />
                    <InputField label="Unsecured, considered good" value={data.unsecuredGood} onChange={(v) => handleFieldUpdate('unsecuredGood', v)} disabled={isFinalized} />
                    <InputField label="Doubtful" value={data.doubtful} onChange={(v) => handleFieldUpdate('doubtful', v)} disabled={isFinalized} />
                    <InputField label="Less: Provision" value={data.provisionForDoubtful} onChange={(v) => handleFieldUpdate('provisionForDoubtful', v)} disabled={isFinalized} />
                </div>
            </div>

            <AgeingTable ageingData={data.ageing} onUpdate={handleAgeingUpdate} isFinalized={isFinalized} />

        </div>
    );
};