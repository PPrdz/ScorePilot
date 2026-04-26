// ═══════════════════════════════════════════════════════════════════════════════
// SYSTÈME DE RANK UP COMPLET
// ═══════════════════════════════════════════════════════════════════════════════
// À ajouter dans rang-FINAL-COMPLET.html ou comme script séparé
// ═══════════════════════════════════════════════════════════════════════════════

// ========================================
// 1. SYSTÈME DE RANG MYSTÈRE (PLACEMENT)
// ========================================

function initializeNewUserRank(userId) {
  const rankKey = `sp_rank_${userId}`;
  const existing = localStorage.getItem(rankKey);
  
  if (!existing) {
    // Nouveau joueur = rang MYSTÈRE
    const initialRank = {
      points: 0,
      rank: 'MYSTÈRE',
      icon: '❓',
      matches: [],
      wins: 0,
      losses: 0,
      totalMatches: 0,
      needsPlacement: true // Flag pour savoir qu'il faut faire le placement
    };
    
    localStorage.setItem(rankKey, JSON.stringify(initialRank));
    return initialRank;
  }
  
  return JSON.parse(existing);
}

// ========================================
// 2. PLACEMENT INITIAL (Après 1ère révision)
// ========================================

function performPlacementMatch(userId, score, correctAnswers, totalQuestions) {
  const rankKey = `sp_rank_${userId}`;
  const rankData = JSON.parse(localStorage.getItem(rankKey) || '{}');
  
  // Calcul des points de placement (entre 0-300 = NOVICE I à INITIÉ I)
  const placementPoints = Math.floor((score / 100) * 300);
  
  const RANKS = [
    { name: 'NOVICE I', min: 0, max: 99 },
    { name: 'NOVICE II', min: 100, max: 199 },
    { name: 'NOVICE III', min: 200, max: 299 },
    { name: 'INITIÉ I', min: 300, max: 399 }
  ];
  
  const newRank = RANKS.find(r => placementPoints >= r.min && placementPoints <= r.max) || RANKS[0];
  
  // Mise à jour
  rankData.points = placementPoints;
  rankData.rank = newRank.name;
  rankData.needsPlacement = false;
  rankData.placementCompleted = true;
  rankData.totalMatches = 1;
  
  if (score >= 70) {
    rankData.wins = 1;
  } else {
    rankData.losses = 1;
  }
  
  localStorage.setItem(rankKey, JSON.stringify(rankData));
  
  // Afficher l'animation de placement
  showPlacementAnimation(newRank.name, placementPoints);
  
  // Créer une notification
  createRankNotification({
    type: 'placement',
    rank: newRank.name,
    points: placementPoints,
    message: `Tu es placé en ${newRank.name} !`
  });
  
  return { newRank, placementPoints };
}

// ========================================
// 3. DÉTECTION DE RANK UP
// ========================================

function detectRankUp(oldRank, newRank, oldPoints, newPoints) {
  // Comparer les rangs
  const TIER_ORDER = [
    'MYSTÈRE',
    'NOVICE I', 'NOVICE II', 'NOVICE III',
    'INITIÉ I', 'INITIÉ II', 'INITIÉ III',
    'RIVAL I', 'RIVAL II', 'RIVAL III',
    'CHALLENGER I', 'CHALLENGER II', 'CHALLENGER III',
    'EXPERT I', 'EXPERT II', 'EXPERT III',
    'MAÎTRE I', 'MAÎTRE II', 'MAÎTRE III',
    'ÉLITE I', 'ÉLITE II', 'ÉLITE III',
    'CHAMPION I', 'CHAMPION II', 'CHAMPION III',
    'GRAND CHAMPION'
  ];
  
  const oldIndex = TIER_ORDER.indexOf(oldRank);
  const newIndex = TIER_ORDER.indexOf(newRank);
  
  if (newIndex > oldIndex) {
    return {
      hasRankUp: true,
      oldRank,
      newRank,
      pointsGained: newPoints - oldPoints
    };
  }
  
  return { hasRankUp: false };
}

// ========================================
// 4. FONCTION MODIFIÉE addMatchToRanking
// ========================================

