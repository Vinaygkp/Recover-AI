# RECOVER AI — AI Revenue Recovery Platform

> **Find revenue that's slipping away and win it back.**

RECOVER AI is an AI-powered revenue recovery platform designed to detect revenue at risk, diagnose why it is being lost, estimate recovery probability, select a bounded intervention, execute the action, verify the outcome, and stop or escalate according to policy.

## Core Recovery Lifecycle

```text
DETECT
  ↓
DIAGNOSE
  ↓
SCORE PROBABILITY
  ↓
DECIDE INTERVENTION
  ↓
POLICY CHECK
  ↓
EXECUTE ACTION
  ↓
VERIFY OUTCOME
  ↓
RECOVERED / FAILED
  ↓
STOP / ESCALATE
  ↓
AUDIT LOG
```

---

## 1. Problem Statement

Businesses lose revenue through failed payments, checkout abandonment, failed subscriptions, mandate failures, and overdue receivables.

RECOVER AI answers:

1. What revenue is at risk?
2. Why is it at risk?
3. How likely is recovery?
4. What intervention should be attempted?
5. Is that intervention allowed by policy?
6. Was the action executed?
7. Was recovery actually verified?
8. Should the system retry, stop, or escalate?
9. How much money was actually recovered?

The platform is designed to **recover measurable revenue**, not just display risk analytics.

---

# 2. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      FRONTEND       │
                         │ React + TypeScript  │
                         │ Tailwind + Vite     │
                         └──────────┬──────────┘
                                    │
                              REST API Calls
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │       FASTAPI       │
                         │    Backend API      │
                         └──────────┬──────────┘
                                    │
          ┌─────────────────────────┼────────────────────────┐
          │                         │                        │
          ▼                         ▼                        ▼
   ┌─────────────┐           ┌─────────────┐          ┌─────────────┐
   │ Recovery    │           │ Policy      │          │ ML / AI     │
   │ Engine      │           │ Engine      │          │ Services    │
   └──────┬──────┘           └─────────────┘          └─────────────┘
          │
          ├──────────► Payment Provider
          ├──────────► Promise-to-Pay
          ├──────────► Audit Trail
          └──────────► MongoDB
```

---

# 3. Repository Structure & Mapping

```text
recover-ai/
│
├── .vscode/
│
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   └── AI / Gemini related logic
│   │   │
│   │   ├── api/
│   │   │   ├── analytics.py
│   │   │   ├── audit.py
│   │   │   ├── dashboard.py
│   │   │   ├── demo.py
│   │   │   ├── integrations.py
│   │   │   ├── ml.py
│   │   │   ├── payments.py
│   │   │   ├── policies.py
│   │   │   ├── promises.py
│   │   │   ├── recovery.py
│   │   │   └── simulation.py
│   │   │
│   │   ├── db/
│   │   │   └── MongoDB connection / database utilities
│   │   │
│   │   ├── middleware/
│   │   │   └── Request / security middleware
│   │   │
│   │   ├── ml/
│   │   │   ├── recovery_model.joblib
│   │   │   ├── test_metrics.joblib
│   │   │   └── ML model / prediction utilities
│   │   │
│   │   ├── models/
│   │   │   └── Domain / database models
│   │   │
│   │   ├── policies/
│   │   │   └── PolicyEngine and recovery rules
│   │   │
│   │   ├── recovery/
│   │   │   └── RecoveryEngine and workflow orchestration
│   │   │
│   │   ├── services/
│   │   │   └── Application / business services
│   │   │
│   │   ├── config.py
│   │   ├── main.py
│   │   └── __init__.py
│   │
│   ├── tests/
│   │   └── Backend and integration tests
│   │
│   ├── test_copilot_e2e.py
│   ├── test_copilot_guest.py
│   ├── test_gemini_models.py
│   ├── test_gemini_ping.py
│   ├── test_razorpay_recovery_e2e.py
│   ├── test_razorpay_suite.py
│   │
│   ├── .env
│   ├── .gitignore
│   ├── Dockerfile
│   ├── requirements.txt
│   └── venv/
│
├── frontend/
│   ├── src/
│   │   ├── animations/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   │
│   ├── dist/
│   ├── node_modules/
│   ├── .env
│   ├── .gitignore
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
│
└── README.md
```

---

# 4. Frontend → Backend Mapping

| Frontend Feature | Backend API | Responsibility |
|---|---|---|
| Dashboard | `/api/dashboard` | Revenue, risk and recovery overview |
| Recovery | `/api/recovery` | Recovery actions and workflow |
| Analytics | `/api/analytics` | Data-driven recovery analytics |
| Payments | `/api/payments` | Payment status and operations |
| ML / Risk | `/api/ml` | Recovery probability |
| Integrations | `/api/integrations` | Payment-provider integrations |
| Policies | `/api/policies` | Recovery constraints |
| Simulation | `/api/simulation` | Batch recovery workflow |
| Promises | `/api/promises` | Promise-to-Pay lifecycle |
| Audit | `/api/audit` | Decision/action history |
| Demo | `/api/demo` | Controlled demo flows |

### Service-layer rule

Frontend API calls should be centralized in:

```text
frontend/src/services/
```

Pages and components should call service functions rather than duplicating raw API request logic.

---

# 5. Recovery Engine

Main file:

```text
backend/app/recovery/engine.py
```

The `RecoveryEngine` is the central orchestrator.

### Workflow

```text
1. DETECT
   Identify a revenue-risk case.

