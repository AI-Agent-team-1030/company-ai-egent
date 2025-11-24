# Analytics Dashboard - Quick Reference Guide

## System Overview
- **Type**: Corporate AI Agent Management System
- **Tech Stack**: Next.js 14, React, Tailwind, Framer Motion, Zustand, Recharts
- **Current Stage**: MVP with mock data
- **Database**: Not yet implemented (documented in API spec)

---

## Data Models Available

```
┌─────────────────────────────────────────────────┐
│              TRACKABLE ENTITIES                  │
├─────────────────────────────────────────────────┤
│ Users (3 roles)         │ Tasks (4 statuses)    │
│ AI Agents (15 types)    │ Directives (KPI)      │
│ Goals (progress track)  │ Knowledge Items       │
│ Documents (4 types)     │ Notifications         │
│ Chat Messages           │ Department mapping    │
└─────────────────────────────────────────────────┘
```

---

## Current Pages (Navigation)

```
Dashboard     Chat      Goals     Agents    Knowledge   Documents
   |           |         |         |          |            |
   ├─ Basic    ├─ Chat   ├─ List   ├─ List    ├─ List      ├─ List
   │  stats    │  UI     ├─ Detail │  Detail  ├─ Search    ├─ Generate
   │  4 KPIs   │         │         │          │             │
   │           │         │         │          │             │
Organization  Notifications Settings
   |              |              |
   ├─ Chart       ├─ List       ├─ Config
   │              │
```

---

## Top 15 Metrics to Implement (Prioritized)

### PHASE 1: Task & Operation Metrics (Foundation)
1. **Task Completion Rate** - % of completed/total tasks
2. **Avg Completion Time** - Days/hours to complete task
3. **Tasks by Status** - Pending, In Progress, Completed, Blocked
4. **Department Task Distribution** - Tasks per department
5. **On-Time Delivery Rate** - % completed by due date

### PHASE 2: AI & Agent Metrics (System Health)
6. **Active Agents** - Count of active vs idle agents
7. **Agent Utilization** - % of time agents are active
8. **AI-Generated Tasks Ratio** - % tasks created by AI vs human
9. **Agent by Department** - Agent count distribution
10. **Task Completion per Agent** - Productivity metric

### PHASE 3: Business Impact Metrics
11. **KPI Achievement Rate** - % of targets met
12. **Directive Completion** - % of directives completed
13. **Goal Progress** - Average completion % across goals
14. **Knowledge Utilization** - Usage count of knowledge items
15. **Automation Impact** - Time/cost saved estimate

---

## Recommended Dashboard Layout

```
┌──────────────────────────────────────────────────────────┐
│  ANALYTICS DASHBOARD                    [Filters][Export] │
├──────────────────────────────────────────────────────────┤

[Quick Stats Row - 4 cards with trends]
  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
  │Completed│ │Avg Days│ │Agents  │ │KPI Hit │
  │  348   │ │ 2.3d   │ │  12    │ │ 87%    │
  │  ↑15%  │ │  ↓8%   │ │  ↑3    │ │  ↑5%   │
  └────────┘ └────────┘ └────────┘ └────────┘

[6-Month Task Trends Line Chart]

[Department Performance Table]
  Department  │ Tasks │ Complete% │ Avg Time │ On-Time │ KPI
  ─────────────────────────────────────────────────────────
  Sales       │ 145   │    82%    │  2.1d    │  85%    │ 92%
  Marketing   │ 120   │    78%    │  2.8d    │  72%    │ 78%
  HR          │  95   │    91%    │  1.9d    │  94%    │ 88%
  Finance     │  87   │    85%    │  2.5d    │  88%    │ 95%

[AI Agent Health Grid]
  Sales-AI        Marketing-AI        CS-AI          HR-AI
  ✓ Active        ✓ Active            ✓ Active       ✓ Idle
  Uptime: 99.2%   Uptime: 98.8%       Uptime: 97.5%  Uptime: 0%

[Knowledge & Automation Stats]
  Knowledge Items: 145  │  Docs Generated: 342  │  AI Coverage: 68%
  Utilization: 4,200    │  AI-Generated: 92%    │  Time Saved: 520h
```

---

## Files to Create

### New Routes
- `/app/(app)/analytics/page.tsx` - Main dashboard

### New Components
```
components/analytics/
├── AnalyticsDashboard.tsx      (main container)
├── QuickStatsGrid.tsx           (4-card summary)
├── TaskTrendChart.tsx           (6-month line chart)
├── DepartmentPerformance.tsx    (table with metrics)
├── AgentHealthGrid.tsx          (status indicators)
├── FilterBar.tsx                (date range, dept filter)
├── MetricsCard.tsx              (reusable metric card)
├── TrendChart.tsx               (generic chart wrapper)
└── ExportButton.tsx             (CSV/PDF export)
```

