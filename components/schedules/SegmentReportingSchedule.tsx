// components/schedules/SegmentReportingSchedule.tsx
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SegmentReportingData, SegmentItem } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';

interface SegmentReportingScheduleProps {
    data: SegmentReportingData;
    onUpdate: (data: SegmentReportingData) => void;
    isFinalized: boolean;
}

export const SegmentReportingSchedule: React.FC<SegmentReportingScheduleProps> = ({ data, onUpdate, isFinalized }) => {

    const handleUpdate = (id: string, field: keyof Omit<SegmentItem, 'id'>, value: string) => {
        onUpdate({ items: data.items.map(item => item.id === id ? { ...item, [field]: value } : item) });
    };

    const addRow = () => {
        const newRow: SegmentItem = {
            id: uuidv4(),
            segmentName: '',
            revenue: '0',
            result: '0',
            assets: '0',
            liabilities: '0',
        };
        onUpdate({ items: [...data.items, newRow] });
    };

    const removeRow = (id: string) => {
        onUpdate({ items: data.items.filter(item => item.id !== id) });
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">AS 17: Segment Reporting</h3>
            <p className="text-sm text-gray-400">Define business or geographical segments and their financial data.</p>
            
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-2 text-left">Segment Name</th>
                            <th className="p-2 text-right">Segment Revenue</th>
                            <th className="p-2 text-right">Segment Result</th>
                            <th className="p-2 text-right">Segment Assets</th>
                            <th className="p-2 text-right">Segment Liabilities</th>
                            {!isFinalized && <th className="w-10"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {data.items.map(item => (
                            <tr key={item.id}>
                                <td className="p-1"><input value={item.segmentName} onChange={e=>handleUpdate(item.id, 'segmentName', e.target.value)} disabled={isFinalized} className="w-full bg-gray-700 p-2 rounded"/></td>
                                <td className="p-1"><input value={item.revenue} onChange={e=>handleUpdate(item.id, 'revenue', e.target.value)} disabled={isFinalized} className="w-full bg-gray-700 p-2 rounded text-right"/></td>
                                <td className="p-1"><input value={item.result} onChange={e=>handleUpdate(item.id, 'result', e.target.value)} disabled={isFinalized} className="w-full bg-gray-700 p-2 rounded text-right"/></td>
                                <td className="p-1"><input value={item.assets} onChange={e=>handleUpdate(item.id, 'assets', e.target.value)} disabled={isFinalized} className="w-full bg-gray-700 p-2 rounded text-right"/></td>
                                <td className="p-1"><input value={item.liabilities} onChange={e=>handleUpdate(item.id, 'liabilities', e.target.value)} disabled={isFinalized} className="w-full bg-gray-700 p-2 rounded text-right"/></td>
                                {!isFinalized && <td className="p-1"><button onClick={() => removeRow(item.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


            {!isFinalized && (
                <button onClick={addRow} className="mt-4 flex items-center text-sm text-brand-blue-light hover:text-white transition-colors font-medium">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Segment
                </button>
            )}
             {data.items.length === 0 && <p className="text-sm text-gray-500">No segments added.</p>}
        </div>
    );
};