2. DIAGNOSE
   Determine the reason/type of revenue risk.

3. SCORE PROBABILITY
   Estimate recovery probability using ML.

4. DECIDE INTERVENTION
   Select the most appropriate bounded action.

5. POLICY CHECK
   Confirm that the action is allowed.

6. EXECUTE ACTION
   Retry, alternate payment, reminder, Promise-to-Pay,
   manual review or escalation.

7. VERIFY OUTCOME
   Confirm the real payment/recovery result.

8. FINALIZE
   RECOVERED / FAILED / STOPPED / ESCALATED /
   MANUAL REVIEW.

9. AUDIT
   Persist the decision and execution trail.
```

The batch simulation uses the same recovery engine instead of a separate fake success algorithm.

---

# 6. ML / AI Decisioning

The ML layer estimates the probability of successful recovery.

Example intervention policy:

```text
Probability >= 70%
        ↓
Primary retry / recovery action

Probability 40% - 69%
        ↓
Alternate payment / alternate intervention

Probability < 40%
        ↓
Manual review / controlled escalation
```

The probability is a **decision signal**, not proof that payment will succeed.

---

# 7. Intervention Mapping

## Failed Payment

```text
Payment Failure
      ↓
Diagnose
      ↓
Recovery Probability
      ↓
Retry / Alternate Payment / Manual Review
      ↓
Verify Payment
      ↓
Recovered / Failed
```

## Checkout Abandonment

```text
Checkout Abandoned
      ↓
Identify transaction
      ↓
Bounded payment reminder
      ↓
Payment link / recovery action
      ↓
Verify
      ↓
Recovered / Failed
```

## Subscription / Mandate

```text
Failure
  ↓
Bounded retry sequence
  ↓
Retry count check
  ↓
Retry / Alternate Method
  ↓
Verify
  ↓
Recovered / Stop
```

## B2B Receivables

```text
Overdue Receivable
      ↓
Amount + probability assessment
      ↓
Payment reminder / Promise-to-Pay
      ↓
Track commitment
      ↓
PAID → Success
MISSED → Escalation
```

---

# 8. Policy Engine

Main file:

```text
backend/app/policies/engine.py
```

The PolicyEngine is the single source of truth for recovery constraints.

| Rule | Value |
|---|---:|
| Maximum retries | 3 |
| High-value threshold | ₹10,000 |
| Manual approval threshold | ₹10,000 |
| Recovery window | 7 days |

Example:

```text
Amount >= ₹10,000
        ↓
Manual Review / Approval
```

AI can recommend an action, but policy determines whether the action is permitted.

---

# 9. Stopping Rules

The system never retries indefinitely.

Recovery stops when:

- Maximum retry count is reached
- Recovery window expires
- Payment is already recovered
- Policy requires manual review
- A high-value case requires approval
- A terminal state is reached
- Safe execution is not possible

```text
Retry #1
   ↓
Retry #2
   ↓
Retry #3
   ↓
MAX RETRIES
   ↓
STOP
   ↓
