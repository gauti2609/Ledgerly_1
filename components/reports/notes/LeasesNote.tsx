// components/reports/notes/LeasesNote.tsx
import React from 'react';
import { LeasesData, MlpReconciliation, ManualInput } from '../../../types.ts';

interface LeasesNoteProps {
    data: LeasesData;
}

const getValue = (val: string | ManualInput | undefined): string => {
    if (!val) return '';
    return typeof val === 'string' ? val : val.value;
};

// Check if any manual input is selected in the MLP data, or if values are present (legacy)
const isMlpVisible = (data: MlpReconciliation): boolean => {
    const check = (val: string | ManualInput) => {
        if (typeof val === 'string') return parseFloat(val) > 0;
        return val.isSelected; // Only care about selection, value might be 0 but user wants to show it
    };
    return check(data.notLaterThan1Year) || check(data.laterThan1YearAndNotLaterThan5Years) || check(data.laterThan5Years);
}

const shouldShow = (val: string | ManualInput | undefined): boolean => {
    if (!val) return false;
    if (typeof val === 'string') return val.length > 0;
    return val.isSelected;
};

const format = (val: string) => {
    const num = parseFloat(val) || 0;
    return num === 0 ? '-' : num.toLocaleString('en-IN', { minimumFractionDigits: 2 });
};

const MlpTable: React.FC<{ title: string, data: MlpReconciliation }> = ({ title, data }) => {
    // If none of the rows are selected/visible, don't show the table at all? 
    // Or show empty table? For notes, usually omit if empty.
    if (!isMlpVisible(data)) return null;

    const parse = (val: string | ManualInput) => parseFloat(getValue(val)) || 0;
    const total = parse(data.notLaterThan1Year) + parse(data.laterThan1YearAndNotLaterThan5Years) + parse(data.laterThan5Years);

    // Helper to conditionally render row
    const renderRow = (label: string, val: string | ManualInput) => {
        if (!shouldShow(val)) return null;
        return <tr><td className="p-1 pl-4 w-3/4">{label}</td><td className="p-1 text-right font-mono">{format(getValue(val))}</td></tr>;
    };

    return (
        <div className="mt-2">
            <h4 className="font-semibold text-gray-300 text-sm mb-1">{title}</h4>
            <table className="min-w-full text-xs max-w-lg">
                <tbody className="divide-y divide-gray-700">
                    {renderRow("Not later than one year", data.notLaterThan1Year)}
                    {renderRow("Later than one year and not later than five years", data.laterThan1YearAndNotLaterThan5Years)}
                    {renderRow("Later than five years", data.laterThan5Years)}
                    <tr className="font-bold border-t-2 border-gray-600"><td className="p-1">Total</td><td className="p-1 text-right font-mono">{format(total.toString())}</td></tr>
                </tbody>
            </table>
        </div>
    );
}

export const LeasesNote: React.FC<LeasesNoteProps> = ({ data }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-bold text-gray-200">Lessee Arrangements</h3>
                <MlpTable title="Future Minimum Lease Payments under non-cancellable Finance Leases" data={data.lesseeFinanceMlp} />
                <MlpTable title="Future Minimum Lease Payments under non-cancellable Operating Leases" data={data.lesseeOperatingMlp} />
                {shouldShow(data.lesseeGeneralDescription) && (
                    <div className="mt-2 text-xs">
                        <p className="font-semibold text-gray-400">General Description:</p>
                        <p className="italic text-gray-500">{getValue(data.lesseeGeneralDescription)}</p>
                    </div>
                )}
            </div>
            <div className="pt-4 border-t border-gray-700">
                <h3 className="font-bold text-gray-200">Lessor Arrangements</h3>
                <MlpTable title="Future Minimum Lease Payments under non-cancellable Finance Leases" data={data.lessorFinanceMlp} />
                <MlpTable title="Future Minimum Lease Payments under non-cancellable Operating Leases" data={data.lessorOperatingMlp} />
                {shouldShow(data.lessorGeneralDescription) && (
                    <div className="mt-2 text-xs">
                        <p className="font-semibold text-gray-400">General Description:</p>
                        <p className="italic text-gray-500">{getValue(data.lessorGeneralDescription)}</p>
                    </div>
                )}
            </div>
        </div>
    );
};