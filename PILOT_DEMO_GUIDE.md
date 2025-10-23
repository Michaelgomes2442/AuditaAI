# 🎬 AuditaAI Pilot Demo - Live Demonstration Guide

## Overview

The Pilot Demo is a fully functional, live demonstration environment designed for:
- ✅ Zoom presentations to potential pilot partners
- ✅ Research lab evaluations
- ✅ Live demos at conferences or meetings
- ✅ Sales presentations
- ✅ Internal training

## Features

### 1. **Live Demo Mode**
- Real-time CRIES score updates every 3 seconds
- Simulated model monitoring
- Live alerts and governance events
- Realistic data patterns

### 2. **Interactive Testing**
- Run governance tests on any model
- See immediate CRIES score improvements
- Generate audit trails
- Demonstrate intervention capabilities

### 3. **Multi-Model Monitoring**
Pre-configured with 3 research station models:
- **GPT-4 Research Station** - High performance baseline
- **Claude Ethics Lab** - Ethics-focused configuration
- **Llama Compliance Test** - Compliance testing with alerts

### 4. **Comprehensive Dashboard Views**
- **Models Dashboard**: Individual model monitoring
- **Alerts & Events**: Real-time governance notifications
- **Model Comparison**: Side-by-side CRIES analysis

## Access

### Frontend
```
http://localhost:3000/pilot
```

### API Endpoints
```
GET  /api/pilot/demo-models      # Get all demo models and alerts
POST /api/pilot/start-demo        # Start live demo mode
POST /api/pilot/stop-demo         # Stop live demo
POST /api/pilot/run-test          # Run governance test
GET  /api/pilot/stats             # Get aggregated stats
POST /api/pilot/simulate-update   # Manual simulation trigger
POST /api/pilot/reset-demo        # Reset to initial state
```

## Quick Start

### 1. Start the Backend
```bash
cd /home/michaelgomes/AuditaAI/backend
npm start
```
Backend will run on `http://localhost:3001`

### 2. Start the Frontend
```bash
cd /home/michaelgomes/AuditaAI/frontend
pnpm dev
```
Frontend will run on `http://localhost:3000`

### 3. Open Pilot Demo
Navigate to: `http://localhost:3000/pilot`

### 4. Start Live Demo
Click the **"Start Live Demo"** button to activate real-time updates

## Demo Script for Zoom Presentations

### Introduction (2 minutes)
```
"Welcome to AuditaAI's Research Station pilot demonstration. 
What you're seeing is a live governance monitoring system for AI models.

We have three models running:
1. GPT-4 Research Station - performing well
2. Claude Ethics Lab - excellent governance scores
3. Llama Compliance Test - currently showing some alerts"
```

### CRIES Metrics Explanation (3 minutes)
```
"The core of our system is the CRIES framework:
- Completeness: Are responses complete and thorough?
- Reliability: Are results consistent over time?
- Integrity: Does behavior align with policies?
- Effectiveness: Do responses achieve their goals?
- Security: Are security boundaries maintained?

Notice the color coding:
- Green (0.9+): Excellent governance
- Yellow (0.7-0.9): Good, monitoring
- Red (<0.7): Needs review

The Llama model is showing yellow/red scores - let me show you why..."
```

### Live Demo Activation (2 minutes)
```
"Let me activate Live Demo mode. [Click Start Live Demo]

Watch the scores update in real-time every 3 seconds.
This simulates continuous monitoring in a production environment.

Notice how the metrics fluctuate slightly - this is normal behavior
as models respond to different types of queries."
```

### Running a Governance Test (3 minutes)
```
"Now let's run an active governance test on the Llama model.
[Click 'Run Test' button]

The system just:
1. Analyzed recent model behavior
2. Calculated updated CRIES scores
3. Generated an audit receipt
4. Updated governance status

Notice the scores improved - this demonstrates how our system
helps identify and track governance improvements over time."
```

### Alerts & Events (2 minutes)
```
"Switch to the Alerts tab. [Click Alerts & Events]

Here you see governance warnings:
- Reliability below threshold
- Effectiveness borderline
- Completeness improving

Each alert is timestamped, traceable, and actionable.
In a research lab, these would trigger review workflows."
```

### Model Comparison (2 minutes)
```
"Finally, the Comparison view. [Click Model Comparison]

This table lets you compare governance across all models at a glance.
Perfect for:
- Academic papers requiring multi-model analysis
- Compliance reporting
- Research publications
- Regulatory submissions

You can export this data in PDF, CSV, or JSON format."
```

### Use Case Examples (3 minutes)
```
"Let me show you three real-world use cases:

1. ACADEMIC RESEARCH
   - Track model behavior across experiments
   - Generate audit trails for peer review
   - Include CRIES reports in paper supplements
   - Verify reproducibility claims

2. CORPORATE COMPLIANCE
   - Monitor production models 24/7
   - Get alerts before problems escalate
   - Generate quarterly compliance reports
   - Track governance improvements over time

3. REGULATORY TESTING
   - Run standardized governance tests
   - Generate compliance certificates
   - Maintain cryptographic audit chains
   - Export for regulatory review"
```

