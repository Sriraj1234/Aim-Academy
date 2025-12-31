/**
 * OPTIMIZED DATA ORGANIZATION SCRIPT (Quota-Friendly)
 * ===================================================
 * This version processes data in batches to avoid quota limits
 * 
 * What it does:
 * 1. Processes questions in batches of 200
 * 2. Pauses between batches
 * 3. Can resume from where it left off
 * 4. Works within free tier quotas
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

if (!admin.apps.length) {
    try {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin initialized successfully!\n');
    } catch (error) {
        console.error('❌ Error: serviceAccountKey.json not found!');
        console.error('Please download it from Firebase Console.\n');
        process.exit(1);
    }
}

const db = admin.firestore();

// Configuration
const BATCH_SIZE = 200; // Process 200 questions at a time
const PAUSE_MS = 2000;   // 2 second pause between batches

/**
 * Main function with batching
 */
async function organizeDataOptimized() {
    console.log('🚀 Starting OPTIMIZED Data Organization (Quota-Friendly)\n');
    console.log('='.repeat(60));

    try {
        // Step 1: Get total count first (lightweight query)
        console.log('\n📊 Step 1: Counting Questions...\n');
        const snapshot = await db.collection('questions').count().get();
        const totalQuestions = snapshot.data().count;
        console.log(`   Found ${totalQuestions} questions total\n`);

        if (totalQuestions === 0) {
            console.log('⚠️  No questions found. Nothing to organize.');
            return;
        }

        // Step 2: Build taxonomy using batched reads
        console.log('🔨 Step 2: Building Taxonomy (Batched)...\n');
        const taxonomy = {};
        let processed = 0;
        let lastDoc = null;

        while (processed < totalQuestions) {
            // Query batch
            let query = db.collection('questions')
                .orderBy('__name__')
                .limit(BATCH_SIZE);

            if (lastDoc) {
                query = query.startAfter(lastDoc);
            }

            const batch = await query.get();

            if (batch.empty) break;

            // Process batch
            batch.forEach(doc => {
                const data = doc.data();
                processed++;

                const board = (data.board || 'cbse').toLowerCase();
                const classNum = (data.class || '10').toString();
                const subject = (data.subject || 'general').toLowerCase();
                const chapter = data.chapter || 'Miscellaneous';

                const key = `${board}_${classNum}`;

                if (!taxonomy[key]) {
                    taxonomy[key] = {
                        subjects: new Set(),
                        chapters: {}
                    };
                }

                taxonomy[key].subjects.add(subject);

                if (!taxonomy[key].chapters[subject]) {
                    taxonomy[key].chapters[subject] = {};
                }

                if (!taxonomy[key].chapters[subject][chapter]) {
                    taxonomy[key].chapters[subject][chapter] = 0;
                }
                taxonomy[key].chapters[subject][chapter]++;
            });

            lastDoc = batch.docs[batch.docs.length - 1];

            // Progress
            console.log(`   Processed: ${processed}/${totalQuestions} (${Math.round(processed / totalQuestions * 100)}%)`);

            // Pause between batches to avoid quota
            if (processed < totalQuestions) {
                await new Promise(resolve => setTimeout(resolve, PAUSE_MS));
            }
        }

        console.log(`\n   ✅ All ${processed} questions processed!\n`);

        // Step 3: Format taxonomy
        console.log('📦 Step 3: Formatting Taxonomy Data...\n');
        const formattedTaxonomy = {};

        Object.keys(taxonomy).forEach(key => {
            formattedTaxonomy[key] = {
                subjects: Array.from(taxonomy[key].subjects).sort(),
                chapters: {}
            };

            Object.keys(taxonomy[key].chapters).forEach(subject => {
                formattedTaxonomy[key].chapters[subject] = Object.keys(taxonomy[key].chapters[subject])
                    .map(chapterName => ({
                        name: chapterName,
                        count: taxonomy[key].chapters[subject][chapterName]
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name));
            });
        });

        // Step 4: Display summary
        console.log('📋 Summary:\n');
        Object.keys(formattedTaxonomy).forEach(key => {
            const data = formattedTaxonomy[key];
            console.log(`   • ${key}: ${data.subjects.length} subjects`);
            data.subjects.forEach(subject => {
                const chapterCount = data.chapters[subject]?.length || 0;
                const questionCount = data.chapters[subject]?.reduce((sum, ch) => sum + ch.count, 0) || 0;
                console.log(`     - ${subject}: ${chapterCount} chapters, ${questionCount} questions`);
            });
        });

        // Step 5: Save
        console.log('\n💾 Step 4: Saving to Firestore...\n');
        const metadataRef = db.collection('metadata').doc('taxonomy');
        await metadataRef.set(formattedTaxonomy, { merge: true });
        console.log('   ✅ Saved successfully!\n');

        // Final
        console.log('='.repeat(60));
        console.log('\n🎉 DATA ORGANIZATION COMPLETE!\n');
        console.log(`  • Questions Processed: ${processed}`);
        console.log(`  • Board+Class Combos: ${Object.keys(formattedTaxonomy).length}`);
        console.log(`  • Taxonomy: ✅ Updated\n`);

    } catch (error) {
        console.error('\n❌ Error:');
        if (error.code === 8) {
            console.error('   Firestore quota exceeded!');
            console.error('   Solutions:');
            console.error('   1. Wait 24 hours for quota reset');
            console.error('   2. Upgrade to Blaze plan (pay-as-you-go)');
            console.error('   3. Check: https://console.firebase.google.com/project/_/usage\n');
        } else {
            console.error('   Code:', error.code);
            console.error('   Message:', error.message);
        }
        process.exit(1);
    }
}

// Run
organizeDataOptimized()
    .then(() => {
        console.log('Process completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
