# Data Organization Scripts

## 🛡️ SAFE Data Organization

### `organize-data.js`

This script fixes data organization issues WITHOUT deleting any data.

**What it does:**
- ✅ Scans all questions in Firestore
- ✅ Auto-generates `metadata/taxonomy` document
- ✅ Organizes by Board + Class (e.g., `cbse_10`, `icse_12`)
- ✅ Counts chapters and questions automatically
- ✅ **ZERO data deletion - 100% safe!**

**Safety Features:**
- Uses `merge: true` to only add/update
- Never deletes any documents
- Can be run multiple times safely
- Shows detailed progress

---

## 📋 Prerequisites

1. **Firebase Service Account Key**
   - Download from: Firebase Console → Project Settings → Service Accounts
   - Save as: `serviceAccountKey.json` in project root
   - **IMPORTANT:** Add to `.gitignore` (already done)

---

## 🚀 How to Run

### Step 1: Install Dependencies (if needed)
```bash
npm install firebase-admin
```

### Step 2: Place Service Account Key
```
aim-academy/
  ├── serviceAccountKey.json  ← Place here!
  └── scripts/
      └── organize-data.js
```

### Step 3: Run the Script
```bash
node scripts/organize-data.js
```

---

## 📊 Expected Output

```
🚀 Starting Data Organization (SAFE MODE - No Deletions)
============================================================

📊 Step 1: Scanning Questions Collection...
   Found 1250 questions in database

🔨 Step 2: Building Taxonomy Structure...
   Processed: 1250/1250 ✅

📦 Step 3: Formatting Taxonomy Data...

📋 Summary of Discovered Data:
   Board + Class Combinations:
   • cbse_10: 5 subjects
     - math: 12 chapters, 350 questions
     - science: 15 chapters, 420 questions
     - sst: 8 chapters, 200 questions
   ...

💾 Step 4: Saving Taxonomy to Firestore...
   ✅ Taxonomy saved successfully!

🔍 Step 5: Verifying...
   ✅ Verification passed!

🎉 DATA ORGANIZATION COMPLETE!
```

---

## ❓ Troubleshooting

**Error: `serviceAccountKey.json not found`**
- Download from Firebase Console
- Place in project root directory

**Error: Permission denied**
- Check Firebase service account has `Cloud Datastore User` role

**No questions found**
- Verify your Firestore has a `questions` collection
- Check collection name is correct

---

## 🔄 After Running

1. Restart your dev server: `npm run dev`
2. Navigate to `/play/group/host`
3. Subjects and chapters should now load correctly!
4. Selection page should also work properly

---

## 📝 What Gets Created

**Firestore Structure:**
```
metadata/
  └── taxonomy
       └── {
            "cbse_10": {
              "subjects": ["math", "science", ...],
              "chapters": {
                "math": [
                  { "name": "Algebra", "count": 25 },
                  ...
                ]
              }
            },
            "icse_12": {...}
          }
```

This structure enables:
- Fast subject/chapter lookups
- Question count tracking
- Board-specific content
- Class-specific filtering
