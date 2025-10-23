import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, type, data } = await request.json();

    if (!to || !subject || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize Resend client only when needed
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    let htmlContent = '';

    switch (type) {
      case 'test-complete':
        htmlContent = generateTestCompleteEmail(data);
        break;
      case 'batch-complete':
        htmlContent = generateBatchCompleteEmail(data);
        break;
      case 'score-alert':
        htmlContent = generateScoreAlertEmail(data);
        break;
      case 'witness-failure':
        htmlContent = generateWitnessFailureEmail(data);
        break;
      case 'scheduled-report':
        htmlContent = generateScheduledReportEmail(data);
        break;
      default:
        htmlContent = generateGenericEmail(data);
    }

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'AuditaAI <noreply@auditaai.com>',
      to,
      subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

function generateTestCompleteEmail(data: any) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .metric { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #667eea; }
          .score { font-size: 32px; font-weight: bold; color: #667eea; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Test Complete ✓</h1>
          </div>
          <div class="content">
            <p>Your test has completed successfully!</p>
            
            <div class="metric">
              <strong>Model:</strong> ${data.model || 'N/A'}
            </div>
            
            <div class="metric">
              <strong>CRIES Score:</strong>
              <div class="score">${data.criesScore || 'N/A'}</div>
            </div>
            
            <div class="metric">
              <strong>Duration:</strong> ${data.duration || 'N/A'}
            </div>
            
            ${data.prompt ? `
            <div class="metric">
              <strong>Prompt:</strong>
              <p style="margin: 10px 0; color: #666;">${data.prompt.substring(0, 200)}${data.prompt.length > 200 ? '...' : ''}</p>
            </div>
            ` : ''}
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/lab" class="button">View Results</a>
          </div>
          <div class="footer">
            <p>AuditaAI - Verifiable AI Testing Platform</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateBatchCompleteEmail(data: any) {
  const passed = data.results?.filter((r: any) => r.status === 'completed').length || 0;
  const failed = data.results?.filter((r: any) => r.status === 'failed').length || 0;
  const total = data.results?.length || 0;
  const avgScore = data.avgScore || 0;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { background: white; padding: 20px; border-radius: 6px; text-align: center; flex: 1; margin: 0 10px; }
          .stat-value { font-size: 28px; font-weight: bold; color: #667eea; }
          .stat-label { color: #666; font-size: 12px; text-transform: uppercase; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Batch Test Complete 🎯</h1>
          </div>
          <div class="content">
            <p>Your batch test of ${total} models has completed!</p>
            
            <div class="stats">
              <div class="stat">
                <div class="stat-value" style="color: #10b981;">${passed}</div>
                <div class="stat-label">Passed</div>
              </div>
              <div class="stat">
                <div class="stat-value" style="color: #ef4444;">${failed}</div>
                <div class="stat-label">Failed</div>
              </div>
              <div class="stat">
                <div class="stat-value">${avgScore.toFixed(1)}</div>
                <div class="stat-label">Avg Score</div>
              </div>
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/batch-test" class="button">View Full Results</a>
          </div>
          <div class="footer">
            <p>AuditaAI - Verifiable AI Testing Platform</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateScoreAlertEmail(data: any) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 6px; }
          .metric { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; }
          .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Performance Alert</h1>
          </div>
          <div class="content">
            <div class="alert">
              <strong>Alert:</strong> ${data.alertType === 'low-score' ? 'Low CRIES score detected' : 'Score drop detected'}
            </div>
            
            <div class="metric">
              <strong>Model:</strong> ${data.model || 'N/A'}
            </div>
            
            <div class="metric">
              <strong>CRIES Score:</strong> ${data.score || 'N/A'}
            </div>
            
            <div class="metric">
              <strong>Threshold:</strong> ${data.threshold || 'N/A'}
            </div>
            
            ${data.previousScore ? `
            <div class="metric">
              <strong>Previous Score:</strong> ${data.previousScore}
            </div>
            ` : ''}
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/lab/analytics" class="button">Investigate Issue</a>
          </div>
          <div class="footer">
            <p>AuditaAI - Verifiable AI Testing Platform</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateWitnessFailureEmail(data: any) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .critical { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 6px; }
          .metric { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; }
          .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Witness Consensus Failure</h1>
          </div>
          <div class="content">
            <div class="critical">
              <strong>Critical:</strong> Witness consensus could not be achieved
            </div>
            
            <div class="metric">
              <strong>Test ID:</strong> ${data.testId || 'N/A'}
            </div>
            
            <div class="metric">
              <strong>Witnesses Responding:</strong> ${data.witnessCount || 0}/${data.totalWitnesses || 0}
            </div>
            
            <div class="metric">
              <strong>Failure Reason:</strong> ${data.reason || 'Insufficient responses'}
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/lab/witness" class="button">Review Witnesses</a>
          </div>
          <div class="footer">
            <p>AuditaAI - Verifiable AI Testing Platform</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateScheduledReportEmail(data: any) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .section { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; }
          .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
          .stat { background: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
          .stat-label { color: #666; font-size: 12px; text-transform: uppercase; margin-top: 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 ${data.period || 'Weekly'} Report</h1>
            <p style="margin: 10px 0; opacity: 0.9;">${data.dateRange || ''}</p>
          </div>
          <div class="content">
            <div class="section">
              <h2 style="margin-top: 0;">Overview</h2>
              <div class="stats">
                <div class="stat">
                  <div class="stat-value">${data.totalTests || 0}</div>
                  <div class="stat-label">Total Tests</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${data.avgScore || 0}</div>
                  <div class="stat-label">Avg Score</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${data.modelsUsed || 0}</div>
                  <div class="stat-label">Models Used</div>
                </div>
                <div class="stat">
                  <div class="stat-value" style="color: ${data.trend > 0 ? '#10b981' : '#ef4444'};">
                    ${data.trend > 0 ? '+' : ''}${data.trend || 0}%
                  </div>
                  <div class="stat-label">Trend</div>
                </div>
              </div>
            </div>
            
            ${data.topModels ? `
            <div class="section">
              <h3>Top Performing Models</h3>
              ${data.topModels.map((model: any) => `
                <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f9fafb; border-radius: 4px;">
                  <span>${model.name}</span>
                  <strong style="color: #667eea;">${model.score}</strong>
                </div>
              `).join('')}
            </div>
            ` : ''}
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/lab/analytics" class="button">View Full Report</a>
          </div>
          <div class="footer">
            <p>AuditaAI - Verifiable AI Testing Platform</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateGenericEmail(data: any) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AuditaAI Notification</h1>
          </div>
          <div class="content">
            <p>${data.message || 'You have a new notification from AuditaAI.'}</p>
          </div>
          <div class="footer">
            <p>AuditaAI - Verifiable AI Testing Platform</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
