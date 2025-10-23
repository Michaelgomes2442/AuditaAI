# Email Notification System

## Overview
Comprehensive email notification system for test completion, performance alerts, and scheduled reports using Resend.

## Features Implemented

### ✅ Notification Settings Page
- **Location**: `/settings/notifications`
- **Features**:
  - Email notifications toggle
  - Test completion notifications
  - Batch test completion alerts
  - Scheduled test completion
  - Performance alert system
  - Witness consensus failure alerts
  - Scheduled reports (daily/weekly/monthly)
  - Customizable thresholds and delivery time

### ✅ Database Schema
Added `NotificationPreference` model with:
- Email enable/disable toggles
- Test completion preferences
- Performance alert settings (low/high thresholds)
- Score drop detection
- Witness failure alerts
- Scheduled report preferences (daily/weekly/monthly)
- Report delivery time customization

### ✅ API Routes

#### `/api/notifications/preferences` (GET/PUT)
- Fetch user notification preferences
- Update notification settings
- Auto-create default preferences

#### `/api/notifications/send` (POST)
- Send emails via Resend
- 5 email templates:
  - Test completion
  - Batch test completion
  - Score alerts
  - Witness consensus failures
  - Scheduled reports

### ✅ Email Templates
Professional HTML email templates with:
- Gradient headers
- Responsive design
- Metric cards
- Call-to-action buttons
- Branded footer

### ✅ Helper Functions
**File**: `src/lib/notifications.ts`

```typescript
// Send test completion
notifyTestComplete(email, model, criesScore, duration, prompt);

// Send batch completion
notifyBatchComplete(email, results, avgScore);

// Send score alert
notifyScoreAlert(email, model, score, threshold, alertType);

// Send witness failure
notifyWitnessFailure(email, testId, witnessCount, totalWitnesses, reason);

// Send scheduled report
sendScheduledReport(email, period, dateRange, stats);
```

## Setup Instructions

### 1. Get Resend API Key
1. Sign up at https://resend.com
2. Create API key
3. Verify sending domain (optional for production)

### 2. Environment Variables
Add to `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL="AuditaAI <noreply@auditaai.com>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Migration
Schema already pushed. Preferences auto-create on first access.

## Usage Examples

### From Test Completion Handler
```typescript
import { notifyTestComplete } from '@/lib/notifications';

async function onTestComplete(test) {
  const user = await getUser();
  const prefs = await getNotificationPreferences(user.id);
  
  if (prefs.emailEnabled && prefs.testComplete) {
    await notifyTestComplete(
      user.email,
      test.model,
      test.criesScore,
      test.duration,
      test.prompt
    );
  }
}
```

### From Batch Testing
```typescript
import { notifyBatchComplete } from '@/lib/notifications';

async function onBatchComplete(results) {
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const user = await getUser();
  const prefs = await getNotificationPreferences(user.id);
  
  if (prefs.emailEnabled && prefs.batchComplete) {
    await notifyBatchComplete(user.email, results, avgScore);
  }
}
```

### Score Alert Monitoring
```typescript
import { notifyScoreAlert } from '@/lib/notifications';

async function checkScoreThresholds(test) {
  const prefs = await getNotificationPreferences(test.userId);
  
  if (prefs.alertsEnabled && test.score < prefs.lowScoreThreshold) {
    await notifyScoreAlert(
      test.userEmail,
      test.model,
      test.score,
      prefs.lowScoreThreshold,
      'low-score'
    );
  }
}
```

## UI Components Created

### Switch Component
- **File**: `src/components/ui/switch.tsx`
- Radix UI based toggle switch
- Used for all notification preferences

### Toast System
- **Files**: 
  - `src/components/ui/toast.tsx` (primitives)
  - `src/components/ui/toaster.tsx` (container)
  - `src/hooks/use-toast.ts` (hook)
- Success/error feedback for settings changes

## Default Preferences
When a user first accesses notification settings:
```typescript
{
  emailEnabled: true,
  testComplete: true,
  batchComplete: true,
  scheduledTestComplete: true,
  alertsEnabled: true,
  lowScoreThreshold: 70,
  highScoreThreshold: 90,
  scoreDropAlert: true,
  witnessFailureAlert: true,
  dailyReport: false,
  weeklyReport: true,
  monthlyReport: false,
  reportTime: '09:00'
}
```

## Integration Points

### Add to Navigation
```typescript
// In MobileNav or main nav
{
  title: 'Notifications',
  href: '/settings/notifications',
  icon: Bell,
}
```

### Add Toaster to Layout
```typescript
// In app/layout.tsx
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

## Email Templates

### Test Complete
- Model name and CRIES score
- Duration and prompt preview
- "View Results" CTA

### Batch Complete
- Passed/failed/average stats
- Visual stat cards
- "View Full Results" CTA

### Score Alert
- Alert type and threshold
- Current vs previous score
- "Investigate Issue" CTA

### Witness Failure
- Test ID and witness counts
- Failure reason
- "Review Witnesses" CTA

### Scheduled Report
- Overview statistics
- Top performing models
- Trend indicators
- "View Full Report" CTA

## Resend Free Tier
- 3,000 emails/month
- 100 emails/day
- Perfect for pilot/demo phase
- Upgrade as needed

## Next Steps
1. Add Toaster to root layout
2. Integrate notification calls in test completion handlers
3. Set up scheduled report cron jobs
4. Test email delivery
5. Configure sending domain for production

## Testing
1. Visit `/settings/notifications`
2. Configure preferences
3. Trigger a test completion
4. Check email inbox
5. Verify template rendering

## Security Notes
- API key stored in environment variables
- User email validation on send
- Rate limiting via Resend
- Preferences tied to authenticated user
- No email addresses exposed in client

## Performance
- Async email sending (non-blocking)
- Background job support ready
- Queue integration possible
- Template caching in production

---

**Status**: ✅ Complete
**Dependencies**: Resend, @radix-ui/react-switch, @radix-ui/react-toast
**Migration**: Applied via `prisma db push`
