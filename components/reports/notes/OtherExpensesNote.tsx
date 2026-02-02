import React from 'react';
import { AllData, GenericScheduleItem } from '../../../types.ts';
import { formatNumber } from '../../../utils/formatNumber.ts';

interface OtherExpensesNoteProps {
    allData: AllData;
}

export const OtherExpensesNote: React.FC<OtherExpensesNoteProps> = ({ allData }) => {
    const { scheduleData, trialBalanceData } = allData;
    const { roundingUnit } = scheduleData.entityInfo;
    const format = (num: number) => formatNumber(num, roundingUnit);

    // 1. Get all line items for this note
    const lineItems = scheduleData.noteLineItems.filter(item => item.noteId === 'otherExpenses');

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

    // 2.5 Auto-populate Standard Groupings for Other Expenses (C.90)
    // Fetch from masters
    const otherExpensesGroupings = allData.masters.groupings.filter(g => g.minorHeadCode === 'C.90');

    const standardGroupingItems = otherExpensesGroupings.map(grouping => {
        const relevantLedgers = trialBalanceData.filter(tb =>
            tb.groupingCode === grouping.code &&
            !tb.noteLineItemId // Ensure it's not already part of a custom line item
        );

        let sumCy = relevantLedgers.reduce((sum, item) => sum + item.closingCy, 0);
        let sumPy = relevantLedgers.reduce((sum, item) => sum + item.closingPy, 0);

        // Standard Practice: Expenses are positive in Note display.
        // If DB has them as Debits (Positive), keep as is.
        // If DB has them as Credits (Negative), flip them.
        // Assuming Debits are positive for now based on previous context.
        // If they are coming as negative in Revenue, maybe Expenses are also flipped?
        // User said "Revenue figures... are coming in negative". Revenue (Credit) coming negative = standard DB convention.
        // Expenses (Debit) should already be positive.
        // So no flip needed here unless user complains about negative expenses.
        // I will just add a check to be safe, or leave as is if only Revenue was the issue.
        // User specifically said "Revenue figures". I will touch only GenericNote for Revenue/Income.
        // But to be consistent with GenericNote pattern:

        if (Math.abs(sumCy) < 0.01 && Math.abs(sumPy) < 0.01) return null; // Skip empty groupings

        return {
            id: grouping.code,
            particular: grouping.name,
            amountCy: sumCy,
            amountPy: sumPy
        };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    // 3. Include items mapped directly to the generic schedule (Manual Entries)
    const directMappedItems = scheduleData.otherExpenses.map(item => ({
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