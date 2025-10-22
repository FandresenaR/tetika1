# 🧪 Guide de Tests - Système de Réponses Refactorisé

## 🎯 Objectif

Ce guide vous aide à valider que la refactorisation du système de réponses a bien résolu les problèmes de bulles vides et de messages incomplets.

---

## ✅ Checklist de Tests Manuels

### **Test 1: Premier Prompt - Bulle Vide** ⭐⭐⭐
**Objectif:** Vérifier qu'aucune bulle vide n'apparaît lors du premier envoi.

**Étapes:**
1. Ouvrir l'application en mode incognito (pour être sûr d'avoir un état propre)
2. Saisir un message simple: "Bonjour, comment vas-tu ?"
3. Cliquer sur Envoyer

**✅ Résultat Attendu:**
- Le message utilisateur apparaît immédiatement
- L'indicateur de chargement "TETIKA est en train de réfléchir..." s'affiche
- La réponse de l'IA apparaît **complète dès le début**, pas de bulle vide
- Le contenu est entièrement visible

**❌ Échec si:**
- Une bulle vide apparaît avant la réponse
- Le message apparaît progressivement (lettre par lettre)
- Le message est tronqué

---

### **Test 2: Message Long - Contenu Complet** ⭐⭐⭐
**Objectif:** Vérifier que les réponses longues s'affichent entièrement.

**Étapes:**
1. Activer le mode RAG (bouton bleu "RAG")
2. Envoyer: "Explique-moi en détail l'histoire de l'intelligence artificielle de 1950 à aujourd'hui"
3. Attendre la réponse

**✅ Résultat Attendu:**
- La réponse complète s'affiche
- Les sources sont présentes en bas
- Le bouton "Afficher les sources" fonctionne
- Le markdown est bien formaté (titres, listes, etc.)

**❌ Échec si:**
- Le message est tronqué
- Les sources ne s'affichent pas
- Le formatage markdown est cassé

---

### **Test 3: Erreur Réseau - Gestion Propre** ⭐⭐
**Objectif:** Vérifier que les erreurs sont gérées gracieusement.

**Étapes:**
1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet Network
3. Activer "Offline" mode
4. Envoyer un message

**✅ Résultat Attendu:**
- L'indicateur de chargement se lance
- Un message d'erreur clair apparaît: "Erreur de connexion au serveur. Vérifiez votre connexion internet."
- L'UI reste utilisable
- Pas de crash ni de console rouge

**❌ Échec si:**
- L'application plante
- Aucun message d'erreur n'apparaît
- L'UI est bloquée

---

### **Test 4: Annulation - Nettoyage Propre** ⭐⭐
**Objectif:** Vérifier que l'annulation fonctionne correctement.

**Étapes:**
1. Envoyer un long prompt (ex: "Écris-moi une longue histoire...")
2. Cliquer rapidement sur le bouton "Arrêter" (si visible)
3. OU rafraîchir la page pendant le chargement

**✅ Résultat Attendu:**
- Le chargement s'arrête immédiatement
- Aucun message d'erreur dans la console
- L'UI reste utilisable
- Un nouveau message peut être envoyé

**❌ Échec si:**
- Le chargement continue
- Des erreurs s'affichent dans la console
- L'UI est bloquée

---

### **Test 5: Mode RAG Auto - Activation Automatique** ⭐⭐
**Objectif:** Vérifier que le RAG s'active automatiquement quand nécessaire.

**Étapes:**
1. S'assurer que le mode RAG est désactivé (pas de badge bleu)
2. Envoyer: "Quelles sont les dernières actualités sur l'IA ?"
3. Attendre la réponse

**✅ Résultat Attendu:**
- Le mode RAG s'active automatiquement (badge bleu apparaît)
- Un message indique: "J'ai automatiquement activé la recherche web..."
- Des sources sont présentes
- La réponse contient des informations récentes

**❌ Échec si:**
- Le RAG ne s'active pas automatiquement
- Pas de mention de l'activation automatique
- Pas de sources

---

### **Test 6: Régénération - Contenu Stable** ⭐
**Objectif:** Vérifier que la régénération fonctionne correctement.

**Étapes:**
1. Envoyer un message simple: "Raconte-moi une blague"
2. Attendre la réponse
3. Cliquer sur le bouton "Régénérer"
4. Attendre la nouvelle réponse

