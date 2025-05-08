/*
(Partie 1/2 : Liste des Pages et Détails)

Récapitulatif Détaillé des Pages du Dashboard Owner (Phase S0 et Extensions Planifiées)

Voici une liste des pages prévues ou existantes pour le dashboard, avec leurs fonctionnalités clés et leur statut (S0 = Essentiel pour Beta, S1/S2+ = Phases suivantes).

/ (ou /dashboard) - Accueil / Tableau de Bord Principal

Statut : S0 (Refactoring UI/API en cours)

Objectif : Vue d'ensemble rapide de l'activité de la boutique sélectionnée.

Contenu :

KPIs principaux (Revenu, Commandes, Visites, Taux Conv.) pour période sélectionnée (HomeStat -> Utilise useGetKpis).

Raccourcis rapides (HomeManage -> Liens vers Produits, Catégories, Stores/Settings).

Liste des dernières commandes (CommandeList -> Utilise useGetAllOrders).

(S1+) Graphique d'évolution simple (ventes ou visites).

(S1+) Notifications récentes importantes.

Composants Clés : HomeStat, HomeManage, CommandeList.

/login - Connexion

Statut : S0 (Refactoring UI/API fait)

Objectif : Authentification des Owners et Collaborateurs.

Contenu : Formulaire Email/Mot de passe, Boutons Connexion Sociale (Google...), Liens vers Inscription/Mot de passe oublié.

API : useLogin, Redirection vers /auth/google/redirect (s_server).

Composants Clés : LoginPage, Formulaires, Boutons.

/register - Inscription

Statut : S0 (Refactoring UI/API fait)

Objectif : Permettre la création d'un compte Sublymus (Owner/Client initial).

Contenu : Formulaire Nom, Email, Mot de passe, Confirmation.

API : useRegister.

Redirection vers : /auth-notice?type=verify.

Composants Clés : RegisterPage, Formulaires.

/auth-notice - Notice Post-Action Auth

Statut : S0 (Créé)

Objectif : Page générique affichant des messages après inscription, demande de reset mdp, etc.

Contenu : Message dynamique basé sur paramètre URL ?type=.... Liens vers Login ou Resend.

API : Aucune.

Composants Clés : AuthNoticePage.

/verify-email (Frontend) ou géré par /api/auth/verify-email (Backend)

Statut : S0 (Logique API existe, page Frontend simple à faire si besoin).

Objectif : Page où l'utilisateur atterrit après clic sur lien de vérification.

Contenu : Affiche message succès/erreur (token invalide/expiré). Lien vers Login.

API : L'API backend gère la validation du token. Le frontend affiche juste le résultat.

/forgot-password - Demande Réinitialisation MDP

Statut : S0 (Refactoring UI/API fait)

Objectif : Permettre à l'utilisateur de demander un lien de reset.

Contenu : Formulaire Email.

API : useRequestPasswordReset.

Redirection vers : /auth-notice?type=reset.

Composants Clés : ForgotPasswordPage.

/reset-password - Réinitialisation MDP

Statut : S0 (Refactoring UI/API fait)

Objectif : Permettre à l'utilisateur de définir un nouveau mot de passe via token.

Contenu : Formulaire Nouveau mot de passe + Confirmation. Lit le token depuis l'URL.

API : useResetPassword.

Affichage : Succès ou Erreur (token invalide/expiré). Lien vers Login.

Composants Clés : ResetPasswordPage.

/setup-account - Configuration Compte Collaborateur Invité

Statut : S0 (Refactoring UI/API fait)

Objectif : Permettre à un nouveau collaborateur invité de définir son mot de passe.

Contenu : Formulaire Nouveau mot de passe + Confirmation. Lit le token depuis l'URL.

API : useSetupAccount.

Affichage : Succès ou Erreur. Lien vers Login.

Composants Clés : SetupAccountPage.

/profile (ou /settings/profile) - Profil Utilisateur

Statut : S0 (Refactoring UI/API fait)

Objectif : Gestion du compte de l'utilisateur connecté (Owner ou Collaborateur).

Contenu : Sections Profil (Avatar, Nom, Email), Sécurité (MDP, Logout All, Delete Account), Adresses/Téléphones (liens), Préférences (Langue).

API : useGetMe, useUpdateUser (adapté pour JSON/FormData), useLogoutAllDevices, useDeleteAccount.

Composants Clés : ProfilePage, Formulaires spécifiques, ConfirmDelete.

/settings/addresses & /settings/phones - Gestion Adresses/Téléphones

Statut : S1+ (Pages dédiées à créer)

Objectif : CRUD complet pour les adresses et téléphones de l'utilisateur.

Contenu : Liste des adresses/téléphones, formulaires d'ajout/modification, bouton suppression.

API : Hooks CRUD pour UserAddress et UserPhone (certains existent déjà dans ReactSublymusApi).

Composants Clés : AddressListPage, PhoneListPage, AddressForm, PhoneForm.

/products - Liste des Produits

Statut : S0 (Refactoring UI/API en cours/fait)

Objectif : Afficher et gérer le catalogue produits du store sélectionné.

Contenu : Aperçu CategoriesList, ProductList avec Toolbar (Recherche, Filtres Prix/Visibilité/Tri, Toggle Vue Card/Row), liste paginée des produits (ProductItemCard/ProductRowItem), bouton/carte "Ajouter".

API : useGetProducts, useGetCategories (pour la Map).

Composants Clés : ProductsPage, CategoriesList, ProductList, ProductsFilters, ProductItemCard, ProductRowItem, AddProductCard/Row, Pagination.

/products/new - Création Produit

Statut : S0 (Logique partagée avec page détail, à finaliser)

Objectif : Formulaire complet pour créer un nouveau produit.

Contenu : Formulaire identique à la page détail mais en mode création (pas de sections Settings/Commandes).

API : useCreateProduct.

Composants Clés : ProductDetailPage (ou composant dédié), SwiperProducts, MarkdownEditor2, CategoryItemMini, Feature, SaveButton.

/products/[id] (ou /products/edit/[id]) - Détail/Édition Produit

Statut : S0 (Refactoring UI/API en cours/fait, logique sauvegarde à finaliser)

Objectif : Voir et modifier tous les aspects d'un produit existant.

Contenu : Formulaire complet (Infos base, Images, Catégories, Variantes/Features/Values, Détails), sections supplémentaires (Settings/Swiper, Commandes liées).

API : useGetProducts (pour charger), useUpdateProduct, useMultipleUpdateFeaturesValues, useDeleteProduct. Hooks pour Détails, Commandes.

Composants Clés : ProductDetailPage, SwiperProducts, MarkdownEditor2, CategoryItemMini, Feature/Value/FeatureInfo/ValueInfo, DetailItem, ProductSettings, CommandeList, SaveButton.

/products/[id]/details - Gestion des Détails Add.

Statut : S0 (Refactoring UI/API fait)

Objectif : Gérer spécifiquement les blocs de détails d'un produit.

Contenu : ProductPreview, bouton "Ajouter", liste ordonnée/draggable(?) des DetailItem avec actions (Edit/Delete/Up/Down).

API : useGetDetails, useCreateDetail, useUpdateDetail, useDeleteDetail.

Composants Clés : ProductDetailsPage, DetailItem, DetailInfo (popup).

/products/[id]/comments - Commentaires d'un Produit

Statut : S0 (Refactoring UI/API fait)

Objectif : Modérer les commentaires laissés sur un produit spécifique.

Contenu : ProductPreview, liste CommentsDashboard (avec infos client), action "Supprimer".

API : useGetComments, useDeleteComment.

Composants Clés : ProductCommentsPage, CommentsDashboard, ViewMore (popup images).

/categories - Liste des Catégories

Statut : S0 (Page définie, composants créés/refactorisés)

Objectif : Gérer l'organisation du catalogue.

Contenu : CategoriesToolbar (Recherche, Filtres Tri/Visibilité, Toggle Vue, Bouton Ajouter), Liste paginée (CategoryItemCard/CategoryItemRow).

API : useGetCategories.

Composants Clés : CategoriesPage, CategoriesToolbar, CategoryItemCard, CategoryItemRow, Pagination, Skeletons.

/category?id=new - Création Catégorie

Statut : S0 (Logique partagée avec page détail, à finaliser)

Objectif : Formulaire pour créer une catégorie.

Contenu : Formulaire (Nom, Description, Parent, Images View/Icon), SaveButton.

API : useCreateCategory.

Composants Clés : CategoryDetailPage (ou dédié), MarkdownEditor2, CategoriesPopup, SaveButton.

/category?id=[id] (ou /categories/[id]) - Détail/Édition Catégorie

Statut : S0 (Refactoring UI/API fait)

Objectif : Modifier une catégorie existante.

Contenu : Formulaire identique à la création, section "Danger Zone" (Supprimer).

API : useGetCategoryById, useUpdateCategory, useDeleteCategory.

Composants Clés : CategoryDetailPage, MarkdownEditor2, CategoriesPopup, SaveButton.

/commands - Liste des Commandes

Statut : S0 (Composant CommandeList existe, page dédiée à créer/intégrer)

Objectif : Suivre et gérer toutes les commandes du store sélectionné.

Contenu : CommandeList complet avec tous les filtres (Statut, Date, Prix, Recherche) et pagination.

API : useGetAllOrders.

Composants Clés : CommandsPage, CommandeList, CommandsFilters, Pagination.

/commands/[id] - Détail Commande

Statut : S0 (Refactoring UI/API fait)

Objectif : Voir les détails complets d'une commande et changer son statut.

Contenu : CommandTop, CommandUser, CommandProduct (liste), CommandStatusHistory, StatusUpdatePopup.

API : useGetOrderDetails, useUpdateOrderStatus.

Composants Clés : CommandDetailPage, et ses sous-composants.

/users - Hub Utilisateurs

Statut : S0 (Refactoring UI/API fait)

Objectif : Point d'entrée pour gérer clients et collaborateurs.

Contenu : CurrentUserCard, Cartes liens vers /users/clients et /users/collaborators.

API : useGetMe.

Composants Clés : UsersHubPage, CurrentUserCard, ClientsLinkCard, CollaboratorsLinkCard.

/users/clients - Liste des Clients

Statut : S0 (Composant ClientList existe, page dédiée à créer/intégrer)

Objectif : Voir la liste des clients du store.

Contenu : ClientList avec filtres (Statut Client, Date inscription, Recherche) et pagination.

API : useGetUsers (avec role=client).

Composants Clés : ClientsListPage, ClientList, ClientsFilters, Pagination.

/users/clients/[id] - Détail Client

Statut : S1+ (Page à créer)

Objectif : Voir les détails d'un client, son historique de commandes, ses commentaires, ses adresses/téléphones. Permettre actions (Bannir?).

Contenu : UserPreview, section commandes (CommandeList filtrée), section commentaires (CommentsDashboard filtré), section adresses/téléphones, section actions admin.

API : useGetUsers (avec ID), useGetAllOrders (filtré), useGetComments (filtré), useBanUser (API à créer).

/users/collaborators - Liste des Collaborateurs

Statut : S0 (Page définie, composants créés)

Objectif : Gérer l'équipe par l'Owner.

Contenu : Liste des collaborateurs (CollaboratorItemRow), bouton "Ajouter", pagination.

API : useGetCollaborators.

Composants Clés : CollaboratorsPage, CollaboratorItemRow, AddCollaboratorPopup, PermissionsPopup, Pagination.

/stores - Gestion des Boutiques

Statut : S0 (Refactoring UI/API en cours/fait)

Objectif : Permettre à l'Owner de voir, sélectionner, et gérer les paramètres/thème de ses différentes boutiques.

Contenu : StoreToolbar, StoresList (Swiper), SelectedStoreDetails (Accordéon/Onglets: Infos, Stats, Limites, Actions Serveur), ThemeManager. Bouton "Créer".

API : useGetStores, useGetStoreById, useGetStats, useGetThemeById, useGetAvailableThemes, mutations Store (start/stop/delete...).

Composants Clés : StoresPage, StoreToolbar, StoresList, StoreItemCard, SelectedStoreDetails, ThemeManager, ThemeCard.

/stores/new - Création Boutique

Statut : S1+ (Page à créer)

Objectif : Formulaire pour créer une nouvelle boutique.

Contenu : Champs Nom, Titre, Description, Sélection Plan (?), Upload Logo/Cover.

API : useCheckStoreNameAvailability, useCreateStore (vers s_server).

/stores/[storeId]/edit - Édition Boutique

Statut : S1+ (Page à créer, similaire à Settings mais focus sur infos modifiables)

Objectif : Modifier les informations de base d'une boutique.

Contenu : Formulaire avec Nom, Titre, Description, Logo, Cover.

API : useUpdateStore (vers s_server).

/stores/[storeId]/settings - Paramètres Boutique

Statut : S0 (Structure définie, sections créées/refactorisées)

Objectif : Configuration détaillée de la boutique sélectionnée.

Contenu : Layout 2 colonnes avec SettingsSidebar et sections dynamiques (Général, Apparence, Forfait, Domaines, Légal, Régional, Danger).

API : useGetStoreById, useUpdateStore, useUpdateStoreSetting (à créer), mutations domaines, delete store.

Composants Clés : SettingsPage, SettingsSidebar, et tous les *SettingsSection.

/stores/[storeId]/inventory (ou /inventory) - Gestion Inventaire

Statut : S0 (Composants créés, page dédiée à créer/intégrer)

Objectif : Gérer les points de vente/stock physiques associés au store.

Contenu : Titre, Bouton "Ajouter", Liste des inventaires (InventoryItemRow), InventoryFormPopup.

API : Hooks CRUD pour Inventaire (useGetInventories, useCreateInventory, etc.).

/themes/market - Marché des Thèmes

Statut : S1+ (Planifié)

Objectif : Découvrir et installer de nouveaux thèmes.

Contenu : Layout 2 colonnes (Desktop), ThemeFilters, Liste de thèmes (ThemeListItem), Preview interactive (ThemePreview avec iframe démo).

API : useGetThemes, useActivateThemeForStore.

/themes/my - Mes Thèmes

Statut : S1+ (Planifié)

Objectif : Voir les thèmes acquis/installés.

Contenu : Liste/Grille des thèmes, boutons "Personnaliser" / "Installer".

/theme/editor - Éditeur de Thème

Statut : S1/S2 (Planifié, complexe)

Objectif : Personnaliser le thème actif d'un store.

Contenu : Layout 2 colonnes, EditorSidebar (avec contrôles spécifiques), LiveThemePreview (iframe avec postMessage).

API : useGetThemeOptions, useGetThemeSettings, useSaveThemeSettings.

/stats (ou /stores/stats) - Page Statistiques

Statut: S0 (Refactoring UI/API fait)

Objectif: Visualiser les performances de la boutique sélectionnée.

Contenu: StatsFilters (Période/Date), KPIs (KPICard), Graphiques Ventes (LineChartCard, DonutChartCard), Graphiques Trafic (LineChartCard, DonutChartCard, BarChartCard, DataTableCard).

API: useGetKpis, useGetVisitDetailsStats, useGetOrderDetailsStats.

Composants Clés: StatsPage, StatsFilters, et tous les *ChartCard, DataTableCard.

(Partie 2/2 dans la prochaine réponse : Fonctionnalités/Libs)



(Partie 2/2 : Liste des Fonctionnalités/Bibliothèques Utilisées)

Récapitulatif Détaillé des Fonctionnalités & Bibliothèques du Dashboard Owner

Voici une liste des fonctionnalités majeures implémentées ou planifiées et des bibliothèques externes clés utilisées (ou dont l'utilisation est supposée/recommandée).

Fonctionnalités Clés Implémentées/Planifiées :

Authentification :

✅ Connexion Email/Mot de passe.

✅ Connexion Sociale (Google - via redirection s_server).

✅ Inscription Email/Mot de passe.

✅ Vérification d'Email (via lien envoyé par email).

✅ Renvoi d'Email de Vérification.

✅ Mot de Passe Oublié (Demande de lien par email).

✅ Réinitialisation de Mot de Passe (via lien/token).

✅ Invitation/Création de Compte Collaborateur (via lien/token).

✅ Gestion de Session/Token (Stockage, ajout aux requêtes API).

✅ Déconnexion (Session courante).

✅ Déconnexion de tous les appareils.

Gestion de Profil Utilisateur :

✅ Affichage des informations (Nom, Email, Avatar).

✅ Modification du Nom.

✅ Modification de l'Avatar (Upload).

✅ Modification du Mot de Passe.

✅ Affichage simple des Adresses/Téléphones (avec liens vers gestion).

✅ Modification de la Langue de préférence.

✅ Suppression du Compte Utilisateur (avec confirmation).

Gestion des Boutiques (Multi-store) :

✅ Affichage Liste Horizontale (Swiper) des boutiques de l'Owner.

✅ Sélection de la boutique active (avec persistance localStorage).

✅ Affichage des Détails de la boutique sélectionnée (Infos, Stats basiques, Limites).

✅ Actions sur la boutique : Activer/Stopper (Appel API s_server planifié), Modifier (lien), Paramètres (lien).

(Planifié S1+) Création de nouvelle boutique.

(Planifié S1+) Suppression de boutique.

Gestion du Catalogue :

✅ Produits :

Liste paginée avec recherche, filtres (prix, visibilité), tri.

Toggle affichage Carte/Ligne.

CRUD complet (Création, Lecture, Modification infos base, Suppression).

Gestion avancée des Variantes (Features/Values) : Ajout/Modif/Suppr via interface dédiée et sauvegarde groupée (multipleUpdateFeaturesValues).

Gestion des Images/Vidéos Produit (via SwiperProducts et feature/value par défaut).

Gestion des Détails Additionnels (CRUD + Réordonnancement).

Gestion de la Visibilité Produit.

✅ Catégories :

Liste paginée (sur page dédiée) avec recherche, filtres (visibilité, tri), toggle vue Carte/Ligne.

Aperçu limité scrollable sur la page Produits.

CRUD complet (Création, Lecture, Modification, Suppression) avec gestion image/icône et catégorie parente.

Gestion de la Visibilité Catégorie.

Gestion des Commandes :

✅ Liste paginée avec filtres avancés (Statut, Date, Prix, Recherche client/réf).

✅ Vue Détail Commande (Infos client, livraison/retrait, liste produits commandés avec variantes, historique statuts).

✅ Mise à Jour Manuelle du Statut (via popup, avec validation des transitions à finaliser).

(Planifié S2+) Gestion Paiements (Marquer comme payé, voir détails transaction).

(Planifié S3+) Gestion Livraison (Marquer comme expédié, ajouter suivi).

✅ Export/Partage Reçu (PDF, Impression, Lien).

Gestion des Utilisateurs (Clients & Collaborateurs) :

✅ Clients : Liste paginée avec recherche, filtres (statut, date), tri. Affichage infos + stats de base.

✅ Collaborateurs : Liste, Ajout (utilisateur existant ou invitation/création nouveau), Gestion des Permissions (via popup), Suppression.

(Planifié S1+) Page détail Client avec historique commandes/commentaires.

(Planifié S1+) Actions sur Client (Bannir?).

Gestion de l'Inventaire / Points de Vente :

✅ Liste des points de vente associés au store.

✅ CRUD complet via popup formulaire (avec gestion image).

Gestion des Thèmes :

✅ Affichage du Thème Actif du store sélectionné (infos, preview image).

✅ Affichage des options de personnalisation (liens vers éditeur).

✅ Affichage liste thèmes disponibles/récents (Swiper ThemeCard, données statiques pour S0).

✅ Bouton/Lien pour changer de thème (vers /themes/market).

(Planifié S1+) Page Marché (/themes/market) avec liste/filtres et preview interactive.

(Planifié S1+) Page Mes Thèmes (/themes/my).

(Planifié S1+/S2) Page Éditeur de Thème (/theme/editor) avec preview live.

Statistiques :

✅ Page dédiée (/stats) avec sélection de période/plage.

✅ Affichage KPIs principaux (KPICard).

✅ Graphiques d'évolution Ventes & Trafic (LineChartCard).

✅ Graphiques de répartition (Statuts Cdes, Moyens Paiement, Appareils, Navigateurs via DonutChartCard/BarChartCard).

✅ Tableau des Sources de Trafic (DataTableCard).

✅ Logique de navigation temporelle (scroll/drag) sur graphiques d'évolution.

Notifications :

✅ Indicateur visuel de nouvelles notifications dans Topbar.

✅ Intégration SSE pour mises à jour temps réel (Commandes, Commentaires).

✅ Intégration de react-hot-toast pour les messages de succès/erreur.

(Planifié S1+) Page dédiée /notifications.

(Planifié S1+) Préférences de notification dans le profil.

UI/UX Général :

✅ Refactoring vers Tailwind CSS.

✅ Utilisation de composants réutilisables (Button, ConfirmPopup, KPICard, etc.).

✅ Internationalisation (i18n) des textes statiques.

✅ Gestion des états de chargement (Skeletons).

✅ Gestion des erreurs API (affichage messages).

✅ Responsive Design (Layout, Sidebar/Bottombar, Grilles).

✅ Utilisation de framer-motion pour animations (liste détails).

✅ Lightbox pour visualisation images (via yet-another-react-lightbox).

Bibliothèques / Outils Clés Utilisés ou Planifiés :

Framework/Build : React, Vite, Vike (SSR).

Styling : Tailwind CSS.

Gestion d'État (Données Serveur) : TanStack Query (React Query) V5 (useQuery, useMutation, QueryClientProvider, queryClient).

Gestion d'État (Global UI/Auth) : Zustand (useAuthStore, useStore, useChildViewer).

Internationalisation : react-i18next, i18next.

Formulaires : (Implicite) Gestion via useState, potentiellement react-hook-form si complexité augmente.

Graphiques : react-chartjs-2, chart.js.

Éditeur Markdown : @toast-ui/react-editor (MarkdownEditor2).

Affichage Markdown : @toast-ui/editor (Viewer implicite ou MarkdownViewer).

Carrousels/Sliders : swiper.

Sélection Fuseau Horaire : react-timezone-select.

Sélection (Dropdowns améliorés) : react-select.

Notifications Toast : react-hot-toast.

Lightbox Images : yet-another-react-lightbox.

Animation : framer-motion.

Gestion d'État (Authentification/Store Global) : Zustand (useAuthStore, useStore, useChildViewer).

QR Code : qrcode.react.

Icônes : react-icons.

Formatage Masque Téléphone : imask.

Formatage Dates/Heures : luxon (côté backend/API client), date-fns (pour locale fr dans DayPicker).

Communication Temps Réel : @adonisjs/transmit-client.

Spinner : react-spinners.

UI Headless (pour Toggle) : @headlessui/react.

Utilitaires JS/TS : lodash (implicite?), uuid, limax (API), etc.

Ce récapitulatif montre l'étendue considérable du travail déjà planifié et en grande partie refactorisé. La phase S0 est très ambitieuse et couvre déjà une large part des fonctionnalités essentielles d'un dashboard e-commerce moderne. Les prochaines étapes se concentreront sur la finalisation de la logique API/mutation, l'implémentation du stock/transitions statut, et les tests approfondis.
*/