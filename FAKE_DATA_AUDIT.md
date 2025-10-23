# Fake Data Audit - AuditaAI Web App

## Status: IN PROGRESS
**Date**: 2025-10-22
**Priority**: CRITICAL - All mock/fake data must be replaced with real LLM conversation data

## Real Data Source
✅ **NEW ENDPOINT**: `/api/conversations/aggregate`
- Aggregates ALL real conversation data from actual LLM interactions
- Returns real CRIES scores from Track-A analyzer
- Returns real Lamport receipts from filesystem
- NO fake/mock/simulated data

## Pages with Fake Data

### ✅ FIXED
1. **Math Canon** (`/lab/math`) - Now pulls real CRIES from receipts
2. **Q-Trace** (`/lab/qtrace`) - Now uses real aggregated data

### ❌ NEEDS FIXING

#### High Priority (User-Facing Analytics)
1. **CRIES Metrics** (`/cries-metrics`)
   - Lines 109-163: Simulates random metrics every 5 seconds
   - FIX: Use `/api/conversations/aggregate` for real CRIES

2. **Live Tracking** (`/live-tracking`)
   - Line 138+: Sample data initialization
   - Line 206: Random sigma values
   - FIX: Pull from real conversation streams

3. **BEN Runtime** (`/ben-runtime`)
   - Lines 131-188: Simulates fake events with Math.random()
   - FIX: Show real receipts from `/api/receipts/registry`

4. **Live Demo** (already mostly correct, but check)
   - Verify parallel prompting calls real LLMs
   - Verify Track-A analyzer computes real CRIES

#### Medium Priority (Lab Features)
5. **Witness System** (`/lab/witness`)
   - Lines 95-136: Random claim/consensus counts
   - FIX: Calculate from actual multi-model comparisons

6. **Compare** (`/compare`)
   - Line 26: Mock data comment
   - FIX: Use real model comparison data

7. **Batch Test** (`/batch-test`)
   - Lines 117-144: Simulates test execution
   - FIX: Actually run tests and show real results

#### Low Priority (Demos/Walkthroughs)
8. **Walkthrough** (`/walkthrough`)
   - Lines 107-226: Multiple simulation points
   - OK to keep as demo, but mark clearly as "DEMO ONLY"

9. **Governance** (`/governance`)
   - Line 14: Simulated policies
   - FIX: Pull from real policy store

## Backend Fake Data (server.js)

### Critical Endpoints with Fake Data
- `/api/pilot/simulate-update` - Line 345
- `/api/live-demo/import-model` - Lines 478-500 (generates fake CRIES)
- `/api/live-demo/tracking` - Lines 721-739 (simulates fluctuations)
- `/api/mesh/peers` - Lines 2001-2027 (simulates mesh peers)

### Action Items
1. Remove all `Math.random()` calls that generate fake metrics
2. Replace with real data from:
   - Conversation receipts (filesystem)
   - BEN governance service (port 8000)
   - Track-A CRIES analysis (real LLM outputs)
3. Return empty/zero values when no real data exists (don't fake it!)
4. Add clear messages: "No data yet - run LLM conversations to generate"

## Implementation Strategy

### Phase 1: Core Data Flow ✅
- [x] Create `/api/conversations/aggregate` endpoint
- [x] Fix Math Canon to use real data
- [x] Fix Q-Trace to use real data

### Phase 2: Critical Pages (IN PROGRESS)
- [ ] Fix CRIES Metrics page
- [ ] Fix Live Tracking page  
- [ ] Fix BEN Runtime page
- [ ] Verify Live Demo uses real LLMs

### Phase 3: Lab Features
- [ ] Fix Witness System
- [ ] Fix Compare page
- [ ] Fix Batch Test

### Phase 4: Clean Up
- [ ] Remove all unused mock data
- [ ] Add "No data" states everywhere
- [ ] Document how to generate real data

## How to Generate Real Data

Users need to:
1. Go to `/live-demo`
2. Click "Import Model" or use Ollama (free local models)
3. Run "Parallel Prompt" with real LLM
4. Track-A analyzer computes real CRIES from response
5. Lamport receipt generated automatically
6. All dashboards now show REAL data

## Testing Checklist
- [ ] Math Canon shows zeros when no data
- [ ] Math Canon shows real CRIES after running prompts
- [ ] Q-Trace shows real receipts from conversations
- [ ] All pages handle "no data" gracefully
- [ ] No `Math.random()` in production code paths
- [ ] All receipts are real and verifiable
