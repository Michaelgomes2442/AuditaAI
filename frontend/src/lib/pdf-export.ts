import { jsPDF } from 'jspdf';

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

/**
 * Export audit report as branded PDF
 * @param auditData - Complete audit data including CRIES scores and witness results
 * @param filename - Optional custom filename (defaults to audit_report_[timestamp].pdf)
 */
export function exportAuditPDF(auditData: AuditData, filename?: string): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let yPosition = margin;

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string, index: number) => {
      checkPageBreak();
      doc.text(line, x, y + (index * lineHeight));
    });
    return lines.length * lineHeight;
  };

  // ==========================================
  // HEADER - AuditaAI Branding
  // ==========================================
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('AuditaAI', margin, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('AI Audit Report', margin, 30);

  doc.setTextColor(0, 0, 0);
  yPosition = 50;

  // ==========================================
  // REPORT METADATA
  // ==========================================
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += lineHeight;

  doc.text(`Audit ID: ${auditData.id}`, margin, yPosition);
  yPosition += lineHeight;

  if (auditData.userEmail) {
    doc.text(`User: ${auditData.userEmail}`, margin, yPosition);
    yPosition += lineHeight;
  }

  yPosition += lineHeight;

  // ==========================================
  // EXECUTIVE SUMMARY
  // ==========================================
  checkPageBreak(40);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin, yPosition);
  yPosition += lineHeight + 3;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Overall CRIES Score Box
  const boxHeight = 25;
  const boxWidth = 60;
  
  // Determine color based on score
  const overallScore = auditData.criesScore.overall * 100;
  let scoreColor: [number, number, number];
  if (overallScore >= 85) {
    scoreColor = [74, 222, 128]; // green-400
  } else if (overallScore >= 70) {
    scoreColor = [250, 204, 21]; // yellow-400
  } else {
    scoreColor = [248, 113, 113]; // red-400
  }

  checkPageBreak(boxHeight + 10);
  doc.setFillColor(...scoreColor);
  doc.roundedRect(margin, yPosition, boxWidth, boxHeight, 3, 3, 'F');

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text('Overall CRIES Score', margin + 5, yPosition + 8);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`${overallScore.toFixed(1)}%`, margin + 5, yPosition + 20);

  // Consensus Rate (if available)
  if (auditData.consensusRate !== undefined) {
    const consensusBoxX = margin + boxWidth + 10;
    const consensusScore = auditData.consensusRate * 100;
    const consensusColor: [number, number, number] = consensusScore >= 80 
      ? [74, 222, 128] 
      : consensusScore >= 60 
        ? [250, 204, 21] 
        : [248, 113, 113];

    doc.setFillColor(...consensusColor);
    doc.roundedRect(consensusBoxX, yPosition, boxWidth, boxHeight, 3, 3, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Witness Consensus', consensusBoxX + 5, yPosition + 8);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`${consensusScore.toFixed(0)}%`, consensusBoxX + 5, yPosition + 20);
  }

  yPosition += boxHeight + 15;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  // ==========================================
  // PROMPT SECTION
  // ==========================================
  checkPageBreak(30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Audit Prompt', margin, yPosition);
  yPosition += lineHeight;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  const promptHeight = addWrappedText(
    auditData.prompt.substring(0, 500) + (auditData.prompt.length > 500 ? '...' : ''),
    margin + 5,
    yPosition,
    pageWidth - (margin * 2) - 5
  );
  yPosition += promptHeight + lineHeight;

  // ==========================================
  // CRIES SCORES TABLE
  // ==========================================
  checkPageBreak(50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CRIES Dimension Scores', margin, yPosition);
  yPosition += lineHeight + 3;

  // Table headers
  const tableX = margin;
  const colWidths = [80, 40, 50];
  const tableY = yPosition;

  doc.setFillColor(229, 231, 235); // gray-200
  doc.rect(tableX, tableY, colWidths[0] + colWidths[1] + colWidths[2], 10, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Dimension', tableX + 2, tableY + 7);
  doc.text('Score', tableX + colWidths[0] + 2, tableY + 7);
  doc.text('Rating', tableX + colWidths[0] + colWidths[1] + 2, tableY + 7);

  yPosition = tableY + 10;

  // Table rows
  const dimensions = [
    { name: 'Completeness', score: auditData.criesScore.completeness, description: 'Coverage & depth' },
    { name: 'Reliability', score: auditData.criesScore.reliability, description: 'Consistency & errors' },
    { name: 'Integrity', score: auditData.criesScore.integrity, description: 'Bias & alignment' },
    { name: 'Effectiveness', score: auditData.criesScore.effectiveness, description: 'Task completion' },
    { name: 'Security', score: auditData.criesScore.security, description: 'Adversarial resistance' }
  ];

  doc.setFont('helvetica', 'normal');
  dimensions.forEach((dim, index) => {
    checkPageBreak(8);
    const rowY = yPosition + (index * 8);
    const scorePercent = dim.score * 100;
    
    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251); // gray-50
      doc.rect(tableX, rowY, colWidths[0] + colWidths[1] + colWidths[2], 8, 'F');
    }

    doc.setTextColor(0, 0, 0);
    doc.text(dim.name, tableX + 2, rowY + 6);
    doc.text(`${scorePercent.toFixed(1)}%`, tableX + colWidths[0] + 2, rowY + 6);

    // Rating text
    let rating = 'Needs Improvement';
    if (scorePercent >= 85) rating = 'Excellent';
    else if (scorePercent >= 70) rating = 'Good';

    doc.text(rating, tableX + colWidths[0] + colWidths[1] + 2, rowY + 6);
  });

  yPosition += dimensions.length * 8 + lineHeight;

  // ==========================================
  // WITNESS CONSENSUS SECTION
  // ==========================================
  if (auditData.witnessResults && auditData.witnessResults.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Witness Model Comparison', margin, yPosition);
    yPosition += lineHeight + 3;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${auditData.witnessResults.length} model(s) tested`, margin, yPosition);
    yPosition += lineHeight + 2;

    auditData.witnessResults.slice(0, 3).forEach((witness, index) => {
      checkPageBreak(30);
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Model ${index + 1}: ${witness.modelName}`, margin + 5, yPosition);
      yPosition += lineHeight;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`CRIES: ${(witness.criesScore.overall * 100).toFixed(1)}%`, margin + 5, yPosition);
      doc.text(`Time: ${new Date(witness.timestamp).toLocaleTimeString()}`, margin + 60, yPosition);
      yPosition += lineHeight;

      // Truncated output
      doc.setFont('helvetica', 'italic');
      const outputPreview = witness.output.substring(0, 150) + (witness.output.length > 150 ? '...' : '');
      const outputHeight = addWrappedText(outputPreview, margin + 5, yPosition, pageWidth - (margin * 2) - 5, 9);
      yPosition += outputHeight + lineHeight;
    });

    if (auditData.witnessResults.length > 3) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(`... and ${auditData.witnessResults.length - 3} more model(s)`, margin + 5, yPosition);
      yPosition += lineHeight;
    }
  }

  // ==========================================
  // LAMPORT CHAIN RECEIPT
  // ==========================================
  if (auditData.receipt) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Cryptographic Receipt', margin, yPosition);
    yPosition += lineHeight + 3;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Receipt Hash:`, margin, yPosition);
    yPosition += lineHeight;
    doc.setFont('helvetica', 'mono');
    doc.setFontSize(8);
    const hashHeight = addWrappedText(auditData.receipt.hash, margin + 5, yPosition, pageWidth - (margin * 2) - 5, 8);
    yPosition += hashHeight + lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Lamport Clock: ${auditData.receipt.lamportClock}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Event: ${auditData.receipt.event}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Timestamp: ${new Date(auditData.receipt.timestamp).toLocaleString()}`, margin, yPosition);
    yPosition += lineHeight + lineHeight;

    if (auditData.receipt.previousHash) {
      doc.text(`Previous Hash:`, margin, yPosition);
      yPosition += lineHeight;
      doc.setFont('helvetica', 'mono');
      doc.setFontSize(8);
      const prevHashHeight = addWrappedText(auditData.receipt.previousHash, margin + 5, yPosition, pageWidth - (margin * 2) - 5, 8);
      yPosition += prevHashHeight + lineHeight;
    }
  }

  // ==========================================
  // COMPLIANCE FOOTER
  // ==========================================
  const footerY = pageHeight - 30;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text('This audit report was generated by AuditaAI and cryptographically verified using Lamport chains.', margin, footerY + 7);
  doc.text('All CRIES scores are calculated using our proprietary methodology combining completeness, reliability,', margin, footerY + 12);
  doc.text('integrity, effectiveness, and security metrics. For compliance inquiries, contact compliance@auditaai.com', margin, footerY + 17);

  // Watermark on last page
  doc.setTextColor(229, 231, 235, 0.3); // gray-200 with transparency
  doc.setFontSize(60);
  doc.setFont('helvetica', 'bold');
  const watermarkText = 'AUDITAAI';
  const watermarkWidth = doc.getTextWidth(watermarkText);
  doc.text(watermarkText, (pageWidth - watermarkWidth) / 2, pageHeight / 2, { angle: 45 });

  // ==========================================
  // SAVE PDF
  // ==========================================
  const pdfFilename = filename || `audit_report_${Date.now()}.pdf`;
  doc.save(pdfFilename);
}

/**
 * Export comparison report with multiple audits
 */
export function exportComparisonPDF(audits: AuditData[], filename?: string): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let yPosition = margin;

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('AuditaAI', margin, 20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Audit Comparison Report', margin, 30);
  doc.setTextColor(0, 0, 0);
  yPosition = 50;

  doc.setFontSize(10);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += lineHeight;
  doc.text(`Comparing ${audits.length} audit(s)`, margin, yPosition);
  yPosition += lineHeight * 2;

  // Comparison table
  audits.forEach((audit, index) => {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Audit ${index + 1}`, margin, yPosition);
    yPosition += lineHeight;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID: ${audit.id}`, margin + 5, yPosition);
    yPosition += lineHeight;
    doc.text(`Overall Score: ${(audit.criesScore.overall * 100).toFixed(1)}%`, margin + 5, yPosition);
    yPosition += lineHeight;
    doc.text(`Timestamp: ${new Date(audit.timestamp).toLocaleString()}`, margin + 5, yPosition);
    yPosition += lineHeight * 2;
  });

  const pdfFilename = filename || `comparison_report_${Date.now()}.pdf`;
  doc.save(pdfFilename);
}
