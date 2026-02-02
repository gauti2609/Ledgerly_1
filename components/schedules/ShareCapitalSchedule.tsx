// components/schedules/ShareCapitalSchedule.tsx
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ShareCapitalData, ScheduleData, ShareCapitalItem, ShareReconciliationItem, Shareholder, PromoterShareholding, ManualInput } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';
import { InputWithCheckbox } from '../InputWithCheckbox.tsx';

interface ShareCapitalScheduleProps {
    data: ShareCapitalData;
    onUpdate: React.Dispatch<React.SetStateAction<ScheduleData>>;
    isFinalized: boolean;
}

const TableActions: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
    <div className="text-right">
        <button onClick={onAdd} className="flex items-center text-sm text-brand-blue-light hover:text-white transition-colors font-medium">
            <PlusIcon className="w-4 h-4 mr-1" /> Add Row
        </button>
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-4 bg-gray-900/50 rounded-lg">
        <h4 className="font-semibold text-gray-300 mb-2">{title}</h4>
        <div className="space-y-2">{children}</div>
    </div>
);

export const ShareCapitalSchedule: React.FC<ShareCapitalScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleUpdate = <T extends keyof ShareCapitalData>(field: T, value: ShareCapitalData[T]) => {
        onUpdate(prev => ({ ...prev, companyShareCapital: { ...prev.companyShareCapital, [field]: value } }))
    };

    const addRow = (field: 'authorized' | 'issued' | 'subscribed' | 'reconciliationCy' | 'reconciliationPy' | 'shareholders' | 'promoterShareholding') => {
        let newRow;
        switch (field) {
            case 'shareholders': newRow = { id: uuidv4(), name: '', noOfShares: '', percentage: '' }; break;
            case 'promoterShareholding': newRow = { id: uuidv4(), promoterName: '', noOfShares: '', percentageTotal: '', percentageChange: '' }; break;
            case 'reconciliationCy':
            case 'reconciliationPy': newRow = { id: uuidv4(), particular: 'Shares outstanding at the beginning of the year', noOfShares: '', amount: '' }; break;
            default: newRow = { id: uuidv4(), particular: 'Equity Shares of __ each', noOfSharesCy: '', amountCy: '', noOfSharesPy: '', amountPy: '' }; break;
        }
        handleUpdate(field, [...data[field] as any[], newRow] as any);
    };

    const removeRow = (field: 'authorized' | 'issued' | 'subscribed' | 'reconciliationCy' | 'reconciliationPy' | 'shareholders' | 'promoterShareholding', id: string) => {
        handleUpdate(field, (data[field] as any[]).filter(item => item.id !== id) as any);
    };

    const updateRow = <T extends 'authorized' | 'issued' | 'subscribed' | 'reconciliationCy' | 'reconciliationPy' | 'shareholders' | 'promoterShareholding'>(
        field: T, id: string, prop: keyof ShareCapitalData[T][0], value: string
    ) => {
        handleUpdate(field, (data[field] as any[]).map(item => item.id === id ? { ...item, [prop]: value } : item) as any);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Share Capital</h3>

            <Section title="a. Authorized, Issued, Subscribed & Paid-up Capital">
                <table className="w-full text-xs">
                    <thead className="text-gray-400">
                        <tr>
                            <th className="p-2 text-left w-1/3">Particulars</th>
                            <th className="p-2 text-right">No of Shares (CY)</th>
                            <th className="p-2 text-right">Amount (CY)</th>
                            <th className="p-2 text-right">No of Shares (PY)</th>
                            <th className="p-2 text-right">Amount (PY)</th>
                            {!isFinalized && <th className="w-10"></th>}
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="font-semibold text-gray-300"><td colSpan={6} className="pt-2">Authorized</td></tr>
                        {data.authorized.map(item => <ShareClassRow key={item.id} item={item} onUpdate={(p, v) => updateRow('authorized', item.id, p, v)} onRemove={() => removeRow('authorized', item.id)} isFinalized={isFinalized} />)}
                        {!isFinalized && <tr><td colSpan={6} className="pt-1"><button onClick={() => addRow('authorized')} className="flex items-center text-sm text-brand-blue-light hover:text-white font-medium"><PlusIcon className="w-4 h-4 mr-1" /> Add Authorized Class</button></td></tr>}

                        <tr className="font-semibold text-gray-300"><td colSpan={6} className="pt-4">Issued</td></tr>
                        {data.issued.map(item => <ShareClassRow key={item.id} item={item} onUpdate={(p, v) => updateRow('issued', item.id, p, v)} onRemove={() => removeRow('issued', item.id)} isFinalized={isFinalized} />)}
                        {!isFinalized && <tr><td colSpan={6} className="pt-1"><button onClick={() => addRow('issued')} className="flex items-center text-sm text-brand-blue-light hover:text-white font-medium"><PlusIcon className="w-4 h-4 mr-1" /> Add Issued Class</button></td></tr>}

                        <tr className="font-semibold text-gray-300"><td colSpan={6} className="pt-4">Subscribed and Fully Paid up</td></tr>
                        {data.subscribed.map(item => <ShareClassRow key={item.id} item={item} onUpdate={(p, v) => updateRow('subscribed', item.id, p, v)} onRemove={() => removeRow('subscribed', item.id)} isFinalized={isFinalized} />)}
                        {!isFinalized && <tr><td colSpan={6} className="pt-1"><button onClick={() => addRow('subscribed')} className="flex items-center text-sm text-brand-blue-light hover:text-white font-medium"><PlusIcon className="w-4 h-4 mr-1" /> Add Subscribed Class</button></td></tr>}
                    </tbody>
                </table>
            </Section>

            <Section title="b. Reconciliation of the number of shares outstanding">
                <div className="grid grid-cols-2 gap-6">
                    <ReconTable title="Current Year" items={data.reconciliationCy} onAdd={() => addRow('reconciliationCy')} onRemove={(id) => removeRow('reconciliationCy', id)} onUpdate={(id, p, v) => updateRow('reconciliationCy', id, p, v)} isFinalized={isFinalized} />
                    <ReconTable title="Previous Year" items={data.reconciliationPy} onAdd={() => addRow('reconciliationPy')} onRemove={(id) => removeRow('reconciliationPy', id)} onUpdate={(id, p, v) => updateRow('reconciliationPy', id, p, v)} isFinalized={isFinalized} />
                </div>
            </Section>

            <Section title="c. Details of shareholders holding more than 5% shares">
                {data.shareholders.map(s => <ShareholderRow key={s.id} item={s} onUpdate={(p, v) => updateRow('shareholders', s.id, p, v)} onRemove={() => removeRow('shareholders', s.id)} isFinalized={isFinalized} />)}
                {!isFinalized && <TableActions onAdd={() => addRow('shareholders')} />}
            </Section>

            <Section title="d. Promoter Shareholding">
                {data.promoterShareholding.map(p => <PromoterRow key={p.id} item={p} onUpdate={(prop, v) => updateRow('promoterShareholding', p.id, prop, v)} onRemove={() => removeRow('promoterShareholding', p.id)} isFinalized={isFinalized} />)}
                {!isFinalized && <TableActions onAdd={() => addRow('promoterShareholding')} />}
            </Section>

            <Section title="e. Other Disclosures">
                <InputWithCheckbox label="Rights, preferences and restrictions attaching to each class of shares" value={data.rightsPreferences} onChange={v => handleUpdate('rightsPreferences', v)} disabled={isFinalized} rows={2} />
                <InputWithCheckbox label="Shares held by holding company or ultimate holding company" value={data.holdingCompanyShares} onChange={v => handleUpdate('holdingCompanyShares', v)} disabled={isFinalized} />
                <InputWithCheckbox label="Aggregate number of shares allotted as fully paid up bonus shares (last 5 yrs)" value={data.fiveYearHistoryBonus} onChange={v => handleUpdate('fiveYearHistoryBonus', v)} disabled={isFinalized} />
                <InputWithCheckbox label="Aggregate number of shares allotted as fully paid up without payment in cash (last 5 yrs)" value={data.fiveYearHistoryNoCash} onChange={v => handleUpdate('fiveYearHistoryNoCash', v)} disabled={isFinalized} />
                <InputWithCheckbox label="Aggregate number of shares bought back (last 5 yrs)" value={data.fiveYearHistoryBuyback} onChange={v => handleUpdate('fiveYearHistoryBuyback', v)} disabled={isFinalized} />
                <InputWithCheckbox label="Terms of any securities convertible into equity/preference shares" value={data.convertibleSecurities} onChange={v => handleUpdate('convertibleSecurities', v)} disabled={isFinalized} />
                <InputWithCheckbox label="Calls unpaid (including details of directors/officers)" value={data.callsUnpaid} onChange={v => handleUpdate('callsUnpaid', v)} disabled={isFinalized} />
                <InputWithCheckbox label="Forfeited shares (amount originally paid-up)" value={data.forfeitedShares} onChange={v => handleUpdate('forfeitedShares', v)} disabled={isFinalized} />
            </Section>
        </div>
    );
};

