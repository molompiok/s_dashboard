/*
Implémentation Logique Métier Manquante :
Actions dans Menus (ProductRowItem, CategoryItemCard, CategoryItemRow, DetailItem) : Connecter les boutons "Supprimer", "Modifier Visibilité", "Dupliquer" (?) aux mutations React Query correspondantes.
Sauvegarde Complète (Product Detail Page) : Finaliser la fonction handleSave pour construire correctement le FormData (en distinguant update simple et update multiple features/values) et appeler les bonnes mutations (useUpdateProduct / useMultipleUpdateFeaturesValues).
Validation Fine import_store : (Reporté à S2 mais à garder en tête).
Transitions de Statut Commande (UI) : Adapter StatusUpdatePopup pour n'afficher/activer que les statuts suivants valides (basé sur les règles API qui sont encore à finaliser côté backend).
Composants Manquants / À Finaliser :
Page Liste Catégories (/categories) : Finaliser l'implémentation avec CategoriesToolbar, CategoryItemCard/Row, Pagination.
Page Édition Catégorie (/category?id=ID&edit=true) : S'assurer que le lien depuis le menu action fonctionne.
Page Création Produit (/products/new) : Vérifier que le formulaire fonctionne correctement en mode création.
Composants Button, ConfirmDelete, ChildViewer, Indicator, ProductPreview : Vérifier/Finaliser leur refactoring Tailwind.
Gestion des Erreurs API : Afficher les messages d'erreur retournés par ApiError de manière conviviale (ex: via Toasts react-hot-toast).
Gestion Fine du Chargement : Afficher des indicateurs de chargement plus spécifiques (ex: sur les boutons, dans les sections) en utilisant les états isLoading/isPending des hooks/mutations.
Intégration & Tests :
Tests Fonctionnels Complets : Tester tous les parcours utilisateurs (CRUD complet produits/catégories, consultation commandes/clients, gestion collaborateurs/inventaire, etc.).
Tests Responsives : Vérifier l'affichage et l'utilisabilité sur différentes tailles d'écran.
Tests i18n : Basculer entre les langues et vérifier que tous les textes sont traduits.
Tests Permissions : Se connecter en tant qu'Owner puis en tant que Collaborateur (avec différentes permissions) pour vérifier que les accès sont corrects.
Points API en Attente (Rappel) :
Finalisation logique transition statuts commande (Backend).
Calcul et exposition stock réel (Backend).
Endpoint API pour réordonnancement atomique des DetailItem (Optionnel, workaround actuel avec 2 appels).


# 📝 Test Complet du Markdown

## 1️⃣ **Texte Basique**
- **Gras**
- *Italique*
- ~~Barré~~
- __Souligné__ (via HTML : `<u>texte</u>`)

---

## 2️⃣ **Titres & Listes**
### ✅ Listes non ordonnées :
- Éléments avec `-`
- Second élément  
  - Sous-élément avec `-`
  - Encore un sous-élément

### 🔢 Listes ordonnées :
1. Premier élément
2. Deuxième élément
   1. Sous-élément 1
   2. Sous-élément 2
3. Troisième élément

---

## 3️⃣ **Liens & Images**
- [🔗 Lien vers Google](https://www.google.com)  
- ![🌄 Image](https://via.placeholder.com/150)

---

## 4️⃣ **Code & Syntaxe**
### 👨‍💻 Code en ligne :
Voici un exemple de `console.log("Hello, Markdown!")`

### 🖥️ Bloc de code multi-lignes :
```js
function test() {
  console.log("Markdown est génial !");
}
test();


┌─────────────────────────────┬──────────────────┬────────────────────────────────────┐
│ ROUTE                       │ TYPE             │ DEFINED BY                         │
├─────────────────────────────┼──────────────────┼────────────────────────────────────┤
│ /                           │ Filesystem Route │ /pages/index/                      │
│ /about                      │ Filesystem Route │ /pages/about/                      │
│ /auth/auth-notice           │ Filesystem Route │ /pages/auth/auth-notice/           │
│ /auth/forgot-password       │ Filesystem Route │ /pages/auth/forgot-password/       │
│ /auth/reset-password        │ Filesystem Route │ /pages/auth/reset-password/        │
│ /auth/setup-account         │ Filesystem Route │ /pages/auth/setup-account/         │
│ /categories                 │ Filesystem Route │ /pages/categories/                 │
│ /categories/@id             │ Filesystem Route │ /pages/categories/@id/             │
│ /commands                   │ Filesystem Route │ /pages/commands/                   │
│ /commands/@id               │ Filesystem Route │ /pages/commands/@id/               │
│ /commands/@id/receipt       │ Filesystem Route │ /pages/commands/@id/receipt/       │
│ /notifications              │ Filesystem Route │ /pages/notifications/              │
│ /products                   │ Filesystem Route │ /pages/products/                   │
│ /products/@id               │ Filesystem Route │ /pages/products/@id/               │
│ /products/@id/comments      │ Filesystem Route │ /pages/products/@id/comments/      │
│ /products/@id/details       │ Filesystem Route │ /pages/products/@id/details/       │
│ /products/@id/price-stock   │ Filesystem Route │ /pages/products/@id/price-stock/   │
│ /s_test                     │ Filesystem Route │ /pages/s_test/                     │
│ /star-wars                  │ Filesystem Route │ /pages/star-wars/index/            │
│ /star-wars/@id              │ Filesystem Route │ /pages/star-wars/@id/              │
│ /stores                     │ Filesystem Route │ /pages/stores/                     │
│ /stores/@id/settings        │ Filesystem Route │ /pages/stores/@id/settings/        │
│ /stores/stats               │ Filesystem Route │ /pages/stores/stats/               │
│ /teams                      │ Filesystem Route │ /pages/teams/                      │
│ /themes/editor              │ Filesystem Route │ /pages/themes/editor/              │
│ /themes/market              │ Filesystem Route │ /pages/themes/market/              │
│ /themes/my                  │ Filesystem Route │ /pages/themes/my/                  │
│ /themes/preview             │ Filesystem Route │ /pages/themes/preview/             │
│ /users                      │ Filesystem Route │ /pages/users/                      │
│ /users/clients              │ Filesystem Route │ /pages/users/clients/              │
│ /users/clients/@id          │ Filesystem Route │ /pages/users/clients/@id/          │
│ /users/clients/@id/comments │ Filesystem Route │ /pages/users/clients/@id/comments/ │
│ /users/collaborators        │ Filesystem Route │ /pages/users/collaborators/        │
│ /users/login                │ Filesystem Route │ /pages/users/login/                │
│ /users/profile              │ Filesystem Route │ /pages/users/profile/              │
│ /users/register             │ Filesystem Route │ /pages/users/register/             |
└─────────────────────────────┴──────────────────┴────────────────────────────────────┘


value.selectColorLabe
value.colorNameLabel
value.colorNamePlaceholder 
*/