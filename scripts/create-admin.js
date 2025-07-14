#!/usr/bin/env node

const admin = require('firebase-admin');

// Configuration Firebase Admin SDK
const serviceAccount = {
    type: "service_account",
    project_id: "espace-gaming-codm",
    private_key_id: "0de958d2e48190c599d15f3e3644f5a2e37d207b",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDGAShu6gzDXWDM\nhYjzAV+4xXsaXXy48/t3u1r994Mov86Hr0ndU1fxGcs7eZ7/Y22b29+cbjWnpKlG\nvuLGDEdNM5450PJvPyAa1Jr9L25m0BMMsUU8IWjyiw6n93/ATghBoe4lbfDktegK\n69ryY525LwzRo0/VbqM6SJOKN8UftQa/6n0ri7YZVxkzoheBFD+ejYPb6FzkwRoP\nQZ/s353cvBIF2D2JXJw4i+6oMV5GsC/fGUymz24Z2Exw1Y2cJRdADSeE/DmVrQ0Y\nZw68yeTyONeOPgMtGo0viget/rVWVZNi5Df7BxAw19I2TuXNL+U4MHDv1YbosYL2\nT58BQk3VAgMBAAECggEAERTa/dyLntQArIwtkRcygJBqyw67GoKT1FOxqRyv8DVB\n1jNBSkptGQPaZEZc+NfFRi+c9hQM5Wo/XzbK/f5jrU2RbhfwPjgiJyZlu4davRxg\ntFTbrfEM6nWkHUns97RTooPbdVerczOdMcoAkK4W1nmwX6p40ecSRk4qCj++7fnr\nRHg44BgQGQ3GZFc4lVDbehw7bDMUEls0DOiPp/IuPHbApBvYY7ZzcColNmyY+7F4\nRp4SfMUaYjZFz9OiBiT8FcgqcEcrtGKrEkp8E1r21CSCa2I4Qef5U/oB0w4nv6km\n0n1Yt7bwLILsL7offlRe7/zKa1wIoOMXS5KZLn8oiQKBgQDzmq34DczXqfcqFP0E\naEbvmJo6bqoHy1bIuoBmmy4dBCaU2HgLNIMsR76EfPcQSRZzyZh/e0Vr4aBCeBK7\nTlM1D45F6cxw9DqY52uhfzyaLyk6YNuuu1vpk3NEaXE9F0+sXZ464BEsr1MTx6bc\nGJiq1RSKTTNLNHYH0jlBUwciDQKBgQDQFHjZ0fYljYaDylFPhVzbyrFBmLB1eipg\nLYDpmpne0UWTsAId6F3RINQ8IKnd3W5y38Y7q8ReAohi/LEIiVbwVq18meFCGig7\nKdYzmGdfkCmiupgDi+UAxmBUIEAkEXno5K/gjb+uweP7EPhU2WXfWPHXHsUk90Uy\nUuZqINGQ6QKBgQDlLLTT82+tyMmtPleWSN/LUn5t0GSHtqVrbAGWBhGI3LnLOCcf\nK4ToKIq0q7fnC0tjHNopvHff+UDCp6G/sv0Wow7O+RgLf8iMxtJ7+W6zAwE/WZXy\nuXLLuJstViFhPsgGuYA9lUSzDDIVHrP8xesCdDnBrsU90BnmW8DfktPYFQKBgQCS\nBxv8+Z2+IwFY8h54KUbOtQQK3gZQm6irkKOczbPYrJMgn3AM3ysf/eMUQ3QS0TiX\nA7ZR4CzSMQLYPTBcpk3OI3ZjMHbmdgbv5l9+HCHH7htaKYtPSdkv3whxYaTB60Xc\nDMnlVHVGRqohY3pzyZH12az3ZI/EbogwVf+AUYHhKQKBgQDo/WGgnulHEjb+Fpml\nRLBxX0xQNzRSbhqROt8epo0L8LK0f+pUED5f3QZcCWqdiYpJhpFxsdBuNKAY6DXX\nEtDBXyRS/I3aIytJcoXCeLThUgBmju1c4RpQMquItDx//zToKUyIp9ULL4nmazDL\nxlTMXyrPGU/BlarMzDqbRVEgyg==\n-----END PRIVATE KEY-----\n",
    client_email: "firebase-adminsdk-fbsvc@espace-gaming-codm.iam.gserviceaccount.com",
    client_id: "104766894519375923780",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40espace-gaming-codm.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
};

// Initialiser Firebase Admin
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "espace-gaming-codm"
    });
}

async function createAdmin() {
    try {
        // Identifiants de l'admin par défaut
        const adminEmail = 'admin@espace-gaming-codm.com';
        const adminPassword = 'AdminCODM2025!';

        console.log('Création du compte administrateur...');

        // Créer l'utilisateur Firebase Auth
        const userRecord = await admin.auth().createUser({
            email: adminEmail,
            password: adminPassword,
            displayName: 'Administrateur Espace Gaming CODM'
        });

        console.log(`✅ Utilisateur créé avec l'UID: ${userRecord.uid}`);

        // Ajouter l'utilisateur à la collection admins dans Firestore
        await admin.firestore().collection('admins').doc(userRecord.uid).set({
            email: adminEmail,
            displayName: 'Administrateur Espace Gaming CODM',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            role: 'super_admin',
            permissions: {
                manageTeams: true,
                validatePlayers: true,
                exportData: true,
                manageSettings: true
            }
        });

        console.log('✅ Utilisateur ajouté à la collection admins');

        console.log('\n🎉 Compte administrateur créé avec succès !');
        console.log('\n📧 Identifiants de connexion :');
        console.log(`Email: ${adminEmail}`);
        console.log(`Mot de passe: ${adminPassword}`);
        console.log('\n🔗 URL de connexion: http://localhost:3000/admin/login');
        console.log('\n⚠️  Changez le mot de passe après la première connexion !');

    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            console.log('❌ Un utilisateur avec cet email existe déjà');
            console.log('\n📧 Identifiants existants :');
            console.log('Email: admin@espace-gaming-codm.com');
            console.log('Mot de passe: AdminCODM2025!');
        } else {
            console.error('❌ Erreur lors de la création de l\'admin:', error);
        }
    }

    process.exit(0);
}

createAdmin();
