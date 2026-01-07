# Citizen Dashboard Integration - Quick Start Guide

## Overview
This guide will help you implement the citizen dashboard integration step by step.

---

## Step 1: Run Database Migration

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** k

2. **Run the Migration Script**
   - Open `src/supabase/citizen_schema.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click **Run** (or press Cmd/Ctrl + Enter)

   This will create:
   - ✅ `citizens` table (user profiles)
   - ✅ `citizen_activity` table (activity log)
   - ✅ Updates to `reports` table (adds `citizen_id`)
   - ✅ Updates to `notifications` table (adds `citizen_id`)
   - ✅ Database functions (points calculation, rank assignment)
   - ✅ Triggers (auto-create profiles, award points)
   - ✅ RLS policies (security)
   - ✅ Views (leaderboard, stats)

3. **Verify Migration**
   - Go to **Table Editor** → You should see `citizens` and `citizen_activity` tables
   - Check that `reports` table has `citizen_id` column
   - Check that `notifications` table has `citizen_id` column

---

## Step 2: Test Database Setup

### Test Citizen Signup
1. Sign up a new citizen account
2. Check `citizens` table - a new profile should be created automatically
3. Verify default values: `total_points = 0`, `current_level = 1`, `rank_title = 'Eco Starter'`

### Test Report Creation
1. Create a report while logged in as a citizen
2. Check `reports` table - `citizen_id` should be set
3. Check `citizens` table - `total_points` should increase by 10, `total_reports` should increase by 1
4. Check `citizen_activity` table - new activity record should exist

### Test Points System
1. As admin, change a report status to `in_progress`
2. Check citizen's `total_points` - should increase by 20
3. Change status to `resolved`
4. Check citizen's `total_points` - should increase by 50 more (total +70 from original +10)
5. Check `resolved_reports` counter - should increase by 1

---

## Step 3: Update Frontend Components

### 3.1 Update CitizenDashboard.tsx

Replace hardcoded user profile with real data:

```typescript
import { useEffect, useState } from 'react';
import { getCitizenProfile, getCitizenStats } from '../db/citizens';

