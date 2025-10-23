# Historical Trend Charts

## Overview
Real-time performance trend visualization using **actual test data from the database**. No fake historical data—charts populate as users run tests.

## ✅ Key Design Principle
**No Fake Data**: Charts display ONLY real test results from the `TestResult` table. Empty states shown when no data exists.

## Features Implemented

### ✅ Database Schema
**Model: `TestResult`**
```prisma
model TestResult {
  id              Int      @id @default(autoincrement())
  userId          Int
  modelName       String
  modelProvider   String
  prompt          String   @db.Text
  response        String?  @db.Text
  criesScore      Float?
  responseTime    Int?     // milliseconds
  tokenCount      Int?
  cost            Float?
  status          String   // 'completed', 'failed', 'pending'
  errorMessage    String?  @db.Text
  metadata        Json?
  createdAt       DateTime @default(now())

  @@index([userId, createdAt])
  @@index([modelName, createdAt])
  @@index([userId, modelName, createdAt])
}
```

### ✅ Trends Page
**Location**: `/analytics/trends`

**Features**:
- Time range selector (7/14/30/60/90 days)
- Model filter (all models or specific model)
- Metric selector (CRIES Score, Response Time, Cost)
- Area chart with daily aggregation
- Model comparison table
- Trend calculation (first half vs second half)
- Empty state when no data exists

**Charts Display**:
- **Time Series**: Daily average of selected metric
- **Model Comparison**: Average, min, max per model
- **Stats Cards**: Total tests, average metric, trend percentage

### ✅ API Routes

#### `/api/analytics/trends` (GET)
Query parameters:
- `days`: Time range (default: 30)
- `model`: Filter by model name (optional)

Returns:
- Real test results from database
- Available models list
- Date range

#### `/api/test-results` (POST/GET)
- **POST**: Save test result after completion
- **GET**: Retrieve recent test results

### ✅ Helper Functions
**File**: `src/lib/test-results.ts`

```typescript
// Save successful test
saveSuccessfulTest(
  userId,
  modelName,
  modelProvider,
  prompt,
  response,
  criesScore,
  responseTime,
  tokenCount,
  cost
);

// Save failed test
saveFailedTest(
  userId,
  modelName,
  modelProvider,
  prompt,
  errorMessage
);
```

## Integration Guide

### 1. Save Test Results
Add to your test completion handler:

```typescript
import { saveSuccessfulTest } from '@/lib/test-results';

async function onTestComplete(test) {
  const user = await getUser();
  
  await saveSuccessfulTest(
    user.id,
    test.modelName,
    test.modelProvider,
    test.prompt,
    test.response,
    test.criesScore,
    test.responseTime,
    test.tokenCount,
    test.cost,
    { testType: 'manual' } // optional metadata
  );
}
```

### 2. From Batch Testing
```typescript
async function onBatchTestComplete(results) {
  const user = await getUser();
  
  for (const result of results) {
    if (result.status === 'completed') {
      await saveSuccessfulTest(
        user.id,
        result.modelName,
        result.modelProvider,
        config.prompt,
        result.response,
        result.criesScore,
        result.duration,
        result.tokenCount,
        result.cost
      );
    } else {
      await saveFailedTest(
        user.id,
        result.modelName,
        result.modelProvider,
        config.prompt,
        result.error
      );
    }
  }
}
```

### 3. From Scheduled Tests
```typescript
async function runScheduledTest(schedule) {
  const startTime = Date.now();
  
  try {
    const result = await executeTest(schedule.prompt);
    const responseTime = Date.now() - startTime;
    
    await saveSuccessfulTest(
      schedule.userId,
      schedule.modelName,
      schedule.modelProvider,
      schedule.prompt,
      result.response,
      result.criesScore,
      responseTime,
      result.tokenCount,
      result.cost,
      { scheduleId: schedule.id }
    );
  } catch (error) {
    await saveFailedTest(
      schedule.userId,
      schedule.modelName,
      schedule.modelProvider,
      schedule.prompt,
      error.message,
      { scheduleId: schedule.id }
    );
  }
}
```

## Data Flow

### Test Execution → Database → Trends
```
1. User runs test
   ↓
2. Test completes (success/failure)
   ↓
3. saveTestResult() called
   ↓
4. TestResult record created in DB
   ↓
5. Trends page queries TestResult table
   ↓
6. Charts render with real data
```

## Empty State Handling

