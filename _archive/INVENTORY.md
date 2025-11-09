# Archive Inventory - File Locations

**Archive Date:** 2025-11-08

This document lists exactly what was moved and where to find it.

---

## 📁 Directory Structure

```
_archive/
├── README.md                  (Quick reference)
├── ARCHIVE_MANIFEST.md        (Detailed restoration guide)
├── INVENTORY.md              (This file - file locations)
└── features/
    ├── curated-gear/
    │   ├── gear/             (from app/gear)
    │   ├── dashboard-gear/   (from app/dashboard/gear)
    │   ├── coach-gear/       (from app/dashboard/coach/gear)
    │   └── api-gear/         (from app/api/gear)
    ├── social-media/
    │   └── social-media/     (from app/dashboard/coach/social-media)
    ├── scheduling/
    │   ├── coach-schedule/   (from app/dashboard/coach/schedule)
    │   ├── assistant-schedule/ (from app/dashboard/assistant/schedule)
    │   └── general-schedule/ (from app/dashboard/schedule)
    ├── coaching-requests/
    │   ├── general-requests/ (from app/dashboard/requests)
    │   ├── admin-requests/   (from app/dashboard/admin/requests)
    │   ├── assistant-requests/ (from app/dashboard/assistant/requests)
    │   └── athlete-coaching/ (from app/dashboard/coaching)
    ├── assistant-role/
    │   ├── assistant/        (from app/dashboard/assistant)
    │   └── coach-assistants-management/ (from app/dashboard/coach/assistants)
    └── coach-network/
        └── invite/           (from app/dashboard/coach/invite)
```

---

## 🗺️ File Mappings

### Curated Gear Feature
| Original Location | Archived Location |
|-------------------|-------------------|
| `app/gear/` | `_archive/features/curated-gear/gear/` |
| `app/dashboard/gear/` | `_archive/features/curated-gear/dashboard-gear/` |
| `app/dashboard/coach/gear/` | `_archive/features/curated-gear/coach-gear/` |
| `app/api/gear/` | `_archive/features/curated-gear/api-gear/` |

### Social Media Feature
| Original Location | Archived Location |
|-------------------|-------------------|
| `app/dashboard/coach/social-media/` | `_archive/features/social-media/social-media/` |

### Scheduling System
| Original Location | Archived Location |
|-------------------|-------------------|
| `app/dashboard/coach/schedule/` | `_archive/features/scheduling/coach-schedule/` |
| `app/dashboard/assistant/schedule/` | `_archive/features/scheduling/assistant-schedule/` |
| `app/dashboard/schedule/` | `_archive/features/scheduling/general-schedule/` |

### Coaching Requests (Sync Coaching)
| Original Location | Archived Location |
|-------------------|-------------------|
| `app/dashboard/requests/` | `_archive/features/coaching-requests/general-requests/` |
| `app/dashboard/admin/requests/` | `_archive/features/coaching-requests/admin-requests/` |
| `app/dashboard/assistant/requests/` | `_archive/features/coaching-requests/assistant-requests/` |
| `app/dashboard/coaching/` | `_archive/features/coaching-requests/athlete-coaching/` |

### Assistant Coach Role
| Original Location | Archived Location |
|-------------------|-------------------|
| `app/dashboard/assistant/` | `_archive/features/assistant-role/assistant/` |
| `app/dashboard/coach/assistants/` | `_archive/features/assistant-role/coach-assistants-management/` |

### Coach Network
| Original Location | Archived Location |
|-------------------|-------------------|
| `app/dashboard/coach/invite/` | `_archive/features/coach-network/invite/` |

---

## 🔍 Finding Archived Code

### To Find a Specific Feature:
1. Check the feature name in the list above
2. Navigate to `_archive/features/[feature-name]/`
3. All code is preserved in subdirectories

### To Restore a Feature:
1. Locate it in the archive using this inventory
2. Copy back to original location (see "Original Location" column)
3. Update `components/DashboardSidebar.tsx` to add navigation
4. Test thoroughly

---

## 📝 Notes

- **Nothing was deleted** - All code is preserved
- **Directory structure preserved** - Each archived feature maintains its internal structure
- **Database collections** - Not modified; may contain data for archived features
- **Dependencies** - `package.json` not modified; all dependencies still available

---

## 🚨 Important

**Do not delete this archive directory.** Your investor wanted to reduce scope, not permanently lose features. This archive allows you to:

1. Show reduced scope to investor
2. Restore features if needed
3. Reference old implementations
4. Learn from past work

---

**Last Updated:** 2025-11-08
**Maintained By:** Development Team
