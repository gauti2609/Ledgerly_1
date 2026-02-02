import React from 'react';
import { AllData } from '../../types.ts';

interface SOCEProps {
    allData: AllData;
}

export const StatementOfChangesInEquity: React.FC<SOCEProps> = ({ allData }) => {
    const { scheduleData } = allData;
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;

    // A. Equity Share Capital
    const equitySharesCur = scheduleData.companyShareCapital.subscribed.map(s => ({
        particulars: s.particular,
        balanceOpening: s.amountPy,
        changes: (parseFloat(s.amountCy) - parseFloat(s.amountPy)).toFixed(2),
        balanceClosing: s.amountCy
    }));

    const equitySharesPrev = scheduleData.companyShareCapital.subscribed.map(s => ({
        particulars: s.particular,
        balanceOpening: '0.00', // Assuming opening of prev year is unknown or 0 for now as we track Cy/Py
        changes: s.amountPy,
        balanceClosing: s.amountPy
    }));


    // B. Other Equity
    // Matrix of Reserves
    const reserves = scheduleData.companyOtherEquity;

    return (
        <div className="p-8 bg-gray-900 min-h-screen text-gray-200 font-mono text-sm">
            <h2 className="text-2xl font-bold mb-6 text-white text-center border-b border-gray-700 pb-4">Statement of Changes in Equity</h2>

            <section className="mb-8">
                <h3 className="text-lg font-semibold text-brand-blue mb-3">A. Equity Share Capital</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-2 border border-gray-700 text-left">Particulars</th>
                                <th className="p-2 border border-gray-700 text-right">Balance at beginning of current reporting period</th>
                                <th className="p-2 border border-gray-700 text-right">Changes in Equity Share Capital due to prior period errors</th>
                                <th className="p-2 border border-gray-700 text-right">Restated balance at the beginning of the current reporting period</th>
                                <th className="p-2 border border-gray-700 text-right">Changes in equity share capital during the current year</th>
                                <th className="p-2 border border-gray-700 text-right">Balance at the end of the current reporting period</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equitySharesCur.map((row, idx) => (
                                <tr key={idx} className="border-t border-gray-700">
                                    <td className="p-2 border border-gray-700">{row.particulars}</td>
                                    <td className="p-2 border border-gray-700 text-right">{row.balanceOpening}</td>
                                    <td className="p-2 border border-gray-700 text-right">-</td>
                                    <td className="p-2 border border-gray-700 text-right">{row.balanceOpening}</td>
                                    <td className="p-2 border border-gray-700 text-right">{row.changes}</td>
                                    <td className="p-2 border border-gray-700 text-right font-bold bg-gray-800/50">{row.balanceClosing}</td>
                                </tr>
                            ))}
                            {equitySharesCur.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-500">No Equity Share Capital Data</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>

            <section>
                <h3 className="text-lg font-semibold text-brand-blue mb-3">B. Other Equity</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-2 border border-gray-700 text-left w-1/4">Particulars</th>
                                <th className="p-2 border border-gray-700 text-right">Balance at beginning of current reporting period</th>
                                <th className="p-2 border border-gray-700 text-right">Total Comprehensive Income for the current year</th>
                                <th className="p-2 border border-gray-700 text-right">Dividends</th>
                                <th className="p-2 border border-gray-700 text-right">Transfer to retained earnings</th>
                                <th className="p-2 border border-gray-700 text-right">Any other change (to be specified)</th>
                                <th className="p-2 border border-gray-700 text-right">Balance at the end of the current reporting period</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reserves.map((row) => (
                                <tr key={row.id} className="border-t border-gray-700">
                                    <td className="p-2 border border-gray-700 font-semibold">{row.reserveName}</td>
                                    <td className="p-2 border border-gray-700 text-right">{row.opening}</td>
                                    <td className="p-2 border border-gray-700 text-right">{row.additions}</td>
                                    <td className="p-2 border border-gray-700 text-right">-</td>
                                    <td className="p-2 border border-gray-700 text-right">-</td>
                                    <td className="p-2 border border-gray-700 text-right text-red-400">({row.deductions})</td>
                                    <td className="p-2 border border-gray-700 text-right font-bold bg-gray-800/50">{row.closing}</td>
                                </tr>
                            ))}
                            {reserves.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-gray-500">No Other Equity Data</td></tr>}
                        </tbody>
                        <tfoot className="bg-gray-800 font-bold">
                            <tr>
                                <td className="p-2 border border-gray-700">Total</td>
                                <td className="p-2 border border-gray-700 text-right">
                                    {reserves.reduce((s, r) => s + (parseFloat(r.opening.replace(/,/g, '')) || 0), 0).toFixed(2)}
                                </td>
                                <td className="p-2 border border-gray-700 text-right">
                                    {reserves.reduce((s, r) => s + (parseFloat(r.additions.replace(/,/g, '')) || 0), 0).toFixed(2)}
                                </td>
                                <td className="p-2 border border-gray-700 text-right">-</td>
                                <td className="p-2 border border-gray-700 text-right">-</td>
                                <td className="p-2 border border-gray-700 text-right">
                                    ({reserves.reduce((s, r) => s + (parseFloat(r.deductions.replace(/,/g, '')) || 0), 0).toFixed(2)})
                                </td>
                                <td className="p-2 border border-gray-700 text-right text-brand-blue">
                                    {reserves.reduce((s, r) => s + (parseFloat(r.closing.replace(/,/g, '')) || 0), 0).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </section>
        </div>
    );
};
