// components/reports/notes/ShareCapitalNote.tsx
import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { ShareCapitalData, ManualInput } from '../../../types.ts';

interface ShareCapitalNoteProps {
    data: ShareCapitalData;
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
    const num = parseFloat(val) || 0;
    return num === 0 ? '-' : num.toLocaleString('en-IN', { minimumFractionDigits: 2 });
};

const formatShares = (val: string) => {
    const num = parseFloat(val) || 0;
    return num === 0 ? '-' : num.toLocaleString('en-IN');
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-4">
        <h4 className="font-semibold text-gray-300 text-sm mb-2">{title}</h4>
        <div className="text-xs">{children}</div>
    </div>
);

export const ShareCapitalNote: React.FC<ShareCapitalNoteProps> = ({ data }) => {
    return (
        <div className="space-y-4">
            <Section title="a. Authorized, Issued and Subscribed Share Capital">
                <table className="min-w-full text-xs">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-2 text-left">Class of Share</th>
                            <th className="p-2 text-right">No of Shares (CY)</th>
                            <th className="p-2 text-right">Amount (CY)</th>
                            <th className="p-2 text-right">No of Shares (PY)</th>
                            <th className="p-2 text-right">Amount (PY)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        <tr className="font-bold"><td colSpan={5} className="p-2">Authorized Capital</td></tr>
                        {data.authorized.map(item => (
                            <tr key={item.id}>
                                <td className="p-2">{item.particular}</td>
                                <td className="p-2 text-right font-mono">{formatShares(item.noOfSharesCy)}</td>
                                <td className="p-2 text-right font-mono">{format(item.amountCy)}</td>
                                <td className="p-2 text-right font-mono">{formatShares(item.noOfSharesPy)}</td>
                                <td className="p-2 text-right font-mono">{format(item.amountPy)}</td>
                            </tr>
                        ))}
                        <tr className="font-bold"><td colSpan={5} className="p-2">Issued, Subscribed and Fully Paid Up</td></tr>
                        {data.subscribed.map(item => (
                            <tr key={item.id}>
                                <td className="p-2">{item.particular}</td>
                                <td className="p-2 text-right font-mono">{formatShares(item.noOfSharesCy)}</td>
                                <td className="p-2 text-right font-mono">{format(item.amountCy)}</td>
                                <td className="p-2 text-right font-mono">{formatShares(item.noOfSharesPy)}</td>
                                <td className="p-2 text-right font-mono">{format(item.amountPy)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Section>

            <Section title="b. Reconciliation of the number of shares outstanding">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h5 className="font-semibold text-gray-400 mb-1">Current Year</h5>
                        <table className="min-w-full text-xs">
                            <tbody className="divide-y divide-gray-700">
                                {data.reconciliationCy.map(r => (
                                    <tr key={r.id}>
                                        <td className="p-1">{r.particular}</td>
                                        <td className="p-1 text-right">{formatShares(r.noOfShares)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h5 className="font-semibold text-gray-400 mb-1">Previous Year</h5>
                        <table className="min-w-full text-xs">
                            <tbody className="divide-y divide-gray-700">
                                {data.reconciliationPy.map(r => (
                                    <tr key={r.id}>
                                        <td className="p-1">{r.particular}</td>
                                        <td className="p-1 text-right">{formatShares(r.noOfShares)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Section>

            {shouldShow(data.rightsPreferences) && (
                <Section title="c. Rights, preferences and restrictions attached to shares">
                    <p className="text-gray-400">{getValue(data.rightsPreferences)}</p>
                </Section>
            )}

            <Section title="d. Details of shareholders holding more than 5% shares">
                <table className="min-w-full text-xs">
                    <thead className="bg-gray-700/50">
                        <tr><th className="p-2 text-left">Name of Shareholder</th><th className="p-2 text-right">No of Shares</th><th className="p-2 text-right">% Holding</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {data.shareholders.map(s => <tr key={s.id}><td className="p-2">{s.name}</td><td className="p-2 text-right">{formatShares(s.noOfShares)}</td><td className="p-2 text-right">{s.percentage}%</td></tr>)}
                        {data.shareholders.length === 0 && <tr><td colSpan={3} className="text-center p-2 text-gray-500">No shareholder holds more than 5% of shares.</td></tr>}
                    </tbody>
                </table>
            </Section>

            <Section title="e. Other Disclosures">
                <div className="space-y-2">
                    {shouldShow(data.holdingCompanyShares) && <div><span className="font-semibold text-gray-400">Shares held by holding company: </span>{getValue(data.holdingCompanyShares)}</div>}
                    {shouldShow(data.fiveYearHistoryBonus) && <div><span className="font-semibold text-gray-400">Shares allotted as fully paid up bonus shares (last 5 yrs): </span>{getValue(data.fiveYearHistoryBonus)}</div>}
                    {shouldShow(data.fiveYearHistoryNoCash) && <div><span className="font-semibold text-gray-400">Shares allotted as fully paid up without payment in cash (last 5 yrs): </span>{getValue(data.fiveYearHistoryNoCash)}</div>}
                    {shouldShow(data.fiveYearHistoryBuyback) && <div><span className="font-semibold text-gray-400">Shares bought back (last 5 yrs): </span>{getValue(data.fiveYearHistoryBuyback)}</div>}
                    {shouldShow(data.convertibleSecurities) && <div><span className="font-semibold text-gray-400">Securities convertible into equity/preference shares: </span>{getValue(data.convertibleSecurities)}</div>}
                    {shouldShow(data.callsUnpaid) && <div><span className="font-semibold text-gray-400">Calls unpaid: </span>{getValue(data.callsUnpaid)}</div>}
                    {shouldShow(data.forfeitedShares) && <div><span className="font-semibold text-gray-400">Forfeited shares: </span>{getValue(data.forfeitedShares)}</div>}
                </div>
            </Section>

            <Section title="f. Promoter Shareholding">
                <table className="min-w-full text-xs">
                    <thead className="bg-gray-700/50">
                        <tr><th className="p-2 text-left">Promoter Name</th><th className="p-2 text-right">No of Shares</th><th className="p-2 text-right">% Total</th><th className="p-2 text-right">% Change</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {data.promoterShareholding.map(p => <tr key={p.id}><td className="p-2">{p.promoterName}</td><td className="p-2 text-right">{formatShares(p.noOfShares)}</td><td className="p-2 text-right">{p.percentageTotal}%</td><td className="p-2 text-right">{p.percentageChange}%</td></tr>)}
                        {data.promoterShareholding.length === 0 && <tr><td colSpan={4} className="text-center p-2 text-gray-500">No promoter shareholding records.</td></tr>}
                    </tbody>
                </table>
            </Section>
        </div>
    );
};