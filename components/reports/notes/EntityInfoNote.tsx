import React from 'react';
import { EntityInfoData } from '../../../types.ts';

interface EntityInfoNoteProps {
    data: EntityInfoData;
}

const InfoRow: React.FC<{ label: string; value: string; }> = 
({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 items-center">
        <span className="block text-sm font-medium text-gray-400 col-span-1">{label}</span>
        <span className="mt-1 text-gray-200 col-span-2">{value}</span>
    </div>
);


export const EntityInfoNote: React.FC<EntityInfoNoteProps> = ({ data }) => {
    const entityLabel = data.entityType === 'Company' ? 'Company' : 'Entity';
    const regLabel = data.entityType === 'Company' ? 'CIN' : 'Registration No.';
    const dateLabel = data.entityType === 'Company' ? 'Date of Incorporation' : 'Date of Formation';

    return (
        <div className="space-y-3 text-sm">
            <p>The {entityLabel} is a {data.entityType} incorporated and domiciled in India.</p>
            <div className="space-y-2 pt-2">
                <InfoRow label={`${entityLabel} Name`} value={data.companyName} />
                <InfoRow label={regLabel} value={data.cin} />
                <InfoRow label={dateLabel} value={data.incorporationDate} />
                <InfoRow label="Registered Office" value={data.registeredOffice} />
            </div>
        </div>
    );
};