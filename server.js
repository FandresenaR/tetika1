// Serveur de démonstration pour le détecteur de code Qiskit en mode RAG

// Configuration de l'environnement
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

// Importation des détecteurs de code
const { enhanceQiskitCodeDetection } = require('./lib/qiskit-detector');
const { enhanceQuantumCodeDetection } = require('./lib/quantum-code-detector');
const { enhanceRagCodeDetection } = require('./lib/rag-code-fixer-v2');

// Configuration du serveur Express
const app = express();
const port = process.env.PORT || 3001; // Utilisation du port 3001 pour éviter les conflits avec Next.js

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes API
app.post('/api/detect-qiskit', (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Le contenu est requis' });
    }
    
    // Application du détecteur de code Qiskit
    const enhanced = enhanceQiskitCodeDetection(content);
    
    return res.json({
      original: content,
      enhanced,
      detectedElements: enhanced !== content
    });
  } catch (error) {
    console.error('Erreur lors de la détection Qiskit:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/api/enhance-code', (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Le contenu est requis' });
    }
    
    // Application de la chaîne complète de traitement
    let enhanced = content;
    enhanced = enhanceQiskitCodeDetection(enhanced);
    enhanced = enhanceQuantumCodeDetection(enhanced);
    enhanced = enhanceRagCodeDetection(enhanced);
    
    return res.json({
      original: content,
      enhanced,
      detectedElements: enhanced !== content
    });
  } catch (error) {
    console.error('Erreur lors du traitement de code:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour la page d'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'qiskit-detector.html'));
});

// Lancement du serveur
app.listen(port, () => {
  console.log(`Serveur de détection de code quantique en cours d'exécution sur le port ${port}`);
  console.log(`Accédez à http://localhost:${port} pour tester le détecteur de code Qiskit`);
});
