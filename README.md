# Tournoi Call of Duty Mobile - Espace Gaming CODM

Une application web complète pour gérer les tournois Call of Duty Mobile Battle Royale Squad organisés par la communauté Espace Gaming CODM.

## 🎮 Fonctionnalités

### Pour les joueurs
- **Inscription d'équipe** : Création d'équipe avec capitaine et code unique
- **Rejoindre une équipe** : Utilisation du code d'équipe pour rejoindre
- **Upload de vidéo** : Device check obligatoire via Cloudinary
- **Suivi en temps réel** : Statut de validation de l'équipe et des joueurs
- **Notifications push** : Mises à jour via Firebase Cloud Messaging

### Pour les administrateurs
- **Interface d'administration sécurisée** : Gestion complète du tournoi
- **Validation manuelle** : Contrôle des joueurs et vidéos
- **Tableau de bord** : Statistiques en temps réel
- **Export de données** : CSV et JSON pour analyse
- **Gestion des paramètres** : Ouverture/fermeture des inscriptions

## 🛠 Technologies utilisées

- **Framework** : Next.js 14+ avec App Router
- **Language** : TypeScript
- **Styling** : Tailwind CSS
- **Base de données** : Firebase Firestore
- **Authentification** : Firebase Auth
- **Stockage** : Cloudinary (vidéos)
- **Notifications** : Firebase Cloud Messaging (FCM)
- **Validation** : React Hook Form + Zod
- **Icons** : Lucide React
- **Notifications UI** : React Hot Toast

## 📁 Structure du projet

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Interface d'administration
│   ├── api/               # API Routes
│   ├── inscription/       # Inscription d'équipe
│   ├── rejoindre/         # Rejoindre une équipe
│   ├── suivi/             # Suivi public
│   └── regles/            # Règles du tournoi
├── components/            # Composants réutilisables
├── hooks/                 # Hooks personnalisés
├── lib/                   # Configurations et utilitaires
└── types/                 # Définitions TypeScript
```

## ⚙️ Installation et configuration

### 1. Cloner le projet
```bash
git clone <repository-url>
cd tournoi
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration des variables d'environnement

Créer un fichier `.env.local` basé sur `.env.local.example`:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Firebase Admin (pour les API routes)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY=your_service_account_private_key

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Tournament Settings
NEXT_PUBLIC_MAX_TEAMS=50
NEXT_PUBLIC_TOURNAMENT_NAME="Tournoi Battle Royale CODM"
```

## 🚀 Démarrage rapide

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

## 🎨 Design et UX

L'application utilise une approche de design moderne avec :

- **Police Poppins** pour une typographie élégante et lisible
- **Gradient backgrounds** pour un effet visuel attrayant
- **Glass morphism** avec des effets de flou d'arrière-plan
- **Animations fluides** et transitions CSS
- **Responsive design** optimisé pour tous les appareils
- **Dark theme** gaming-oriented
- **Composants interactifs** avec effets hover

### Palette de couleurs
- **Primaire** : Dégradé bleu → violet → rose
- **Secondaire** : Gris foncé avec transparence
- **Accent** : Jaune pour les récompenses
- **Background** : Dégradé dark multi-couleurs

## ⚙️ Configuration détaillée

### Variables d'environnement complètes

Créer un fichier `.env.local` basé sur `.env.local.example`:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Firebase Admin (pour les API routes)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY=your_service_account_private_key

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Tournament Settings
NEXT_PUBLIC_MAX_TEAMS=50
NEXT_PUBLIC_TOURNAMENT_NAME="Tournoi Battle Royale CODM"
```

### Configuration Firebase complète

1. **Créer un projet Firebase**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

2. **Activer les services**
   - Firestore Database
   - Authentication (Email/Password)
   - Cloud Messaging
   - Cloud Functions (optionnel)

3. **Règles de sécurité Firestore**
   ```javascript
   // Voir firestore.rules pour les règles complètes
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Règles sécurisées pour teams, admins, settings
     }
   }
   ```

4. **Configuration des administrateurs**
   ```javascript
   // Ajouter dans Firestore > admins collection
   {
     "adminUID": {
       "email": "admin@example.com",
       "role": "super_admin",
       "createdAt": new Date()
     }
   }
   ```

### Configuration Cloudinary

1. **Créer un compte Cloudinary**
2. **Configurer un preset d'upload**
   - Aller dans Settings > Upload
   - Créer un nouveau Upload Preset
   - Configurer pour les vidéos (mp4, mov, avi)
   - Taille max: 50MB
   - Qualité: Auto

3. **Configuration CORS**
   ```javascript
   // Ajouter votre domaine dans Cloudinary Settings
   ```

## 📱 Fonctionnalités détaillées

### Interface utilisateur

1. **Page d'accueil**
   - Hero section avec dégradés
   - Compteur en temps réel
   - Informations du tournoi
   - Call-to-action animés

2. **Inscription d'équipe**
   - Formulaire multi-étapes
   - Upload vidéo intégré
   - Validation en temps réel
   - Génération de code unique

3. **Suivi des équipes**
   - Recherche par code
   - Statut en temps réel
   - Interface publique

### Interface admin

1. **Dashboard**
   - Statistiques temps réel
   - Graphiques de progression
   - Actions rapides

2. **Gestion des joueurs**
   - Validation manuelle
   - Visualisation des vidéos
   - Système de notification

3. **Export de données**
   - Format CSV pour Excel
   - Format JSON pour API
   - Filtres personnalisés

## 🔧 Développement

### Structure des composants

```
src/components/
├── AdminGuard.tsx          # Protection routes admin
├── Footer.tsx              # Pied de page
├── Navbar.tsx              # Navigation principale
├── NotificationPermission.tsx  # Gestion notifications
└── VideoUpload.tsx         # Upload Cloudinary
```

### Hooks personnalisés

```
src/hooks/
├── useAuth.ts              # Authentification Firebase
├── useCloudinaryUpload.ts  # Upload Cloudinary
└── useNotifications.ts     # Notifications FCM
```

### API Routes

```
src/app/api/
├── admin/
│   ├── export/route.ts     # Export données
│   └── settings/route.ts   # Paramètres tournoi
├── cloudinary/
│   └── signature/route.ts  # Signature upload
└── teams/
    ├── join/route.ts       # Rejoindre équipe
    ├── register/route.ts   # Inscription équipe
    └── search/route.ts     # Recherche équipe
```

## 🚀 Déploiement production

### Vercel (recommandé)

1. **Connecter le repository**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Configurer les variables d'environnement**
   - Aller dans Project Settings
   - Ajouter toutes les variables `.env.local`

3. **Déployer**
   ```bash
   vercel --prod
   ```

### Configuration domaine custom

1. **Ajouter le domaine dans Vercel**
2. **Mettre à jour Firebase Auth domains**
3. **Configurer Cloudinary CORS**

## 🔍 Monitoring et Analytics

### Logs Firebase

```bash
# Consulter les logs
firebase functions:log

# Monitoring en temps réel
firebase functions:log --only myFunction
```

### Analytics personnalisés

L'application inclut des événements de tracking pour :
- Inscriptions d'équipes
- Uploads de vidéos
- Validations admin
- Erreurs utilisateur

## 🆘 Dépannage

### Problèmes courants

1. **Erreur Firebase**
   ```
   Solution: Vérifier les credentials et règles
   ```

2. **Upload Cloudinary échoue**
   ```
   Solution: Vérifier le preset et CORS
   ```

3. **Notifications ne fonctionnent pas**
   ```
   Solution: Vérifier VAPID key et service worker
   ```
