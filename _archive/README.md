# Feature Archive - Quick Reference

**Date:** 2025-11-08
**Reason:** Investor feedback - reduce feature creep, focus on core video coaching loop

---

## 📦 What's Archived

All removed features are preserved in `_archive/features/` and can be restored at any time.

### Archived Features:
1. **Curated Gear** - Premature e-commerce monetization
2. **Social Media Tools** - Content generation for social media
3. **Scheduling System** - Calendar and appointment management
4. **Coaching Requests** - Synchronous coaching (keeping async video review)
5. **Assistant Coach Role** - Entire role with 7 pages
6. **Coach Network** - Coach invitation and networking features

---

## 📊 Results

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Athlete Nav Items** | 6 | 3 | **-50%** |
| **Coach Nav Items** | 12 | 5 | **-58%** |
| **Assistant Nav Items** | 7 | 0 | **-100%** |
| **Admin Nav Items** | 16 | 8 | **-50%** |
| **Total Nav Items** | 41 | 16 | **-61%** |

---

## ✅ New Focused Navigation

### **Athletes** (3 items)
- Dashboard
- Video Reviews
- Submit Video

### **Coaches** (5 items)
- Coaches Locker Room
- Video Review Queue
- Athletes
- Video Analytics
- Create Content

### **Super Admins** (8 items)
- Dashboard
- System Analytics
- User & Role Management
- All Invitations
- Coach Applications
- Content Management
- Coaches Locker Room
- System Settings

---

## 🔄 How to Restore Features

See `ARCHIVE_MANIFEST.md` for detailed restoration instructions for each feature.

**Quick Steps:**
1. Copy feature from `_archive/features/[feature-name]/` back to original location
2. Update `components/DashboardSidebar.tsx`
3. Test thoroughly
4. Deploy

---

## 🎯 Core Focus

**What PLAYBOOKD Does Now:**
- Athletes submit videos for review
- Coaches provide video feedback
- Athletes track their progress
- Platform manages users and content

**Everything else is archived and can be restored later.**