window.addMatchToRanking = function(quizData) {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  const uid = (currentUser.name || 'guest').replace(/\s+/g, '_').toLowerCase();
  const key = `sp_rank_${uid}`;
  
  let rankData = JSON.parse(localStorage.getItem(key) || '{}');
  
  // Initialiser si nouveau
  if (!rankData.points && rankData.points !== 0) {
    rankData = initializeNewUserRank(uid);
  }
  
  // Si c'est le premier match (placement)
  if (rankData.needsPlacement === true) {
    const score = Math.round((quizData.correctAnswers / quizData.totalQuestions) * 100);
    return performPlacementMatch(uid, score, quizData.correctAnswers, quizData.totalQuestions);
  }
  
  // Match normal
  if (!rankData.matches) rankData.matches = [];
  if (!rankData.wins) rankData.wins = 0;
  if (!rankData.losses) rankData.losses = 0;
  if (!rankData.totalMatches) rankData.totalMatches = 0;
  
  const oldRank = rankData.rank;
  const oldPoints = rankData.points;
  
  const score = Math.round((quizData.correctAnswers / quizData.totalQuestions) * 100);
  const isWin = score >= 70;
  
  let pointsChange = 0;
  if (isWin) {
    pointsChange = Math.floor(15 + ((score - 70) / 30) * 15);
    rankData.wins++;
  } else {
    pointsChange = -Math.floor(5 + ((70 - score) / 70) * 15);
    rankData.losses++;
  }
  
  rankData.points = Math.max(0, rankData.points + pointsChange);
  rankData.totalMatches++;
  
  const RANKS = [
    { name: 'NOVICE I', min: 0, max: 99 },
    { name: 'NOVICE II', min: 100, max: 199 },
    { name: 'NOVICE III', min: 200, max: 299 },
    { name: 'INITIÉ I', min: 300, max: 399 },
    { name: 'INITIÉ II', min: 400, max: 499 },
    { name: 'INITIÉ III', min: 500, max: 599 },
    { name: 'RIVAL I', min: 600, max: 699 },
    { name: 'RIVAL II', min: 700, max: 799 },
    { name: 'RIVAL III', min: 800, max: 899 },
    { name: 'CHALLENGER I', min: 900, max: 999 },
    { name: 'CHALLENGER II', min: 1000, max: 1099 },
    { name: 'CHALLENGER III', min: 1100, max: 1199 },
    { name: 'EXPERT I', min: 1200, max: 1299 },
    { name: 'EXPERT II', min: 1300, max: 1399 },
    { name: 'EXPERT III', min: 1400, max: 1499 },
    { name: 'MAÎTRE I', min: 1500, max: 1599 },
    { name: 'MAÎTRE II', min: 1600, max: 1699 },
    { name: 'MAÎTRE III', min: 1700, max: 1799 },
    { name: 'ÉLITE I', min: 1800, max: 1899 },
    { name: 'ÉLITE II', min: 1900, max: 1999 },
    { name: 'ÉLITE III', min: 2000, max: 2099 },
    { name: 'CHAMPION I', min: 2100, max: 2199 },
    { name: 'CHAMPION II', min: 2200, max: 2299 },
    { name: 'CHAMPION III', min: 2300, max: 2399 },
    { name: 'GRAND CHAMPION', min: 2400, max: 99999 }
  ];
  
  const newRankObj = RANKS.find(r => rankData.points >= r.min && rankData.points <= r.max) || RANKS[0];
  rankData.rank = newRankObj.name;
  
  const match = {
    id: Date.now(),
    date: Date.now(),
    title: quizData.subject || 'Révision générale',
    subject: quizData.subject || 'Non spécifié',
    questionsTotal: quizData.totalQuestions,
    correctAnswers: quizData.correctAnswers,
    score: score,
    result: isWin ? 'win' : 'loss',
    pointsChange: pointsChange,
    totalPoints: rankData.points,
    rankName: rankData.rank,
    wins: rankData.wins,
    losses: rankData.losses,
    totalMatches: rankData.totalMatches,
    duration: quizData.duration || 'N/A'
  };
  
  rankData.matches.push(match);
  if (rankData.matches.length > 50) {
    rankData.matches = rankData.matches.slice(-50);
  }
  
  localStorage.setItem(key, JSON.stringify(rankData));
  
  // Détecter rank up
  const rankUpInfo = detectRankUp(oldRank, rankData.rank, oldPoints, rankData.points);
  
  if (rankUpInfo.hasRankUp) {
    // Afficher l'animation de rank up
    showRankUpAnimation(rankUpInfo.oldRank, rankUpInfo.newRank, rankUpInfo.pointsGained);
    
    // Créer une notification
    createRankNotification({
      type: 'rankup',
      oldRank: rankUpInfo.oldRank,
      newRank: rankUpInfo.newRank,
      points: rankData.points,
      message: `Rank Up ! Tu es maintenant ${rankUpInfo.newRank} !`
    });
  }
  
  console.log('✅ Match ajouté:', match);
  
  return match;
};