**✅ Résultat Attendu:**
- La nouvelle réponse remplace l'ancienne
- Le nouveau contenu est différent
- Pas de bulle vide
- L'historique reste cohérent

**❌ Échec si:**
- Deux réponses s'affichent
- Le message est vide
- L'historique est dupliqué

---

### **Test 7: Scraping - Workflow Complet** ⭐
**Objectif:** Vérifier que le système de scraping fonctionne correctement.

**Étapes:**
1. Activer le mode RAG
2. Envoyer: "@scraper https://example.com extract main content"
3. Attendre la réponse

**✅ Résultat Attendu:**
- Le processus de scraping démarre
- Des étapes de "thinking" s'affichent dans la sidebar
- Une réponse complète avec les données extraites apparaît
- Le rapport de scraping est accessible

**❌ Échec si:**
- Erreur pendant le scraping
- Pas de thinking steps
- Réponse vide ou incomplète

---

### **Test 8: Fichier Joint - Traitement Correct** ⭐
**Objectif:** Vérifier que les fichiers joints sont traités correctement.

**Étapes:**
1. Cliquer sur "Uploader un fichier"
2. Sélectionner un fichier texte simple (ex: .txt)
3. Envoyer le message: "Résume ce fichier"

**✅ Résultat Attendu:**
- L'icône de fichier apparaît sur le message utilisateur
- La réponse de l'IA fait référence au contenu du fichier
- Le résumé est pertinent

**❌ Échec si:**
- Le fichier n'est pas reconnu
- La réponse ignore le fichier
- Erreur pendant le traitement

---

## 🔍 Tests de Régression

### **Test R1: Navigation Historique**
1. Créer 3 conversations différentes
2. Basculer entre elles
3. Vérifier que les messages s'affichent correctement

### **Test R2: Thème Clair/Sombre**
1. Basculer entre les thèmes
2. Vérifier que l'UI reste cohérente
3. Vérifier que les messages restent lisibles

### **Test R3: Mobile Responsive**
1. Ouvrir sur mobile ou réduire la fenêtre
2. Envoyer des messages
3. Vérifier que l'UI s'adapte correctement

---

## 📊 Rapport de Tests

Remplir après chaque session de tests:

| Test | Statut | Notes | Date |
|------|--------|-------|------|
| Test 1 - Premier Prompt | ⏳ | | |
| Test 2 - Message Long | ⏳ | | |
| Test 3 - Erreur Réseau | ⏳ | | |
| Test 4 - Annulation | ⏳ | | |
| Test 5 - RAG Auto | ⏳ | | |
| Test 6 - Régénération | ⏳ | | |
| Test 7 - Scraping | ⏳ | | |
| Test 8 - Fichier Joint | ⏳ | | |
| Test R1 - Navigation | ⏳ | | |
| Test R2 - Thème | ⏳ | | |
| Test R3 - Mobile | ⏳ | | |

**Légende:**
- ⏳ = Non testé
- ✅ = Passé
- ❌ = Échec
- ⚠️ = Partiel

---

## 🐛 Rapport de Bug

Si vous trouvez un problème:

```markdown
### Bug: [Titre Court]

**Priorité:** 🔴 Critique / 🟠 Haute / 🟡 Moyenne / 🟢 Basse

**Description:**
[Décrire le problème en détail]

**Étapes de Reproduction:**
1. [Étape 1]
2. [Étape 2]
3. [Étape 3]

**Résultat Attendu:**
[Ce qui devrait se passer]

**Résultat Obtenu:**
[Ce qui se passe réellement]

**Console Errors:**
```
[Copier les erreurs de la console ici]
```

**Screenshots:**
[Ajouter des captures d'écran si pertinent]

**Environnement:**
- Navigateur: [Chrome/Firefox/Safari]
- Version: [Numéro de version]
- OS: [Windows/Mac/Linux]
```

---

## 💡 Conseils de Test

1. **Console Ouverte:** Toujours avoir la console DevTools ouverte pendant les tests
2. **Mode Incognito:** Utiliser le mode incognito pour tests propres
3. **Logs Détaillés:** Chercher les logs avec `[ChatService]` et `[useChatMessages]`
4. **Network Tab:** Surveiller les requêtes réseau pour voir les réponses brutes
5. **React DevTools:** Utile pour inspecter l'état des composants

---

**Bonne chance pour les tests! 🚀**
