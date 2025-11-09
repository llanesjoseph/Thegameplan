# PLAYBOOKD Feature Archive

**Archive Date:** 2025-11-08
**Reason:** Scope reduction to focus on core athlete-coach video feedback loop
**Requested By:** Investor feedback on feature creep

---

## 📋 Archive Overview

This directory contains features that were removed to reduce scope and feature creep. All code is preserved and can be restored if needed.

### Quick Stats
- **Features Archived:** 6 major features
- **Pages Archived:** ~30+ pages
- **Sidebar Items Removed:** 27 items reduced to 14 items (-48%)
- **Code Preserved:** 100% (nothing deleted, only moved)

---

## 🗂️ Archived Features

### 1. **Curated Gear** (`/gear`)
**Location:** `_archive/features/curated-gear/`
**Original Paths:**
- `app/gear/` → All gear-related pages
- `app/dashboard/coach/gear/` → Coach gear management
- Any gear components

**Reason:** Premature monetization, not core to video coaching feedback loop

**Sidebar Impact:**
- Removed from Athletes (1 item)
- Removed from Coaches (1 item)
- Removed from Assistants (1 item)
- Removed from Super Admins (1 item)

**To Restore:**
1. Move `_archive/features/curated-gear/` contents back to original locations
2. Add gear links back to sidebar in `components/DashboardSidebar.tsx`
3. Verify routes in `app/` structure

---

### 2. **Social Media Tools** (`/dashboard/coach/social-media`)
**Location:** `_archive/features/social-media/`
**Original Paths:**
- `app/dashboard/coach/social-media/` → Social media content generator

**Reason:** Not core to video feedback, separate product entirely

**Sidebar Impact:**
- Removed from Coaches (1 item)

**To Restore:**
1. Move `_archive/features/social-media/` back to `app/dashboard/coach/social-media/`
2. Add "Social Media" link back to coach sidebar
3. Test social media generation functionality

---

### 3. **Scheduling System** (`/dashboard/coach/schedule`)
**Location:** `_archive/features/scheduling/`
**Original Paths:**
- `app/dashboard/coach/schedule/` → Coach scheduling
- `app/dashboard/assistant/schedule/` → Assistant schedule management

**Reason:** Scheduling is a different product, focus on async video review

**Sidebar Impact:**
- Removed from Coaches (1 item: "My Schedule")
- Removed from Assistants (1 item: "Schedule Management")

**To Restore:**
1. Move `_archive/features/scheduling/` contents back to original locations
2. Add schedule links back to coach and assistant sidebars
3. Verify calendar integrations work

---

### 4. **Coaching Requests** (Synchronous Coaching)
**Location:** `_archive/features/coaching-requests/`
**Original Paths:**
- `app/dashboard/requests/` → General requests
- `app/dashboard/assistant/requests/` → Assistant request handling
- `app/dashboard/admin/requests/` → Admin request oversight
- `app/dashboard/coaching/` → Athlete request coaching

**Reason:** Async video review is core, synchronous coaching is feature creep

**Sidebar Impact:**
- Removed from Athletes (1 item: "Request Coaching")
- Removed from Coaches (1 item: "Coaching Requests")
- Removed from Assistants (1 item: "Coaching Requests")

**To Restore:**
1. Move `_archive/features/coaching-requests/` contents back to original locations
2. Add request links back to all role sidebars
3. Test request workflow end-to-end

---

### 5. **Assistant Coach Role** (Entire Role)
**Location:** `_archive/features/assistant-role/`
**Original Paths:**
- `app/dashboard/assistant/` → All assistant pages (7 pages)
- Assistant-specific components
- Assistant role logic in auth/permissions

**Reason:** Adds complexity without clear ROI, can add back post-product-market-fit

**Sidebar Impact:**
- Removed entire Assistant role (7 items)
- Removed from Super Admin (1 item: "Assistant Coaches")

