// components/reports/notes/TradePayablesMsmeNote.tsx
import React from 'react';
import { MsmeDisclosureData } from '../../../types.ts';

interface TradePayablesMsmeNoteProps {
    data: MsmeDisclosureData;
}

const format = (val: string) => {
    const num = parseFloat(val) || 0;
    return num === 0 ? '-' : num.toLocaleString('en-IN', {minimumFractionDigits: 2});
};

const NoteRow: React.FC<{label: string; value: string}> = ({label, value}) => (
    <tr>
        <td className="p-2 w-3/4">{label}</td>
        <td className="p-2 w-1/4 text-right font-mono">{format(value)}</td>
    </tr>
)

export const TradePayablesMsmeNote: React.FC<TradePayablesMsmeNoteProps> = ({ data }) => {
    return (
        <div className="overflow-x-auto max-w-2xl">
            <p className="text-xs text-gray-400 mb-2">Details of dues to Micro, Small and Medium Enterprises as defined under the MSMED Act, 2006.</p>
            <table className="min-w-full text-sm">
                <tbody className="divide-y divide-gray-700">
                    <NoteRow label="Principal amount and the interest due thereon remaining unpaid to any supplier" value={data.principalAndInterestDue} />
                    <NoteRow label="Interest paid by the buyer in terms of section 16 of the MSMED Act, 2006" value={data.interestPaid} />
                    <NoteRow label="Interest due and payable for the period of delay in making payment" value={data.interestDueAndPayable} />
                    <NoteRow label="Interest accrued and remaining unpaid at the end of each accounting year" value={data.interestAccruedAndUnpaid} />
                    <NoteRow label="Further interest remaining due and payable even in the succeeding years" value={data.furtherInterest} />
                </tbody>
            </table>
        </div>
    );
};
