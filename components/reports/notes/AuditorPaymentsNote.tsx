import React from 'react';
import { AuditorPaymentsData } from '../../../types.ts';

interface AuditorPaymentsNoteProps {
    data: AuditorPaymentsData;
}

const formatCurrency = (val: string): string => {
    const num = parseFloat(val.replace(/,/g, ''));
    if (isNaN(num) || num === 0) return '-';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export const AuditorPaymentsNote: React.FC<AuditorPaymentsNoteProps> = ({ data }) => {
    return (
        <div className="overflow-x-auto max-w-md">
            <table className="min-w-full text-sm">
                <tbody className="divide-y divide-gray-700">
                    <tr><td className="p-2">As Auditor</td><td className="p-2 text-right font-mono">{formatCurrency(data.asAuditor)}</td></tr>
                    <tr><td className="p-2">For Taxation Matters</td><td className="p-2 text-right font-mono">{formatCurrency(data.forTaxation)}</td></tr>
                    <tr><td className="p-2">For Company Law Matters</td><td className="p-2 text-right font-mono">{formatCurrency(data.forCompanyLaw)}</td></tr>
                    <tr><td className="p-2">For Management Services</td><td className="p-2 text-right font-mono">{formatCurrency(data.forManagement)}</td></tr>
                    <tr><td className="p-2">For Other Services</td><td className="p-2 text-right font-mono">{formatCurrency(data.forOther)}</td></tr>
                    <tr><td className="p-2">For Reimbursement of Expenses</td><td className="p-2 text-right font-mono">{formatCurrency(data.forReimbursement)}</td></tr>
                </tbody>
            </table>
        </div>
    );
};