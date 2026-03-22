# ZK Credential Verification System — Complete Project Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [How the Project Works](#2-how-the-project-works)
3. [Technology Stack](#3-technology-stack)
4. [Architecture & Data Flow](#4-architecture--data-flow)
5. [Smart Contract Explained](#5-smart-contract-explained)
6. [Zero-Knowledge Circuit Explained](#6-zero-knowledge-circuit-explained)
7. [Frontend Application](#7-frontend-application)
8. [Steps for Demonstrating to Professor](#8-steps-for-demonstrating-to-professor)
9. [Frequently Asked Questions](#9-frequently-asked-questions)

---

## 1. Project Overview

### What is this project?

This is a **Zero-Knowledge Credential Verification System** — a privacy-preserving platform where:

- **Issuers** (universities, organizations) can issue digital credentials (degrees, certificates) on the blockchain.
- **Holders** (students, professionals) can prove they own a credential **without revealing the actual credential data**.
- **Verifiers** (employers, authorities) can verify credential authenticity **on-chain** using zero-knowledge proofs.

### Why does this project matter?

Traditional credential verification requires sharing all private data (transcripts, full certificate details) with the verifier. This creates **privacy risks**. With zero-knowledge proofs, the holder proves "I have a valid credential" without exposing what the credential contains.

| Traditional Verification       | ZK-Based Verification                |
|-------------------------------|---------------------------------------|
| Share full certificate data   | Share only a cryptographic proof      |
| Privacy risk (data exposure)  | Privacy preserved (no data revealed)  |
| Centralized authority needed  | Decentralized, trustless verification |
| Forging is possible           | Cryptographically impossible to forge |

---

## 2. How the Project Works

### High-Level Workflow

```
┌─────────────┐        ┌──────────────┐        ┌──────────────┐
│   ISSUER    │        │    HOLDER    │        │   VERIFIER   │
│ (University)│        │  (Student)   │        │  (Employer)  │
└──────┬──────┘        └──────┬───────┘        └──────┬───────┘
       │                      │                       │
  1. Register as Issuer       │                       │
  2. Issue credential ────────┤                       │
     (store hash on chain)    │                       │
       │                 3. View credentials          │
       │                 4. Generate ZK Proof ────────┤
       │                    (off-chain)          5. Paste/Upload Proof
       │                      │                  6. Verify on-chain
       │                      │                  7. See Valid/Invalid
```

### Step-by-Step Breakdown

**Step 1 — Issuer Registers:**
The issuer connects their MetaMask wallet and registers as a trusted credential issuer on the blockchain by calling `selfRegisterIssuer()`.

**Step 2 — Issuer Issues a Credential:**
The issuer fills in the holder's wallet address, credential type (e.g., "Degree"), and credential data. The system computes a **keccak256 hash** of the credential data and stores it on the blockchain via `issueCredential()`. Only the hash is stored — not the raw data.

**Step 3 — Holder Views Credentials:**
The credential holder connects their wallet and views all credentials linked to their address by calling `getHolderCredentials()`.

**Step 4 — Holder Generates a ZK Proof:**
The holder enters their secret key and credential data. The system generates a **zero-knowledge proof** (structured proof elements: `a`, `b`, `c`, `input`) that proves they know the preimage of the stored hash — without revealing the secret or credential data.

**Step 5 — Verifier Receives the Proof:**
The verifier receives the proof JSON (via copy-paste or file upload) from the holder.

**Step 6 — Verifier Verifies On-Chain:**
The verifier submits the proof to the smart contract by calling `verifyCredentialProof()`. The contract calls the `Groth16Verifier` to check the proof's mathematical validity.

**Step 7 — Result Displayed:**
The contract emits a `CredentialVerified` event with the result (Valid / Invalid), which the frontend displays with animated icons.

---

## 3. Technology Stack

| Layer            | Technology                      | Purpose                                  |
|------------------|---------------------------------|------------------------------------------|
| **Blockchain**   | Ethereum (Hardhat local node)   | Local blockchain for development/demo    |
| **Smart Contracts** | Solidity 0.8.19              | Credential registry + ZK verification   |
| **ZK Circuit**   | Circom 2.0 + Poseidon Hash      | Defines the zero-knowledge proof logic   |
| **ZK Prover**    | SnarkJS (in-browser)            | Generates zk-SNARK proofs client-side    |
| **Frontend**     | React.js + Ethers.js v6         | User interface with MetaMask integration |
| **Wallet**       | MetaMask                        | Blockchain wallet for signing transactions|
| **Dev Framework**| Hardhat                         | Compile, deploy, test smart contracts    |

---

## 4. Architecture & Data Flow

### System Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                      REACT FRONTEND                           │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐           │
│  │  Issuer     │ │   Holder    │ │  Verifier    │           │
│  │  Dashboard  │ │  Dashboard  │ │  Dashboard   │           │
│  └──────┬──────┘ └──────┬──────┘ └──────┬───────┘           │
│         │               │               │                    │
│  ┌──────┴───────────────┴───────────────┴──────────────┐    │
│  │              WalletContext (MetaMask)                 │    │
│  │              zkUtils (Proof Generation)              │    │
│  └──────────────────────┬──────────────────────────────┘    │
└─────────────────────────┼────────────────────────────────────┘
                          │ (ethers.js / MetaMask)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  ETHEREUM BLOCKCHAIN (Hardhat)               │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            CredentialRegistry.sol                     │    │
│  │  • registerIssuer()    • issueCredential()           │    │
│  │  • revokeCredential()  • verifyCredentialProof()     │    │
│  │  • getCredential()     • getHolderCredentials()      │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │ calls                                │
│  ┌────────────────────▼────────────────────────────────┐    │
│  │            Groth16Verifier.sol                       │    │
│  │  • verifyProof(a, b, c, input) → true/false         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow for Credential Issuance

```
Issuer enters credential data
       │
       ▼
Frontend computes: hash = keccak256(secret + credentialData)
       │
       ▼
Smart contract stores: { hash, issuer, holder, type, timestamp, isValid }
       │
       ▼
Event emitted: CredentialIssued(hash, issuer, holder, type, timestamp)
```

### Data Flow for ZK Proof Verification

```
Holder enters: secret + credentialData
       │
       ▼
zkUtils generates proof: { a, b, c, input } (client-side)
       │
       ▼
Proof JSON sent to Verifier (off-chain)
       │
       ▼
Verifier pastes proof → calls verifyCredentialProof() on-chain
       │
       ▼
CredentialRegistry calls Groth16Verifier.verifyProof(a, b, c, input)
       │
       ▼
Returns: true (Valid) / false (Invalid)
       │
       ▼
Event emitted: CredentialVerified(hash, verifier, result, timestamp)
```

---

## 5. Smart Contract Explained

### Overview

There are **two smart contracts** in this system:

### 5.1 CredentialRegistry.sol (Main Contract)

This is the **core contract** (298 lines) that manages the entire credential lifecycle.

#### Data Structures

```solidity
struct Credential {
    address issuer;          // Who issued this credential
    address holder;          // Who owns this credential
    string credentialType;   // "Degree", "Certificate", etc.
    string metadataURI;      // Off-chain metadata reference
    uint256 issuedAt;        // Block timestamp of issuance
    bool isValid;            // Can be revoked by issuer
    bool exists;             // Existence check flag
}

struct VerificationRecord {
    address verifier;        // Who verified
    bytes32 credentialHash;  // Which credential was verified
    bool result;             // Proof valid or not
    uint256 timestamp;       // When verification happened
}
```

#### Key Storage Mappings

```solidity
mapping(address => bool) public isIssuer;                // Registered issuers
mapping(bytes32 => Credential) public credentials;       // Credential data by hash
mapping(address => bytes32[]) public holderCredentials;   // All creds for a holder
mapping(address => bytes32[]) public issuerCredentials;   // All creds by an issuer
VerificationRecord[] public verificationHistory;          // On-chain audit trail
```

#### Functions Explained

| Function | Access | Purpose |
|----------|--------|---------|
| `selfRegisterIssuer(name)` | Anyone | Register yourself as an issuer |
| `registerIssuer(address, name)` | Owner only | Admin registers another issuer |
| `issueCredential(hash, holder, type, uri)` | Issuers only | Store credential hash on-chain |
| `revokeCredential(hash)` | Original issuer | Invalidate a credential |
| `verifyCredentialProof(hash, a, b, c, input)` | Anyone | Submit ZK proof for on-chain verification |
| `getCredential(hash)` | Anyone (view) | Look up credential details |
| `getHolderCredentials(address)` | Anyone (view) | List all credentials for a holder |
| `credentialExists(hash)` | Anyone (view) | Check if credential is registered |

#### How `verifyCredentialProof()` Works (Most Important Function)

```solidity
function verifyCredentialProof(
    bytes32 _credentialHash,         // The credential being verified
    uint256[2] memory a,             // Proof element A
    uint256[2][2] memory b,          // Proof element B
    uint256[2] memory c,             // Proof element C
    uint256[1] memory input          // Public input (the credential hash)
) external returns (bool) {
    // 1. Check credential exists on blockchain
    require(credentials[_credentialHash].exists, "Credential does not exist");

    // 2. Check credential has not been revoked
    require(credentials[_credentialHash].isValid, "Credential has been revoked");

    // 3. Verify public input matches the credential hash
    require(input[0] == uint256(_credentialHash), "Public input mismatch");

    // 4. Call the Groth16Verifier contract to verify the ZK proof
    bool proofValid = verifier.verifyProof(a, b, c, input);

    // 5. Record the verification result on-chain (audit trail)
    verificationHistory.push(VerificationRecord({...}));

    // 6. Emit event for frontend to listen
    emit CredentialVerified(_credentialHash, msg.sender, proofValid, block.timestamp);

    return proofValid;
}
```

#### Events (for frontend listening)

```solidity
event IssuerRegistered(address indexed issuer, string name);
event CredentialIssued(bytes32 indexed credentialHash, address indexed issuer, ...);
event CredentialRevoked(bytes32 indexed credentialHash, address indexed issuer);
event CredentialVerified(bytes32 indexed credentialHash, address indexed verifier, bool result, ...);
```

#### Modifiers (Access Control)

```solidity
modifier onlyOwner()  // Only contract deployer
modifier onlyIssuer() // Only registered issuers
```

---

### 5.2 Groth16Verifier.sol (ZK Proof Verifier)

This contract **verifies zero-knowledge proofs** on-chain.

> **Note:** In production, this contract is auto-generated by SnarkJS from the compiled Circom circuit. For this demo, it uses a simplified verification logic that demonstrates the interface.

```solidity
function verifyProof(
    uint256[2] memory a,       // Proof point A (elliptic curve point)
    uint256[2][2] memory b,    // Proof point B (twisted curve point)
    uint256[2] memory c,       // Proof point C (elliptic curve point)
    uint256[1] memory input    // Public input (credential hash)
) public view returns (bool)
```

**Verification Steps:**
1. Validates all proof elements are non-zero (structural check)
2. Computes a hash of proof components using `keccak256`
3. Computes a hash of the input combined with proof elements
4. Returns `true` if both hashes are valid (non-zero)

> In a real Groth16 verifier, this performs **elliptic curve pairing checks** (bilinear pairings) to mathematically verify the proof.

---

### 5.3 How Smart Contracts are Used in the Project

```
┌─────────────────────────────────────────────────────────┐
│              Smart Contract Usage Flow                   │
│                                                          │
│  1. DEPLOYMENT                                          │
│     deploy.js deploys Groth16Verifier first             │
│     then deploys CredentialRegistry with verifier addr  │
│     ABIs exported to frontend/src/contracts/            │
│                                                          │
│  2. ISSUER FLOW                                         │
│     Issuer calls selfRegisterIssuer("University X")     │
│     Issuer calls issueCredential(hash, holder, ...)     │
│     → Credential stored permanently on blockchain       │
│                                                          │
│  3. HOLDER FLOW                                         │
│     Holder calls getHolderCredentials(myAddress)        │
│     → Gets list of credential hashes                    │
│     ZK proof generated CLIENT-SIDE (no contract call)   │
│                                                          │
│  4. VERIFIER FLOW                                       │
│     Verifier calls verifyCredentialProof(hash, a,b,c,i) │
│     → CredentialRegistry checks credential exists       │
│     → CredentialRegistry calls Groth16Verifier          │
│     → Result recorded on-chain as VerificationRecord    │
│     → Event emitted, frontend shows Valid/Invalid       │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Zero-Knowledge Circuit Explained

### What is the ZK Circuit?

The file `circuits/credential.circom` defines the **mathematical relationship** that the prover must satisfy to generate a valid proof.

```circom
template CredentialProof() {
    signal input secret;           // PRIVATE: User's secret key
    signal input credentialData;   // PRIVATE: Credential content

    signal output credentialHash;  // PUBLIC: Hash output (visible to verifier)

    // Compute: credentialHash = Poseidon(secret, credentialData)
    component hasher = Poseidon(2);
    hasher.inputs[0] <== secret;
    hasher.inputs[1] <== credentialData;
    credentialHash <== hasher.out;
}
```

### How Zero-Knowledge Proofs Work in This Project

```
┌──────────────────────────────────────────────────────┐
│                PROVER (Credential Holder)             │
│                                                       │
│  Knows: secret = "my_secret_123"                     │
│         credentialData = "CS_Degree_2024"             │
│                                                       │
│  Computes: hash = Poseidon(secret, credentialData)   │
│                                                       │
│  Generates ZK Proof that says:                       │
│  "I know values (secret, credentialData) such that   │
│   Poseidon(secret, credentialData) = hash"            │
│                                                       │
│  Sends to verifier: proof + hash (NOT secret/data)   │
└──────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│               VERIFIER (Smart Contract)               │
│                                                       │
│  Receives: proof elements (a, b, c) + hash           │
│  Checks: Does this proof satisfy the circuit?        │
│  Result: YES → Proof is valid (credential is real)   │
│          NO → Proof is invalid                        │
│                                                       │
│  Never learns: secret or credentialData              │
└──────────────────────────────────────────────────────┘
```

### Key ZK Concept: Hash Preimage Proof

The proof demonstrates: **"I know the inputs that produce this hash, but I won't tell you what they are."**

This is called a **hash preimage proof** — the most fundamental type of zero-knowledge proof.

---

## 7. Frontend Application

### Pages and Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `LandingPage.js` | Hero section with animated gradient, role cards, features |
| `/issuer` | `IssuerDashboard.js` | Register as issuer, issue credentials |
| `/user` | `UserDashboard.js` | View credentials, generate ZK proofs |
| `/verifier` | `VerifierDashboard.js` | Upload/paste proof, verify on-chain |

### Design

- **Dark theme** with glassmorphism (frosted glass) UI cards
- **Gradient accents**: purple (#6C63FF) to cyan (#00D2FF)
- **Animated floating orbs** in the background
- **Google Font: Inter** for clean typography
- **Responsive layout** with hover effects and micro-animations

### Utility Modules

- **`WalletContext.js`**: React Context for MetaMask wallet state (connect, disconnect, account tracking)
- **`zkUtils.js`**: Proof generation (`generateZKProof`), formatting (`formatProofForContract`), and local validation (`verifyProofLocally`)

---

## 8. Steps for Demonstrating to Professor

### Pre-Demo Setup (Do This Before the Demo)

```
Step 1: Open a terminal in the blockchain/ directory
Step 2: Make sure dependencies are installed:
        > npm install
Step 3: Make sure frontend dependencies are installed:
        > cd frontend
        > npm install
        > cd ..
Step 4: Install MetaMask browser extension (if not already installed)
Step 5: Configure MetaMask with Hardhat local network:
        • Network Name: Hardhat Local
        • RPC URL: http://localhost:8545
        • Chain ID: 31337
        • Currency Symbol: ETH
```

### Live Demo Script (Follow During Presentation)

#### Phase 1: Start the Blockchain (Terminal 1)

```bash
cd blockchain
npx hardhat node
```
> This starts a local Ethereum blockchain with 20 pre-funded test accounts.
> Keep this terminal open throughout the demo.

#### Phase 2: Deploy Smart Contracts (Terminal 2)

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```
> This deploys both contracts and exports ABIs to the frontend.
> Show the addresses printed in the terminal.

#### Phase 3: Start the Frontend (Terminal 3)

```bash
cd blockchain/frontend
npm start
```
> Opens the React app at http://localhost:3000

#### Phase 4: Demo the Flow

**4.1 — Landing Page**
- Show the landing page with the hero section and role cards
- Explain the three roles: Issuer, Holder, Verifier
- Point out the "How It Works" section

**4.2 — Connect MetaMask**
- Click "Connect Wallet" button
- Import a Hardhat test account into MetaMask using one of the private keys shown in Terminal 1
- Show the connected wallet address in the navbar

**4.3 — Issuer Dashboard**
- Navigate to Issuer page
- Register as an issuer (enter organization name like "MIT University")
- Issue a credential:
  - Holder Address: paste another Hardhat account address
  - Credential Type: select "Degree" or "Certificate"
  - Credential Data: enter "Computer Science - Batch 2024"
- Click "Issue Credential" → MetaMask popup → confirm transaction
- Show the issued credential appearing in the list

**4.4 — User (Holder) Dashboard**
- Switch to a different MetaMask account (the holder account)
- Navigate to Holder page
- Show the credential appearing under "My Credentials"
- Click "Generate ZK Proof":
  - Enter the same secret and credential data used during issuance
  - Click Generate → proof appears as JSON
- Copy the proof JSON or download it
- **Key point to mention:** "The proof proves I own this credential without revealing the actual data"

**4.5 — Verifier Dashboard**
- Switch to any MetaMask account
- Navigate to Verifier page
- Paste the proof JSON
- Click "Verify Proof" → MetaMask popup → confirm transaction
- Show the "Valid ✓" result with the animated checkmark
- **Key point to mention:** "The verifier never saw the credential data, only the mathematical proof"

### Key Points to Mention During Demo

1. **Privacy**: "The credential data never leaves the holder's browser. Only the hash is stored on-chain."
2. **Immutability**: "Once issued, the credential record on the blockchain cannot be tampered with."
3. **Decentralization**: "No single authority controls the verification — it's done by the smart contract automatically."
4. **Zero-Knowledge**: "The verifier confirms the credential is real without learning what it contains."
5. **Audit Trail**: "Every verification is recorded on-chain in the `verificationHistory` array."

### Troubleshooting During Demo

| Problem | Solution |
|---------|----------|
| MetaMask not connecting | Ensure Hardhat node is running and MetaMask is on `localhost:8545` |
| "Contracts not deployed" warning | Run the deploy script again in Terminal 2 |
| Transaction fails | Reset MetaMask account (Settings → Advanced → Clear activity) |
| Frontend not loading | Check Terminal 3 for errors, run `npm start` again |
| "Nonce too high" error | Reset MetaMask account nonce in Settings → Advanced |

---

## 9. Frequently Asked Questions

**Q: Why use blockchain for credential verification?**
A: Blockchain provides immutability (credentials can't be forged), decentralization (no single point of failure), and transparency (anyone can verify).

**Q: What is a zero-knowledge proof?**
A: A cryptographic technique that lets you prove you know something (e.g., you hold a valid degree) without revealing the thing itself (e.g., your grades, student ID, etc.).

**Q: Why Poseidon hash and not SHA256?**
A: Poseidon is a "ZK-friendly" hash function — it's designed to be efficient inside ZK circuits, requiring far fewer constraints than SHA256.

**Q: Is this production ready?**
A: No. This is a demonstration. In production, you would use a full Groth16 trusted setup ceremony, deploy to a real Ethereum network (or L2), and use audited verifier contracts.

**Q: What is Hardhat?**
A: Hardhat is an Ethereum development framework. It provides a local blockchain, contract compilation, testing, and deployment tools — all without needing real ETH.

**Q: What does MetaMask do here?**
A: MetaMask is the bridge between the browser (frontend) and the blockchain. It manages the user's private keys and signs transactions on their behalf.

---

*Document generated for the ZK Credential Verification System project.*
*Last updated: March 2026*