// --- Sub-components for ShareCapitalSchedule ---

const ShareClassRow: React.FC<{ item: ShareCapitalItem; onUpdate: (prop: keyof ShareCapitalItem, value: string) => void; onRemove: () => void; isFinalized: boolean; }> = ({ item, onUpdate, onRemove, isFinalized }) => (
    <tr>
        <td><input value={item.particular} onChange={e => onUpdate('particular', e.target.value)} disabled={isFinalized} className="w-full bg-gray-700 p-1 rounded" /></td>
        <td><input value={item.noOfSharesCy} onChange={e => onUpdate('noOfSharesCy', e.target.value)} disabled={isFinalized} className="w-full bg-gray-700 p-1 rounded text-right" /></td>
        <td><input value={item.amountCy} onChange={e => onUpdate('amountCy', e.target.value)} disabled={isFinalized} className="w-full bg-gray-700 p-1 rounded text-right" /></td>
        <td><input value={item.noOfSharesPy} onChange={e => onUpdate('noOfSharesPy', e.target.value)} disabled={isFinalized} className="w-full bg-gray-700 p-1 rounded text-right" /></td>
        <td><input value={item.amountPy} onChange={e => onUpdate('amountPy', e.target.value)} disabled={isFinalized} className="w-full bg-gray-700 p-1 rounded text-right" /></td>
        {!isFinalized && <td><button onClick={onRemove}><TrashIcon className="w-4 h-4 text-gray-500 hover:text-red-400" /></button></td>}
    </tr>
)

