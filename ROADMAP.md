# Detailed Implementation Roadmap: Agentic Security Arbiter

Cette roadmap détaille pas à pas l'implémentation de notre solution "Micro-Arbitration as a Service" pour le hackathon Arc. L'objectif est de construire une preuve de concept (PoC) robuste, visuellement impressionnante pour la démo, et qui valide à 100% les critères d'évaluation.

---

## 1. Stack Technique Détaillée

### A. Blockchain & Smart Contracts (Settlement Layer)
*   **Réseau :** Arc L1 (EVM-compatible).
*   **Token :** USDC (Native gas token & value token).
*   **Langage Contrat :** Solidity (via Hardhat ou Foundry) pour déployer le contrat d'Escrow.
*   **Interaction On-Chain :** `ethers.js` ou `viem` (TypeScript).

### B. Backend (The Micro-Arbiter API)
*   **Environnement :** Node.js avec TypeScript.
*   **Framework API :** Express.js ou Hono (pour la légèreté).
*   **Intelligence Artificielle :** Google AI Studio API (`@google/generative-ai`) utilisant le modèle **Gemini 1.5 Flash** (le plus rapide et économique pour l'arbitrage haute fréquence).
*   **Paiements :** Circle Nanopayments API. Nous utiliserons le standard x402 (Web-native payment) pour facturer 0.001$ par appel d'API.

### C. Client / Agent (The Demo Driver)
*   **Environnement :** Node.js script.
*   **Rôle :** Simuler un agent autonome qui génère 50+ transactions à haute fréquence.

### D. Visualisation (Optionnel mais recommandé pour la vidéo)
*   **Frontend :** Next.js avec TailwindCSS.
*   **Rôle :** Un tableau de bord en direct montrant les requêtes reçues, le verdict de l'IA (Approve/Reject), et le flux des nanopaiements de 0.001$.

---

## 2. Roadmap d'Implémentation Étape par Étape

### Phase 1 : Infrastructure Blockchain & Smart Contract (Jour 1)
**Objectif :** Avoir un contrat capable de bloquer des fonds et de les libérer uniquement si l'IA (l'Arbitre) donne son accord cryptographique.

1.  **Configuration Arc :** Configurer le portefeuille développeur (Circle Wallets) et récupérer de l'USDC sur le Testnet Arc.
2.  **Développement `MicroEscrow.sol` :**
    *   Créer un contrat où l'Agent peut déposer des USDC.
    *   Créer une fonction `executeAction(payload, signature)`.
    *   La fonction doit vérifier que la `signature` provient bien de la clé privée de notre backend (Le Micro-Arbitre). Si la signature est valide, les USDC sont transférés à la cible.
3.  **Déploiement :** Déployer le contrat sur le Testnet Arc L1 et vérifier le contrat sur l'explorateur de blocs.

### Phase 2 : Le Backend "Micro-Arbiter" et Intégration Gemini (Jour 2)
**Objectif :** Un serveur qui reçoit une demande, demande l'avis de Gemini, et retourne une signature d'approbation.

1.  **Setup du Serveur :** Initialiser le projet Node.js/TypeScript.
2.  **Intégration Gemini :**
    *   Créer un prompt système strict : *"Tu es un Arbitre de Sécurité. Voici la politique de l'utilisateur (ex: max 0.1 USDC par action, pas de tokens inconnus). Voici l'action proposée par l'agent. Réponds uniquement par un JSON : { status: 'APPROVE' | 'REJECT', reason: '...' }."*
3.  **Génération de Signature :** Si Gemini retourne `APPROVE`, le backend signe cryptographiquement le payload (l'action) avec sa clé privée (`ethers.Wallet`).

### Phase 3 : L'Intégration Cruciale "Circle Nanopayments" (Jour 3)
**Objectif :** Monétiser le backend à la micro-transaction (Le cœur du Hackathon).

1.  **Configuration Circle :** Générer les clés API pour les Nanopayments.
2.  **Mise en place du flux x402 :**
    *   Quand l'Agent appelle l'API `/api/verify`, le serveur vérifie si un jeton de paiement valide est fourni.
    *   Sinon, il renvoie une erreur HTTP 402 (Payment Required) avec une facture de **0.001 USDC**.
    *   L'Agent paie la facture via l'infrastructure Circle.
    *   Une fois payé, le serveur exécute le prompt Gemini et renvoie la signature d'approbation.

### Phase 4 : Le Script "Demo Driver" (Agent Haute Fréquence) (Jour 4)
**Objectif :** Produire les 50+ transactions exigées pour la démo de manière automatisée.

1.  **Création du Script Agent :**
    *   Générer un tableau de 60 actions factices (ex: 55 achats d'API valides, 5 tentatives d'achat malveillantes).
    *   Faire une boucle `for` qui s'exécute rapidement.
2.  **Cycle complet dans la boucle :**
    *   Demander l'arbitrage.
    *   Payer les 0.001 USDC via Nanopayments.
    *   Recevoir la signature (si approuvé).
    *   Appeler le contrat `MicroEscrow` sur Arc pour exécuter l'action finale.

### Phase 5 : Interface & Production de la Vidéo (Jour 5)
**Objectif :** Rendre l'invisible visible pour les juges.

1.  **Dashboard CLI ou Web :** Afficher un log esthétique montrant :
    *   [Paiement Reçu] 0.001 USDC -> [Gemini Verification] En cours... -> [Verdict] APPROVE -> [Arc TX] 0xabc123...
2.  **Enregistrement de la démo :**
    *   Montrer l'exécution du script (les 50+ transactions qui défilent).
    *   Ouvrir la **Circle Developer Console** pour montrer le flux des nanopaiements de 0.001 USDC.
    *   Ouvrir l'**Arc Block Explorer** pour montrer les transactions finales sur la blockchain.
3.  **Explication de la Marge (The Margin Explanation) :** Insérer dans la présentation le slide/la voix off expliquant pourquoi ce modèle économique (facturer l'IA 0.001$ à chaque micro-action d'un agent) n'est possible *que* sur Arc grâce à l'absence de gas fees élevés.

---

## 3. Structure du Dépôt (Proposée)

```text
arc-hackathon/
├── contracts/          # Smart contracts (Solidity)
│   └── MicroEscrow.sol
├── backend/            # Serveur Micro-Arbiter
│   ├── src/
│   │   ├── gemini.ts   # Logique d'appel IA
│   │   ├── circle.ts   # Gestion des nanopaiements
│   │   └── server.ts   # API Express
├── agent-client/       # Le script de démo (Demo Driver)
│   └── run_demo.ts
├── frontend/           # (Optionnel) Dashboard de visualisation
├── SPECIFICATION.md
└── ROADMAP.md
```
