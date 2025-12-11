# Firestore Indexes Setup for creators_index Collection

## 🎯 Quick Links

**Firebase Console - Indexes:**
```
https://console.firebase.google.com/project/gameplan-787a2/firestore/indexes
```

**Firebase Console - Data:**
```
https://console.firebase.google.com/project/gameplan-787a2/firestore/data
```

---

## 📋 Required Indexes

We need to create **5 composite indexes** for the `creators_index` collection to support the Browse Coaches functionality.

---

## Method 1: Manual Creation in Firebase Console

Go to: [Firebase Indexes Console](https://console.firebase.google.com/project/gameplan-787a2/firestore/indexes)

Click the blue **"Add Index"** button and create each index below:

### Index 1: Basic Active + Display Name Query
**Collection ID:** `creators_index`
**Query Scope:** Collection

| Field path | Index mode |
|------------|------------|
| isActive | Ascending |
| displayName | Ascending |

Click **Create Index**

---

### Index 2: Sport Filter (Array Contains)
**Collection ID:** `creators_index`
**Query Scope:** Collection

| Field path | Index mode |
|------------|------------|
| isActive | Ascending |
| specialties | **Array-contains** |
| displayName | Ascending |

Click **Create Index**

---

### Index 3: Experience Filter
**Collection ID:** `creators_index`
**Query Scope:** Collection

| Field path | Index mode |
|------------|------------|
| isActive | Ascending |
| experience | Ascending |
| displayName | Ascending |

Click **Create Index**

---

### Index 4: Verified Filter
**Collection ID:** `creators_index`
**Query Scope:** Collection

| Field path | Index mode |
|------------|------------|
| isActive | Ascending |
| verified | Ascending |
| displayName | Ascending |

Click **Create Index**

---

### Index 5: Featured Filter
**Collection ID:** `creators_index`
**Query Scope:** Collection

| Field path | Index mode |
|------------|------------|
| isActive | Ascending |
| featured | Ascending |
| displayName | Ascending |

Click **Create Index**

---

## Method 2: gcloud CLI Commands

### Setup (run once)
```bash
gcloud auth login
gcloud config set project gameplan-787a2
```

### Index 1: Basic Query
```bash
gcloud firestore indexes composite create --collection-group=creators_index --query-scope=COLLECTION --field-config field-path=isActive,order=ASCENDING --field-config field-path=displayName,order=ASCENDING
```

### Index 2: Sport Filter (Array Contains)
```bash
gcloud firestore indexes composite create --collection-group=creators_index --query-scope=COLLECTION --field-config field-path=isActive,order=ASCENDING --field-config field-path=specialties,array-config=CONTAINS --field-config field-path=displayName,order=ASCENDING
```

### Index 3: Experience Filter
```bash
gcloud firestore indexes composite create --collection-group=creators_index --query-scope=COLLECTION --field-config field-path=isActive,order=ASCENDING --field-config field-path=experience,order=ASCENDING --field-config field-path=displayName,order=ASCENDING
```

### Index 4: Verified Filter
```bash
gcloud firestore indexes composite create --collection-group=creators_index --query-scope=COLLECTION --field-config field-path=isActive,order=ASCENDING --field-config field-path=verified,order=ASCENDING --field-config field-path=displayName,order=ASCENDING
```

### Index 5: Featured Filter
```bash
gcloud firestore indexes composite create --collection-group=creators_index --query-scope=COLLECTION --field-config field-path=isActive,order=ASCENDING --field-config field-path=featured,order=ASCENDING --field-config field-path=displayName,order=ASCENDING
```

### Verify Indexes Created
```bash
gcloud firestore indexes composite list
```

---

## Method 3: Firebase CLI (Alternative)

If you have the indexes defined in `firestore.indexes.json`:

```bash
firebase login
firebase deploy --only firestore:indexes
```

---

## ✅ Verification

After creating the indexes, verify they're building:

1. Go to: https://console.firebase.google.com/project/gameplan-787a2/firestore/indexes
2. Look for 5 new indexes with Collection ID = `creators_index`
3. Status should show "Building..." then "Enabled" (takes 5-10 minutes)

---

## 🎯 Why These Indexes Are Needed

The Browse Coaches page (`/contributors`) queries the `creators_index` collection with various filters:

- **Index 1**: Base query - shows all active coaches sorted by name
- **Index 2**: Filtering by sport (uses array-contains on specialties)
- **Index 3**: Filtering by experience level
- **Index 4**: Showing only verified coaches
- **Index 5**: Showing only featured coaches

Without these indexes, queries will fail with "missing index" errors.

---

## 📝 Related Files

- `firestore.indexes.json` - Index definitions
- `app/contributors/page.tsx` - Browse Coaches page that uses these indexes
- `app/dashboard/profile/page.tsx` - Profile save logic that writes to creators_index

---

## 🐛 Troubleshooting

**If indexes don't appear after firebase deploy:**
- Try creating them manually in the console (Method 1)
- Check that `firestore.indexes.json` is properly formatted
- Verify you're authenticated to the correct project

**If gcloud commands fail:**
- Make sure gcloud CLI is installed and authenticated
- Run `gcloud config set project gameplan-787a2`
- Try running commands one at a time

**If queries still fail after indexes are created:**
- Wait 10-15 minutes for indexes to finish building
- Check index status in Firebase Console
- Verify the collection name is exactly `creators_index` (case-sensitive)
