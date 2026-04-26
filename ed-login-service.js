// ed-login-service.js - Service de connexion EcoleDirecte avec Puppeteer

const puppeteer = require('puppeteer');

class EDLoginService {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async login(username, password) {
    try {
      console.log('Connexion a EcoleDirecte...');
      
      // Initialiser le navigateur en mode headless d'abord
      console.log('Ouverture du navigateur (invisible)...');
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage'
        ]
      });
      this.page = await this.browser.newPage();
      
      // User agent réaliste
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Aller sur ED
      await this.page.goto('https://www.ecoledirecte.com', { 
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      console.log('Remplissage des identifiants...');

      // Attendre que la page soit chargée
      await this.page.waitForSelector('input[type="text"], input[name="identifiant"]', { timeout: 10000 });
      
      // Remplir les identifiants
      const usernameField = await this.page.$('input[name="identifiant"]') || await this.page.$('input[id="identifiant"]') || await this.page.$('input[type="text"]');
      if (usernameField) {
        await usernameField.type(username, { delay: 100 });
      }
      
      const passwordField = await this.page.$('input[name="motdepasse"]') || await this.page.$('input[id="motdepasse"]') || await this.page.$('input[type="password"]');
      if (passwordField) {
        await passwordField.type(password, { delay: 100 });
      }

      // Cliquer sur connexion
      console.log('Clic sur connexion...');
      await this.page.click('button[type="submit"], input[type="submit"]');

      console.log('En attente de connexion...');
      
      // Attendre navigation
      await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});

      // Vérifier si on a la 2FA
      const has2FA = await this.page.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase();
        return bodyText.includes('code') || 
               bodyText.includes('authentification') ||
               bodyText.includes('verification') ||
               bodyText.includes('double') ||
               bodyText.includes('validation');
      });

      if (has2FA) {
        console.log('2FA detectee - Affichage du navigateur...');
        
        // Fermer le navigateur headless
        await this.browser.close();
        
        // Rouvrir en mode visible pour la 2FA
        this.browser = await puppeteer.launch({
          headless: false,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // Refaire la connexion avec le navigateur visible
        await this.page.goto('https://www.ecoledirecte.com', { waitUntil: 'networkidle0' });
        
        const usernameField2 = await this.page.$('input[name="identifiant"]') || await this.page.$('input[type="text"]');
        if (usernameField2) await usernameField2.type(username, { delay: 100 });
        
        const passwordField2 = await this.page.$('input[name="motdepasse"]') || await this.page.$('input[type="password"]');
        if (passwordField2) await passwordField2.type(password, { delay: 100 });
        
        await this.page.click('button[type="submit"], input[type="submit"]');
        await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
        
        // Attendre que utilisateur entre son code 2FA
        console.log('En attente du code 2FA...');
        await this.page.waitForFunction(
          () => {
            return window.location.href.includes('accueil') || 
                   window.location.href.includes('dashboard') ||
                   window.location.href.includes('eleve') ||
                   document.querySelector('[class*="dashboard"]') !== null ||
                   document.querySelector('[class*="accueil"]') !== null;
          },
          { timeout: 120000 }
        );
      }

      console.log('Connexion reussie !');

      // Attendre un peu pour capturer le token
      await this.page.waitForTimeout(2000);

      // Extraire le token
      const token = await this.extractToken();
      
      // Récupérer les infos utilisateur
      const userData = await this.getUserData();

      await this.close();

      return {
        success: true,
        token,
        userData
      };

    } catch (error) {
      console.error('Erreur connexion:', error);
      await this.close();
      throw error;
    }
  }

  async extractToken() {
    try {
      // Essayer depuis localStorage
      const token = await this.page.evaluate(() => {
        return localStorage.getItem('token') || localStorage.getItem('ed_token');
      });

      if (token) return token;

      // Essayer depuis les cookies
      const cookies = await this.page.cookies();
      const tokenCookie = cookies.find(c => c.name.includes('token'));
      if (tokenCookie) return tokenCookie.value;

      // Essayer depuis sessionStorage
      const sessionToken = await this.page.evaluate(() => {
        return sessionStorage.getItem('token');
      });

      return sessionToken || 'NO_TOKEN_FOUND';

    } catch (error) {
      console.error('Erreur extraction token:', error);
      return null;
    }
  }

  async getUserData() {
    try {
      const userData = await this.page.evaluate(() => {
        const userDataLS = localStorage.getItem('user') || localStorage.getItem('userData');
        if (userDataLS) {
          try {
            return JSON.parse(userDataLS);
          } catch (e) {}
        }
        return null;
      });

      if (userData) {
        return {
          id: userData.id,
          nom: userData.nom || userData.name,
          prenom: userData.prenom || userData.firstName
        };
      }

      return { id: 'UNKNOWN', nom: '', prenom: '' };

    } catch (error) {
      console.error('Erreur extraction user data:', error);
      return null;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

module.exports = EDLoginService;
