# Citizen Dashboard Integration Plan

## Overview
This document outlines the step-by-step plan to integrate Supabase with the Citizen Dashboard, replacing all hardcoded data with real database-backed information.

---

## Current State Analysis

### ✅ What's Already Working:
- **Authentication**: Citizens can sign up/login via Supabase Auth
- **Waste Reporting**: Reports can be created and stored in `reports` table
- **UI Components**: All dashboard views are built and styled

### ❌ What's Missing:
- **No `citizens` table**: User profiles don't exist in database
- **Reports are anonymous**: `reports` table has no `citizen_id` foreign key
- **No points/XP system**: No tracking of citizen contributions
- **No rank/level system**: No gamification data
- **No activity tracking**: Can't show citizen-specific history
- **No leaderboard data**: Can't rank citizens by points
- **No notifications linked to citizens**: Notifications aren't user-specific

---

## Step-by-Step Integration Plan

### **STEP 1: Database Schema Design**

#### 1.1 Create `citizens` Table
This table will store citizen profiles and gamification data.

**Required Fields:**
- `id` (UUID, PRIMARY KEY) - References `auth.users(id)`
- `full_name` (TEXT) - User's display name
- `avatar_url` (TEXT, nullable) - Profile picture URL
- `total_points` (INTEGER, default 0) - Current XP/points
- `current_level` (INTEGER, default 1) - Current level (calculated from points)
- `rank_title` (TEXT, default 'Eco Starter') - Rank name (e.g., "Eco Warrior")
- `total_reports` (INTEGER, default 0) - Total reports submitted
- `resolved_reports` (INTEGER, default 0) - Reports that were resolved
- `neighborhood` (TEXT, nullable) - User's neighborhood/sector
- `city` (TEXT, nullable) - User's city
- `created_at` (TIMESTAMPTZ) - Account creation time
- `updated_at` (TIMESTAMPTZ) - Last profile update

**Indexes:**
- Index on `total_points` DESC (for leaderboard queries)
- Index on `city` (for city-specific leaderboards)
- Index on `neighborhood` (for neighborhood rankings)

#### 1.2 Update `reports` Table
Add foreign key to link reports to citizens.

**New Field:**
- `citizen_id` (UUID, nullable) - References `citizens(id) ON DELETE SET NULL`
  - Nullable to support anonymous reports
  - SET NULL on delete to preserve report history

