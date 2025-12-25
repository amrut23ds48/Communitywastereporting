# Supabase Backend Setup Guide

This guide will help you set up the complete Supabase backend for the Community Waste Reporting Platform.

## Prerequisites

- Supabase project URL: `https://mnkyaakbizxydtgulugu.supabase.co`
- You need access to the Supabase Dashboard

## Setup Steps

### 1. Run Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/mnkyaakbizxydtgulugu
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `/supabase/schema.sql` file
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

This will create:
- ✅ All database tables (reports, admin_actions, notifications)
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for automatic timestamps and notifications
- ✅ Views for analytics queries
- ✅ Storage bucket for images

### 2. Create Admin User

Since we don't have an email server configured, you need to manually create the admin user:

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Fill in:
   - **Email**: `admin@waste.com`
   - **Password**: `admin123`
   - **Auto Confirm User**: ✅ **Check this box** (important!)
4. Click **Create user**

### 3. Verify Storage Bucket

1. Go to **Storage** in the Supabase Dashboard
2. You should see a bucket named **waste-reports**
3. If not, the SQL script should have created it. If there's an error, manually create:
   - Bucket name: `waste-reports`
   - Public bucket: ✅ Enabled
   - File size limit: 5MB (optional)
   - Allowed MIME types: `image/*`

### 4. Test the Setup

#### Test Admin Login:
1. Run the app
2. Select **Admin** role
3. Login with:
   - Email: `admin@waste.com`
   - Password: `admin123`

#### Test Citizen Report:
1. Select **Citizen** role
2. Upload an image (will request location permission)
3. Submit a report
4. Check the admin dashboard to see the new report

### 5. Database Structure

#### Tables Created:

**reports**
- Primary table for waste reports
- Fields: id, image_url, latitude, longitude, street_name, city, description, status, created_at, updated_at, resolved_at
- Indexes on: status, street_name, created_at, location

**admin_actions**
- Audit log for all admin actions
- Fields: id, admin_id, report_id, previous_status, new_status, created_at
- Tracks who changed what and when

**notifications**
- Auto-generated notifications
- Fields: id, report_id, message, type, is_read, created_at
- Triggered when report status changes to 'resolved' or 'false_report'

#### Security (RLS Policies):

- **Public (anon + authenticated)**:
  - ✅ Can INSERT reports (anonymous reporting)
  - ✅ Can SELECT reports (view all reports)
  
- **Authenticated only** (admins):
  - ✅ Can UPDATE reports (change status)
  - ✅ Can DELETE reports
  - ✅ Can view admin_actions
  - ✅ Can view notifications

#### Storage Policies:

- **waste-reports bucket**:
  - ✅ Anyone can upload images
  - ✅ Anyone can view images
  - ✅ Only admins can delete images

### 6. API Functions Available

All database functions are organized in `/db/` directory:

#### `/db/reports.ts`
- `createReport()` - Create new waste report (citizen)
- `getReports()` - Fetch reports with filters
- `getReportById()` - Get single report
- `uploadReportImage()` - Upload image to storage
- `subscribeToReports()` - Real-time updates

#### `/db/admin.ts`
- `signInAdmin()` - Admin authentication
- `signOutAdmin()` - Logout
- `updateReportStatus()` - Change report status (creates notification)
- `bulkUpdateReportStatus()` - Update multiple reports
- `getAdminActions()` - View audit log
- `deleteReport()` - Delete a report
- `getCurrentAdmin()` - Get current session

#### `/db/analytics.ts`
- `getAnalyticsOverview()` - Dashboard statistics
- `getStreetStatistics()` - Per-street aggregation
- `getMonthlyInsights()` - Charts data
- `getHeatmapData()` - Map visualization

#### `/db/notifications.ts`
- `getNotifications()` - Fetch notifications
- `getUnreadCount()` - Count unread
- `markAsRead()` - Mark as read
- `markAllAsRead()` - Mark all as read
- `subscribeToNotifications()` - Real-time updates

### 7. Automated Features

#### Triggers:
1. **Auto-update timestamp**: `updated_at` is automatically set on every update
2. **Auto-set resolved_at**: When status changes to 'resolved', timestamp is recorded
3. **Auto-create notifications**: When status changes to 'resolved' or 'false_report', notification is created

#### Views:
1. **street_statistics**: Aggregated stats per street
2. **monthly_insights**: Monthly report counts by status

### 8. Testing Queries

You can run these in SQL Editor to verify:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';

-- View all policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Test reports table
SELECT * FROM reports LIMIT 10;

-- Check storage bucket
SELECT * FROM storage.buckets WHERE name = 'waste-reports';

-- Check admin user exists
SELECT id, email FROM auth.users;
```

### 9. Common Issues

**Issue**: Storage uploads fail
**Solution**: Make sure the bucket is public and policies are set correctly

**Issue**: Can't login as admin
**Solution**: Make sure you checked "Auto Confirm User" when creating the admin

**Issue**: Reports not showing
**Solution**: Check browser console for errors, verify RLS policies allow SELECT for anon role

**Issue**: Status update fails
**Solution**: Make sure you're logged in as admin, check that admin_id is being passed correctly

### 10. Production Checklist

Before deploying to production:

- [ ] Change admin password from `admin123`
- [ ] Set up proper email authentication (remove auto-confirm)
- [ ] Add rate limiting on report creation
- [ ] Set up image upload size limits
- [ ] Configure backup policies
- [ ] Add monitoring for storage usage
- [ ] Set up email notifications (optional)
- [ ] Add geolocation API for accurate street detection
- [ ] Consider adding content moderation for images

### 11. Data Flow

**Citizen Flow:**
1. Citizen uploads image → Supabase Storage
2. Browser gets location → Reverse geocoding (mocked for now)
3. Create report → PostgreSQL `reports` table
4. Trigger creates notification

**Admin Flow:**
1. Admin logs in → Supabase Auth
2. Fetch reports → PostgreSQL with filters
3. Update status → Trigger creates notification + logs to `admin_actions`
4. View analytics → Aggregation queries on `reports` table

### 12. Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase logs in Dashboard → Database → Logs
3. Verify all SQL was executed successfully
4. Ensure admin user was created with auto-confirm enabled

---

## Quick Reference

**Admin Login:**
- Email: `admin@waste.com`
- Password: `admin123`

**Supabase Project:**
- URL: `https://mnkyaakbizxydtgulugu.supabase.co`
- Project ID: `mnkyaakbizxydtgulugu`

**Storage Bucket:**
- Name: `waste-reports`
- Public: Yes

**Tables:**
- `reports` (main data)
- `admin_actions` (audit log)
- `notifications` (auto-generated)

**Key Features:**
✅ Anonymous reporting
✅ Admin authentication
✅ Status tracking with notifications
✅ Image storage
✅ Real-time updates (optional)
✅ Audit logging
✅ Street-level analytics
