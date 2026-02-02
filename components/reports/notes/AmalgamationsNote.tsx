// components/reports/notes/AmalgamationsNote.tsx
import React from 'react';
import { AmalgamationData, ManualInput } from '../../../types.ts';

interface AmalgamationsNoteProps {
    data: AmalgamationData;
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

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-3">
        <h4 className="font-semibold text-gray-300 text-sm mb-1">{title}</h4>
        <div className="text-xs text-gray-400 space-y-1">{children}</div>
    </div>
)

export const AmalgamationsNote: React.FC<AmalgamationsNoteProps> = ({ data }) => {

    // Logic: if amalgamatedCompany is not present, we assume no amalgamation?
    // Or check if user deselected it? 
    // If user unchecks "Name of other company", does it mean they don't want to show the note, or just that specific line?
    // Usually if the main "Amalgamated Company" is unchecked, the whole note might be irrelevant or hidden.
    // Let's assume if the company name is missing (empty or unchecked), we show the "No amalgamation" msg or null.

    // But wait, the standard text says "During the period... with [Company Name]".
    // If CompanyName is hidden, the sentence breaks.
    // So if CompanyName is hidden, we probably shouldn't show this main paragraph.

    const companyName = getValue(data.amalgamatedCompany);
    const showCompany = shouldShow(data.amalgamatedCompany);

    if (!companyName || !showCompany) {
        // If user hides the main company name, we assume they want to hide the disclosure or there is none.
        // However, existing code showed "No amalgamation to report" if empty.
        // We can keep that behavior if companyName is empty text.
        // But if it is UNCHECKED, we might render nothing?
        // Let's stick to: if no content or hidden, show nothing or placeholder.
        // If the user actively unchecks it, it implies "don't show".
        if (!companyName) return <p className="text-sm text-gray-500 italic">No amalgamation to report during the period.</p>;
        // If it has a name but is unchecked -> return null? Or just hide that part?
        // Let's assume unchecked means "don't disclose this detail".
        // But for the main sentence, it's critical.
    }

    const parse = (val: string) => parseFloat(val) || 0;
    const totalConsideration = data.consideration.reduce((sum, item) => sum + parse(item.amount), 0);

    return (
        <div className="space-y-4 text-sm">
            {shouldShow(data.amalgamatedCompany) && (
                <p>
                    During the period, the company underwent an amalgamation in the nature of a <span className="font-semibold">{data.nature}</span> with {getValue(data.amalgamatedCompany)}, effective from {getValue(data.effectiveDate)}.
                    {shouldShow(data.accountingMethod) && <span> The amalgamation has been accounted for using the <span className="font-semibold">{getValue(data.accountingMethod)}</span>.</span>}
                </p>
            )}

            <Section title="Details of Consideration">
                <table className="min-w-full text-xs">
                    <tbody className="divide-y divide-gray-700">
                        {data.consideration.map(item => (
                            <tr key={item.id}><td className="p-1">{item.particular}</td><td className="p-1 text-right font-mono">{format(item.amount)}</td></tr>
                        ))}
                        <tr className="font-bold border-t-2 border-gray-500">
                            <td className="p-1">Total Consideration</td><td className="p-1 text-right font-mono">{format(totalConsideration.toString())}</td>
                        </tr>
                    </tbody>
                </table>
            </Section>

            {shouldShow(data.treatmentOfReserves) && (
                <Section title="Treatment of Reserves">
                    <p className="italic">{getValue(data.treatmentOfReserves)}</p>
                </Section>
            )}

            {shouldShow(data.additionalInfo) && (
                <Section title="Additional Information">
                    <p className="italic">{getValue(data.additionalInfo)}</p>
                </Section>
            )}
        </div>
    );
};