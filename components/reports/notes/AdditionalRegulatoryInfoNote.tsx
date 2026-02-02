import React from 'react';
import { AdditionalRegulatoryInfoData, FundUtilisationData, FundUtilisationIntermediary, FundUtilisationGuarantee, FundUtilisationUltimate, ManualInput } from '../../../types.ts';

interface AdditionalRegulatoryInfoNoteProps {
    data: AdditionalRegulatoryInfoData;
}

const Section: React.FC<{ title: string; children: React.ReactNode; defaultText?: string }> = ({ title, children, defaultText }) => {
    const hasContent = React.Children.count(children) > 0 &&
        React.Children.toArray(children).some(child => child !== null && typeof child !== 'boolean' && (typeof child !== 'string' || child.trim() !== ''));

    return (
        <div className="mt-4 break-inside-avoid">
            <h4 className="font-semibold text-gray-300 text-sm mb-2">{title}</h4>
            <div className="text-xs space-y-1 text-gray-400">
                {hasContent ? children : <p className="italic text-gray-500">{defaultText || 'No items to report.'}</p>}
            </div>
        </div>
    );
}

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between">
        <span>{label}</span>
        <span className="font-mono text-right">{value || '-'}</span>
    </div>
);

// Other display components like FundUtilisationDisplayTable would go here.

