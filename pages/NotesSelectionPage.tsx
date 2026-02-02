import React from 'react';
import { AllData, ScheduleData } from '../types.ts';
import { getEntityLevel, getApplicableNotes, isNoteMandatory } from '../utils/applicabilityUtils.ts';

interface NotesSelectionPageProps {
  allData: AllData;
  setScheduleData: React.Dispatch<React.SetStateAction<ScheduleData>>;
}

export const NotesSelectionPage: React.FC<NotesSelectionPageProps> = ({ allData, setScheduleData }) => {
    const { noteSelections, entityInfo } = allData.scheduleData;
    const { entityType } = entityInfo;

    const entityLevel = getEntityLevel(entityType, entityInfo);
    const applicableNotes = getApplicableNotes(noteSelections, entityType, entityLevel);

    const handleToggleNote = (id: string) => {
        setScheduleData(prev => ({
            ...prev,
            noteSelections: prev.noteSelections.map(note => 
                note.id === id ? { ...note, isSelected: !note.isSelected } : note
            )
        }));
    };
    
    return (
        <div className="p-6 h-full flex flex-col space-y-4">
            <header>
                <h1 className="text-2xl font-bold text-white">Notes Selection</h1>
                <p className="text-sm text-gray-400">Select which narrative notes to include in the final report.</p>
                <p className="text-xs text-gray-500 mt-1">Entity Type: <span className="font-semibold">{entityType}</span> | Level: <span className="font-semibold">{entityLevel}</span></p>
            </header>
            <main className="flex-1 bg-gray-800 p-6 rounded-lg border border-gray-700 overflow-y-auto max-w-2xl mx-auto">
                 <div className="space-y-3">
                    {applicableNotes.sort((a,b) => a.order - b.order).map(note => {
                        const mandatory = isNoteMandatory(note.id);
                        const isSelected = mandatory || note.isSelected;

                        return (
                            <div key={note.id} className={`flex items-center p-3 rounded-lg ${mandatory ? 'bg-gray-700/50' : 'bg-gray-900/50'}`}>
                                <label className={`flex items-center w-full ${mandatory ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => !mandatory && handleToggleNote(note.id)}
                                        disabled={mandatory}
                                        className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-brand-blue focus:ring-brand-blue focus:ring-2 disabled:opacity-50"
                                    />
                                    <span className={`ml-4 ${mandatory ? 'text-gray-400' : 'text-gray-200'}`}>{note.name}</span>
                                    {mandatory && <span className="ml-auto text-xs font-semibold text-gray-500">MANDATORY</span>}
                                </label>
                            </div>
                        )
                    })}
                </div>
            </main>
        </div>
    );
};