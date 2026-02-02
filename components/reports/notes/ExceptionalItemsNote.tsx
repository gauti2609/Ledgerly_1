import React from 'react';
import { ExceptionalItem } from '../../../types.ts';

interface ExceptionalItemsNoteProps {
    data: ExceptionalItem[];
}

const formatCurrency = (val: string): string => {
    const num = parseFloat(val.replace(/,/g, ''));
    if (isNaN(num) || num === 0) return '-';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export const ExceptionalItemsNote: React.FC<ExceptionalItemsNoteProps> = ({ data }) => {
    
    const exceptional = data.filter(i => i.type === 'exceptional');
    const extraordinary = data.filter(i => i.type === 'extraordinary');
    const priorPeriod = data.filter(i => i.type === 'priorPeriod');
    
    return (
        <div className="overflow-x-auto">
             <table className="min-w-full text-sm">
                <thead className="bg-gray-700/50">
                    <tr>
                        <th className="p-2 text-left font-medium w-3/5">Particulars</th>
                        <th className="p-2 text-right font-medium">Amount CY (₹)</th>
                        <th className="p-2 text-right font-medium">Amount PY (₹)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                    {exceptional.length > 0 && <tr className="font-semibold"><td colSpan={3} className="p-2">Exceptional Items</td></tr>}
                    {exceptional.map(item => <tr key={item.id}><td className="p-2 pl-6">{item.particular}</td><td className="p-2 text-right font-mono">{formatCurrency(item.amountCy)}</td><td className="p-2 text-right font-mono">{formatCurrency(item.amountPy)}</td></tr>)}
                    
                    {extraordinary.length > 0 && <tr className="font-semibold"><td colSpan={3} className="p-2">Extraordinary Items</td></tr>}
                    {extraordinary.map(item => <tr key={item.id}><td className="p-2 pl-6">{item.particular}</td><td className="p-2 text-right font-mono">{formatCurrency(item.amountCy)}</td><td className="p-2 text-right font-mono">{formatCurrency(item.amountPy)}</td></tr>)}

                    {priorPeriod.length > 0 && <tr className="font-semibold"><td colSpan={3} className="p-2">Prior Period Items</td></tr>}
                    {priorPeriod.map(item => <tr key={item.id}><td className="p-2 pl-6">{item.particular}</td><td className="p-2 text-right font-mono">{formatCurrency(item.amountCy)}</td><td className="p-2 text-right font-mono">{formatCurrency(item.amountPy)}</td></tr>)}
                    
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={3} className="p-4 text-center text-xs text-gray-500">No exceptional, extraordinary or prior period items to report.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};