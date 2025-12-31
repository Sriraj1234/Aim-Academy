/**
 * SAFE DATA ORGANIZATION SCRIPT
 * ==============================
 * This script ONLY ADDS/UPDATES data, NEVER DELETES!
 * 
 * What it does:
 * 1. Scans all questions in Firestore
 * 2. Builds taxonomy structure automatically
 * 3. Creates/updates metadata/taxonomy document
 * 4. Shows progress and statistics
 * 
 * SAFETY: No data is deleted. Can be run multiple times.
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
        console.error('Please download it from Firebase Console and place it in the root directory.\n');
        process.exit(1);
    }
}

const db = admin.firestore();

// Progress tracking
let totalQuestions = 0;
let processedQuestions = 0;

/**
 * Main function to organize data
 */
async function organizeData() {
    console.log('🚀 Starting Data Organization (SAFE MODE - No Deletions)\n');
    console.log('='.repeat(60));

    try {
        // Step 1: Scan all questions
        console.log('\n📊 Step 1: Scanning Questions Collection...\n');
        const questionsSnapshot = await db.collection('questions').get();
        totalQuestions = questionsSnapshot.size;
        console.log(`   Found ${totalQuestions} questions in database\n`);

        if (totalQuestions === 0) {
            console.log('⚠️  No questions found. Nothing to organize.');
            return;
        }

        // Step 2: Build taxonomy structure
        console.log('🔨 Step 2: Building Taxonomy Structure...\n');
        const taxonomy = {};

        questionsSnapshot.forEach(doc => {
            const data = doc.data();
            processedQuestions++;

            // Extract metadata
            const board = (data.board || 'cbse').toLowerCase();
            const classNum = (data.class || '10').toString();
            const subject = (data.subject || 'general').toLowerCase();
            const chapter = data.chapter || 'Miscellaneous';

            // Create board+class key
            const key = `${board}_${classNum}`;

            // Initialize structure if needed
            if (!taxonomy[key]) {
                taxonomy[key] = {
                    subjects: new Set(),
                    chapters: {}
                };
            }

            // Add subject
            taxonomy[key].subjects.add(subject);

            // Initialize chapter tracking for subject
            if (!taxonomy[key].chapters[subject]) {
                taxonomy[key].chapters[subject] = {};
            }

            // Track chapter and count
            if (!taxonomy[key].chapters[subject][chapter]) {
                taxonomy[key].chapters[subject][chapter] = 0;
            }
            taxonomy[key].chapters[subject][chapter]++;

            // Progress indicator
            if (processedQuestions % 100 === 0) {
                process.stdout.write(`   Processed: ${processedQuestions}/${totalQuestions}\r`);
            }
        });

        console.log(`   Processed: ${processedQuestions}/${totalQuestions} ✅\n`);

        // Step 3: Convert Sets to Arrays and format structure
        console.log('📦 Step 3: Formatting Taxonomy Data...\n');
        const formattedTaxonomy = {};

        Object.keys(taxonomy).forEach(key => {
            formattedTaxonomy[key] = {
                subjects: Array.from(taxonomy[key].subjects).sort(),
                chapters: {}
            };

            // Format chapters with counts
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
        console.log('📋 Summary of Discovered Data:\n');
        console.log('   Board + Class Combinations:');
        Object.keys(formattedTaxonomy).forEach(key => {
            const data = formattedTaxonomy[key];
            console.log(`   • ${key}: ${data.subjects.length} subjects`);
            data.subjects.forEach(subject => {
                const chapterCount = data.chapters[subject]?.length || 0;
                const questionCount = data.chapters[subject]?.reduce((sum, ch) => sum + ch.count, 0) || 0;
                console.log(`     - ${subject}: ${chapterCount} chapters, ${questionCount} questions`);
            });
        });

        // Step 5: Save to Firestore (SAFE - only creates/updates)
        console.log('\n💾 Step 4: Saving Taxonomy to Firestore...\n');

        const metadataRef = db.collection('metadata').doc('taxonomy');
        await metadataRef.set(formattedTaxonomy, { merge: true });

        console.log('   ✅ Taxonomy saved successfully!\n');

        // Step 6: Verify
        console.log('🔍 Step 5: Verifying...\n');
        const verifyDoc = await metadataRef.get();
        if (verifyDoc.exists()) {
            console.log('   ✅ Verification passed! metadata/taxonomy exists.\n');
        } else {
            console.log('   ⚠️  Warning: Could not verify document creation.\n');
        }

        // Final Summary
        console.log('='.repeat(60));
        console.log('\n🎉 DATA ORGANIZATION COMPLETE!\n');
        console.log('Summary:');
        console.log(`  • Total Questions Analyzed: ${totalQuestions}`);
        console.log(`  • Board+Class Combinations: ${Object.keys(formattedTaxonomy).length}`);
        console.log(`  • Taxonomy Document: ✅ Created/Updated`);
        console.log(`  • Data Deleted: ❌ ZERO (Safe Mode)\n`);
        console.log('Your application should now work perfectly! 🚀\n');

    } catch (error) {
        console.error('\n❌ Error during organization:');
        console.error(error);
        process.exit(1);
    }
}

// Run the script
organizeData()
    .then(() => {
        console.log('Process completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
