# WorkSphere - Gestion Interactive du Personnel

 **Présentation**  
WorkSphere est une application web innovante dédiée à la gestion interactive du personnel dans les espaces de travail.  
L'objectif est de faciliter l'organisation et la répartition des employés sur un plan d'étage en temps réel, tout en respectant les contraintes liées aux rôles et zones autorisées.

---

##  Objectifs
- Permettre l'ajout, la modification et la suppression d'employés via une interface graphique
- Assurer le respect des règles métier (ex : seuls les techniciens IT peuvent occuper la salle des serveurs)
- Offrir une expérience utilisateur fluide, intuitive et responsive sur desktop, tablette et mobile
- Centraliser la gestion des données du personnel et la visualisation spatiale sur une même plateforme

---

##  Fonctionnalités

###  Gestion des Employés
- Sidebar **Unassigned Staff** pour gérer les employés non assignés
- Modale d'ajout d'employé avec champs complets :
  - Nom complet
  - Rôle professionnel
  - Photo de profil (URL)
  - Email
  - Téléphone
  - Expériences professionnelles (multiples)
- Prévisualisation instantanée de la photo
- Validation du formulaire :
  - Regex pour email et téléphone
  - Vérification date début < date fin pour les expériences
  - Validation des champs obligatoires

###  Plan d'Étage Interactif
6 Zones de Travail :  
- Salle de conférence (Capacité : 6)  
- Réception (Capacité : 10)  
- Salle des serveurs (Capacité : 3)  
- Salle de sécurité (Capacité : 3)  
- Salle du personnel (Capacité : 3)  
- Salle d'archives (Capacité : 2)  

####  Restrictions par Rôle
- **Manager** : Accès à toutes les zones  
- **Réceptionnistes** : Réception, Conférence, Personnel, Archives  
- **Techniciens IT** : Serveurs, Conférence, Personnel, Archives  
- **Agents de sécurité** : Sécurité, Conférence, Personnel, Archives  
- **Nettoyage** : Conférence, Réception, Personnel, Serveurs, Sécurité  
- **Autres rôles** : Conférence, Réception, Personnel  

###  Interface Utilisateur
- Bouton "+" dans chaque zone pour ajouter un employé selon les règles
- Bouton "×" pour retirer un employé d'une zone et le renvoyer à **Unassigned Staff**
- Zones vides affichées avec indicateur visuel (couleur d'arrière-plan)
- Limitation stricte du nombre d'employés par zone
- Profil détaillé en popup pour chaque employé
- Recherche en temps réel par nom
- Filtre par rôle pour affichage ciblé

###  Persistance des Données
- Sauvegarde automatique de l'état du plan dans le `localStorage`
- Rechargement automatique des employés assignés au démarrage
- Aucune perte de données lors de la fermeture du navigateur

###  Responsive Design
- **Mobile** : Layout en colonne unique, optimisé pour petits écrans
- **Tablette** : Grille 2 colonnes adaptative
- **Desktop** : Grille multi-colonnes complète
- Adaptabilité totale : Tous les éléments s'ajustent automatiquement

###  Technologies Utilisées
- HTML5 - Structure sémantique
- Tailwind CSS - Framework CSS utility-first
- CSS3 - Styles avancés
- JavaScript - Logique applicative pure

###  Démo en Ligne
Le projet est hébergé sur GitHub Pages : [https://oumai2001.github.io/WorkSphere---Virtual-Workspace/](#)

---

##  Guide d'Utilisation

### Ajouter un Employé
1. Cliquer sur le bouton vert "+ Add New Worker"
2. Remplir tous les champs du formulaire
3. Ajouter une ou plusieurs expériences professionnelles
4. Cliquer sur **Submit** pour enregistrer

### Assigner un Employé à une Zone
1. Cliquer sur le bouton bleu "+" dans la zone souhaitée
2. Sélectionner un employé dans la liste (seuls les rôles autorisés apparaissent)
3. L'employé apparaît immédiatement dans la zone et est retiré de **Unassigned Staff**

### Retirer un Employé d'une Zone
- Cliquer sur le bouton rouge "×" sur la carte de l'employé  
- L'employé retourne automatiquement dans **Unassigned Staff**

### Consulter un Profil
- Cliquer sur n'importe quelle carte d'employé  
- Une popup s'ouvre avec toutes les informations détaillées  
- Possibilité de supprimer l'employé depuis cette vue

### Rechercher et Filtrer
- **Barre de recherche** : taper un nom pour filtrer en temps réel  
- **Menu déroulant** : sélectionner un rôle pour afficher uniquement ces employés
