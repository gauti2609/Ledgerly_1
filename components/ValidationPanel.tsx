import React, { useState } from 'react';
import {
    ValidationResult,
    ValidationFinding,
    ValidationSeverity,
    getSeverityBgColor
} from '../services/validationService.ts';
import { ChevronDownIcon, ChevronUpIcon } from './icons.tsx';

interface ValidationPanelProps {
    validationResult: ValidationResult | null;
    onClose: () => void;
    onLedgerClick?: (ledgerId: string) => void;
}

const SeverityBadge: React.FC<{ severity: ValidationSeverity; count: number }> = ({ severity, count }) => {
    if (count === 0) return null;

    const colors = {
        Critical: 'bg-red-600',
        High: 'bg-orange-500',
        Medium: 'bg-yellow-500'
    };

    return (
        <span className={`${colors[severity]} text-white text-xs font-bold px-2 py-1 rounded-full`}>
            {count} {severity}
        </span>
    );
};

const FindingCard: React.FC<{
    finding: ValidationFinding;
    onLedgerClick?: (ledgerId: string) => void
}> = ({ finding, onLedgerClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`border rounded-lg p-3 mb-2 ${getSeverityBgColor(finding.severity)}`}>
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${finding.severity === 'Critical' ? 'bg-red-600 text-white' :
                            finding.severity === 'High' ? 'bg-orange-500 text-white' :
                                'bg-yellow-500 text-black'
                        }`}>
                        {finding.ruleId}
                    </span>
                    <span className="font-medium text-white">{finding.ruleName}</span>
                </div>
                {isExpanded ?
                    <ChevronUpIcon className="w-4 h-4 text-gray-400" /> :
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                }
            </div>

            <p className="text-gray-300 text-sm mt-2">{finding.message}</p>

            {isExpanded && finding.details && (
                <div className="mt-2 pt-2 border-t border-gray-600">
                    <p className="text-gray-400 text-xs">{finding.details}</p>

                    {finding.affectedLedgers && finding.affectedLedgers.length > 0 && onLedgerClick && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {finding.affectedLedgers.slice(0, 10).map((ledgerId, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onLedgerClick(ledgerId);
                                    }}
                                    className="text-xs bg-gray-700 hover:bg-gray-600 text-blue-400 px-2 py-0.5 rounded"
                                >
                                    View #{idx + 1}
                                </button>
                            ))}
                            {finding.affectedLedgers.length > 10 && (
                                <span className="text-xs text-gray-500">+{finding.affectedLedgers.length - 10} more</span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
    validationResult,
    onClose,
    onLedgerClick
}) => {
    if (!validationResult) return null;

    const { findings, criticalCount, highCount, mediumCount, isValid, timestamp } = validationResult;

    // Group findings by severity
    const criticalFindings = findings.filter(f => f.severity === 'Critical');
    const highFindings = findings.filter(f => f.severity === 'High');
    const mediumFindings = findings.filter(f => f.severity === 'Medium');

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white">Validation Results</h3>
                    {isValid ? (
                        <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            ✓ Valid
                        </span>
                    ) : (
                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            ✗ Issues Found
                        </span>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white text-xl font-bold"
                >
                    ×
                </button>
            </div>

            {/* Summary badges */}
            <div className="flex gap-2 mb-4">
                <SeverityBadge severity="Critical" count={criticalCount} />
                <SeverityBadge severity="High" count={highCount} />
                <SeverityBadge severity="Medium" count={mediumCount} />
                <span className="text-gray-500 text-xs ml-auto">
                    Validated at {timestamp.toLocaleTimeString()}
                </span>
            </div>

            {/* Findings */}
            {findings.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <span className="text-4xl">✓</span>
                    <p className="mt-2">All validations passed! No issues found.</p>
                </div>
            ) : (
                <div className="max-h-96 overflow-y-auto pr-2">
                    {/* Critical */}
                    {criticalFindings.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                Critical Issues
                            </h4>
                            {criticalFindings.map((finding, idx) => (
                                <FindingCard key={idx} finding={finding} onLedgerClick={onLedgerClick} />
                            ))}
                        </div>
                    )}

                    {/* High */}
                    {highFindings.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-orange-400 font-semibold mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                High Priority
                            </h4>
                            {highFindings.map((finding, idx) => (
                                <FindingCard key={idx} finding={finding} onLedgerClick={onLedgerClick} />
                            ))}
                        </div>
                    )}

                    {/* Medium */}
                    {mediumFindings.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                Medium Priority
                            </h4>
                            {mediumFindings.map((finding, idx) => (
                                <FindingCard key={idx} finding={finding} onLedgerClick={onLedgerClick} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
