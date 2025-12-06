# 🏢 CRM Projet RH - Version 2.0

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.11-2D3748?style=for-the-badge&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)

**Système complet de gestion des congés et absences pour les Ressources Humaines**

[Fonctionnalités](#-fonctionnalités) •
[Installation](#-installation) •
[Utilisation](#-utilisation) •
[Technologies](#-technologies)

</div>

---

## 📋 Description

CRM Projet RH est une application web moderne de gestion des ressources humaines, spécialisée dans la gestion des congés et absences. Développée avec les dernières technologies (Next.js 15, React 19, Prisma), elle offre une interface intuitive et responsive pour les employés et les équipes RH.

---

## ✨ Fonctionnalités

### 🔐 Authentification & Sécurité
- ✅ Authentification JWT sécurisée
- ✅ Gestion des rôles (Admin, RH, Manager, Employé)
- ✅ Récupération de mot de passe
- ✅ Sessions sécurisées

### 👥 Gestion des Employés
- ✅ CRUD complet des employés
- ✅ Profils détaillés avec photo
- ✅ Historique des congés
- ✅ Attribution des départements et postes

### 📅 Gestion des Congés
- ✅ Demandes de congés en ligne
- ✅ Support des **demi-journées** (matin/après-midi)
- ✅ Workflow d'approbation multi-niveaux
- ✅ Types de congés configurables :
  - 🏖️ Congés annuels (18 jours)
  - 🏥 Congés maladie (certificat médical requis)
  - 👶 Congé maternité (120 jours)
  - 👨‍👧 Congé paternité (3 jours)
  - 🎉 Événements familiaux
  - ⏰ Récupération

### 📊 Tableaux de Bord
- ✅ **Dashboard RH** : Vue d'ensemble des demandes, statistiques
- ✅ **Dashboard Employé** : Soldes, historique personnel
- ✅ **Calendrier interactif** : Visualisation des absences
- ✅ **Graphiques** : Statistiques et tendances (Recharts)

### 🛠️ Administration
- ✅ Gestion des départements
- ✅ Gestion des postes
- ✅ Configuration des types de congés
- ✅ Gestion des jours fériés
- ✅ Journal d'audit complet
- ✅ Rapports et exports (Excel, PDF)

### 🎨 Interface Utilisateur
- ✅ **Mode sombre/clair** avec persistance
- ✅ Design moderne avec shadcn/ui
- ✅ Interface 100% responsive
- ✅ Notifications en temps réel
- ✅ Animations fluides

---

## 🚀 Installation

### Prérequis

- **Node.js** 18.0 ou supérieur
- **npm** ou **yarn**

### Étapes d'installation

```bash
# 1. Cloner le repository
git clone https://github.com/MohammedBelmekki01/CRM-gestion-de-cong-es-RH.git

# 2. Accéder au dossier
cd CRM-gestion-de-cong-es-RH

# 3. Installer les dépendances
npm install

# 4. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos propres valeurs

# 5. Initialiser la base de données
npx prisma db push
npm run db:seed

# 6. Lancer l'application
npm run dev
```

L'application sera accessible sur **http://localhost:3000**

---

## 🔑 Comptes de Démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| 👔 RH/Admin | `admin@entreprise.com` | `admin123` |
| 👨‍💼 Employé | `jean.dupont@entreprise.com` | `admin123` |
| 👩‍💼 Employée | `marie.martin@entreprise.com` | `admin123` |

> ⚠️ **Note** : Ces credentials sont configurables via le fichier `.env`. Consultez `.env.example` pour plus de détails.

---

## 📁 Structure du Projet

```
CRM-gestion-de-cong-es-RH/
├── 📂 prisma/
│   ├── schema.prisma          # Schéma de base de données
│   └── seed.ts                # Données initiales
├── 📂 public/
│   └── uploads/               # Fichiers uploadés
├── 📂 src/
│   ├── 📂 app/
│   │   ├── 📂 admin/          # Pages administration
│   │   │   ├── audit-logs/
│   │   │   ├── departments/
│   │   │   ├── employees/
│   │   │   ├── exports/
│   │   │   ├── leave-requests/
│   │   │   ├── leave-types/
│   │   │   ├── positions/
│   │   │   ├── public-holidays/
│   │   │   └── reports/
│   │   ├── 📂 api/            # API Routes
│   │   │   ├── auth/
│   │   │   ├── departments/
│   │   │   ├── employees/
│   │   │   ├── leave-requests/
│   │   │   └── ...
│   │   ├── 📂 dashboard/      # Tableaux de bord
│   │   │   ├── calendar/
│   │   │   ├── employee/
│   │   │   ├── hr/
│   │   │   ├── notifications/
│   │   │   └── settings/
│   │   └── forgot-password/
│   ├── 📂 components/
│   │   ├── auth/
│   │   ├── forms/
│   │   ├── layout/
│   │   ├── providers/
│   │   └── ui/                # Composants shadcn/ui
│   ├── 📂 contexts/
│   │   └── AuthContext.tsx
│   ├── 📂 hooks/
│   └── 📂 lib/
│       ├── auth.ts
│       ├── email.ts
│       ├── prisma.ts
│       └── utils.ts
├── .env.example
├── package.json
└── README.md
```

---

## 🛠️ Technologies

### Frontend
| Technologie | Version | Description |
|-------------|---------|-------------|
| Next.js | 15.5.7 | Framework React avec App Router |
| React | 19.0.0 | Bibliothèque UI |
| TypeScript | 5.x | Typage statique |
| Tailwind CSS | 3.4.x | Framework CSS |
| shadcn/ui | latest | Composants UI |
| next-themes | 0.4.x | Gestion du thème |
| Recharts | 2.x | Graphiques |

### Backend
| Technologie | Version | Description |
|-------------|---------|-------------|
| Prisma | 6.11.1 | ORM |
| SQLite | - | Base de données |
| bcryptjs | 3.x | Hashage des mots de passe |
| jose | 6.x | JWT |

---

## 📊 Modèle de Données

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Employee   │────▶│ Department  │     │    Role     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       │            │  Position   │
       │            └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│LeaveRequest │────▶│  LeaveType  │
└─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│LeaveBalance │     │PublicHoliday│
└─────────────┘     └─────────────┘
```

---

## 🔒 Sécurité

- ✅ Mots de passe hashés avec bcrypt (10 rounds)
- ✅ Tokens JWT avec expiration
- ✅ Variables sensibles dans `.env` (non versionné)
- ✅ Validation des entrées utilisateur
- ✅ Protection CSRF
- ✅ Middleware d'authentification

---

## 📝 Scripts Disponibles

```bash
# Développement
npm run dev          # Lancer en mode dev avec Turbopack

# Base de données
npm run db:push      # Appliquer le schéma
npm run db:seed      # Peupler avec des données de test
npm run db:studio    # Ouvrir Prisma Studio

# Production
npm run build        # Build de production
npm run start        # Démarrer en production

# Qualité de code
npm run lint         # Linter ESLint
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👨‍💻 Auteur

**Mohammed Belmekki**

- GitHub: [@MohammedBelmekki01](https://github.com/MohammedBelmekki01)

---

<div align="center">

**⭐ Si ce projet vous a été utile, n'hésitez pas à lui donner une étoile !**

Made with ❤️ using Next.js & TypeScript

</div>
