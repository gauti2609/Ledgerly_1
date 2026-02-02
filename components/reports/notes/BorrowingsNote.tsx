
import React from 'react';
import { BorrowingsData, BorrowingItem } from '../../../types.ts';

import { ManualInput } from '../../../types.ts';

interface BorrowingsNoteProps {
    data: BorrowingsData;
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

const format = (val: string) => {
    const num = parseFloat(val.replace(/,/g, '')) || 0;
    return num === 0 ? '-' : num.toLocaleString('en-IN', { minimumFractionDigits: 2 });
};

const BorrowingTable: React.FC<{ title: string, items: BorrowingItem[] }> = ({ title, items }) => (
    <div className="mt-4">
        <h4 className="font-semibold text-gray-300 text-sm mb-2">{title}</h4>
        <table className="min-w-full text-xs">
            <thead className="bg-gray-700/50">
                <tr>
                    <th className="p-2 text-left">Nature of Borrowing</th>
                    <th className="p-2 text-left">Classification</th>
                    <th className="p-2 text-right">Amount (CY)</th>
                    <th className="p-2 text-right">Amount (PY)</th>
                    <th className="p-2 text-left">Repayment Terms</th>
                    <th className="p-2 text-left">Default Details</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
                {items.map(item => (
                    <tr key={item.id}>
                        <td className="p-2">{item.nature}</td>
                        <td className="p-2 capitalize">{item.classification}</td>
                        <td className="p-2 text-right font-mono">{format(item.amountCy)}</td>
                        <td className="p-2 text-right font-mono">{format(item.amountPy)}</td>
                        <td className="p-2">{shouldShow(item.repaymentTerms) ? getValue(item.repaymentTerms) : '-'}</td>
                        <td className="p-2">
                            {(shouldShow(item.defaultPeriod) || item.defaultAmount) ?
                                `${shouldShow(item.defaultPeriod) ? getValue(item.defaultPeriod) : ''} ${item.defaultAmount ? '- ' + format(item.defaultAmount) : ''} `
                                : '-'}
                        </td>
                    </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={6} className="text-center p-2 text-gray-500">No {title.toLowerCase()} to report.</td></tr>}
            </tbody>
        </table>
    </div>
);

export const BorrowingsNote: React.FC<BorrowingsNoteProps> = ({ data }) => {
    return (
        <div className="space-y-4">
            <BorrowingTable title="Long-Term Borrowings" items={data.longTerm} />
            <BorrowingTable title="Short-Term Borrowings" items={data.shortTerm} />
            {shouldShow(data.directorGuarantees) && (
                <div className="text-xs">
                    <span className="font-semibold text-gray-400">Guarantees by Directors/Others: </span>
                    <span>{getValue(data.directorGuarantees)}</span>
                </div>
            )}
            {shouldShow(data.reissuableBonds) && (
                <div className="text-xs">
                    <span className="font-semibold text-gray-400">Reissuable Redeemed Bonds/Debentures: </span>
                    <span>{getValue(data.reissuableBonds)}</span>
                </div>
            )}
            {shouldShow(data.undrawnBorrowingFacilities) && (
                <div className="text-xs">
                    <span className="font-semibold text-gray-400">Undrawn Borrowing Facilities (AS 3): </span>
                    <span>{getValue(data.undrawnBorrowingFacilities)}</span>
                </div>
            )}
        </div>
    );
};