When no test data exists:
```typescript
if (!data?.results.length) {
  return (
    <Card>
      <AlertCircle />
      <h3>No Data Available</h3>
      <p>Run some tests to see performance trends here.</p>
    </Card>
  );
}
```

## Chart Calculations

### Daily Aggregation
```typescript
// Group results by date
const grouped = results.reduce((acc, result) => {
  const date = new Date(result.createdAt).toLocaleDateString();
  if (!acc[date]) acc[date] = { values: [] };
  acc[date].values.push(result.criesScore);
  return acc;
}, {});

// Calculate daily averages
const chartData = Object.values(grouped).map(day => ({
  date: day.date,
  average: day.values.reduce((sum, val) => sum + val, 0) / day.values.length
}));
```

### Trend Calculation
```typescript
// Compare first half vs second half of time period
const midpoint = Math.floor(values.length / 2);
const firstHalf = values.slice(0, midpoint);
const secondHalf = values.slice(midpoint);

const firstAvg = average(firstHalf);
const secondAvg = average(secondHalf);
const trend = ((secondAvg - firstAvg) / firstAvg) * 100;
```

### Model Comparison
```typescript
// Group by model, calculate stats
const modelData = results.reduce((acc, result) => {
  if (!acc[result.modelName]) acc[result.modelName] = [];
  acc[result.modelName].push(result.criesScore);
  return acc;
}, {});

// Calculate per-model statistics
const comparison = Object.entries(modelData).map(([model, values]) => ({
  modelName: model,
  average: average(values),
  min: Math.min(...values),
  max: Math.max(...values),
  count: values.length
}));
```

## Metrics Supported

### CRIES Score
- Range: 0-100
- Format: `85.3`
- Visualization: Higher is better

### Response Time
- Range: 0-∞ milliseconds
- Format: `1234ms`
- Visualization: Lower is better

### Cost
- Range: 0-∞ dollars
- Format: `$0.0012`
- Visualization: Lower is better

## UI Components

### Time Range Selector
- 7 days
- 14 days
- 30 days (default)
- 60 days
- 90 days

### Model Filter
- All Models (default)
- Individual models from database

### Metric Selector
- CRIES Score (default)
- Response Time
- Cost

## Database Indexes
Optimized queries with:
- `@@index([userId, createdAt])`
- `@@index([modelName, createdAt])`
- `@@index([userId, modelName, createdAt])`

## Performance Considerations

### Query Optimization
- Limit date range to prevent large queries
- Only fetch completed tests by default
- Use database indexes for fast filtering

### Client-Side Aggregation
- Group by date in JavaScript
- Calculate statistics client-side
- Reduce API payload size

## Testing the Feature

### Step 1: Run Some Tests
```typescript
// In Lab page or batch testing
await runTest({
  model: 'GPT-4',
  prompt: 'Test prompt'
});
```

### Step 2: Visit Trends Page
```
Navigate to /analytics/trends
```

### Step 3: Verify Charts
- Should see data points appear
- Time series should show daily averages
- Model comparison should list tested models

## Add to Navigation

```typescript
// In MobileNav or main nav
{
  title: 'Trends',
  href: '/analytics/trends',
  icon: TrendingUp,
}
```

## Data Retention

### Current: Unlimited Storage
All test results stored indefinitely.

### Future: Optional Retention Policies
```typescript
// Example: Delete tests older than 90 days
await prisma.testResult.deleteMany({
  where: {
    createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
  }
});
```

## Privacy & Security

### User Isolation
- Tests filtered by `userId`
- Users only see their own data
- No cross-user data leakage

### Authentication
- Requires active session
- API routes verify user identity
- Database queries scoped to user

## Example Data Lifecycle

### Day 1: No Data
- User visits `/analytics/trends`
- Sees empty state message
- Charts don't render

### Day 7: Some Tests
- User has run 15 tests
- Charts show 7 data points (daily averages)
- Trend calculation shows +5% improvement

### Day 30: Rich Data
- User has run 100 tests across 5 models
- Full 30-day time series
- Model comparison shows performance differences
- Meaningful trend analysis

## Integration Checklist

- [ ] Add `saveTestResult()` to Lab test completion
- [ ] Add to batch testing completion handler
- [ ] Add to scheduled test runner
- [ ] Test with real user flow
- [ ] Verify empty states work
- [ ] Check performance with large datasets
- [ ] Add to main navigation
- [ ] Update user documentation

---

**Status**: ✅ Complete
**Dependencies**: recharts (already installed)
**Migration**: Applied via `prisma db push`
**Data Source**: Real test results only—NO fake data
