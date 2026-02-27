# GestionRH - Gestion des Conges

Application web de gestion des conges et des ressources humaines. Elle permet aux employes de soumettre des demandes de conge et aux responsables RH de les traiter, avec un tableau de bord complet pour le suivi.

## Fonctionnalites

### Authentification et securite
- Connexion par email et mot de passe avec token JWT
- Middleware de protection des routes selon le role (employe, RH)
- Fonction mot de passe oublie avec envoi d'email
- Sessions utilisateur avec expiration

### Espace Employe
- Tableau de bord personnel avec statistiques (demandes en attente, approuvees, rejetees)
- Soumission de demandes de conge avec choix du type, dates et motif
- Historique des demandes avec statut en temps reel
- Profil personnel consultable

### Espace RH / Administration
- Tableau de bord global avec graphiques (repartition par type de conge, evolution mensuelle)
- Gestion des demandes de conge (approbation, rejet avec motif)
- Gestion des employes (ajout, modification, liste complete)
- Gestion des departements
- Gestion des postes (lies aux departements)
- Gestion des types de conge (jours max par an/mois, restriction par genre, certificat medical)
- Gestion des roles et permissions
- Export des donnees en PDF, Excel et CSV
- Systeme de notifications

### Interface
- Design responsive et moderne
- Composants reutilisables (boutons, inputs, modals, badges, cartes)
- Animations fluides
- Pages de chargement et gestion des erreurs

## Stack technique

- **Framework** : Next.js 15 (App Router, TypeScript)
- **Base de donnees** : MySQL avec Prisma ORM
- **Styles** : Tailwind CSS 4
- **Authentification** : JWT (jsonwebtoken) + bcryptjs
- **Formulaires** : React Hook Form + Zod
- **Graphiques** : Recharts
- **Export** : jsPDF, xlsx
- **Icones** : Lucide React
- **Dates** : date-fns
- **Email** : Nodemailer

## Pre-requis

- Node.js 18 ou superieur
- MySQL (Laragon, XAMPP ou autre)
- npm

## Installation

1. Cloner le projet :

```bash
git clone https://github.com/MohammedBelmekki01/CRM-gestion-de-cong-es-RH.git
cd CRM-gestion-de-cong-es-RH
```

2. Installer les dependances :

```bash
npm install
```

3. Configurer les variables d'environnement en creant un fichier `.env` a la racine :

```
DATABASE_URL="mysql://root:@localhost:3306/crm_conges_rh"
JWT_SECRET="votre_secret_jwt"
NEXTAUTH_SECRET="votre_secret_nextauth"
```

Adapter le port MySQL et les identifiants selon votre configuration.

4. Creer la base de donnees et appliquer le schema :

```bash
npx prisma db push
```

5. Remplir la base avec les donnees de test :

```bash
npm run db:seed
```

6. Lancer le serveur de developpement :

```bash
npm run dev
```

## Comptes de test

| Email | Mot de passe | Role |
|-------|-------------|------|
| admin@entreprise.com | admin123 | RH |
| jean.dupont@entreprise.com | admin123 | Employe |
| marie.martin@entreprise.com | admin123 | Employe |

## Structure du projet

```
prisma/              Schema et seed de la base de donnees
src/
  app/
    page.tsx         Page de connexion
    admin/           Pages d'administration (employes, departements, postes, types de conge)
    dashboard/       Tableaux de bord (employe, RH, export)
    api/             Routes API REST (auth, employes, conges, departements, etc.)
  components/
    forms/           Formulaires (connexion, employe)
    layout/          Composants de mise en page (sidebar, header)
    ui/              Composants d'interface reutilisables
  lib/               Utilitaires (auth, prisma, validations, erreurs, email)
```

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lancer le serveur de developpement |
| `npm run build` | Construire l'application pour la production |
| `npm run start` | Lancer le serveur de production |
| `npm run lint` | Verifier le code avec ESLint |
| `npm run db:seed` | Remplir la base de donnees avec les donnees de test |
