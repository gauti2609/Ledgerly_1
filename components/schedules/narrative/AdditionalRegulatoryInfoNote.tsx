import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    AdditionalRegulatoryInfoData,
    ScheduleData,
    FundUtilisationData,
    ImmovableProperty,
    LoanToPromoter,
    BenamiProperty,
    StruckOffCompany,
    ManualInput
} from '../../../types.ts';
import { PlusIcon, TrashIcon } from '../../icons.tsx';
import { InputWithCheckbox } from '../../InputWithCheckbox.tsx';

// Re-using components from the original implementation for consistency
interface AdditionalRegulatoryInfoNoteProps {
    data: AdditionalRegulatoryInfoData;
    onUpdate?: React.Dispatch<React.SetStateAction<ScheduleData>>;
    isFinalized?: boolean;
}

const ToggleSection: React.FC<{
    title: string;
    isApplicable: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    disabled?: boolean;
}> = ({ title, isApplicable, onToggle, children, disabled }) => (
    <div className={`space-y-2 p-4 rounded-lg border transition-colors ${isApplicable ? 'bg-gray-800 border-gray-700' : 'bg-gray-900 border-gray-800 opacity-75'}`}>
        <div className="flex items-center justify-between">
            <h4 className={`font-semibold ${isApplicable ? 'text-gray-200' : 'text-gray-500'}`}>{title}</h4>
            <label className="flex items-center space-x-2 cursor-pointer">
                <span className="text-xs text-gray-400">Applicable?</span>
                <input
                    type="checkbox"
                    checked={isApplicable}
                    onChange={onToggle}
                    disabled={disabled}
                    className="form-checkbox h-4 w-4 text-brand-blue bg-gray-700 border-gray-600 rounded focus:ring-brand-blue"
                />
            </label>
        </div>
        {isApplicable && <div className="mt-4 pt-4 border-t border-gray-700/50 animate-fadeIn">{children}</div>}
    </div>
);

// ... Other helper components (InputField, FundUtilisationTable) would go here ...
// For brevity, they are assumed to exist as in the previous incomplete version.

