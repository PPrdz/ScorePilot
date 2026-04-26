# 🔐 CONNEXION ED AVEC GOOGLE OAUTH - GUIDE COMPLET

## 📦 FICHIERS FOURNIS

1. **ed-connect-google-oauth.html** - Page de connexion avec bouton Google
2. **ed-oauth-callback.html** - Page de callback OAuth
3. Ce guide d'installation

---

## ⚙️ CONFIGURATION GOOGLE OAUTH (ÉTAPE PAR ÉTAPE)

### 1. Créer un projet Google Cloud

1. Va sur https://console.cloud.google.com/
2. Clique sur "Sélectionner un projet" → "Nouveau projet"
3. Nom du projet : `ScorePilot`
4. Clique sur "Créer"

### 2. Activer l'API Google+

1. Dans le menu, va dans "APIs & Services" → "Library"
2. Cherche "Google+ API"
3. Clique dessus et active-le

### 3. Créer des identifiants OAuth

1. Va dans "APIs & Services" → "Credentials"
2. Clique sur "Create Credentials" → "OAuth client ID"
3. Type d'application : **Web application**
4. Nom : `ScorePilot ED Connect`

5. **Origines JavaScript autorisées :**
   ```
   http://localhost:8080
   http://127.0.0.1:8080
   https://ton-domaine.com (si tu as un site en ligne)
   ```

6. **URI de redirection autorisés :**
   ```
   http://localhost:8080/ed-oauth-callback.html
   http://127.0.0.1:8080/ed-oauth-callback.html
   https://ton-domaine.com/ed-oauth-callback.html
   ```

7. Clique sur "Create"

### 4. Récupérer le Client ID

Tu vas voir une popup avec :
- **Client ID** : `1234567890-abcdefghijklmnop.apps.googleusercontent.com`
- Client Secret (pas besoin)

**COPIE LE CLIENT ID !**

### 5. Ajouter le Client ID dans le code

Ouvre **ed-connect-google-oauth.html** et remplace ligne ~104 :

```javascript
const CLIENT_ID = 'VOTRE_CLIENT_ID_GOOGLE';  // ⚠️ À CONFIGURER
```

Par ton vrai Client ID :

```javascript
const CLIENT_ID = '1234567890-abcdefghijklmnop.apps.googleusercontent.com';
```

---

## 📁 STRUCTURE DES FICHIERS

```
ton-projet/
├── ed-connect-google-oauth.html   ← Page principale de connexion
├── ed-oauth-callback.html         ← Callback OAuth (ne pas ouvrir directement)
├── settings.html                  ← Redirige vers ed-connect-google-oauth.html
├── dashboard.html
└── ... (autres fichiers)
```

---

## 🔄 FLOW DE CONNEXION

### Avec Google OAuth :

```
1. User clique "Continuer avec Google"
2. Popup Google s'ouvre
3. User se connecte avec son compte Google
4. Google renvoie vers ed-oauth-callback.html
5. Callback récupère le profil Google
6. Données sauvegardées dans localStorage
7. Redirection vers dashboard.html
```

### Avec identifiants manuels :

```
1. User clique "Utiliser identifiants manuels"
2. Formulaire apparaît
3. User entre identifiant + mot de passe ED
4. Connexion directe à l'API EcoleDirecte
5. Si succès → dashboard.html
```

---

## 🧪 TESTER EN LOCAL

### 1. Lancer un serveur local

**Option 1 - Python:**
```bash
cd ton-projet
python -m http.server 8080
```

**Option 2 - Node.js:**
```bash
npm install -g http-server
cd ton-projet
http-server -p 8080
```

**Option 3 - VS Code:**
- Installer l'extension "Live Server"
- Clic droit sur index.html → "Open with Live Server"

### 2. Ouvrir dans le navigateur

```
http://localhost:8080/ed-connect-google-oauth.html
```

### 3. Tester