AUDIT
```

---

# 10. Idempotency

A recovery workflow must not double-count recovered money.

Example:

```text
Batch Run #1
    ↓
Recovered = ₹146,496

Batch Run #2
    ↓
Already processed cases
    ↓
Additional recovered = ₹0
```

Idempotency prevents duplicate recovery actions and false revenue totals.

---

# 11. Recovered Revenue

The primary success metric is based on verified recovery data:

```text
Recovered Revenue
=
SUM(verified recovered_amount)
```

Recovery numbers should come from actual stored outcomes, not hardcoded or fabricated success values.

---

# 12. Promise-to-Pay

Promise-to-Pay handles overdue receivables.

```text
Promise Created
      ↓
Payment Due
      ↓
   ┌──┴──┐
   │     │
 PAID   MISSED
   │     │
   ↓     ↓
Success Escalation
```

Supported operations:

- Create Promise
- Record Payment
- Mark Missed
- Escalate
- Track status

---

# 13. Hinglish Recovery

The platform supports customer-facing Hinglish recovery messages.

Example:

```text
"Hi, aapka payment complete nahi ho paya.
Aap yahan se payment retry kar sakte hain."
```

Recovery actions can expose the appropriate message through the UI, with language selection and copy functionality.

---

# 14. Audit Trail

Important events include:

```text
BATCH_STARTED
BATCH_COMPLETED

INTERVENTION_SELECTED
MANUAL_REVIEW_REQUIRED

RECOVERY_SUCCEEDED
RECOVERY_FAILED

RETRY_EXHAUSTED
STOP_RULE_TRIGGERED

PROMISE_CREATED
PROMISE_PAID
PROMISE_MISSED

EXECUTION_ERROR
```

This makes every important decision traceable:

```text
Case
 ↓
Risk
 ↓
Probability
 ↓
Intervention
 ↓
Policy
 ↓
Action
 ↓
Verification
 ↓
Outcome
```

---

# 15. Analytics

Analytics should be derived from stored application data.

Key metrics:

- Revenue at risk
- Recovered revenue
- Recovery rate
- Failed recovery
- Recovery attempts
- Intervention distribution
- Recovery probability distribution
- Retry performance
- Promise-to-Pay performance
- Time-to-recovery
- Recovery funnel
- Escalations
- Stopped cases

The analytics layer should not use hardcoded recovery totals.

---

# 16. Payment Provider Architecture

Payment operations are abstracted behind a provider layer:

```text
PaymentProvider
      │
      ├── RazorpayTestProvider
      │
      └── DemoPaymentProvider
```

This keeps the recovery engine independent from a specific payment implementation.

---

# 17. Security & Reliability

The platform should enforce:

- Environment-based secrets
- HMAC webhook verification
- Merchant/user isolation
- Bounded retry policies
- Idempotent recovery operations
- Safe error handling
- Verified recovery reporting
- Complete auditability
- No automatic fraud declaration

Risky cases should be labelled using terms such as:

```text
Risk indicator
Potential anomaly
Requires verification
Priority review
```

rather than automatically declaring fraud.

---

# 18. Recommended API Data Flow

```text
Frontend UI
    ↓
React Page / Component
    ↓
frontend/src/services/
    ↓
FastAPI Route
    ↓
Business Service / RecoveryEngine
    ↓
ML + Policy + Payment Provider
    ↓
MongoDB
    ↓
API Response
    ↓
Frontend State
    ↓
UI
```

Avoid putting business logic directly inside UI components.

---

# 19. Frontend Architecture

```text
frontend/src/
│
├── animations/
│   └── Page / interaction animations
│
├── components/
│   ├── Shared UI
│   ├── Dashboard
│   ├── Recovery
│   ├── Analytics
│   ├── Charts
│   └── Reusable components
│
├── context/
│   └── Global application state
│
├── hooks/
│   └── Reusable React hooks
│
├── lib/
│   └── Utility functions
│
├── pages/
│   ├── Dashboard
│   ├── Recovery
│   ├── Analytics
│   ├── Payments
│   ├── Promises
│   ├── Audit
│   └── Other pages
│
├── services/
│   └── Backend API integration
│
├── types/
│   └── TypeScript interfaces
│
├── App.tsx
├── main.tsx
└── index.css
```

---

# 20. Testing

Important validation areas:

```text
Backend API
Recovery workflow
Payment verification
ML prediction
Policy enforcement
Idempotency
Razorpay Test Mode
Promise-to-Pay
Audit trail
Gemini integration
```

Recommended validation flow:

```text
Seed Data
   ↓
