import React from 'react';
// FIX: Add file extension to fix module resolution error.
import { AllData, GenericScheduleItem } from '../../../types.ts';
import { formatNumber } from '../../../utils/formatNumber.ts';

interface GenericNoteProps {
    title: string;
    data: GenericScheduleItem[];
    allData: AllData;
    noteId: string;
}

export const GenericNote: React.FC<GenericNoteProps> = ({ title, data, allData, noteId }) => {
    const { scheduleData, trialBalanceData } = allData;
    const { roundingUnit } = scheduleData.entityInfo;
    const format = (num: number) => formatNumber(num, roundingUnit);

    // 1. Get all line items for this note
    const lineItems = scheduleData.noteLineItems.filter(item => item.noteId === noteId);

    // 2. Group and sum trial balance data by line item (Custom User Defined Lines)
    const aggregatedLineItems = lineItems.map(lineItem => {
        const sumCy = trialBalanceData
            .filter(tb => tb.noteLineItemId === lineItem.id)
            .reduce((sum, current) => sum + current.closingCy, 0);

        const sumPy = trialBalanceData
            .filter(tb => tb.noteLineItemId === lineItem.id)
            .reduce((sum, current) => sum + current.closingPy, 0);

        return { id: lineItem.id, particular: lineItem.name, amountCy: sumCy, amountPy: sumPy };
    });

    // 2.5 Auto-populate Standard Groupings based on Note ID
    const minorHeadMap: Record<string, string> = {
        'revenue': 'C.10',
        'otherIncome': 'C.20',
        'purchases': 'C.40',
        'finance': 'C.70',
        'otherExpenses': 'C.90',
        'otherCurrentAssets': 'A.140', // Use A.140 for other current assets
        'otherNonCurrentAssets': 'A.80',
        'otherCurrentLiabilities': 'B.90',
        'otherLongTermLiabilities': 'B.50',
    };

    const targetMinorHead = minorHeadMap[noteId];
    let standardGroupingItems: { id: string, particular: string, amountCy: number, amountPy: number }[] = [];

    if (targetMinorHead && allData.masters && allData.masters.groupings) {
        const groupings = allData.masters.groupings.filter(g => g.minorHeadCode === targetMinorHead);

        standardGroupingItems = groupings.map(grouping => {
            const relevantLedgers = trialBalanceData.filter(tb =>
                tb.groupingCode === grouping.code &&
                !tb.noteLineItemId // Ensure it's not already part of a custom line item
            );

            const sumCy = relevantLedgers.reduce((sum, item) => sum + item.closingCy, 0);
            const sumPy = relevantLedgers.reduce((sum, item) => sum + item.closingPy, 0);

            if (sumCy === 0 && sumPy === 0) return null;

            return {
                id: grouping.code,
                particular: grouping.name,
                amountCy: sumCy,
                amountPy: sumPy
            };
        }).filter((item): item is NonNullable<typeof item> => item !== null);
    }

    // 3. Include items mapped directly to the generic schedule (Manual Entries)
    const directMappedItems = data.map(item => ({
        id: item.id,
        particular: item.particular,
        amountCy: parseFloat(item.amountCy) || 0,
        amountPy: parseFloat(item.amountPy) || 0,
    }));

    const combinedData = [...standardGroupingItems, ...aggregatedLineItems, ...directMappedItems];

    const totalCy = combinedData.reduce((sum, item) => sum + item.amountCy, 0);
    const totalPy = combinedData.reduce((sum, item) => sum + item.amountPy, 0);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-700/50">
                    <tr>
                        <th className="p-2 text-left font-medium w-3/5">Particulars</th>
                        <th className="p-2 text-right font-medium">Amount CY ({scheduleData.entityInfo.currencySymbol})</th>
                        <th className="p-2 text-right font-medium">Amount PY ({scheduleData.entityInfo.currencySymbol})</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                    {combinedData.map(item => (
                        <tr key={item.id}>
                            <td className="p-2">{item.particular}</td>
                            <td className="p-2 text-right font-mono">{format(item.amountCy)}</td>
                            <td className="p-2 text-right font-mono">{format(item.amountPy)}</td>
                        </tr>
                    ))}
                    <tr className="font-bold bg-gray-700/30">
                        <td className="p-2">Total</td>
                        <td className="p-2 text-right font-mono">{format(totalCy)}</td>
                        <td className="p-2 text-right font-mono">{format(totalPy)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};