### Q&A Setup (1 minute)
```
"This is the pilot-ready version. For your organization, we can:
- Integrate with your specific models
- Customize governance policies
- Set up team access and roles
- Configure custom reporting

The system runs in your environment, your data stays private,
and you get full audit trails for every decision.

Questions?"
```

## Demo Best Practices

### Before the Demo
- [ ] Test internet connection
- [ ] Close unnecessary browser tabs
- [ ] Set zoom to 150% for better visibility
- [ ] Have backend and frontend running
- [ ] Reset demo to initial state
- [ ] Test audio/video

### During the Demo
- [ ] Share entire screen (not just browser)
- [ ] Move slowly between sections
- [ ] Explain what you're clicking before clicking
- [ ] Pause for questions
- [ ] Show both dashboards and code/API if technical audience
- [ ] Take notes on questions asked

### After the Demo
- [ ] Share pilot application link
- [ ] Send follow-up materials
- [ ] Provide access to sandbox environment
- [ ] Schedule follow-up call
- [ ] Reset demo for next presentation

## Customization for Different Audiences

### For Academic Researchers
**Focus on:**
- Reproducibility tracking
- Ethics board compliance
- Multi-model comparison
- Data export for publications

**Demo Flow:**
1. Show model comparison
2. Run test and explain metrics
3. Export report demonstration
4. Discuss integration with existing research tools

### For Corporate AI Labs
**Focus on:**
- Compliance monitoring
- Risk detection
- ROI (time savings)
- Production readiness

**Demo Flow:**
1. Show real-time monitoring
2. Alert system demonstration
3. Quick governance test
4. Discuss integration with CI/CD

### For Regulators/Standards Bodies
**Focus on:**
- Audit trail integrity
- Compliance reporting
- Standardized metrics
- Cryptographic verification

**Demo Flow:**
1. Explain CRIES framework
2. Show audit chain
3. Generate compliance report
4. Discuss regulatory alignment

## Troubleshooting

### Backend Not Responding
```bash
# Check if backend is running
curl http://localhost:3001/health

# Restart backend
cd /home/michaelgomes/AuditaAI/backend
npm start
```

### Frontend Not Loading
```bash
# Check if frontend is running
# Navigate to http://localhost:3000

# Restart frontend
cd /home/michaelgomes/AuditaAI/frontend
pnpm dev
```

### Demo Stuck in Live Mode
```bash
# Reset via API
curl -X POST http://localhost:3001/api/pilot/reset-demo

# Or refresh the page and click "Stop Demo"
```

### Scores Not Updating
- Check if "Start Live Demo" button was clicked
- Verify "Auto-Refresh" is enabled
- Check browser console for errors
- Restart the demo

## API Examples

### Start Demo Programmatically
```bash
curl -X POST http://localhost:3001/api/pilot/start-demo
```

### Run Test on Specific Model
```bash
curl -X POST http://localhost:3001/api/pilot/run-test \
  -H "Content-Type: application/json" \
  -d '{"modelId": "gpt-4-research"}'
```

### Get Current Stats
```bash
curl http://localhost:3001/api/pilot/stats
```

### Reset Demo
```bash
curl -X POST http://localhost:3001/api/pilot/reset-demo
```

## Integration with Research Labs

The pilot demo can be extended for actual research use:

```python
# Example: Integrate with your AI model
import requests

# Run a governance test
response = requests.post('http://localhost:3001/api/pilot/run-test', json={
    'modelId': 'your-model-id'
})

cries_score = response.json()['cries']['overall']
print(f"Governance Score: {cries_score}")

# Get detailed metrics
metrics = response.json()['cries']
print(f"Completeness: {metrics['completeness']}")
print(f"Reliability: {metrics['reliability']}")
# ... etc
```

## Demo Data Persistence

The demo uses in-memory state that resets on server restart. For persistent demos:

1. Data is stored temporarily during the session
2. Audit records are saved to the database
3. Reset endpoint clears temporary state
4. Server restart returns to initial configuration

## Next Steps After Demo

1. **For Interested Partners:**
   - Send pilot application form
   - Provide sandbox access
   - Schedule technical deep-dive
   - Discuss custom integration

2. **For Evaluators:**
   - Provide documentation links
   - Share sample integration code
   - Offer extended trial period
   - Schedule follow-up Q&A

3. **For Researchers:**
   - Provide academic pricing info
   - Share research partnership opportunities
   - Discuss data sharing agreements
   - Connect with other academic users

## Support

**For Demo Issues:**
- Email: pilot-support@auditaai.com
- Slack: #pilot-demo channel

**For Sales/Partnerships:**
- Email: pilot@auditaai.com
- Calendar: https://cal.com/auditaai/pilot

## Updates

This demo is continuously improved based on feedback. Current version includes:

- ✅ Real-time CRIES monitoring
- ✅ Interactive governance testing
- ✅ Multi-model comparison
- ✅ Alert system
- ✅ Zoom-optimized UI
- ✅ One-click demo activation

**Planned Enhancements:**
- [ ] PDF report generation
- [ ] Custom policy configuration
- [ ] Historical trend charts
- [ ] WebSocket real-time updates
- [ ] Mobile-responsive views
- [ ] Dark/light mode toggle

---

**Version:** 1.0  
**Last Updated:** October 21, 2025  
**Maintained By:** AuditaAI Engineering Team