Run Recovery
   ↓
Verify Database
   ↓
Verify Recovered Amount
   ↓
Run Same Recovery Again
   ↓
Confirm No Double Counting
   ↓
Verify Audit Events
```

---

# 21. Running Locally

## Backend

```powershell
cd backend
.env\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend:

```text
http://localhost:8000
```

Swagger API docs:

```text
http://localhost:8000/docs
```

## Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 22. Environment Variables

Backend `.env` should contain the required secrets/configuration:

```env
MONGODB_URI=...
DATABASE_NAME=...

RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

```

Frontend `.env` should contain only variables intended for browser-side use.

**Never commit real API keys, database passwords, webhook secrets, or private credentials to Git.**

---

# 23. Hackathon Demo Flow

Recommended judging/demo sequence:

```text
1. Open RECOVER AI
        ↓
2. Dashboard
        ↓
3. Show Revenue At Risk
        ↓
4. Open a Failed Payment
        ↓
5. Show Diagnosis
        ↓
6. Show AI Recovery Probability
        ↓
7. Show Selected Intervention
        ↓
8. Show Policy Check
        ↓
9. Execute Recovery
        ↓
10. Verify Payment
        ↓
11. Show Recovered Amount
        ↓
12. Open Audit Trail
        ↓
13. Run Batch Simulation
        ↓
14. Show Batch Recovered Revenue
        ↓
15. Run Batch Again
        ↓
16. Show ₹0 Additional Recovery
```

This proves that RECOVER AI does more than identify problems: it **detects → decides → acts → verifies → measures**.

---

# 24. Key Differentiators

### Action, not just detection

Instead of only saying:

```text
"Payment failed."
```

the system determines:

```text
Why?
 ↓
Probability?
 ↓
Which intervention?
 ↓
Is it allowed?
 ↓
Execute
 ↓
Did it recover?
```

### AI + Deterministic Policy

AI helps choose the intervention while deterministic policies bound what the system is allowed to do.

### Verified Revenue

Recovered money is based on verified outcomes.

### Bounded Automation

Retries, recovery windows, approval thresholds and escalation rules prevent uncontrolled actions.

### Explainable Decisions

The audit trail preserves the important decisions and outcomes.

### Multi-Scenario Recovery

The architecture supports:

- Payment failures
- Checkout abandonment
- Failed subscriptions
- Mandate retries
- B2B receivables
- Promise-to-Pay
- Hinglish recovery messaging

---

# 25. Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Reusable component architecture
- Interactive animations

### Backend

- Python
- FastAPI
- Uvicorn
- MongoDB
- REST APIs

### AI / ML

- Python ML pipeline
- Recovery-success model
- Probability-based decisioning
- Gemini integration where applicable

### Payments

- Razorpay Test Mode
- Payment provider abstraction
- HMAC SHA-256 webhook verification

### Development

- Git
- VS Code
- Docker
- Automated tests

---

# 26. Design Principle

```text
REAL DATA
    +
REAL DECISIONING
    +
BOUNDED ACTIONS
    +
VERIFIED OUTCOMES
    +
AUDITABILITY
    =
TRUSTWORTHY REVENUE RECOVERY
```

RECOVER AI should never increase its recovery metric by bypassing verification or policy.

---

# 27. Final Goal

> **Find revenue that's slipping away and win it back — safely, measurably, and with a complete audit trail.**

```text
DETECT → DECIDE → ACT → VERIFY → RECOVER
                         │
                         └── STOP / ESCALATE
```

## Project Status

| Capability | Status |
|---|---|
| Recovery workflow | Implemented |
| ML probability decisioning | Implemented |
| Policy engine | Implemented |
| Stopping rules | Implemented |
| Payment verification | Implemented |
| Promise-to-Pay | Implemented |
| Hinglish recovery | Implemented |
| Audit trail | Implemented |
| Batch recovery | Implemented |
| Batch idempotency | Implemented |
| Data-driven analytics | Implemented |
