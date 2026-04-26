// ed-data-analyzer.js - Analyse les données ED et génère des insights

class EDDataAnalyzer {
  constructor(notesData) {
    this.notes = notesData.notes || [];
    this.matieres = notesData.matieres || {};
    this.stats = notesData.stats || {};
  }

  // Moyenne générale
  getMoyenneGenerale() {
    return this.stats.moyenneGenerale || 0;
  }

  // Évolution de la moyenne sur les 4 dernières semaines
  getEvolution() {
    const weeks = this.groupNotesByWeek();
    if (weeks.length < 2) return { trend: 'stable', value: 0 };
    
    const lastWeek = weeks[weeks.length - 1].moyenne;
    const previousWeek = weeks[weeks.length - 2].moyenne;
    const diff = lastWeek - previousWeek;
    
    return {
      trend: diff > 0.3 ? 'up' : diff < -0.3 ? 'down' : 'stable',
      value: Math.abs(diff),
      lastWeek,
      previousWeek
    };
  }

  // Grouper les notes par semaine
  groupNotesByWeek() {
    const weeks = {};
    
    this.notes.forEach(note => {
      if (!note.date || !note.valeur) return;
      
      const date = new Date(note.date);
      const weekNumber = this.getWeekNumber(date);
      const key = `${date.getFullYear()}-W${weekNumber}`;
      
      if (!weeks[key]) {
        weeks[key] = { notes: [], date };
      }
      
      const val = parseFloat(note.valeur.replace(',', '.'));
      const sur = parseFloat(note.noteSur) || 20;
      const coef = parseFloat(note.coef) || 1;
      weeks[key].notes.push({ val: (val / sur) * 20, coef });
    });
    
    // Calculer moyenne par semaine
    return Object.keys(weeks).map(key => {
      const week = weeks[key];
      let totalPts = 0, totalCoefs = 0;
      week.notes.forEach(n => {
        totalPts += n.val * n.coef;
        totalCoefs += n.coef;
      });
      return {
        week: key,
        moyenne: totalCoefs > 0 ? totalPts / totalCoefs : 0,
        nbNotes: week.notes.length,
        date: week.date
      };
    }).sort((a, b) => a.date - b.date);
  }

  getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  // Top 3 matières
  getTop3Matieres() {
    return Object.keys(this.matieres)
      .map(nom => ({ nom, moyenne: this.matieres[nom].moyenne }))
      .sort((a, b) => b.moyenne - a.moyenne)
      .slice(0, 3);
  }

  // Bottom 3 matières (axes d'amélioration)
  getBottom3Matieres() {
    return Object.keys(this.matieres)
      .map(nom => ({ nom, moyenne: this.matieres[nom].moyenne }))
      .filter(m => m.moyenne > 0)
      .sort((a, b) => a.moyenne - b.moyenne)
      .slice(0, 3);
  }

  // Détection des matières en difficulté
  getMatieresEnDifficulte() {
    const moyenneGenerale = this.getMoyenneGenerale();
    return Object.keys(this.matieres)
      .map(nom => ({
        nom,
        moyenne: this.matieres[nom].moyenne,
        ecart: moyenneGenerale - this.matieres[nom].moyenne
      }))
      .filter(m => m.moyenne > 0 && m.ecart > 2)
      .sort((a, b) => b.ecart - a.ecart);
  }

  // Suggestions d'amélioration
  getSuggestions() {
    const suggestions = [];
    const evolution = this.getEvolution();
    const difficiles = this.getMatieresEnDifficulte();
    const moyenneGenerale = this.getMoyenneGenerale();
    
    // Suggestion basée sur la tendance
    if (evolution.trend === 'down') {
      suggestions.push({
        type: 'warning',
        icon: '📉',
        title: 'Baisse de moyenne détectée',
        text: `Ta moyenne a baissé de ${evolution.value.toFixed(1)} points cette semaine. Augmente tes sessions de révision.`,
        priority: 'high'
      });
    } else if (evolution.trend === 'up') {
      suggestions.push({
        type: 'success',
        icon: '📈',
        title: 'Progression constante',
        text: `Excellent ! Tu as gagné ${evolution.value.toFixed(1)} points. Continue comme ça !`,
        priority: 'low'
      });
    }
    
    // Suggestions par matière
    if (difficiles.length > 0) {
      const pire = difficiles[0];
      suggestions.push({
        type: 'action',
        icon: '🎯',
        title: `Focus sur ${pire.nom}`,
        text: `${pire.ecart.toFixed(1)} points en dessous de ta moyenne. Planifie 2-3 sessions cette semaine.`,
        priority: 'high',
        action: 'create_plan',
        matiere: pire.nom
      });
    }
    
    // Suggestion objectif
    if (moyenneGenerale >= 10 && moyenneGenerale < 12) {
      suggestions.push({
        type: 'goal',
        icon: '🎓',
        title: 'Objectif 12/20',
        text: `Tu es à ${moyenneGenerale.toFixed(1)}/20. Avec ${(12 - moyenneGenerale).toFixed(1)} points de plus, tu atteins les mentions.`,
        priority: 'medium'
      });
    } else if (moyenneGenerale >= 12 && moyenneGenerale < 14) {
      suggestions.push({
        type: 'goal',
        icon: '🏆',
        title: 'Objectif Mention Bien',
        text: `Plus que ${(14 - moyenneGenerale).toFixed(1)} points pour la Mention Bien !`,
        priority: 'medium'
      });
    }
    
    return suggestions.sort((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 };
      return priority[b.priority] - priority[a.priority];
    });
  }

  // Générer un rapport complet
  generateReport() {
    return {
      moyenneGenerale: this.getMoyenneGenerale(),
      evolution: this.getEvolution(),
      top3: this.getTop3Matieres(),
      bottom3: this.getBottom3Matieres(),
      difficiles: this.getMatieresEnDifficulte(),
      suggestions: this.getSuggestions(),
      stats: {
        totalNotes: this.notes.length,
        nbMatieres: Object.keys(this.matieres).length,
        moyennesParMatiere: this.matieres
      },
      weeklyProgress: this.groupNotesByWeek()
    };
  }
}

module.exports = EDDataAnalyzer;