**To Restore:**
1. Move `_archive/features/assistant-role/` back to `app/dashboard/assistant/`
2. Restore assistant navigation in `components/DashboardSidebar.tsx`
3. Update role types in `types/` or `lib/auth`
4. Test assistant permissions and access controls

---

### 6. **Coach Network / Invitations**
**Location:** `_archive/features/coach-network/`
**Original Paths:**
- `app/dashboard/coach/invite/` → Coach invitation system
- Coach network UI in `dashboard/coach-unified`
- Related components

**Reason:** Premature growth feature, focus on product-market-fit first

**Sidebar Impact:**
- Removed from Coaches (1 item: "Coach Network")

**To Restore:**
1. Move `_archive/features/coach-network/` back to original locations
2. Add "Coach Network" link back to coach sidebar
3. Verify invitation generation and tracking

---

### 7. **Progress Page** (Athlete Duplicate)
**Location:** `_archive/features/athlete-progress/`
**Original Paths:**
- Standalone progress page (consolidated into Dashboard)

**Reason:** Duplicate of Dashboard functionality, consolidated to reduce navigation

**Sidebar Impact:**
- Removed from Athletes (1 item: "Progress")

**To Restore:**
1. Move `_archive/features/athlete-progress/` back to original location
2. Add "Progress" link back to athlete sidebar
3. Decide whether to keep separate or keep consolidated

---

## 📊 Sidebar Reduction Summary

| Role | Original Items | Reduced To | Removed | Reduction |
|------|----------------|------------|---------|-----------|
| **Athlete** | 6 items | 3 items | -3 | **-50%** |
| **Coach** | 12 items | 6 items | -6 | **-50%** |
| **Assistant** | 7 items | 0 items (role removed) | -7 | **-100%** |
| **Super Admin** | 16 items | 8 items | -8 | **-50%** |
| **TOTAL** | 41 items | 17 items | -24 | **-59%** |

---

## 🎯 New Focused Navigation

### Athletes (3 items)
1. Dashboard (includes progress)
2. Video Reviews
3. Submit Video

### Coaches (6 items)
1. Coaches Locker Room
2. Video Review Queue
3. Video Analytics
4. Create Content
5. Manage Content
6. Athletes (if we keep this - needs decision)

### Super Admins (8 items)
1. Dashboard
2. System Analytics
3. User & Role Management
4. All Invitations
5. Coach Applications
6. Content Management
7. Coaches Locker Room
8. System Settings

---

## 🔧 Restoration Instructions

### General Restoration Process:
1. Identify the feature to restore from this manifest
2. Copy the archived code from `_archive/features/[feature-name]/` back to original location
3. Update `components/DashboardSidebar.tsx` to add navigation items
4. Test the feature end-to-end
5. Update this manifest to note restoration date

### Testing Checklist After Restoration:
- [ ] Routes load correctly
- [ ] Navigation items appear in sidebar
- [ ] Permissions/roles work correctly
- [ ] Database operations function
- [ ] No console errors
- [ ] Mobile responsive layout works

---

## 📝 Archive Metadata

**Created:** 2025-11-08
**Last Updated:** 2025-11-08
**Archive Format:** Feature-based organization
**Restoration Tested:** No (features archived but not yet tested for restoration)

---

## ⚠️ Important Notes

1. **Do Not Delete This Archive** - All code is preserved for potential future use
2. **Database Schema** - Some archived features may have Firestore collections that are not deleted
3. **Dependencies** - Check `package.json` if restoring features with external dependencies
4. **Routes** - Some archived routes may need Next.js route updates if app structure changed
5. **Types** - TypeScript types for archived features are preserved in archive

---

## 🤝 Questions?

If you need to restore a feature:
1. Read the specific feature section above
2. Follow the restoration instructions
3. Test thoroughly before deploying
4. Update this manifest with restoration date

---

**Archive Maintained By:** Development Team
**Review Schedule:** Quarterly (review if archived features should be permanently removed or restored)