**New Index:**
- Index on `citizen_id` (for fetching citizen's reports)

#### 1.3 Create `citizen_activity` Table (Optional but Recommended)
Track detailed activity for analytics and history.

**Fields:**
- `id` (UUID, PRIMARY KEY)
- `citizen_id` (UUID) - References `citizens(id)`
- `report_id` (UUID, nullable) - References `reports(id)`
- `activity_type` (TEXT) - 'report_submitted', 'points_earned', 'level_up', etc.
- `points_awarded` (INTEGER, default 0) - Points for this activity
- `description` (TEXT) - Human-readable description
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- Index on `citizen_id, created_at DESC` (for activity feed)

#### 1.4 Update `notifications` Table
Link notifications to citizens.

**New Field:**
- `citizen_id` (UUID, nullable) - References `citizens(id)`
  - Nullable for system-wide notifications

**New Index:**
- Index on `citizen_id, is_read` (for unread notifications query)

---

### **STEP 2: Points & Rank System Design**

#### 2.1 Points Award Structure
- **Report Submitted**: +10 points (base)
- **Report Verified** (status changes to 'in_progress'): +20 points
- **Report Resolved**: +50 points (total: 80 points per resolved report)
- **Daily Challenge Completed**: +50 points
- **First Report of Day**: +25 bonus points
- **Report Marked as False**: -10 points (penalty)

#### 2.2 Level Calculation
Levels based on cumulative points:
- **Level 1** (Eco Starter): 0-99 points
- **Level 2** (Eco Helper): 100-249 points
- **Level 3** (Eco Contributor): 250-499 points
- **Level 4** (Eco Advocate): 500-999 points
- **Level 5** (Eco Warrior): 1000-1999 points
- **Level 6** (Eco Champion): 2000-3999 points
- **Level 7** (Eco Hero): 4000-7999 points
- **Level 8+** (Eco Legend): 8000+ points

#### 2.3 Rank Title Assignment
Based on level (see above). Can be customized per level.

---

### **STEP 3: Database Functions & Triggers**

#### 3.1 Function: `calculate_level(points INTEGER)`
Returns level number based on points.

#### 3.2 Function: `get_rank_title(level INTEGER)`
Returns rank title string based on level.

#### 3.3 Function: `award_points_to_citizen(citizen_id UUID, points INTEGER, activity_type TEXT)`
- Updates `citizens.total_points`
- Recalculates `current_level` and `rank_title`
- Inserts into `citizen_activity` table
- Returns new total points

#### 3.4 Trigger: `on_report_created`
- When report is created with `citizen_id`:
  - Award +10 points
  - Increment `citizens.total_reports`
  - Create activity record

#### 3.5 Trigger: `on_report_status_changed`
- When report status changes:
  - If status = 'in_progress': Award +20 points
  - If status = 'resolved': Award +50 points, increment `resolved_reports`
  - If status = 'false_report': Deduct -10 points
  - Create activity record
  - Create notification for citizen

#### 3.6 Trigger: `on_citizen_signup`
- When new user signs up:
  - Create `citizens` record with default values
  - Link to `auth.users(id)`

---

### **STEP 4: Row Level Security (RLS) Policies**

#### 4.1 `citizens` Table Policies
- **SELECT**: Citizens can view their own profile + public leaderboard data (points, rank, name)
- **UPDATE**: Citizens can only update their own profile (name, avatar, neighborhood)
- **INSERT**: Only via trigger (on signup)
- **DELETE**: Not allowed (soft delete via flag if needed)

#### 4.2 `reports` Table Policies (Updated)
- **SELECT**: Citizens can view all reports (public data) + their own reports with full details
- **INSERT**: Citizens can create reports and link to their `citizen_id`
- **UPDATE**: Only admins (existing policy)
- **DELETE**: Only admins (existing policy)

#### 4.3 `citizen_activity` Table Policies
- **SELECT**: Citizens can only view their own activity
- **INSERT**: Only via triggers/functions
- **UPDATE/DELETE**: Not allowed

#### 4.4 `notifications` Table Policies (Updated)
- **SELECT**: Citizens can only view their own notifications
- **UPDATE**: Citizens can mark their own notifications as read
- **INSERT**: Only via triggers/functions

---

### **STEP 5: Database Views & Helper Functions**

#### 5.1 View: `citizen_leaderboard`
```sql
SELECT 
  c.id,
  c.full_name,
  c.avatar_url,
  c.total_points,
  c.current_level,
  c.rank_title,
  c.total_reports,
  c.resolved_reports,
  ROW_NUMBER() OVER (ORDER BY c.total_points DESC) as global_rank,
  ROW_NUMBER() OVER (PARTITION BY c.city ORDER BY c.total_points DESC) as city_rank,
  ROW_NUMBER() OVER (PARTITION BY c.neighborhood ORDER BY c.total_points DESC) as neighborhood_rank
FROM citizens c
WHERE c.total_points > 0
ORDER BY c.total_points DESC;
```

#### 5.2 View: `citizen_stats`
Aggregated stats per citizen (for dashboard).

#### 5.3 Function: `get_citizen_profile(citizen_id UUID)`
Returns full profile with calculated rank, recent activity, etc.

#### 5.4 Function: `get_citizen_reports(citizen_id UUID, limit INTEGER)`
Returns citizen's reports with status, points earned, etc.

---

### **STEP 6: TypeScript Integration**

#### 6.1 Update Database Types (`src/utils/supabase/client.ts`)
Add types for:
- `citizens` table
- `citizen_activity` table
- Updated `reports` table (with `citizen_id`)
- Updated `notifications` table (with `citizen_id`)

#### 6.2 Create Database Functions (`src/db/citizens.ts`)
Functions to:
- `getCitizenProfile(userId: string)` - Fetch citizen profile
- `updateCitizenProfile(userId: string, data: Partial<Citizen>)` - Update profile
- `getCitizenLeaderboard(options?: { city?: string, limit?: number })` - Get leaderboard
- `getCitizenActivity(userId: string, limit?: number)` - Get activity feed
- `getCitizenReports(userId: string, filters?: {...})` - Get citizen's reports
- `getCitizenStats(userId: string)` - Get dashboard stats

#### 6.3 Update Report Creation (`src/db/reports.ts`)
- Modify `createReport()` to accept `citizen_id` (from auth session)
- Automatically link report to logged-in citizen

---

### **STEP 7: Frontend Integration**

#### 7.1 Update `CitizenDashboard.tsx`
- Replace hardcoded `userProfile` with real data from `getCitizenProfile()`
- Fetch data on mount using `userId` prop
- Add loading states
- Add error handling

#### 7.2 Update `OverviewView.tsx`
- Fetch real stats: total reports, resolved reports, points, level
- Fetch recent activity (last 3 reports)
- Calculate progress percentage dynamically
- Show real neighborhood rank

#### 7.3 Update `LeaderboardView.tsx`
- Fetch leaderboard data from `getCitizenLeaderboard()`
- Highlight current user in list
- Show real rank changes (requires historical tracking)

#### 7.4 Update `HistoryView.tsx`
- Fetch citizen's reports from `getCitizenReports()`
- Show real report status, dates, points earned
- Filter by status (all/resolved/pending)

#### 7.5 Update `ReportWasteView.tsx`
- Ensure `citizen_id` is included when creating report
- Show points that will be awarded
- Update citizen stats after successful submission

#### 7.6 Update Notifications
- Fetch user-specific notifications
- Mark as read functionality
- Real-time updates for new notifications

---

### **STEP 8: Migration Strategy**

#### 8.1 For Existing Reports
- Run migration to set `citizen_id = NULL` for all existing reports
- Optionally, allow admins to manually assign reports to citizens

#### 8.2 For Existing Users
- Create `citizens` records for all existing `auth.users`
- Calculate initial points from their reports (if any)
- Set default rank/level

#### 8.3 Data Seeding (Optional)
- Create sample citizens with varying points for testing
- Create sample activity records

---

### **STEP 9: Testing Checklist**

- [ ] Citizen signup creates `citizens` record
- [ ] Report creation awards points and updates stats
- [ ] Report status changes award correct points
- [ ] Level calculation works correctly
- [ ] Leaderboard shows correct rankings
- [ ] Citizen can only see their own activity
- [ ] Notifications are citizen-specific
- [ ] RLS policies prevent unauthorized access
- [ ] Dashboard displays real data
- [ ] Points accumulate correctly over time

---

### **STEP 10: Performance Optimization**

#### 10.1 Caching Strategy
- Cache citizen profile in React state
- Cache leaderboard (refresh every 5 minutes)
- Use Supabase real-time subscriptions for live updates

#### 10.2 Query Optimization
- Use indexes effectively
- Limit leaderboard queries (top 100 only)
- Paginate activity feed
- Use database views for complex queries

---

## Implementation Order

1. **Phase 1: Database Schema** (Steps 1-2)
   - Create tables and relationships
   - Set up points/rank system

2. **Phase 2: Database Logic** (Steps 3-5)
   - Create functions and triggers
   - Set up RLS policies
   - Create views

3. **Phase 3: Backend Integration** (Step 6)
   - Update TypeScript types
   - Create database functions

4. **Phase 4: Frontend Integration** (Step 7)
   - Update all dashboard components
   - Connect to real data

5. **Phase 5: Migration & Testing** (Steps 8-9)
   - Migrate existing data
   - Test all functionality

6. **Phase 6: Optimization** (Step 10)
   - Performance tuning
   - Caching strategies

---

## Estimated Timeline

- **Phase 1**: 2-3 hours
- **Phase 2**: 3-4 hours
- **Phase 3**: 2-3 hours
- **Phase 4**: 4-6 hours
- **Phase 5**: 2-3 hours
- **Phase 6**: 1-2 hours

**Total**: ~14-21 hours

---

## Next Steps

1. Review and approve this plan
2. Start with Phase 1: Database Schema
3. Test each phase before moving to next
4. Document any deviations from plan