// ========================================
// 5. AFFICHER L'ANIMATION DE RANK UP
// ========================================

function showRankUpAnimation(oldRank, newRank, pointsGained) {
  // Créer l'overlay d'animation
  const overlay = document.createElement('div');
  overlay.id = 'rankup-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(ellipse at center, rgba(99,102,241,0.1) 0%, rgba(0,0,0,0.95) 70%);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: overlayFadeIn 0.4s ease;
  `;
  
  // Couleurs par tier
  const tierColors = {
    'NOVICE': '#94a3b8',
    'INITIÉ': '#10b981',
    'RIVAL': '#3b82f6',
    'CHALLENGER': '#8b5cf6',
    'EXPERT': '#06b6d4',
    'MAÎTRE': '#f59e0b',
    'ÉLITE': '#ec4899',
    'CHAMPION': '#ef4444',
    'GRAND': '#a855f7'
  };
  
  const tier = newRank.split(' ')[0];
  const color = tierColors[tier] || '#6366f1';
  
  overlay.innerHTML = `
    <style>
      @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { 
        from { transform: translateY(40px); opacity: 0; } 
        to { transform: translateY(0); opacity: 1; } 
      }
      @keyframes rankGlow { 
        0%, 100% { 
          text-shadow: 0 0 20px ${color}80, 0 0 40px ${color}40; 
          transform: scale(1);
        } 
        50% { 
          text-shadow: 0 0 30px ${color}CC, 0 0 60px ${color}80, 0 0 80px ${color}40; 
          transform: scale(1.05);
        } 
      }
      @keyframes particles {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        100% { transform: translateY(-100px) scale(0); opacity: 0; }
      }
      @keyframes fadeOut { to { opacity: 0; } }
      
      .particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: ${color};
        border-radius: 50%;
        animation: particles 2s ease-out forwards;
        opacity: 0.8;
      }
    </style>
    
    <div style="text-align: center; animation: slideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
      <!-- Particules -->
      ${Array.from({length: 30}, (_, i) => `
        <div class="particle" style="
          left: ${50 + (Math.random() - 0.5) * 60}%;
          bottom: 40%;
          animation-delay: ${Math.random() * 0.5}s;
          animation-duration: ${1.5 + Math.random()}s;
        "></div>
      `).join('')}
      
      <!-- Icône -->
      <div style="font-size: 64px; margin-bottom: 24px; animation: slideUp 0.8s ease 0.2s backwards;">
        🎉
      </div>
      
      <!-- Label RANK UP -->
      <div style="
        font-size: 16px;
        font-weight: 700;
        color: rgba(255,255,255,0.6);
        margin-bottom: 20px;
        letter-spacing: 6px;
        text-transform: uppercase;
        animation: slideUp 0.8s ease 0.3s backwards;
      ">
        RANK UP
      </div>
      
      <!-- Ancien rang → Nouveau rang -->
      <div style="
        font-size: 18px;
        color: rgba(255,255,255,0.4);
        margin-bottom: 32px;
        animation: slideUp 0.8s ease 0.4s backwards;
      ">
        <span style="text-decoration: line-through; opacity: 0.5;">${oldRank}</span>
        <span style="margin: 0 16px;">→</span>
        <span style="color: ${color};">${newRank}</span>
      </div>
      
      <!-- Nouveau rang en gros -->
      <div style="
        font-family: 'Montserrat', sans-serif;
        font-size: 72px;
        font-weight: 900;
        color: ${color};
        margin-bottom: 24px;
        animation: rankGlow 2s ease-in-out infinite, slideUp 0.8s ease 0.5s backwards;
        line-height: 1;
      ">
        ${newRank}
      </div>
      
      <!-- Points gagnés -->
      <div style="
        font-size: 28px;
        font-weight: 700;
        color: #10b981;
        animation: slideUp 0.8s ease 0.6s backwards;
      ">
        +${pointsGained} RR
      </div>
      
      <!-- Message -->
      <div style="
        margin-top: 32px;
        font-size: 14px;
        color: rgba(255,255,255,0.5);
        animation: slideUp 0.8s ease 0.7s backwards;
      ">
        Continue comme ça pour atteindre le prochain rang !
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Son (optionnel)
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSp+zPLTfzEGG2W57OmiUg8MUqfk77RgGw==');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch (e) {}
  
  // Retirer après 4 secondes
  setTimeout(() => {
    overlay.style.animation = 'fadeOut 0.4s ease';
    setTimeout(() => overlay.remove(), 400);
  }, 4000);
  
  // Mettre à jour le badge dans le menu
  updateRankBadgeInMenu(newRank);
}

