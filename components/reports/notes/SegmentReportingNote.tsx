// components/reports/notes/SegmentReportingNote.tsx
import React from 'react';
import { SegmentReportingData } from '../../../types.ts';

interface SegmentReportingNoteProps {
    data: SegmentReportingData;
}

const format = (val: string) => {
    const num = parseFloat(val) || 0;
    return num === 0 ? '-' : num.toLocaleString('en-IN', {minimumFractionDigits: 2});
};

export const SegmentReportingNote: React.FC<SegmentReportingNoteProps> = ({ data }) => {
    
    const parse = (val: string) => parseFloat(val) || 0;
    
    const totalRevenue = data.items.reduce((sum, item) => sum + parse(item.revenue), 0);
    const totalResult = data.items.reduce((sum, item) => sum + parse(item.result), 0);
    const totalAssets = data.items.reduce((sum, item) => sum + parse(item.assets), 0);
    const totalLiabilities = data.items.reduce((sum, item) => sum + parse(item.liabilities), 0);
    
    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-400">
                The company's primary segment reporting is based on its business segments.
            </p>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-2 text-left">Segment</th>
                            <th className="p-2 text-right">Revenue</th>
                            <th className="p-2 text-right">Result</th>
                            <th className="p-2 text-right">Assets</th>
                            <th className="p-2 text-right">Liabilities</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                        {data.items.map(item => (
                            <tr key={item.id}>
                                <td className="p-2 font-semibold">{item.segmentName}</td>
                                <td className="p-2 text-right font-mono">{format(item.revenue)}</td>
                                <td className="p-2 text-right font-mono">{format(item.result)}</td>
                                <td className="p-2 text-right font-mono">{format(item.assets)}</td>
                                <td className="p-2 text-right font-mono">{format(item.liabilities)}</td>
                            </tr>
                        ))}
                        <tr className="font-bold bg-gray-700/30">
                            <td className="p-2">Total</td>
                            <td className="p-2 text-right font-mono">{totalRevenue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                            <td className="p-2 text-right font-mono">{totalResult.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                            <td className="p-2 text-right font-mono">{totalAssets.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                            <td className="p-2 text-right font-mono">{totalLiabilities.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                        </tr>
                        {/* Reconciliation items would be added here in a real-world scenario */}
                    </tbody>
                </table>
            </div>
        </div>
    );
};