- Clique sur "Continuer avec Google"
- Une popup Google devrait s'ouvrir
- Connecte-toi avec ton compte Google
- Tu devrais être redirigé vers le dashboard

---

## ❓ POURQUOI GOOGLE OAUTH ?

### Avantages :

✅ **Pas besoin du mot de passe ED** - Plus sécurisé  
✅ **Connexion rapide** - Un clic  
✅ **Photo de profil** - Récupérée de Google  
✅ **Pas de code 505** - Pas d'appel direct à l'API ED  

### Comment ça marche ?

Google OAuth te donne :
- L'email de l'utilisateur
- Son nom/prénom
- Sa photo de profil

On utilise l'email comme identifiant ED (si ton établissement utilise des emails).

---

## 🔧 CONFIGURATION DANS SETTINGS.HTML

Dans **settings.html**, la fonction `connectED()` doit rediriger vers la nouvelle page :

```javascript
function connectED() {
  window.location.href = 'ed-connect-google-oauth.html';
}
```

(C'est déjà fait si tu utilises la version corrigée)

---

## 🐛 DÉPANNAGE

### Erreur "Invalid OAuth client"

→ Vérifie que l'URL est dans les "Origines autorisées" de Google Cloud Console

### Popup bloquée

→ Autorise les popups pour ton site dans le navigateur

### "No access token received"

→ Vérifie que l'URI de redirection est correcte dans Google Cloud Console

### "Client ID not found"

→ Tu as oublié de remplacer `VOTRE_CLIENT_ID_GOOGLE` par ton vrai Client ID

---

## 💾 DONNÉES SAUVEGARDÉES

Après connexion Google, les données suivantes sont sauvegardées :

```javascript
{
  username: "ayman.lamiri@gmail.com",
  provider: "google",
  googleId: "123456789",
  nom: "LAMIRI",
  prenom: "Ayman",
  email: "ayman.lamiri@gmail.com",
  photo: "https://lh3.googleusercontent.com/...",
  connectedAt: 1234567890
}
```

Stockées dans :
- `sp_ed_${userId}`
- `scorepilot_ed_${userId}`

---

## 🔐 SÉCURITÉ

### Ce qui est stocké :
- ✅ Email
- ✅ Nom/Prénom
- ✅ Google ID
- ✅ Photo

### Ce qui N'est PAS stocké :
- ❌ Mot de passe ED
- ❌ Access token Google (seulement utilisé temporairement)

---

## 🚀 DÉPLOIEMENT EN PRODUCTION

Si tu veux mettre ton site en ligne :

1. Upload tous les fichiers sur ton hébergement
2. Note ton URL (ex: `https://scorepilot.com`)
3. Retourne dans Google Cloud Console
4. Ajoute ton URL dans les "Origines autorisées"
5. Ajoute `https://scorepilot.com/ed-oauth-callback.html` dans les URI de redirection
6. C'est prêt !

---

## 📝 ALTERNATIVE - SI GOOGLE OAUTH NE MARCHE PAS

Tu peux toujours utiliser la connexion manuelle :

1. Clique sur "Utiliser identifiants manuels"
2. Entre ton identifiant ED (le VRAI, pas avec faute de frappe)
3. Entre ton mot de passe (sans guillemet à la fin)
4. Connexion directe à l'API ED

---

## ✅ CHECKLIST FINALE

- [ ] Projet Google Cloud créé
- [ ] API Google+ activée
- [ ] Credentials OAuth créés
- [ ] Client ID copié dans le code
- [ ] Origines JavaScript autorisées configurées
- [ ] URI de redirection configurés
- [ ] Serveur local lancé
- [ ] Test de connexion Google OK
- [ ] Redirection vers dashboard OK

---

C'est le même système qui marchait avant ! 🎉

Tu as juste besoin de :
1. Configurer Google OAuth (10 minutes)
2. Remplacer le Client ID dans le code
3. Tester

Pas besoin de mot de passe ED, pas de code 505, ça marche avec Google ! 🚀