export function CitizenDashboard({ onLogout, userId }: CitizenDashboardProps) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await getCitizenProfile(userId);
      if (data) {
        setUserProfile({
          name: data.full_name,
          rank: data.rank_title,
          points: data.total_points,
          avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.full_name}`
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (!userProfile) return <div>Error loading profile</div>;

  // ... rest of component
}
```

### 3.2 Update OverviewView.tsx

Fetch real stats and recent activity:

```typescript
import { useEffect, useState } from 'react';
import { getCitizenStats, getCitizenRecentReports } from '../../db/citizens';

export function OverviewView({ onViewChange, user }: { onViewChange: any, user: any }) {
  const [stats, setStats] = useState(null);
  const [recentReports, setRecentReports] = useState([]);

  useEffect(() => {
    async function loadData() {
      // Load stats
      const { data: statsData } = await getCitizenStats(user.id);
      if (statsData) setStats(statsData);

      // Load recent reports
      const { data: reportsData } = await getCitizenRecentReports(user.id, 3);
      if (reportsData) setRecentReports(reportsData);
    }
    loadData();
  }, [user.id]);

  // Use stats.current_level_points and stats.points_to_next_level for progress bar
  // Use recentReports for activity feed
}
```

### 3.3 Update LeaderboardView.tsx

Fetch real leaderboard data:

```typescript
import { useEffect, useState } from 'react';
import { getCitizenLeaderboard } from '../../db/citizens';

export function LeaderboardView() {
  const [leaders, setLeaders] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    async function loadLeaderboard() {
      const { data } = await getCitizenLeaderboard({ limit: 100 });
      if (data) {
        setLeaders(data);
        // Get current user ID from auth session
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUserId(session?.user?.id);
      }
    }
    loadLeaderboard();
  }, []);

  // Map leaders data to component format
  // Highlight user where leader.id === currentUserId
}
```

### 3.4 Update HistoryView.tsx

Fetch citizen's reports:

```typescript
import { useEffect, useState } from 'react';
import { getCitizenReports } from '../../db/citizens';

export function HistoryView() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState<'all' | 'resolved' | 'pending'>('all');

  useEffect(() => {
    async function loadReports() {
      const statusFilter = filter === 'all' ? 'all' : filter === 'resolved' ? 'resolved' : 'open';
      const { data } = await getCitizenReports(userId, { status: statusFilter });
      if (data) setReports(data);
    }
    loadReports();
  }, [filter, userId]);

  // Map reports to component format
  // Calculate points earned per report based on status
}
```

---

## Step 4: Points Calculation Reference

### Points Awarded:
- **Report Submitted**: +10 points
- **Report Verified** (status → `in_progress`): +20 points  
- **Report Resolved** (status → `resolved`): +50 points
- **False Report** (status → `false_report`): -10 points

**Total per resolved report**: 80 points (10 + 20 + 50)

### Level Thresholds:
- **Level 1** (Eco Starter): 0-99 points
- **Level 2** (Eco Helper): 100-249 points
- **Level 3** (Eco Contributor): 250-499 points
- **Level 4** (Eco Advocate): 500-999 points
- **Level 5** (Eco Warrior): 1000-1999 points
- **Level 6** (Eco Champion): 2000-3999 points
- **Level 7** (Eco Hero): 4000-7999 points
- **Level 8+** (Eco Legend): 8000+ points

---

## Step 5: Database Functions Available

### From `src/db/citizens.ts`:

- `getCitizenProfile(userId)` - Get citizen profile
- `getCitizenStats(userId)` - Get stats with calculated ranks
- `updateCitizenProfile(userId, updates)` - Update profile (name, avatar, etc.)
- `getCitizenLeaderboard(options?)` - Get leaderboard
- `getCitizenActivity(userId, limit?)` - Get activity feed
- `getCitizenReports(userId, filters?)` - Get citizen's reports
- `getCitizenRecentReports(userId, limit?)` - Get recent reports
- `subscribeToCitizenProfile(userId, callback)` - Real-time profile updates

---

## Step 6: Common Issues & Solutions

### Issue: Citizen profile not created on signup
**Solution**: Check that the trigger `on_auth_user_created` exists and is enabled in Supabase.

### Issue: Points not awarded
**Solution**: 
- Verify triggers are enabled: `trigger_on_report_created`, `trigger_on_report_status_changed`
- Check `citizen_activity` table for activity records
- Verify `citizen_id` is set in `reports` table

### Issue: RLS policy blocking queries
**Solution**: 
- Ensure user is authenticated (`auth.uid()` is not null)
- Check RLS policies are enabled on tables
- Verify policies allow SELECT for authenticated users

### Issue: Leaderboard not showing
**Solution**: 
- Check `citizen_leaderboard` view exists
- Verify citizens have `total_points > 0`
- Check RLS policies allow SELECT on view

---

## Step 7: Next Steps

1. ✅ Run database migration
2. ✅ Test citizen signup and profile creation
3. ✅ Test report creation and points awarding
4. ✅ Update frontend components to use real data
5. ✅ Test all dashboard views with real data
6. ✅ Add loading states and error handling
7. ✅ Add real-time updates (optional)
8. ✅ Test notifications system

---

## Files Created/Modified

### New Files:
- `CITIZEN_DASHBOARD_INTEGRATION_PLAN.md` - Detailed integration plan
- `src/supabase/citizen_schema.sql` - Database migration script
- `src/db/citizens.ts` - Citizen database functions
- `CITIZEN_INTEGRATION_QUICKSTART.md` - This file

### Modified Files:
- `src/utils/supabase/client.ts` - Added citizen types
- `src/db/reports.ts` - Added citizen_id linking

### Files to Update (Frontend):
- `src/components/CitizenDashboard.tsx`
- `src/components/dashboard-views/OverviewView.tsx`
- `src/components/dashboard-views/LeaderboardView.tsx`
- `src/components/dashboard-views/HistoryView.tsx`
- `src/components/dashboard-views/ReportWasteView.tsx` (already linked, but verify)

---

## Support

If you encounter issues:
1. Check Supabase Dashboard → Logs for SQL errors
2. Check browser console for JavaScript errors
3. Verify RLS policies are correct
4. Ensure triggers are enabled
5. Check that `auth.users` table has corresponding `citizens` records

