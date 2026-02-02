// components/reports/notes/TradeReceivablesNote.tsx
import React from 'react';
import { TradeReceivablesData } from '../../../types.ts';

interface TradeReceivablesNoteProps {
    data: TradeReceivablesData;
}

const format = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
    if (isNaN(num) || num === 0) return '-';
    return new Intl.NumberFormat('en-IN', {minimumFractionDigits: 2}).format(num);
};

const AgeingTable: React.FC<{data: TradeReceivablesData['ageing']}> = ({ data }) => {
    const headers = ['< 6 Months', '6-12 Months', '1-2 Years', '2-3 Years', '> 3 Years', 'Total'];
    const fields: (keyof Omit<TradeReceivablesData['ageing'][0], 'category'>)[] = ['lessThan6Months', '6MonthsTo1Year', '1To2Years', '2To3Years', 'moreThan3Years'];
    const rowConfig = [
        { category: 'undisputedGood', label: 'Undisputed - Considered Good' },
        { category: 'undisputedDoubtful', label: 'Undisputed - Considered Doubtful' },
        { category: 'disputedGood', label: 'Disputed - Considered Good' },
        { category: 'disputedDoubtful', label: 'Disputed - Considered Doubtful' },
    ] as const;

    const parse = (val: string) => parseFloat(val) || 0;
    
    return (
         <table className="min-w-full text-sm border-collapse border border-gray-600 mt-4">
            <caption className="caption-top text-left font-semibold text-gray-300 mb-2">Trade Receivables Ageing</caption>
            <thead className="bg-gray-700/50">
                <tr>
                    <th className="p-2 text-left border border-gray-600">Particulars</th>
                    {headers.map(h => <th key={h} className="p-2 text-right border border-gray-600">{h}</th>)}
                </tr>
            </thead>
            <tbody>
                {rowConfig.map(config => {
                     const rowData = data.find(r => r.category === config.category);
                     if (!rowData) return null;
                     const total = parse(rowData.lessThan6Months) + parse(rowData['6MonthsTo1Year']) + parse(rowData['1To2Years']) + parse(rowData['2To3Years']) + parse(rowData.moreThan3Years);
                    return (
                         <tr key={config.category}>
                            <td className="p-2 border border-gray-600">{config.label}</td>
                            {fields.map(field => (
                                <td key={field} className="p-2 border border-gray-600 text-right font-mono">
                                    {format(rowData[field])}
                                </td>
                            ))}
                             <td className="p-2 border border-gray-600 text-right font-mono bg-gray-800/50">{total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}

export const TradeReceivablesNote: React.FC<TradeReceivablesNoteProps> = ({ data }) => {
    const p = (v:string) => parseFloat(v) || 0;
    const gross = p(data.securedGood) + p(data.unsecuredGood) + p(data.doubtful);
    const net = gross - p(data.provisionForDoubtful);
    return (
        <div className="space-y-4 text-sm">
            <table className="max-w-md">
                 <tbody className="divide-y divide-gray-700">
                    <tr><td className="p-2 pl-4">Secured, considered good</td><td className="p-2 text-right font-mono">{format(data.securedGood)}</td></tr>
                    <tr><td className="p-2 pl-4">Unsecured, considered good</td><td className="p-2 text-right font-mono">{format(data.unsecuredGood)}</td></tr>
                    <tr><td className="p-2 pl-4">Doubtful</td><td className="p-2 text-right font-mono">{format(data.doubtful)}</td></tr>
                    <tr className="border-t-2 border-gray-500"><td className="p-2 font-bold">Gross Receivables</td><td className="p-2 text-right font-mono font-bold">{format(gross)}</td></tr>
                    <tr><td className="p-2 pl-4">Less: Provision for doubtful receivables</td><td className="p-2 text-right font-mono">({format(data.provisionForDoubtful)})</td></tr>
                    <tr className="font-bold bg-gray-700/30"><td className="p-2">Net Receivables</td><td className="p-2 text-right font-mono">{format(net)}</td></tr>
                 </tbody>
            </table>
            <AgeingTable data={data.ageing} />
        </div>
    );
};