const ReconTable: React.FC<{ title: string; items: ShareReconciliationItem[]; onAdd: () => void; onRemove: (id: string) => void; onUpdate: (id: string, prop: keyof ShareReconciliationItem, v: string) => void; isFinalized: boolean }> = ({ title, items, onAdd, onRemove, onUpdate, isFinalized }) => (
    <div>
        <h5 className="font-semibold text-gray-400 mb-1">{title}</h5>
        {items.map(item => (
            <div key={item.id} className="flex items-center space-x-1 mb-1">
                <input value={item.particular} onChange={e => onUpdate(item.id, 'particular', e.target.value)} disabled={isFinalized} className="w-full bg-gray-700 p-1 rounded text-xs" />
                <input value={item.noOfShares} onChange={e => onUpdate(item.id, 'noOfShares', e.target.value)} disabled={isFinalized} className="w-24 bg-gray-700 p-1 rounded text-xs text-right" />
                <input value={item.amount} onChange={e => onUpdate(item.id, 'amount', e.target.value)} disabled={isFinalized} className="w-24 bg-gray-700 p-1 rounded text-xs text-right" />
                {!isFinalized && <button onClick={() => onRemove(item.id)}><TrashIcon className="w-3 h-3 text-gray-500 hover:text-red-400" /></button>}
            </div>
        ))}
        {!isFinalized && <TableActions onAdd={onAdd} />}
    </div>
)

const ShareholderRow: React.FC<{ item: Shareholder; onUpdate: (prop: keyof Shareholder, value: string) => void; onRemove: () => void; isFinalized: boolean; }> = ({ item, onUpdate, onRemove, isFinalized }) => (
    <div className="flex items-center space-x-2 mb-1">
        <input value={item.name} onChange={e => onUpdate('name', e.target.value)} placeholder="Shareholder Name" disabled={isFinalized} className="flex-1 bg-gray-700 p-1 rounded text-xs" />
        <input value={item.noOfShares} onChange={e => onUpdate('noOfShares', e.target.value)} placeholder="No. of Shares" disabled={isFinalized} className="w-24 bg-gray-700 p-1 rounded text-xs text-right" />
        <input value={item.percentage} onChange={e => onUpdate('percentage', e.target.value)} placeholder="% Holding" disabled={isFinalized} className="w-24 bg-gray-700 p-1 rounded text-xs text-right" />
        {!isFinalized && <button onClick={onRemove}><TrashIcon className="w-3 h-3 text-gray-500 hover:text-red-400" /></button>}
    </div>
)

const PromoterRow: React.FC<{ item: PromoterShareholding; onUpdate: (prop: keyof PromoterShareholding, value: string) => void; onRemove: () => void; isFinalized: boolean; }> = ({ item, onUpdate, onRemove, isFinalized }) => (
    <div className="flex items-center space-x-2 mb-1">
        <input value={item.promoterName} onChange={e => onUpdate('promoterName', e.target.value)} placeholder="Promoter Name" disabled={isFinalized} className="flex-1 bg-gray-700 p-1 rounded text-xs" />
        <input value={item.noOfShares} onChange={e => onUpdate('noOfShares', e.target.value)} placeholder="No. of Shares" disabled={isFinalized} className="w-24 bg-gray-700 p-1 rounded text-xs text-right" />
        <input value={item.percentageTotal} onChange={e => onUpdate('percentageTotal', e.target.value)} placeholder="% of Total Shares" disabled={isFinalized} className="w-32 bg-gray-700 p-1 rounded text-xs text-right" />
        <input value={item.percentageChange} onChange={e => onUpdate('percentageChange', e.target.value)} placeholder="% Change" disabled={isFinalized} className="w-24 bg-gray-700 p-1 rounded text-xs text-right" />
        {!isFinalized && <button onClick={onRemove}><TrashIcon className="w-3 h-3 text-gray-500 hover:text-red-400" /></button>}
    </div>
)
