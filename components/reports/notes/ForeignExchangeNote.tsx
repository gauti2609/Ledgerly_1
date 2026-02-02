import React from 'react';
import { AllData, ForeignExchangeData } from '../../../types.ts';
import { GenericNote } from './GenericNote.tsx';

interface ForeignExchangeNoteProps {
    data: ForeignExchangeData;
    allData: AllData;
}

const formatCurrency = (val: string): string => {
    const num = parseFloat(val.replace(/,/g, ''));
    if (isNaN(num) || num === 0) return '-';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export const ForeignExchangeNote: React.FC<ForeignExchangeNoteProps> = ({ data, allData }) => {
    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-semibold text-gray-300 mb-2">a. Earnings in foreign currency</h4>
                <GenericNote title="" data={data.earnings} allData={allData} noteId="forex-earnings" />
            </div>
            <div>
                <h4 className="font-semibold text-gray-300 mb-2">b. Expenditure in foreign currency</h4>
                <GenericNote title="" data={data.expenditure} allData={allData} noteId="forex-expenditure" />
            </div>
             <div>
                <h4 className="font-semibold text-gray-300 mb-2">c. Value of imports calculated on C.I.F basis</h4>
                <table className="max-w-md text-sm">
                    <tbody>
                        <tr><td className="p-2">i. Raw Materials</td><td className="p-2 font-mono text-right">{formatCurrency(data.imports.rawMaterials)}</td></tr>
                        <tr><td className="p-2">ii. Components and spare parts</td><td className="p-2 font-mono text-right">{formatCurrency(data.imports.components)}</td></tr>
                        <tr><td className="p-2">iii. Capital goods</td><td className="p-2 font-mono text-right">{formatCurrency(data.imports.capitalGoods)}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};