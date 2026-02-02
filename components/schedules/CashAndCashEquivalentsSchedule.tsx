import { CashAndCashEquivalentsData, ScheduleData, CashComponent, ManualInput } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';
import { InputWithCheckbox } from '../InputWithCheckbox.tsx';

interface CashAndCashEquivalentsScheduleProps {
    data: CashAndCashEquivalentsData;
    onUpdate: React.Dispatch<React.SetStateAction<ScheduleData>>;
    isFinalized: boolean;
}

const ComponentTable: React.FC<{
    title: string;
    items: CashComponent[];
    type: 'balancesWithBanks' | 'others';
    onUpdate: (type: 'balancesWithBanks' | 'others', id: string, field: keyof Omit<CashComponent, 'id'>, value: string) => void;
    onAdd: (type: 'balancesWithBanks' | 'others') => void;
    onRemove: (type: 'balancesWithBanks' | 'others', id: string) => void;
    isFinalized: boolean;
}> = ({ title, items, type, onUpdate, onAdd, onRemove, isFinalized }) => (
    <div>
        <h4 className="text-md font-semibold text-gray-300 mb-2">{title}</h4>
        <div className="space-y-2">
            {items.map(item => (
                <div key={item.id} className="flex items-center space-x-2">
                    <input type="text" placeholder="Particular" value={item.particular} onChange={e => onUpdate(type, item.id, 'particular', e.target.value)} disabled={isFinalized} className="w-1/2 bg-gray-700 p-2 rounded-md" />
                    <input type="text" placeholder="Amount (CY)" value={item.amountCy} onChange={e => onUpdate(type, item.id, 'amountCy', e.target.value)} disabled={isFinalized} className="w-1/4 bg-gray-700 p-2 rounded-md" />
                    <input type="text" placeholder="Amount (PY)" value={item.amountPy} onChange={e => onUpdate(type, item.id, 'amountPy', e.target.value)} disabled={isFinalized} className="w-1/4 bg-gray-700 p-2 rounded-md" />
                    {!isFinalized && <button onClick={() => onRemove(type, item.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5" /></button>}
                </div>
            ))}
        </div>
        {!isFinalized && <button onClick={() => onAdd(type)} className="mt-2 flex items-center text-sm text-brand-blue-light hover:text-white"><PlusIcon className="w-4 h-4 mr-1" /> Add Row</button>}
    </div>
);

export const CashAndCashEquivalentsSchedule: React.FC<CashAndCashEquivalentsScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleFieldUpdate = (field: keyof CashAndCashEquivalentsData, value: ManualInput) => {
        onUpdate(prev => ({ ...prev, cashAndCashEquivalents: { ...prev.cashAndCashEquivalents, [field]: value } }));
    };

    const handleComponentUpdate = (type: 'balancesWithBanks' | 'others', id: string, field: keyof Omit<CashComponent, 'id'>, value: string) => {
        onUpdate(prev => ({ ...prev, cashAndCashEquivalents: { ...prev.cashAndCashEquivalents, [type]: prev.cashAndCashEquivalents[type].map(item => item.id === id ? { ...item, [field]: value } : item) } }));
    };

    const addComponentRow = (type: 'balancesWithBanks' | 'others') => {
        const newRow: CashComponent = { id: uuidv4(), particular: '', amountCy: '', amountPy: '' };
        onUpdate(prev => ({ ...prev, cashAndCashEquivalents: { ...prev.cashAndCashEquivalents, [type]: [...prev.cashAndCashEquivalents[type], newRow] } }));
    };

    const removeComponentRow = (type: 'balancesWithBanks' | 'others', id: string) => {
        onUpdate(prev => ({ ...prev, cashAndCashEquivalents: { ...prev.cashAndCashEquivalents, [type]: prev.cashAndCashEquivalents[type].filter(item => item.id !== id) } }));
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Cash and Cash Equivalents Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputWithCheckbox label="Cash on Hand" value={data.cashOnHand} onChange={v => handleFieldUpdate('cashOnHand', v)} disabled={isFinalized} />
                <InputWithCheckbox label="Cheques, Drafts on Hand" value={data.chequesDraftsOnHand} onChange={v => handleFieldUpdate('chequesDraftsOnHand', v)} disabled={isFinalized} />
            </div>
            <ComponentTable title="Balances with Banks" items={data.balancesWithBanks} type="balancesWithBanks" onUpdate={handleComponentUpdate} onAdd={addComponentRow} onRemove={removeComponentRow} isFinalized={isFinalized} />
            <ComponentTable title="Others (e.g., deposits with original maturity less than 3 months)" items={data.others} type="others" onUpdate={handleComponentUpdate} onAdd={addComponentRow} onRemove={removeComponentRow} isFinalized={isFinalized} />
            <InputWithCheckbox label="Repatriation Restrictions" value={data.repatriationRestrictions} onChange={v => handleFieldUpdate('repatriationRestrictions', v)} disabled={isFinalized} />
        </div>
    );
};