### API Endpoints
```
GET    /api/analytics/summary
GET    /api/analytics/tasks/timeline
GET    /api/analytics/departments
GET    /api/analytics/agents
GET    /api/analytics/knowledge
GET    /api/analytics/export
```

---

## Key Integration Points

### Existing Resources
- **Charts**: Recharts (already in dependencies)
- **State**: Zustand (already configured)
- **UI**: Tailwind + Framer Motion
- **Types**: Defined in `/types/index.ts`
- **Mock Data**: Available in `/data/mockData.ts`

### Data Flow
```
Mock Data → Calculate Metrics → React State (Zustand) → Display Charts
  (current)      (new logic)        (existing)          (Recharts)
```

---

## Quick Implementation Checklist

### Week 1: Setup & Basic Metrics
- [ ] Create `/analytics` route
- [ ] Build QuickStatsGrid component
- [ ] Add date range filter
- [ ] Calculate 4 basic metrics (completion rate, avg time, agents, KPI)
- [ ] Add to sidebar navigation

### Week 2: Charts & Department View
- [ ] Task timeline chart (6-month view)
- [ ] Department performance table
- [ ] Department filter integration
- [ ] Styling and animations

### Week 3: Advanced Metrics
- [ ] Agent health grid
- [ ] Knowledge stats
- [ ] Document analytics
- [ ] Automation impact calculation

### Week 4: Polish & Export
- [ ] Export to CSV/PDF
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Error handling and edge cases

---

## Data Model Relationships

```
User
  └─ creates → Task, Directive, ChatMessage, Document
  
ExecutiveDirective
  └─ triggers → Task (1:many)
  └─ has → KPI (1:many)
  
Task
  └─ assigned to → User or AIAgent
  └─ belongs to → Department
  └─ related to → Directive (optional)
  
AIAgent
  └─ assigned to → Task (1:many)
  └─ belongs to → Department
  
KnowledgeItem
  └─ belongs to → Department
  └─ has → usageCount, helpful rating
  
Document
  └─ created by → User
  └─ may be → AI Generated
  └─ has status → draft or published
  
ChatMessage
  └─ between → User and AIAgent
  └─ timestamped
```

---

## Suggested Alert/Threshold System

```
RED FLAGS (Alert immediately)
├─ Task completion rate drops below 70%
├─ Any agent has 100% idle time
├─ Blocked tasks > 5% of total
└─ KPI achievement < 80%

YELLOW FLAGS (Monitor closely)
├─ Task completion rate 70-80%
├─ Agent uptime < 95%
├─ Average completion time increasing
└─ KPI achievement 80-90%

GREEN FLAGS (Excellent)
├─ Task completion rate > 85%
├─ All agents > 95% uptime
├─ On-time delivery > 90%
└─ KPI achievement > 95%
```

---

## Performance Optimization Notes

1. **Data Caching**: Cache summary metrics for 5-10 mins
2. **Pagination**: Use pagination for large data tables
3. **Lazy Loading**: Load chart data on demand
4. **Zustand State**: Store selected filters to avoid recalculations
5. **React Query**: Consider for API responses caching

---

## Success Metrics

**Analytics Feature Success** will be measured by:
1. Load time < 2 seconds
2. All 15 priority metrics visible
3. Filters work across all metrics
4. Export produces valid CSV/PDF
5. Mobile responsive design
6. Zero console errors

---

## Dependencies Already Installed

```json
{
  "next": "14.0.4",
  "react": "^18.2.0",
  "recharts": "^2.10.3",        ✓ Charts
  "framer-motion": "^10.16.16",  ✓ Animations
  "zustand": "^4.4.7",           ✓ State
  "date-fns": "^3.0.6",          ✓ Date formatting
  "@heroicons/react": "^2.1.1"   ✓ Icons
}
```

---

## Common Metric Calculations

```typescript
// Task Completion Rate
const completionRate = (completedTasks / totalTasks) * 100

// Average Completion Time
const avgCompletionTime = totalCompletionHours / completedTasks

// Agent Utilization
const utilizationRate = (activeTasks / totalAgents) * 100

// KPI Achievement
const kpiAchievement = (currentValue / targetValue) * 100

// On-Time Delivery
const onTimeRate = (onTimeCompletedTasks / completedTasks) * 100

// Automation Ratio
const automationRatio = (aiGeneratedTasks / totalTasks) * 100

// Task Velocity
const velocityPerWeek = completedTasks / (daysSinceStart / 7)
```

---

## Next Steps

1. **Immediate**: Review this analysis with product team
2. **Week 1**: Create `/analytics` route + basic dashboard
3. **Ongoing**: Integrate with real API as backend develops
4. **Future**: Add ML-based predictions and anomaly detection

