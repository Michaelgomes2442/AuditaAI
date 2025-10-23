'use client';

import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportAuditPDF, exportComparisonPDF } from '@/lib/pdf-export';

/**
 * Export PDF Button Component
 * 
 * Reusable button for exporting audit reports or comparison reports as branded PDFs.
 * 
 * @example
 * // Single audit export
 * <ExportPDFButton 
 *   auditData={{
 *     id: 'audit-123',
 *     prompt: 'Test prompt',
 *     criesScore: { completeness: 0.92, ... },
 *     receipt: { hash: 'abc...', ... },
 *     timestamp: new Date().toISOString()
 *   }}
 * />
 * 
 * @example
 * // Comparison export
 * <ExportPDFButton 
 *   auditsData={[audit1, audit2, audit3]}
 *   label="Export Comparison"
 *   variant="outline"
 * />
 */

interface CRIESScore {
  completeness: number;
  reliability: number;
  integrity: number;
  effectiveness: number;
  security: number;
  overall: number;
}

interface WitnessResult {
  modelName: string;
  output: string;
  criesScore: CRIESScore;
  timestamp: string;
  consensusAchieved?: boolean;
}

interface ReceiptData {
  hash: string;
  lamportClock: number;
  event: string;
  timestamp: string;
  previousHash?: string;
}

interface AuditData {
  id: string;
  prompt: string;
  criesScore: CRIESScore;
  witnessResults?: WitnessResult[];
  receipt?: ReceiptData;
  modelName?: string;
  timestamp: string;
  consensusRate?: number;
  userEmail?: string;
}

interface ExportPDFButtonProps {
  auditData?: AuditData;
  auditsData?: AuditData[];
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  label?: string;
  showIcon?: boolean;
  disabled?: boolean;
}

export default function ExportPDFButton({
  auditData,
  auditsData,
  variant = 'default',
  size = 'default',
  className = '',
  label,
  showIcon = true,
  disabled = false
}: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (disabled || isExporting) return;

    setIsExporting(true);

    try {
      // Simulate a small delay for UX (feels more substantial)
      await new Promise(resolve => setTimeout(resolve, 500));

      if (auditsData && auditsData.length > 0) {
        // Export comparison report
        exportComparisonPDF(auditsData);
      } else if (auditData) {
        // Export single audit report
        exportAuditPDF(auditData);
      } else {
        console.warn('No audit data provided to export');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const buttonLabel = label || (auditsData ? 'Export Comparison' : 'Download Report');
  const hasData = !!(auditData || (auditsData && auditsData.length > 0));

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isExporting || !hasData}
      variant={variant}
      size={size}
      className={className}
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          {showIcon && (
            auditsData ? (
              <FileText className="mr-2 h-4 w-4" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )
          )}
          {buttonLabel}
        </>
      )}
    </Button>
  );
}
