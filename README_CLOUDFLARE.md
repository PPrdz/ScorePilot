# Fix déploiement Cloudflare Pages — ScorePilot

## ❌ Erreur rencontrée
```
[ERROR] Asset too large.
Cloudflare Workers supports assets with sizes of up to 25 MiB.
We found a file /opt/buildhome/repo/node_modules/workerd/bin/workerd with a size of 118 MiB.
```

## ✅ Solution (à faire UNE SEULE FOIS)

Le dossier `node_modules/` a été accidentellement commité dans le repo git.
Il faut le retirer de l'historique git :

```bash
# 1. Supprimer node_modules du tracking git (sans supprimer les fichiers localement)
git rm -r --cached node_modules/
git rm -r --cached package-lock.json  # optionnel

# 2. Vérifier que .gitignore contient bien "node_modules/"
cat .gitignore | grep node_modules

# 3. Commiter la suppression
git add .gitignore
git commit -m "fix: remove node_modules from git tracking (fixes Cloudflare 118MiB asset error)"

# 4. Pusher
git push

# 5. Cloudflare Pages re-déploiera automatiquement ✅
```

## 📝 Contexte
- Cloudflare Pages limite chaque asset à **25 MiB max**
- `node_modules/workerd/bin/workerd` fait **118 MiB** → bloque le déploiement
- ScorePilot est un site **100% statique** (HTML/CSS/JS) : `node_modules` n'est pas nécessaire au déploiement
- Le `server.js` (backend Express/Puppeteer) doit tourner séparément (VPS, Railway, Render...)

## 🚀 Architecture recommandée
```
Cloudflare Pages  →  Fichiers HTML/CSS/JS/images (site statique)
Railway / Render  →  server.js (backend Node.js pour EcoleDirecte proxy)
```
