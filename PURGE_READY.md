# ✅ Ready to Purge Database

## What You'll Get After Purge

### Accounts Created:
1. **joseph@crucibleanalytics.dev** → Superadmin (you)
2. **llanes.joseph.m@gmail.com** → Coach (for testing)

### What's Deleted:
- ❌ All mock/test data
- ❌ All existing users (except your 2 accounts)
- ❌ All content, lessons, sessions
- ❌ Everything else

### What's Preserved:
- ✅ Jasmine's coach card (hard-coded, shows even before signup)
- ✅ Your superadmin account
- ✅ Your coach account for testing

---

## How to Run Purge

1. **Open** https://playbookd.crucibleanalytics.dev
2. **Sign in** as joseph@crucibleanalytics.dev
3. **Press F12** (DevTools)
4. **Console tab**
5. **Copy** `scripts/purge-and-reseed-clean.js` contents
6. **Paste** into console
7. **Press Enter**
8. **Confirm twice**

Takes ~30 seconds. Done!

---

## After Purge

### As Superadmin (joseph@crucibleanalytics.dev):
- ✅ Access all dashboards
- ✅ Create admins
- ✅ Manage users
- ✅ Switch roles for testing

### As Coach (llanes.joseph.m@gmail.com):
1. **Sign in** with this account
2. **Create lessons** and content
3. **Send athlete invitations**
4. **Test coach features**
5. **Build out the platform**

### Jasmine's Coach Card:
- ✅ Shows on `/contributors` page
- ✅ Hard-coded in `app/contributors/page.tsx` (line 55-71)
- ✅ Visible before she creates account
- When she signs up, she'll need to match this data

---

## 5-Role System Active

Only these roles exist:
1. **athlete** - Athletes using the platform
2. **coach** - Coaches creating content
3. **assistant** - Assistant coaches
4. **admin** - Platform admins
5. **superadmin** - You (joseph@crucibleanalytics.dev)

No more:
- ❌ user (now athlete)
- ❌ creator (now coach)
- ❌ guest (deleted)

---

## Next Steps

1. **Run purge script** (30 seconds)
2. **Sign in as llanes.joseph.m@gmail.com**
3. **Create first lessons**
4. **Invite first athletes**
5. **Real users can sign up**
6. **Platform is clean and ready!**

---

## Important Notes

- **No rollback** - deletion is permanent
- **Asks twice** before deleting
- **Clean slate** for production testing
- **Real users** can now sign up with proper roles

---

**Ready?** Run the script and start fresh! 🚀