// ========================================
// 6. AFFICHER L'ANIMATION DE PLACEMENT
// ========================================

function showPlacementAnimation(rank, points) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.95);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease;
  `;
  
  overlay.innerHTML = `
    <div style="text-align: center; animation: slideUp 0.6s ease;">
      <div style="font-size: 48px; margin-bottom: 32px;">✨</div>
      <div style="font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.6); margin-bottom: 16px; letter-spacing: 4px; text-transform: uppercase;">
        PLACEMENT
      </div>
      <div style="font-size: 72px; font-weight: 900; color: #818cf8; margin-bottom: 24px; animation: glow 2s infinite; --glow: rgba(129,140,248,0.6); font-family: 'Montserrat', sans-serif;">
        ${rank}
      </div>
      <div style="font-size: 16px; color: rgba(255,255,255,0.5); margin-bottom: 8px;">
        Bienvenue dans le système de rangs !
      </div>
      <div style="font-size: 24px; font-weight: 700; color: #6366f1;">
        ${points} RR
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    overlay.style.animation = 'fadeIn 0.3s ease reverse';
    setTimeout(() => overlay.remove(), 300);
  }, 5000);
}

// ========================================
// 7. CRÉER UNE NOTIFICATION
// ========================================

function createRankNotification(data) {
  // Sauvegarder la notification dans localStorage
  const notificationsKey = 'sp_notifications';
  const notifications = JSON.parse(localStorage.getItem(notificationsKey) || '[]');
  
  const notification = {
    id: Date.now(),
    type: data.type, // 'rankup' ou 'placement'
    title: data.type === 'placement' ? 'Placement Initial' : 'Rank Up !',
    message: data.message,
    rank: data.newRank || data.rank,
    oldRank: data.oldRank,
    points: data.points,
    timestamp: Date.now(),
    read: false,
    icon: data.type === 'placement' ? '✨' : '🎉'
  };
  
  notifications.unshift(notification);
  
  // Garder seulement les 50 dernières
  if (notifications.length > 50) {
    notifications.length = 50;
  }
  
  localStorage.setItem(notificationsKey, JSON.stringify(notifications));
  
  console.log('✅ Notification créée:', notification);
  
  // Mettre à jour le badge de notifications dans le dashboard
  updateNotificationBadge();
}

// ========================================
// 8. METTRE À JOUR LE BADGE DE NOTIFICATIONS
// ========================================

function updateNotificationBadge() {
  const notifications = JSON.parse(localStorage.getItem('sp_notifications') || '[]');
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Mettre à jour tous les badges dans la page
  const badges = document.querySelectorAll('.notification-badge, #notificationBadge');
  badges.forEach(badge => {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  });
}

// ========================================
// 9. METTRE À JOUR LE BADGE DE RANG DANS LE MENU
// ========================================

function updateRankBadgeInMenu(newRank) {
  // Chercher tous les éléments de rang dans le menu/navigation
  const rankElements = document.querySelectorAll('.user-rank, #userRank, [data-rank]');
  
  rankElements.forEach(el => {
    el.textContent = newRank;
    
    // Animation flash
    el.style.animation = 'none';
    setTimeout(() => {
      el.style.animation = 'rankFlash 0.5s ease';
    }, 10);
  });
  
  // Ajouter l'animation CSS si elle n'existe pas
  if (!document.getElementById('rankAnimationStyle')) {
    const style = document.createElement('style');
    style.id = 'rankAnimationStyle';
    style.textContent = `
      @keyframes rankFlash {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.1); color: #6366f1; }
      }
    `;
    document.head.appendChild(style);
  }
}

// ========================================
// 10. RAFRAÎCHIR LE LOGO/EMBLÈME DANS LE PANEL
// ========================================

function refreshRankEmblem() {
  // Cette fonction doit être appelée pour rafraîchir l'emblème SVG dans le panel de rang
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  const userId = (currentUser.name || 'guest').replace(/\s+/g, '_').toLowerCase();
  const rankData = JSON.parse(localStorage.getItem(`sp_rank_${userId}`) || '{}');
  
  if (rankData.rank && typeof updateRankDisplay === 'function') {
    updateRankDisplay();
  }
  
  console.log('✅ Emblème de rang rafraîchi:', rankData.rank);
}

// ========================================
// 11. INITIALISATION
// ========================================

// Auto-update badge au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    updateNotificationBadge();
    refreshRankEmblem();
  });
} else {
  updateNotificationBadge();
  refreshRankEmblem();
}

console.log('✅ Système de Rank Up chargé');
