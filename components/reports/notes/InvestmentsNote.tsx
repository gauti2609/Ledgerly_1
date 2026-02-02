import React from 'react';
import { InvestmentsScheduleData, ManualInput } from '../../../types.ts';

interface InvestmentsNoteProps {
    data: InvestmentsScheduleData;
}

const getValue = (val: string | ManualInput | undefined): string => {
    if (!val) return '';
    return typeof val === 'string' ? val : val.value;
};

const shouldShow = (val: string | ManualInput | undefined): boolean => {
    if (!val) return false;
    if (typeof val === 'string') return val.length > 0;
    return val.isSelected;
};

const formatCurrency = (val: string): string => {
    const num = parseFloat(val.replace(/,/g, ''));
    if (isNaN(num) || num === 0) return '-';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export const InvestmentsNote: React.FC<InvestmentsNoteProps> = ({ data }) => {
    const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;
    const totalCy = data.items.reduce((sum, item) => sum + parse(item.amountCy), 0);
    const totalPy = data.items.reduce((sum, item) => sum + parse(item.amountPy), 0);

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-2 text-left font-medium w-2/5">Particulars</th>
                            <th className="p-2 text-left font-medium">Classification</th>
                            <th className="p-2 text-right font-medium">Market Value</th>
                            <th className="p-2 text-right font-medium">Cost (CY)</th>
                            <th className="p-2 text-right font-medium">Cost (PY)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                        {data.items.map(item => (
                            <tr key={item.id}>
                                <td className="p-2">{item.particular}</td>
                                <td className="p-2 capitalize">{item.classification}</td>
                                <td className="p-2 text-right font-mono">{formatCurrency(item.marketValue)}</td>
                                <td className="p-2 text-right font-mono">{formatCurrency(item.amountCy)}</td>
                                <td className="p-2 text-right font-mono">{formatCurrency(item.amountPy)}</td>
                            </tr>
                        ))}
                        <tr className="font-bold bg-gray-700/30">
                            <td className="p-2" colSpan={3}>Total</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(totalCy.toString())}</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(totalPy.toString())}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {shouldShow(data.provisionForDiminution) && (
                <div>
                    <span className="font-semibold text-gray-400">Aggregate Provision for Diminution in Value: </span>
                    <span className="font-mono">{formatCurrency(getValue(data.provisionForDiminution))}</span>
                </div>
            )}
        </div>
    );
};