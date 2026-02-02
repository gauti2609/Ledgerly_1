import React from 'react';

export const FinalizedBanner: React.FC = () => {
    return (
        <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm" role="alert">
            <p><span className="font-bold">Schedules Finalized.</span> The data entry is locked. To make changes, click "Edit Schedules".</p>
        </div>
    );
};