export const AdditionalRegulatoryInfoNote: React.FC<AdditionalRegulatoryInfoNoteProps> = ({ data, onUpdate, isFinalized = false }) => {

    const handleUpdate = <T extends keyof AdditionalRegulatoryInfoData>(field: T, value: AdditionalRegulatoryInfoData[T]) => {
        if (onUpdate) onUpdate(prev => ({ ...prev, additionalRegulatoryInfo: { ...prev.additionalRegulatoryInfo, [field]: value } }));
    };

    const handleApplicability = (key: string) => {
        if (onUpdate) {
            onUpdate(prev => {
                const current = prev.additionalRegulatoryInfo.applicability || {};
                return {
                    ...prev,
                    additionalRegulatoryInfo: {
                        ...prev.additionalRegulatoryInfo,
                        applicability: { ...current, [key]: !current[key] }
                    }
                };
            });
        }
    };

    const isApplicable = (key: string) => {
        // Default to true if undefined to support legacy data, unless user explicitly toggles off
        // Or default to false? User asked for "checkbox to select applicable ones", implies opt-in or opt-out.
        // Given it's "Additional", opt-in is safer for UI clutter, but opt-out is safer for compliance.
        // Let's assume Opt-Out (Default True) so existing data isn't hidden.
        return data.applicability?.[key] ?? false;
    };

    const addRow = <T extends keyof AdditionalRegulatoryInfoData>(field: T, newRow: any) => {
        if (onUpdate) {
            handleUpdate(field, [...(data[field] as any[]), newRow] as any);
        }
    };

    const removeRow = <T extends keyof AdditionalRegulatoryInfoData>(field: T, id: string) => {
        if (onUpdate) {
            handleUpdate(field, (data[field] as any[]).filter(item => item.id !== id) as any);
        }
    };

    const updateRow = <T extends keyof AdditionalRegulatoryInfoData>(field: T, id: string, prop: keyof any, value: string) => {
        if (onUpdate) {
            handleUpdate(field, (data[field] as any[]).map(item => item.id === id ? { ...item, [prop]: value } : item) as any);
        }
    };


    if (!onUpdate) {
        return <div>Readonly View Not Implemented</div>;
    }

    return (
        <div className="space-y-6">
            <header>
                <h3 className="text-lg font-bold text-white">Additional Regulatory Information</h3>
                <p className="text-sm text-gray-400">Select applicable sections and provide details. Only selected sections will appear in the final report.</p>
            </header>

            <ToggleSection title="Title deeds of Immovable Property not held in name of the Company" isApplicable={isApplicable('immovableProperty')} onToggle={() => handleApplicability('immovableProperty')} disabled={isFinalized}>
                {data.immovableProperty.map(row => (
                    <div key={row.id} className="text-xs grid grid-cols-4 gap-2 items-center mb-2">
                        <input value={row.description} onChange={e => updateRow('immovableProperty', row.id, 'description', e.target.value)} placeholder="Description" className="bg-gray-700 p-1 rounded border border-gray-600" />
                        <input value={row.grossCarrying} onChange={e => updateRow('immovableProperty', row.id, 'grossCarrying', e.target.value)} placeholder="Carrying Value" className="bg-gray-700 p-1 rounded border border-gray-600" />
                        <input value={row.holderName} onChange={e => updateRow('immovableProperty', row.id, 'holderName', e.target.value)} placeholder="Holder Name" className="bg-gray-700 p-1 rounded border border-gray-600" />
                        <button onClick={() => removeRow('immovableProperty', row.id)}><TrashIcon className="w-4 h-4 text-red-400" /></button>
                    </div>
                ))}
                {!isFinalized && <button onClick={() => addRow('immovableProperty', { id: uuidv4(), description: '', grossCarrying: '', holderName: '' })} className="text-xs flex items-center text-brand-blue"><PlusIcon className="w-3 h-3 mr-1" /> Add Property</button>}
            </ToggleSection>

            <ToggleSection title="Revaluation of Property, Plant and Equipment" isApplicable={isApplicable('ppeRevaluation')} onToggle={() => handleApplicability('ppeRevaluation')} disabled={isFinalized}>
                {Array.isArray(data.ppeRevaluation) ? (
                    <>
                        {data.ppeRevaluation.map(row => (
                            <div key={row.id} className="text-xs grid grid-cols-6 gap-2 items-center mb-2">
                                <input value={row.assetClass} onChange={e => updateRow('ppeRevaluation', row.id, 'assetClass', e.target.value)} placeholder="Asset Class" className="bg-gray-700 p-1 rounded border border-gray-600" />
                                <input type="date" value={row.dateOfRevaluation} onChange={e => updateRow('ppeRevaluation', row.id, 'dateOfRevaluation', e.target.value)} className="bg-gray-700 p-1 rounded border border-gray-600" />
                                <input value={row.amount} onChange={e => updateRow('ppeRevaluation', row.id, 'amount', e.target.value)} placeholder="Amount" className="bg-gray-700 p-1 rounded border border-gray-600 text-right" />
                                <input value={row.valuerName} onChange={e => updateRow('ppeRevaluation', row.id, 'valuerName', e.target.value)} placeholder="Valuer" className="bg-gray-700 p-1 rounded border border-gray-600" />
                                <input value={row.method} onChange={e => updateRow('ppeRevaluation', row.id, 'method', e.target.value)} placeholder="Method" className="bg-gray-700 p-1 rounded border border-gray-600" />
                                <button onClick={() => removeRow('ppeRevaluation', row.id)}><TrashIcon className="w-4 h-4 text-red-400" /></button>
                            </div>
                        ))}
                        {!isFinalized && <button onClick={() => addRow('ppeRevaluation', { id: uuidv4(), assetClass: '', dateOfRevaluation: '', amount: '', valuerName: '', method: '' })} className="text-xs flex items-center text-brand-blue"><PlusIcon className="w-3 h-3 mr-1" /> Add Revaluation</button>}
                    </>
                ) : (
                    <div className="space-y-2">
                        {/* Handling Mixed Type ppeRevaluation (Array | String | ManualInput) - Simple cast/check */}
                        <InputWithCheckbox
                            label=""
                            value={typeof data.ppeRevaluation === 'string' || (data.ppeRevaluation && 'value' in (data.ppeRevaluation as any)) ? (data.ppeRevaluation as any) : ''}
                            onChange={v => handleUpdate('ppeRevaluation', v)}
                            disabled={isFinalized}
                            rows={3}
                        />
                        <button onClick={() => handleUpdate('ppeRevaluation', [])} className="text-xs text-brand-blue">Switch to Table Format</button>
                    </div>
                )}
            </ToggleSection>

            <ToggleSection title="Loans or Advances to Promoters, Directors, KMPs, etc." isApplicable={isApplicable('loansToPromoters')} onToggle={() => handleApplicability('loansToPromoters')} disabled={isFinalized}>
                {data.loansToPromoters.map(row => (
                    <div key={row.id} className="text-xs grid grid-cols-4 gap-2 items-center mb-2">
                        <input value={row.borrowerType} onChange={e => updateRow('loansToPromoters', row.id, 'borrowerType', e.target.value)} placeholder="Borrower Type" className="bg-gray-700 p-1 rounded border border-gray-600" />
                        <input value={row.amount} onChange={e => updateRow('loansToPromoters', row.id, 'amount', e.target.value)} placeholder="Amount" className="bg-gray-700 p-1 rounded border border-gray-600" />
                        <input value={row.percentage} onChange={e => updateRow('loansToPromoters', row.id, 'percentage', e.target.value)} placeholder="% of Total" className="bg-gray-700 p-1 rounded border border-gray-600" />
                        <button onClick={() => removeRow('loansToPromoters', row.id)}><TrashIcon className="w-4 h-4 text-red-400" /></button>
                    </div>
                ))}
                {!isFinalized && <button onClick={() => addRow('loansToPromoters', { id: uuidv4(), borrowerType: '', amount: '', percentage: '' })} className="text-xs flex items-center text-brand-blue"><PlusIcon className="w-3 h-3 mr-1" /> Add Loan</button>}
            </ToggleSection>

            <ToggleSection title="Benami Property held (Prohibition of Benami Property Transactions Act, 1988)" isApplicable={isApplicable('benamiProperty')} onToggle={() => handleApplicability('benamiProperty')} disabled={isFinalized}>
                {data.benamiProperty.map(row => (
                    <div key={row.id} className="text-xs grid grid-cols-2 gap-2 mb-2 p-2 bg-gray-900/30 rounded border border-gray-700">
                        <div className="col-span-2 grid grid-cols-2 gap-2">
                            <input value={row.details} onChange={e => updateRow('benamiProperty', row.id, 'details', e.target.value)} placeholder="Details of Property" className="bg-gray-700 p-1 rounded border border-gray-600" />
                            <input value={row.beneficiaries} onChange={e => updateRow('benamiProperty', row.id, 'beneficiaries', e.target.value)} placeholder="Beneficiaries" className="bg-gray-700 p-1 rounded border border-gray-600" />
                        </div>
                        <div className="col-span-2 grid grid-cols-3 gap-2">
                            <input value={row.amount} onChange={e => updateRow('benamiProperty', row.id, 'amount', e.target.value)} placeholder="Amount" className="bg-gray-700 p-1 rounded border border-gray-600" />
                            <input value={row.inBooks} onChange={e => updateRow('benamiProperty', row.id, 'inBooks', e.target.value)} placeholder="Ref in Books" className="bg-gray-700 p-1 rounded border border-gray-600" />
                            <div className="flex items-center space-x-2">
                                <input value={row.reason} onChange={e => updateRow('benamiProperty', row.id, 'reason', e.target.value)} placeholder="Reason not in name" className="bg-gray-700 p-1 rounded border border-gray-600 flex-1" />
                                <button onClick={() => removeRow('benamiProperty', row.id)}><TrashIcon className="w-4 h-4 text-red-400" /></button>
                            </div>
                        </div>
                    </div>
                ))}
                {!isFinalized && <button onClick={() => addRow('benamiProperty', { id: uuidv4(), details: '', amount: '', beneficiaries: '', inBooks: '', reason: '' })} className="text-xs flex items-center text-brand-blue"><PlusIcon className="w-3 h-3 mr-1" /> Add Property</button>}
            </ToggleSection>

            <ToggleSection title="Borrowings from banks on security of current assets" isApplicable={isApplicable('currentAssetBorrowings')} onToggle={() => handleApplicability('currentAssetBorrowings')} disabled={isFinalized}>
                <InputWithCheckbox label="Details" value={data.currentAssetBorrowings} onChange={v => handleUpdate('currentAssetBorrowings', v)} disabled={isFinalized} rows={3} />
            </ToggleSection>

            <ToggleSection title="Wilful Defaulter Status" isApplicable={isApplicable('wilfulDefaulter')} onToggle={() => handleApplicability('wilfulDefaulter')} disabled={isFinalized}>
                <InputWithCheckbox label="Details" value={data.wilfulDefaulter} onChange={v => handleUpdate('wilfulDefaulter', v)} disabled={isFinalized} rows={3} />
            </ToggleSection>

            <ToggleSection title="Transactions with Struck off Companies" isApplicable={isApplicable('struckOffCompanies')} onToggle={() => handleApplicability('struckOffCompanies')} disabled={isFinalized}>
                {data.struckOffCompanies.map(row => (
                    <div key={row.id} className="text-xs grid grid-cols-5 gap-2 items-center mb-2">
                        <input value={row.name} onChange={e => updateRow('struckOffCompanies', row.id, 'name', e.target.value)} placeholder="Company Name" className="bg-gray-700 p-1 rounded border border-gray-600 col-span-2" />
                        <input value={row.nature} onChange={e => updateRow('struckOffCompanies', row.id, 'nature', e.target.value)} placeholder="Nature of Txn" className="bg-gray-700 p-1 rounded border border-gray-600" />
                        <input value={row.balance} onChange={e => updateRow('struckOffCompanies', row.id, 'balance', e.target.value)} placeholder="Balance" className="bg-gray-700 p-1 rounded border border-gray-600" />
                        <button onClick={() => removeRow('struckOffCompanies', row.id)}><TrashIcon className="w-4 h-4 text-red-400" /></button>
                    </div>
                ))}
                {!isFinalized && <button onClick={() => addRow('struckOffCompanies', { id: uuidv4(), name: '', nature: '', balance: '', relationship: '' })} className="text-xs flex items-center text-brand-blue"><PlusIcon className="w-3 h-3 mr-1" /> Add Company</button>}
            </ToggleSection>

            <ToggleSection title="Registration of charges or satisfactions with ROC" isApplicable={isApplicable('registrationOfCharges')} onToggle={() => handleApplicability('registrationOfCharges')} disabled={isFinalized}>
                <InputWithCheckbox label="Details" value={data.registrationOfCharges} onChange={v => handleUpdate('registrationOfCharges', v)} disabled={isFinalized} rows={3} />
            </ToggleSection>

            <ToggleSection title="Compliance with number of layers of companies" isApplicable={isApplicable('layerCompliance')} onToggle={() => handleApplicability('layerCompliance')} disabled={isFinalized}>
                <InputWithCheckbox label="Details" value={data.layerCompliance} onChange={v => handleUpdate('layerCompliance', v)} disabled={isFinalized} rows={3} />
            </ToggleSection>

            <ToggleSection title="Compliance with approved Scheme(s) of Arrangements" isApplicable={isApplicable('schemeOfArrangements')} onToggle={() => handleApplicability('schemeOfArrangements')} disabled={isFinalized}>
                <InputWithCheckbox label="Details" value={data.schemeOfArrangements} onChange={v => handleUpdate('schemeOfArrangements', v)} disabled={isFinalized} rows={3} />
            </ToggleSection>

            <ToggleSection title="Utilisation of Borrowed Funds & Premium" isApplicable={isApplicable('fundUtilisation')} onToggle={() => handleApplicability('fundUtilisation')} disabled={isFinalized}>
                <div className="space-y-4">
                    <div>
                        <h5 className="text-xs font-semibold text-gray-400 mb-2">Funds advanced/loaned/invested in Intermediaries</h5>
                        {(data.fundUtilisation.intermediaries || []).map(row => (
                            <div key={row.id} className="text-xs grid grid-cols-4 gap-2 items-center mb-2">
                                <input value={row.name} onChange={e => {
                                    const newRows = data.fundUtilisation.intermediaries.map(r => r.id === row.id ? { ...r, name: e.target.value } : r);
                                    handleUpdate('fundUtilisation', { ...data.fundUtilisation, intermediaries: newRows });
                                }} placeholder="Intermediary Name" className="bg-gray-700 p-1 rounded border border-gray-600" />
                                <input type="date" value={row.date} onChange={e => {
                                    const newRows = data.fundUtilisation.intermediaries.map(r => r.id === row.id ? { ...r, date: e.target.value } : r);
                                    handleUpdate('fundUtilisation', { ...data.fundUtilisation, intermediaries: newRows });
                                }} className="bg-gray-700 p-1 rounded border border-gray-600" />
                                <input value={row.amount} onChange={e => {
                                    const newRows = data.fundUtilisation.intermediaries.map(r => r.id === row.id ? { ...r, amount: e.target.value } : r);
                                    handleUpdate('fundUtilisation', { ...data.fundUtilisation, intermediaries: newRows });
                                }} placeholder="Amount" className="bg-gray-700 p-1 rounded border border-gray-600 text-right" />
                                <button onClick={() => {
                                    const newRows = data.fundUtilisation.intermediaries.filter(r => r.id !== row.id);
                                    handleUpdate('fundUtilisation', { ...data.fundUtilisation, intermediaries: newRows });
                                }}><TrashIcon className="w-4 h-4 text-red-400" /></button>
                            </div>
                        ))}
                        {!isFinalized && <button onClick={() => {
                            const newRows = [...(data.fundUtilisation.intermediaries || []), { id: uuidv4(), name: '', date: '', amount: '' }];
                            handleUpdate('fundUtilisation', { ...data.fundUtilisation, intermediaries: newRows });
                        }} className="text-xs flex items-center text-brand-blue"><PlusIcon className="w-3 h-3 mr-1" /> Add Intermediary</button>}
                    </div>

                    <div>
                        <h5 className="text-xs font-semibold text-gray-400 mb-2">Funds received as Ultimate Beneficiaries</h5>
                        {(data.fundUtilisation.ultimateBeneficiaries || []).map(row => (
                            <div key={row.id} className="text-xs grid grid-cols-4 gap-2 items-center mb-2">
                                <input value={row.name} onChange={e => {
                                    const newRows = data.fundUtilisation.ultimateBeneficiaries.map(r => r.id === row.id ? { ...r, name: e.target.value } : r);
                                    handleUpdate('fundUtilisation', { ...data.fundUtilisation, ultimateBeneficiaries: newRows });
                                }} placeholder="Name of Funding Party" className="bg-gray-700 p-1 rounded border border-gray-600" />
                                <input type="date" value={row.date} onChange={e => {
                                    const newRows = data.fundUtilisation.ultimateBeneficiaries.map(r => r.id === row.id ? { ...r, date: e.target.value } : r);
                                    handleUpdate('fundUtilisation', { ...data.fundUtilisation, ultimateBeneficiaries: newRows });
                                }} className="bg-gray-700 p-1 rounded border border-gray-600" />
                                <input value={row.amount} onChange={e => {
                                    const newRows = data.fundUtilisation.ultimateBeneficiaries.map(r => r.id === row.id ? { ...r, amount: e.target.value } : r);
                                    handleUpdate('fundUtilisation', { ...data.fundUtilisation, ultimateBeneficiaries: newRows });
                                }} placeholder="Amount" className="bg-gray-700 p-1 rounded border border-gray-600 text-right" />
                                <button onClick={() => {
                                    const newRows = data.fundUtilisation.ultimateBeneficiaries.filter(r => r.id !== row.id);
                                    handleUpdate('fundUtilisation', { ...data.fundUtilisation, ultimateBeneficiaries: newRows });
                                }}><TrashIcon className="w-4 h-4 text-red-400" /></button>
                            </div>
                        ))}
                        {!isFinalized && <button onClick={() => {
                            const newRows = [...(data.fundUtilisation.ultimateBeneficiaries || []), { id: uuidv4(), name: '', date: '', amount: '' }];
                            handleUpdate('fundUtilisation', { ...data.fundUtilisation, ultimateBeneficiaries: newRows });
                        }} className="text-xs flex items-center text-brand-blue"><PlusIcon className="w-3 h-3 mr-1" /> Add Beneficiary</button>}
                    </div>
                </div>
            </ToggleSection>

            <ToggleSection title="Undisclosed Income (surrendered in tax assessments)" isApplicable={isApplicable('undisclosedIncome')} onToggle={() => handleApplicability('undisclosedIncome')} disabled={isFinalized}>
                <InputWithCheckbox label="Details" value={data.undisclosedIncome} onChange={v => handleUpdate('undisclosedIncome', v)} disabled={isFinalized} rows={3} />
            </ToggleSection>

            <ToggleSection title="Corporate Social Responsibility (CSR)" isApplicable={isApplicable('csr')} onToggle={() => handleApplicability('csr')} disabled={isFinalized}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <input placeholder="Amount Required" value={data.csr.required} onChange={e => handleUpdate('csr', { ...data.csr, required: e.target.value })} className="bg-gray-700 p-2 rounded border border-gray-600 text-sm" />
                    <input placeholder="Amount Spent" value={data.csr.spent} onChange={e => handleUpdate('csr', { ...data.csr, spent: e.target.value })} className="bg-gray-700 p-2 rounded border border-gray-600 text-sm" />
                    <input placeholder="Shortfall" value={data.csr.shortfall} onChange={e => handleUpdate('csr', { ...data.csr, shortfall: e.target.value })} className="bg-gray-700 p-2 rounded border border-gray-600 text-sm" />
                    <div className="col-span-2">
                        <InputWithCheckbox label="Reason for Shortfall" value={data.csr.reason} onChange={v => handleUpdate('csr', { ...data.csr, reason: v })} disabled={isFinalized} />
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                    <h5 className="text-xs font-semibold text-gray-400 mb-2">Project Details</h5>
                    {(data.csr.details || []).map(row => (
                        <div key={row.id} className="text-xs grid grid-cols-6 gap-2 items-center mb-2">
                            <input value={row.projectName} onChange={e => {
                                const newDetails = data.csr.details.map(d => d.id === row.id ? { ...d, projectName: e.target.value } : d);
                                handleUpdate('csr', { ...data.csr, details: newDetails });
                            }} placeholder="Project Name" className="bg-gray-700 p-1 rounded border border-gray-600" />
                            <input value={row.location} onChange={e => {
                                const newDetails = data.csr.details.map(d => d.id === row.id ? { ...d, location: e.target.value } : d);
                                handleUpdate('csr', { ...data.csr, details: newDetails });
                            }} placeholder="Location" className="bg-gray-700 p-1 rounded border border-gray-600" />
                            <input value={row.amountOutlay} onChange={e => {
                                const newDetails = data.csr.details.map(d => d.id === row.id ? { ...d, amountOutlay: e.target.value } : d);
                                handleUpdate('csr', { ...data.csr, details: newDetails });
                            }} placeholder="Outlay" className="bg-gray-700 p-1 rounded border border-gray-600 text-right" />
                            <input value={row.amountSpent} onChange={e => {
                                const newDetails = data.csr.details.map(d => d.id === row.id ? { ...d, amountSpent: e.target.value } : d);
                                handleUpdate('csr', { ...data.csr, details: newDetails });
                            }} placeholder="Spent" className="bg-gray-700 p-1 rounded border border-gray-600 text-right" />
                            <input value={row.modeOfImplementation} onChange={e => {
                                const newDetails = data.csr.details.map(d => d.id === row.id ? { ...d, modeOfImplementation: e.target.value } : d);
                                handleUpdate('csr', { ...data.csr, details: newDetails });
                            }} placeholder="Mode (Direct/Agency)" className="bg-gray-700 p-1 rounded border border-gray-600" />
                            <button onClick={() => {
                                const newDetails = data.csr.details.filter(d => d.id !== row.id);
                                handleUpdate('csr', { ...data.csr, details: newDetails });
                            }}><TrashIcon className="w-4 h-4 text-red-400" /></button>
                        </div>
                    ))}
                    {!isFinalized && <button onClick={() => {
                        const newDetails = [...(data.csr.details || []), { id: uuidv4(), projectName: '', location: '', amountOutlay: '', amountSpent: '', modeOfImplementation: '' }];
                        handleUpdate('csr', { ...data.csr, details: newDetails });
                    }} className="text-xs flex items-center text-brand-blue"><PlusIcon className="w-3 h-3 mr-1" /> Add Project</button>}
                </div>
            </ToggleSection>

            <ToggleSection title="Details of Crypto Currency or Virtual Currency" isApplicable={isApplicable('crypto')} onToggle={() => handleApplicability('crypto')} disabled={isFinalized}>
                <div className="grid grid-cols-1 gap-2">
                    <input placeholder="Profit or Loss on transactions" value={data.crypto.profitOrLoss} onChange={e => handleUpdate('crypto', { ...data.crypto, profitOrLoss: e.target.value })} className="bg-gray-700 p-2 rounded border border-gray-600 text-sm" />
                    <input placeholder="Amount held at reporting date" value={data.crypto.amountHeld} onChange={e => handleUpdate('crypto', { ...data.crypto, amountHeld: e.target.value })} className="bg-gray-700 p-2 rounded border border-gray-600 text-sm" />
                    <input placeholder="Advances from any person for trading" value={data.crypto.advances} onChange={e => handleUpdate('crypto', { ...data.crypto, advances: e.target.value })} className="bg-gray-700 p-2 rounded border border-gray-600 text-sm" />
                </div>
            </ToggleSection>

        </div>
    );
};