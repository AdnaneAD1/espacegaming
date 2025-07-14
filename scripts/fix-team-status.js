const fs = require('fs')
const path = require('path')
const admin = require('firebase-admin')

// Lire le fichier .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')

// Parser les variables d'environnement
const envVars = {}
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
    }
})

// Configuration Firebase Admin
const serviceAccount = {
    type: "service_account",
    project_id: envVars.FIREBASE_PROJECT_ID,
    private_key_id: envVars.FIREBASE_PRIVATE_KEY_ID,
    private_key: envVars.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: envVars.FIREBASE_CLIENT_EMAIL,
    client_id: envVars.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${envVars.FIREBASE_CLIENT_EMAIL}`
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    })
}

const db = admin.firestore()

async function fixTeamStatus() {
    console.log('🔧 Correction des statuts d\'équipes...')

    try {
        const teamsSnapshot = await db.collection('teams').get()
        const batch = db.batch()
        let fixedCount = 0

        teamsSnapshot.docs.forEach(doc => {
            const team = doc.data()
            const players = team.players || []
            const totalPlayers = players.length
            const validatedPlayers = players.filter(p => p.status === 'validated').length

            let correctStatus

            if (validatedPlayers >= 3) {
                correctStatus = 'validated'
            } else if (totalPlayers === 4) {
                correctStatus = 'complete'
            } else {
                correctStatus = 'incomplete'
            }

            if (team.status !== correctStatus) {
                console.log(`📝 Équipe "${team.name}" (${totalPlayers}/4 joueurs, ${validatedPlayers} validés): ${team.status} → ${correctStatus}`)
                batch.update(doc.ref, {
                    status: correctStatus,
                    updatedAt: new Date()
                })
                fixedCount++
            }
        })

        if (fixedCount > 0) {
            await batch.commit()
            console.log(`✅ ${fixedCount} équipe(s) corrigée(s) avec succès !`)
        } else {
            console.log('✅ Aucune correction nécessaire, tous les statuts sont corrects.')
        }

    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error)
    }
}

fixTeamStatus().then(() => {
    console.log('🎉 Script terminé.')
    process.exit(0)
})
