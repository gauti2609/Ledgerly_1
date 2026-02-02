import React from 'react';
import { ForeignExchangeData, ScheduleData, GenericScheduleItem } from '../../types.ts';
import { GenericSchedule } from './GenericSchedule.tsx';

interface ForeignExchangeScheduleProps {
    data: ForeignExchangeData;
    onUpdate: React.Dispatch<React.SetStateAction<ScheduleData>>;
    isFinalized: boolean;
}

const InputField: React.FC<{ label: string; value: string; onChange: (value: string) => void; disabled: boolean; }> = 
({ label, value, onChange, disabled }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400">{label}</label>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-800 disabled:cursor-not-allowed"
        />
    </div>
);


export const ForeignExchangeSchedule: React.FC<ForeignExchangeScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleEarningsUpdate = (updatedData: GenericScheduleItem[]) => {
        onUpdate(prev => ({...prev, foreignExchange: {...prev.foreignExchange, earnings: updatedData }}));
    };
    
    const handleExpenditureUpdate = (updatedData: GenericScheduleItem[]) => {
        onUpdate(prev => ({...prev, foreignExchange: {...prev.foreignExchange, expenditure: updatedData }}));
    };

    const handleImportUpdate = (field: keyof ForeignExchangeData['imports'], value: string) => {
        onUpdate(prev => ({...prev, foreignExchange: {...prev.foreignExchange, imports: {...prev.foreignExchange.imports, [field]: value} }}));
    };

    return (
        <div className="space-y-8">
             <GenericSchedule
                title="Foreign Exchange Earnings"
                data={data.earnings}
                onUpdate={handleEarningsUpdate}
                isFinalized={isFinalized}
            />
             <GenericSchedule
                title="Foreign Exchange Expenditure"
                data={data.expenditure}
                onUpdate={handleExpenditureUpdate}
                isFinalized={isFinalized}
            />
            <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg">
                 <h4 className="text-md font-semibold text-gray-300">Value of imports calculated on C.I.F basis</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Raw Materials" value={data.imports.rawMaterials} onChange={v => handleImportUpdate('rawMaterials', v)} disabled={isFinalized} />
                    <InputField label="Components and spare parts" value={data.imports.components} onChange={v => handleImportUpdate('components', v)} disabled={isFinalized} />
                    <InputField label="Capital goods" value={data.imports.capitalGoods} onChange={v => handleImportUpdate('capitalGoods', v)} disabled={isFinalized} />
                 </div>
            </div>
        </div>
    );
};