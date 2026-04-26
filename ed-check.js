// ed-check.js - Utilitaire pour vérifier la connexion ED
// À inclure dans chaque page avec <script src="ed-check.js"></script>

function checkEDConnection() {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  const userId = currentUser.name?.replace(/\s+/g, '_').toLowerCase() || 'guest';
  
  // Vérifier les deux formats de clés
  const edData = localStorage.getItem(`sp_ed_${userId}`) || localStorage.getItem(`scorepilot_ed_${userId}`);
  
  if (!edData) {
    return {
      connected: false,
      userId: null
    };
  }
  
  try {
    const ed = JSON.parse(edData);
    return {
      connected: true,
      userId: ed.userId,
      token: ed.token,
      nom: ed.nom,
      prenom: ed.prenom
    };
  } catch (e) {
    return {
      connected: false,
      userId: null
    };
  }
}

function requireED(redirectIfMissing = true) {
  const ed = checkEDConnection();
  
  if (!ed.connected && redirectIfMissing) {
    if (confirm('🔒 Connecte ton EcoleDirecte pour accéder à cette fonctionnalité\n\nAller dans Paramètres ?')) {
      window.location.href = 'settings.html';
    } else {
      window.location.href = 'dashboard.html';
    }
    return null;
  }
  
  return ed;
}
