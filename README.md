# 🔐 ZK Credential Verification System

A privacy-preserving credential verification platform built on Ethereum using **Zero-Knowledge Proofs**. Issuers can issue digital credentials on-chain, holders can prove ownership without revealing sensitive data, and verifiers can validate credentials trustlessly.

![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue?logo=solidity)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Hardhat](https://img.shields.io/badge/Hardhat-2.x-yellow?logo=ethereum)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🚀 Features

- **Issuer Dashboard** — Register as a trusted authority and issue credentials on-chain
- **Holder Dashboard** — View credentials and generate zero-knowledge proofs
- **Verifier Dashboard** — Verify proofs on-chain without accessing personal data
- **ZK Proof Generation** — Prove credential ownership without revealing private data
- **On-Chain Verification** — Smart contract validates proofs cryptographically
- **MetaMask Integration** — Auto-connects to the correct blockchain network
- **Immutable Audit Trail** — Every verification is recorded on the blockchain

---

## 🏗️ Architecture

```
┌──────────────────────────────────┐
│        React Frontend            │
│  (Issuer / Holder / Verifier)    │
└──────────────┬───────────────────┘
               │ ethers.js + MetaMask
               ▼
┌──────────────────────────────────┐
│     Ethereum Blockchain          │
│  ┌────────────────────────────┐  │
│  │  CredentialRegistry.sol    │  │
│  │  (Issue, Revoke, Verify)   │  │
│  └─────────────┬──────────────┘  │
│                │ calls            │
│  ┌─────────────▼──────────────┐  │
│  │  Groth16Verifier.sol       │  │
│  │  (ZK Proof Verification)   │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

---

## 📂 Project Structure

```
blockchain/
├── contracts/
│   ├── CredentialRegistry.sol    # Credential management + ZK verification
│   └── Groth16Verifier.sol       # ZK-SNARK proof verifier
├── circuits/
│   └── credential.circom         # Circom ZK circuit (Poseidon hash)
├── scripts/
│   └── deploy.js                 # Contract deployment + ABI export
├── test/
│   └── CredentialRegistry.test.js
├── frontend/
│   └── src/
│       ├── components/           # Issuer, Holder, Verifier dashboards
│       ├── utils/                # WalletContext, zkUtils
│       └── App.js                # Router + contract loading
├── hardhat.config.js
└── package.json
```

---

## ⚡ Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MetaMask](https://metamask.io/) browser extension

### 1. Install Dependencies

```bash
cd blockchain
npm install
cd frontend
npm install
cd ..
```

### 2. Start Local Blockchain (Terminal 1)

```bash
npx hardhat node
```

### 3. Deploy Contracts (Terminal 2)

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 4. Start Frontend (Terminal 3)

```bash
cd frontend
npm start
```

### 5. Configure MetaMask

The app auto-switches MetaMask to the Hardhat network. Just click **Connect** and approve.

- **Network**: Hardhat Local
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`

---

## 🎮 Usage Flow

```
1. ISSUER    →  Register  →  Issue credential (hash stored on-chain)
2. HOLDER    →  Enter secret + data  →  Generate ZK Proof  →  Copy/Download
3. VERIFIER  →  Paste proof JSON  →  Verify on-chain  →  Valid ✓ / Invalid ✗
```

**Key Concept:** The verifier confirms the credential is authentic **without ever seeing** the credential data. Only a cryptographic proof is verified.

---

## 🔒 How Zero-Knowledge Proofs Work Here

```
Holder knows: secret + credentialData
              ↓
Computes:     hash = Poseidon(secret, credentialData)
              ↓
Generates:    ZK Proof → "I know the preimage of this hash"
              ↓
Verifier:     Checks proof on-chain → Valid/Invalid
              (never learns secret or credentialData)
```

---

## 🧪 Smart Contracts

### CredentialRegistry.sol

| Function | Description |
|----------|-------------|
| `selfRegisterIssuer(name)` | Register as a credential issuer |
| `issueCredential(hash, holder, type, uri)` | Issue a credential on-chain |
| `revokeCredential(hash)` | Revoke a credential |
| `verifyCredentialProof(hash, a, b, c, input)` | Verify a ZK proof on-chain |
| `getHolderCredentials(address)` | Get all credentials for a holder |

### Groth16Verifier.sol

Verifies that ZK proof elements are cryptographically linked, ensuring forged proofs are rejected.

---

## 🧪 Running Tests

```bash
npx hardhat test
```

```
  CredentialRegistry
    ✓ should auto-register deployer as issuer
    ✓ should allow self-registration as issuer
    ✓ should prevent duplicate issuer registration
    ✓ should issue a credential
    ✓ should prevent non-issuers from issuing
    ✓ should prevent duplicate credentials
    ✓ should track holder credentials
    ✓ should allow issuer to revoke
    ✓ should prevent non-issuer from revoking

  9 passing
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Solidity 0.8.19 | Smart contracts |
| Circom 2.0 | ZK circuit definition |
| Hardhat | Ethereum dev framework |
| React 18 | Frontend UI |
| Ethers.js v6 | Blockchain interaction |
| MetaMask | Wallet & transaction signing |
| SnarkJS | ZK proof generation |

---

## 📄 License

MIT

---

*Built with ❤️ using Ethereum, Zero-Knowledge Proofs, and React*