export const AdditionalRegulatoryInfoNote: React.FC<AdditionalRegulatoryInfoNoteProps> = ({ data }) => {

    // Helper functions for ManualInput
    const getValue = (val: string | ManualInput | undefined): string => {
        if (!val) return '';
        return typeof val === 'string' ? val : val.value;
    };

    const shouldShow = (val: string | ManualInput | undefined): boolean => {
        if (!val) return false;
        if (typeof val === 'string') return val.length > 0;
        return val.isSelected;
    };

    // Default to true if applicability map is missing (legacy data compatibility)
    // If map exists, strictly follow it.
    const isApplicable = (key: string) => {
        return data.applicability?.[key] ?? true;
    };

    return (
        <div className="space-y-4">
            {isApplicable('immovableProperty') && (
                <Section title="Title deeds of Immovable Property not held in name of the Company">
                    {data.immovableProperty && data.immovableProperty.length > 0 && (
                        <table className="min-w-full text-xs">
                            <thead className="bg-gray-800/50"><tr><th className="p-1 text-left">Description</th><th className="p-1 text-right">Carrying Value</th><th className="p-1 text-left">Holder Name</th></tr></thead>
                            <tbody>{data.immovableProperty.map(p => <tr key={p.id}><td className="p-1">{p.description}</td><td className="p-1 text-right">{p.grossCarrying}</td><td className="p-1">{p.holderName}</td></tr>)}</tbody>
                        </table>
                    )}
                </Section>
            )}

            {isApplicable('ppeRevaluation') && (
                <Section title="Revaluation of Property, Plant and Equipment">
                    {Array.isArray(data.ppeRevaluation) ? (
                        <table className="min-w-full text-xs mb-2">
                            <thead className="bg-gray-800/50"><tr><th className="p-1 text-left">Asset Class</th><th className="p-1 text-left">Date</th><th className="p-1 text-right">Amount</th><th className="p-1 text-left">Valuer</th><th className="p-1 text-left">Method</th></tr></thead>
                            <tbody>
                                {data.ppeRevaluation.map(r => (
                                    <tr key={r.id}><td className="p-1">{r.assetClass}</td><td className="p-1">{r.dateOfRevaluation}</td><td className="p-1 text-right">{r.amount}</td><td className="p-1">{r.valuerName}</td><td className="p-1">{r.method}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        shouldShow(data.ppeRevaluation) && <p className="mb-2">{getValue(data.ppeRevaluation)}</p>
                    )}
                </Section>
            )}

            {isApplicable('loansToPromoters') && (
                <Section title="Loans or Advances to Promoters, Directors, KMPs, etc.">
                    {data.loansToPromoters && data.loansToPromoters.length > 0 && (
                        <table className="min-w-full text-xs">
                            <thead className="bg-gray-800/50"><tr><th className="p-1 text-left">Borrower Type</th><th className="p-1 text-right">Amount</th><th className="p-1 text-right">% of Total</th></tr></thead>
                            <tbody>{data.loansToPromoters.map(l => <tr key={l.id}><td className="p-1">{l.borrowerType}</td><td className="p-1 text-right">{l.amount}</td><td className="p-1 text-right">{l.percentage}</td></tr>)}</tbody>
                        </table>
                    )}
                </Section>
            )}

            {isApplicable('benamiProperty') && (
                <Section title="Benami Property held">
                    {data.benamiProperty && data.benamiProperty.length > 0 && (
                        <table className="min-w-full text-xs">
                            <thead className="bg-gray-800/50"><tr><th className="p-1 text-left">Details</th><th className="p-1 text-left">Beneficiaries</th><th className="p-1 text-right">Amount</th><th className="p-1 text-left">In Books</th><th className="p-1 text-left">Reason</th></tr></thead>
                            <tbody>{data.benamiProperty.map(p => <tr key={p.id}><td className="p-1">{p.details}</td><td className="p-1">{p.beneficiaries}</td><td className="p-1 text-right">{p.amount}</td><td className="p-1">{p.inBooks}</td><td className="p-1">{p.reason}</td></tr>)}</tbody>
                        </table>
                    )}
                </Section>
            )}

            {isApplicable('currentAssetBorrowings') && shouldShow(data.currentAssetBorrowings) && (
                <Section title="Borrowings from banks/FIs on security of current assets"><p>{getValue(data.currentAssetBorrowings)}</p></Section>
            )}

            {isApplicable('wilfulDefaulter') && shouldShow(data.wilfulDefaulter) && (
                <Section title="Wilful Defaulter Status"><p>{getValue(data.wilfulDefaulter)}</p></Section>
            )}

            {isApplicable('struckOffCompanies') && (
                <Section title="Transactions with Struck off Companies">
                    {data.struckOffCompanies && data.struckOffCompanies.length > 0 && (
                        <table className="min-w-full text-xs">
                            <thead className="bg-gray-800/50"><tr><th className="p-1 text-left">Company</th><th className="p-1 text-left">Nature of Txn</th><th className="p-1 text-right">Balance</th></tr></thead>
                            <tbody>{data.struckOffCompanies.map(c => <tr key={c.id}><td className="p-1">{c.name}</td><td className="p-1">{c.nature}</td><td className="p-1 text-right">{c.balance}</td></tr>)}</tbody>
                        </table>
                    )}
                </Section>
            )}

            {isApplicable('csr') && (
                <Section title="Corporate Social Responsibility (CSR)">
                    <InfoRow label="Amount required to be spent" value={data.csr.required} />
                    <InfoRow label="Amount of expenditure incurred" value={data.csr.spent} />
                    <InfoRow label="Shortfall at the end of the year" value={data.csr.shortfall} />
                    {data.csr.shortfall && shouldShow(data.csr.reason) && <p className="mt-1"><strong>Reason for shortfall:</strong> {getValue(data.csr.reason)}</p>}

                    {data.csr.details && data.csr.details.length > 0 && (
                        <div className="mt-4">
                            <h5 className="font-semibold text-gray-400 text-xs mb-1">Project Details:</h5>
                            <table className="min-w-full text-xs">
                                <thead className="bg-gray-800/50"><tr><th className="p-1 text-left">Project</th><th className="p-1 text-left">Location</th><th className="p-1 text-right">Outlay</th><th className="p-1 text-right">Spent</th><th className="p-1 text-left">Mode</th></tr></thead>
                                <tbody>
                                    {data.csr.details.map(p => (
                                        <tr key={p.id}><td className="p-1">{p.projectName}</td><td className="p-1">{p.location}</td><td className="p-1 text-right">{p.amountOutlay}</td><td className="p-1 text-right">{p.amountSpent}</td><td className="p-1">{p.modeOfImplementation}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Section>
            )}

            {isApplicable('crypto') && (
                <Section title="Details of Crypto Currency or Virtual Currency">
                    <InfoRow label="Profit or loss on transactions" value={data.crypto.profitOrLoss} />
                    <InfoRow label="Amount of currency held as at reporting date" value={data.crypto.amountHeld} />
                    <InfoRow label="Deposits or advances from any person for trading or investing" value={data.crypto.advances} />
                </Section>
            )}

            {isApplicable('registrationOfCharges') && shouldShow(data.registrationOfCharges) && <Section title="Registration of charges with ROC"><p>{getValue(data.registrationOfCharges)}</p></Section>}
            {isApplicable('layerCompliance') && shouldShow(data.layerCompliance) && <Section title="Compliance with number of layers"><p>{getValue(data.layerCompliance)}</p></Section>}
            {isApplicable('schemeOfArrangements') && shouldShow(data.schemeOfArrangements) && <Section title="Compliance with approved Scheme(s) of Arrangements"><p>{getValue(data.schemeOfArrangements)}</p></Section>}

            {isApplicable('fundUtilisation') && (
                <Section title="Utilisation of Borrowed Funds & Premium">
                    {data.fundUtilisation.intermediaries && data.fundUtilisation.intermediaries.length > 0 && (
                        <div className="mb-4">
                            <h5 className="font-semibold text-gray-400 text-xs mb-1">Funds advanced to Intermediaries</h5>
                            <table className="min-w-full text-xs">
                                <thead className="bg-gray-800/50"><tr><th className="p-1 text-left">Intermediary</th><th className="p-1 text-left">Date</th><th className="p-1 text-right">Amount</th></tr></thead>
                                <tbody>{data.fundUtilisation.intermediaries.map(r => <tr key={r.id}><td className="p-1">{r.name}</td><td className="p-1">{r.date}</td><td className="p-1 text-right">{r.amount}</td></tr>)}</tbody>
                            </table>
                        </div>
                    )}
                    {data.fundUtilisation.ultimateBeneficiaries && data.fundUtilisation.ultimateBeneficiaries.length > 0 && (
                        <div>
                            <h5 className="font-semibold text-gray-400 text-xs mb-1">Funds received as Ultimate Beneficiaries</h5>
                            <table className="min-w-full text-xs">
                                <thead className="bg-gray-800/50"><tr><th className="p-1 text-left">Party</th><th className="p-1 text-left">Date</th><th className="p-1 text-right">Amount</th></tr></thead>
                                <tbody>{data.fundUtilisation.ultimateBeneficiaries.map(r => <tr key={r.id}><td className="p-1">{r.name}</td><td className="p-1">{r.date}</td><td className="p-1 text-right">{r.amount}</td></tr>)}</tbody>
                            </table>
                        </div>
                    )}
                    {(!data.fundUtilisation.intermediaries?.length && !data.fundUtilisation.ultimateBeneficiaries?.length) && <p className="italic text-gray-500">No reportable utilization of funds.</p>}
                </Section>
            )}

            {isApplicable('undisclosedIncome') && shouldShow(data.undisclosedIncome) && <Section title="Undisclosed Income"><p>{getValue(data.undisclosedIncome)}</p></Section>}
        </div>
    );
};