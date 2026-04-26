// server.js - Backend ScorePilot avec wrapper ED fonctionnel
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const EDLoginService = require('./ed-login-service');
const EDDataAnalyzer = require('./ed-data-analyzer');

const app = express();
const PORT = 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ED_API_BASE = 'https://api.ecoledirecte.com/v3';

// Fonction helper pour appeler l'API ED
async function callEDAPI(endpoint, data, token = null) {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };
  
  if (token) {
    headers['X-Token'] = token;
  }

  const body = new URLSearchParams();
  body.append('data', JSON.stringify(data));

  console.log(`📡 Appel ED: ${endpoint}`);
  console.log(`📦 Data:`, data);

  const response = await fetch(`${ED_API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: body.toString()
  });

  const result = await response.json();
  console.log(`✅ Code retour: ${result.code}`);
  
  return result;
}

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '🚀 Backend ScorePilot v2 actif',
    timestamp: new Date().toISOString()
  });
});

// LOGIN avec Puppeteer (gère 2FA)
app.post('/api/ed/login-browser', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Username et password requis' 
      });
    }

    console.log(`\n🔐 Connexion avec navigateur: ${username}`);

    const service = new EDLoginService();
    const result = await service.login(username, password);

    console.log(`✅ Token obtenu: ${result.token?.substring(0, 20)}...`);

    return res.json({
      success: true,
      data: {
        token: result.token,
        ...result.userData
      }
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la connexion',
      details: error.message
    });
  }
});

// LOGIN
app.post('/api/ed/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Username et password requis' 
      });
    }

    console.log(`\n🔐 Tentative connexion: ${username}`);

    const result = await callEDAPI('/login.awp', {
      identifiant: username,
      motdepasse: password
    });

    console.log(`📄 Réponse ED complète:`, JSON.stringify(result, null, 2));

    if (result.code === 200) {
      const account = result.data.accounts[0];
      
      console.log(`✅ Connexion réussie: ${account.prenom} ${account.nom}`);
      
      return res.json({
        success: true,
        data: {
          token: result.token,
          id: account.id,
          nom: account.nom,
          prenom: account.prenom,
          typeCompte: account.typeCompte,
          etablissements: account.profile?.etablissements || []
        }
      });
    } else {
      console.log(`❌ Échec connexion - Code: ${result.code}, Message: ${result.message}`);
      
      return res.status(401).json({
        success: false,
        error: result.message || 'Identifiants incorrects',
        code: result.code,
        details: result
      });
    }

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
});

// NOTES
app.post('/api/ed/notes', async (req, res) => {
  try {
    const { token, userId } = req.body;
    
    if (!token || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Token et userId requis' 
      });
    }

    console.log(`\n📚 Récupération notes pour user: ${userId}`);

    const result = await callEDAPI(`/eleves/${userId}/notes.awp?verbe=get`, {
      token
    }, token);

    if (result.code === 200) {
      const notes = result.data.notes || [];
      
      // Calculer stats
      const matieres = {};
      let totalPoints = 0;
      let totalCoefs = 0;

      notes.forEach(note => {
        const matiere = note.libelleMatiere;
        if (!matieres[matiere]) {
          matieres[matiere] = { notes: [], moyenne: 0 };
        }

        if (note.valeur && !isNaN(parseFloat(note.valeur))) {
          const val = parseFloat(note.valeur.replace(',', '.'));
          const sur = parseFloat(note.noteSur) || 20;
          const coef = parseFloat(note.coef) || 1;
          const val20 = (val / sur) * 20;

          matieres[matiere].notes.push({
            valeur: val,
            noteSur: sur,
            coef,
            date: note.date,
            intitule: note.devoir
          });

          totalPoints += val20 * coef;
          totalCoefs += coef;
        }
      });

      // Moyenne par matière
      Object.keys(matieres).forEach(mat => {
        const m = matieres[mat];
        if (m.notes.length > 0) {
          let pts = 0, coefs = 0;
          m.notes.forEach(n => {
            pts += (n.valeur / n.noteSur) * 20 * n.coef;
            coefs += n.coef;
          });
          m.moyenne = coefs > 0 ? parseFloat((pts / coefs).toFixed(2)) : 0;
        }
      });

      const moyenneGenerale = totalCoefs > 0 
        ? parseFloat((totalPoints / totalCoefs).toFixed(2)) 
        : 0;

      console.log(`✅ ${notes.length} notes récupérées - Moyenne: ${moyenneGenerale}`);

      return res.json({
        success: true,
        data: {
          notes,
          matieres,
          stats: {
            total: notes.length,
            moyenneGenerale,
            nbMatieres: Object.keys(matieres).length
          }
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.message || 'Erreur récupération notes',
        code: result.code
      });
    }

  } catch (error) {
    console.error('❌ Erreur notes:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
});

// EMPLOI DU TEMPS
app.post('/api/ed/emploi', async (req, res) => {
  try {
    const { token, userId, dateDebut, dateFin } = req.body;
    
    if (!token || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Token et userId requis' 
      });
    }

    const today = new Date().toISOString().split('T')[0];

    const result = await callEDAPI(`/E/${userId}/emploidutemps.awp?verbe=get`, {
      token,
      dateDebut: dateDebut || today,
      dateFin: dateFin || today
    }, token);

    if (result.code === 200) {
      return res.json({
        success: true,
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.message || 'Erreur emploi du temps',
        code: result.code
      });
    }

  } catch (error) {
    console.error('❌ Erreur emploi:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
});

// DEVOIRS
app.post('/api/ed/devoirs', async (req, res) => {
  try {
    const { token, userId } = req.body;
    
    if (!token || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Token et userId requis' 
      });
    }

    const result = await callEDAPI(`/Eleves/${userId}/cahierdetexte.awp?verbe=get`, {
      token
    }, token);

    if (result.code === 200) {
      return res.json({
        success: true,
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.message || 'Erreur devoirs',
        code: result.code
      });
    }

  } catch (error) {
    console.error('❌ Erreur devoirs:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
});

// INSIGHTS & ANALYSE
app.post('/api/ed/insights', async (req, res) => {
  try {
    const { token, userId } = req.body;
    
    if (!token || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Token et userId requis' 
      });
    }

    console.log(`\n📊 Génération insights pour user: ${userId}`);

    // Récupérer les notes
    const notesResult = await callEDAPI(`/eleves/${userId}/notes.awp?verbe=get`, {
      token
    }, token);

    if (notesResult.code !== 200) {
      return res.status(400).json({
        success: false,
        error: 'Erreur récupération notes'
      });
    }

    const notes = notesResult.data.notes || [];
    
    // Calculer stats complètes
    const matieres = {};
    let totalPoints = 0;
    let totalCoefs = 0;

    notes.forEach(note => {
      const matiere = note.libelleMatiere;
      if (!matieres[matiere]) {
        matieres[matiere] = { notes: [], moyenne: 0 };
      }

      if (note.valeur && !isNaN(parseFloat(note.valeur))) {
        const val = parseFloat(note.valeur.replace(',', '.'));
        const sur = parseFloat(note.noteSur) || 20;
        const coef = parseFloat(note.coef) || 1;
        const val20 = (val / sur) * 20;

        matieres[matiere].notes.push({
          valeur: val,
          noteSur: sur,
          coef,
          date: note.date,
          intitule: note.devoir
        });

        totalPoints += val20 * coef;
        totalCoefs += coef;
      }
    });

    // Moyenne par matière
    Object.keys(matieres).forEach(mat => {
      const m = matieres[mat];
      if (m.notes.length > 0) {
        let pts = 0, coefs = 0;
        m.notes.forEach(n => {
          pts += (n.valeur / n.noteSur) * 20 * n.coef;
          coefs += n.coef;
        });
        m.moyenne = coefs > 0 ? parseFloat((pts / coefs).toFixed(2)) : 0;
      }
    });

    const moyenneGenerale = totalCoefs > 0 
      ? parseFloat((totalPoints / totalCoefs).toFixed(2)) 
      : 0;

    const notesData = {
      notes,
      matieres,
      stats: {
        total: notes.length,
        moyenneGenerale,
        nbMatieres: Object.keys(matieres).length
      }
    };

    // Analyser les données
    const analyzer = new EDDataAnalyzer(notesData);
    const report = analyzer.generateReport();

    console.log(`✅ Rapport généré - Moyenne: ${report.moyenneGenerale}, ${report.suggestions.length} suggestions`);

    return res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('❌ Erreur insights:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Backend ScorePilot v2 démarré !');
  console.log('='.repeat(50));
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔗 Test: http://localhost:${PORT}/api/test`);
  console.log('='.repeat(50) + '\n');
});
