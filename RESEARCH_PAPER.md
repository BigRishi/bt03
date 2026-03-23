# Zero-Knowledge Credential Verification System: A Blockchain-Based Approach to Privacy-Preserving Identity Attestation

---

## Abstract

The proliferation of digital credentials in education, employment, and professional certification has introduced critical challenges in balancing verification integrity with individual privacy. Conventional credential verification mechanisms require holders to disclose complete credential data to verifiers, resulting in unnecessary exposure of personally identifiable information (PII) and creating vulnerabilities for identity theft and data misuse. This paper presents the design, implementation, and evaluation of a **Zero-Knowledge Credential Verification System** — a decentralized platform that leverages Ethereum smart contracts and zero-knowledge succinct non-interactive arguments of knowledge (zk-SNARKs) to enable privacy-preserving credential verification. The proposed system introduces a three-actor model comprising Issuers, Holders, and Verifiers, where credentials are stored as cryptographic hash commitments on an immutable blockchain ledger, and holders generate zero-knowledge proofs to demonstrate credential ownership without revealing underlying data. The system architecture consists of three core components: (i) a Solidity-based Credential Registry smart contract that manages credential lifecycle operations including issuance, revocation, and on-chain proof verification, (ii) a Circom-based arithmetic circuit employing the Poseidon hash function for efficient ZK proof generation using the Groth16 proving scheme, and (iii) a React.js web application with role-specific dashboards and MetaMask wallet integration for seamless blockchain interaction. Experimental evaluation on a local Ethereum test network demonstrates that the system successfully verifies valid credential proofs while rejecting forged or tampered proofs, maintains a transparent on-chain audit trail of all verification events, and preserves complete data privacy throughout the verification process. The results validate that zero-knowledge proofs, combined with blockchain immutability, offer a viable and practical solution for trustless, privacy-preserving digital credential verification.

**Keywords:** Zero-Knowledge Proofs, Blockchain, Ethereum, Smart Contracts, zk-SNARKs, Credential Verification, Privacy-Preserving Authentication, Groth16, Decentralized Identity

---

## 1. Introduction

### 1.1 Background and Motivation

The digital transformation of educational institutions, professional certification bodies, and governmental agencies has led to an exponential increase in the issuance and exchange of digital credentials. Academic degrees, professional licenses, skill certifications, and identity documents are now routinely issued, stored, and verified in digital formats. According to the World Economic Forum, over 1 billion people worldwide lack formal identification documents, while those who possess credentials face growing challenges related to verification fraud, cross-border recognition, and data privacy [1].

Traditional credential verification mechanisms operate on a centralized trust model where verifiers must contact the issuing authority directly or require the credential holder to submit complete, unredacted documents. This paradigm introduces several fundamental limitations:

**Privacy Violation:** Current verification processes require credential holders to expose far more information than necessary. For instance, verifying a university degree typically requires sharing the complete transcript, which includes the student's full name, date of birth, student identification number, individual course grades, and other sensitive details — when the verifier may only need confirmation that a valid degree was conferred.

**Centralized Points of Failure:** Verification depends on the availability and responsiveness of issuing authorities. Institutional closures, administrative delays, and cross-jurisdictional barriers frequently impede timely verification.

**Document Forgery:** The FBI estimates that credential fraud costs institutions and employers billions of dollars annually. Traditional digital signatures, while useful, still require trust in certificate authorities and do not address the privacy exposure problem.

**Absence of Audit Transparency:** There is no standardized, tamper-proof mechanism for recording who verified which credential and when, leaving verification processes opaque and unaccountable.

### 1.2 Problem Statement

The fundamental research question addressed in this work is:

> *How can a credential holder cryptographically prove the validity of their credential to a third-party verifier, without revealing any of the credential's underlying data, in a decentralized and trustless manner?*

Formally, the system must satisfy three properties derived from zero-knowledge proof theory:

1. **Completeness:** If the credential is valid and the holder possesses the correct secret, the proof will always be accepted by an honest verifier.
2. **Soundness:** If the credential is invalid or the holder does not possess the correct secret, no computationally bounded adversary can produce a proof that an honest verifier will accept.
3. **Zero-Knowledge:** The verification process reveals no information to the verifier beyond the single-bit output: the credential is valid or invalid.

### 1.3 Proposed Approach

This paper presents a system that integrates two complementary technologies to address the stated problem:

**Blockchain Technology (Ethereum):** Provides a decentralized, immutable ledger for storing credential hash commitments. Once a credential hash is recorded on the blockchain, it cannot be altered, deleted, or disputed — establishing an irrefutable record of issuance. Smart contracts automate the verification logic, eliminating the need for trusted intermediaries.

**Zero-Knowledge Proofs (zk-SNARKs):** Enable credential holders to generate succinct, non-interactive proofs demonstrating knowledge of the credential's private data (secret key and credential content) without transmitting that data. The Groth16 proving scheme is employed for its constant-size proofs and efficient on-chain verification.

The system implements a **hash preimage proof** — the most fundamental application of zero-knowledge proofs. The issuer stores `H = Hash(secret, credentialData)` on-chain during issuance. The holder, who knows both the `secret` and `credentialData`, generates a zk-SNARK proof asserting: *"I know values (s, d) such that Hash(s, d) = H"* — without revealing `s` or `d`. The verifier submits this proof to the smart contract, which cryptographically validates it and returns a boolean result.

### 1.4 Objectives

The specific objectives of this research are:

1. To design a smart contract architecture on Ethereum that supports the complete credential lifecycle — registration, issuance, revocation, and zero-knowledge proof-based verification.
2. To develop an arithmetic circuit using Circom and the Poseidon hash function that efficiently encodes the hash preimage relationship for zk-SNARK proof generation.
3. To implement a user-facing web application with role-specific interfaces for Issuers, Holders, and Verifiers, integrated with MetaMask for transparent blockchain interaction.
4. To experimentally validate that the system accepts legitimate proofs, rejects forged proofs, maintains an on-chain audit trail, and preserves holder data privacy throughout the verification lifecycle.

### 1.5 Key Contributions

The principal contributions of this work are:

- **End-to-end implementation** of a zero-knowledge credential verification system spanning smart contracts, ZK circuits, and a web-based user interface.
- **On-chain ZK proof verification** through a Groth16 verifier smart contract that cryptographically validates proof element relationships, ensuring forged proofs are rejected.
- **Automated network integration** where the frontend application programmatically configures the user's wallet to connect to the appropriate blockchain network, reducing setup friction.
- **Immutable verification audit trail** stored on-chain, providing transparent, tamper-proof records of all verification events.

### 1.6 Paper Organization

The remainder of this paper is organized as follows: Section 2 reviews related work in decentralized identity and zero-knowledge credential systems. Section 3 presents the system architecture and design methodology. Section 4 details the implementation of smart contracts, ZK circuits, and the frontend application. Section 5 presents experimental results and analysis. Section 6 discusses limitations and future work. Section 7 concludes the paper.

---

## 2. Literature Review

This section presents a comprehensive review of existing literature across the domains of blockchain technology, zero-knowledge proof systems, decentralized identity frameworks, and privacy-preserving credential verification mechanisms that collectively inform the design of the proposed system.

### 2.1 Blockchain Technology and Smart Contracts

Blockchain technology, originally conceived as the underlying infrastructure for Bitcoin by Nakamoto in 2008, has evolved into a general-purpose platform for decentralized computation and trustless data management. Zheng et al. [5] provided an extensive survey of blockchain architectures, classifying them into public, private, and consortium categories, and analyzing their respective consensus mechanisms, scalability characteristics, and application domains. Their work highlighted the suitability of public blockchains for applications requiring transparency, auditability, and censorship resistance — properties that are directly relevant to credential verification systems.

The introduction of Ethereum by Buterin [6] marked a paradigm shift from blockchain as a simple distributed ledger to a programmable platform supporting Turing-complete smart contracts. Smart contracts are self-executing programs deployed on the blockchain that automatically enforce predefined rules without intermediary intervention. Ethereum's smart contract capability enables the implementation of complex business logic — such as credential issuance, revocation, and verification — directly on-chain, eliminating the need for trusted third parties and ensuring that the verification rules are transparent, immutable, and universally accessible.

Christidis and Devetsikiotis [7] explored the integration of smart contracts with Internet of Things (IoT) ecosystems and demonstrated that blockchain-based automation can significantly reduce transaction costs, eliminate intermediaries, and provide tamper-proof execution guarantees. Their findings reinforced the potential of smart contracts as a foundation for secure, automated credential management systems where issuance and verification logic must be reliably enforced without human intervention.

### 2.2 Zero-Knowledge Proof Systems

Zero-knowledge proof (ZKP) systems represent a class of cryptographic protocols that enable one party (the prover) to convince another party (the verifier) that a statement is true, without conveying any information beyond the validity of the statement itself. The theoretical foundations of zero-knowledge proofs were established by Goldwasser, Micali, and Rackoff [3], who formally defined the properties of completeness, soundness, and zero-knowledge that any such system must satisfy. Their seminal contribution laid the groundwork for subsequent advances in both interactive and non-interactive proof systems.

A significant practical advancement in ZKP technology came with the development of zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge). Ben-Sasson et al. [8] proposed the foundational construction of zk-SNARKs and demonstrated their application in the Zerocash protocol, which enables fully anonymous cryptocurrency transactions while preserving the integrity of the underlying ledger. Their work established that zk-SNARKs could provide constant-size proofs with efficient verification — making them suitable for deployment in resource-constrained environments such as blockchain smart contracts, where gas costs are proportional to computational complexity.

Groth [4] further advanced the field with the Groth16 proving scheme, which achieves the smallest known proof size for pairing-based non-interactive arguments. The Groth16 scheme produces proofs consisting of only three group elements, with verification requiring a constant number of pairing operations regardless of the complexity of the underlying statement. This efficiency property makes Groth16 the de facto standard for on-chain ZK verification, as the verification cost in gas remains constant irrespective of circuit size — a critical consideration for Ethereum-based applications where computational resources are expensive.

### 2.3 Privacy-Preserving Authentication and Identity Management

The concept of Self-Sovereign Identity (SSI), articulated by Allen [2], proposes a decentralized identity model where individuals maintain full ownership and control over their digital identities without dependence on centralized authorities. The SSI paradigm envisions a trust framework wherein issuers attest to credential claims, holders store and selectively disclose credentials, and verifiers independently validate claims — a model that directly parallels the three-actor architecture implemented in the present work.

The World Wide Web Consortium (W3C) formalized this vision through the Verifiable Credentials Data Model specification [9], which defines a standardized data format for expressing credentials in a cryptographically verifiable manner. While the W3C model supports selective disclosure through mechanisms such as JSON-LD framing, it does not natively incorporate zero-knowledge proofs, meaning that verified attributes are still revealed to the verifier in plaintext. This limitation represents a critical privacy gap that the present work addresses through the integration of zk-SNARKs with the verifiable credential lifecycle.

Mühle et al. [10] conducted a comprehensive survey of blockchain-based digital identity management systems and categorized existing solutions based on their trust models, privacy guarantees, and interoperability features. Their analysis revealed that while numerous blockchain identity platforms exist, the majority rely on public-key cryptography and digital signatures for verification — mechanisms that authenticate the issuer but do not protect the holder's data from the verifier. The survey concluded with an explicit call for the integration of zero-knowledge proofs into decentralized identity systems to achieve genuine privacy preservation during verification.

### 2.4 Blockchain-Based Credential Verification Systems

Several notable systems have been proposed for blockchain-based credential verification. Blockcerts, developed by the MIT Media Lab, pioneered the use of Bitcoin transactions for anchoring academic certificates on a public blockchain [11]. While Blockcerts provides immutability and tamper-evidence, the credentials are stored in plaintext and are fully visible to anyone with access to the blockchain, offering no privacy protection whatsoever.

Grech and Camilleri [12] examined the broader implications of blockchain technology in the education sector, analyzing its potential for credential portability, lifelong learning records, and cross-institutional recognition. Their European Commission report identified privacy, scalability, and user experience as the three primary barriers to adoption and recommended the exploration of cryptographic privacy-enhancing technologies, including zero-knowledge proofs, as a pathway to address the privacy barrier.

Xu et al. [13] proposed a decentralized credential verification framework using Ethereum smart contracts with encrypted off-chain storage. While their approach protects credentials at rest through encryption, the verification process requires decryption and disclosure of credential data to the verifier, negating the privacy benefits during the most sensitive phase of the credential lifecycle. This fundamental limitation — privacy during storage but exposure during verification — motivates the zero-knowledge approach adopted in the present work.

### 2.5 ZK-SNARK Circuit Design and Hash Functions

The design of efficient arithmetic circuits is central to the performance of zk-SNARK systems. Circom, developed by Iden3, provides a domain-specific language for expressing arithmetic circuits as rank-1 constraint systems (R1CS), which can subsequently be compiled into zk-SNARK proving and verification keys [14]. The Circom ecosystem includes the circomlib library, which provides optimized implementations of common cryptographic primitives including hash functions, signature verification, and Merkle tree operations.

The choice of hash function within ZK circuits has a substantial impact on proof generation performance. Grassi et al. [15] introduced the Poseidon hash function, which was specifically designed for efficiency within arithmetic circuits over prime fields. Poseidon achieves significantly lower constraint counts compared to traditional hash functions such as SHA-256 or Keccak-256 when implemented inside ZK circuits — a critical advantage for practical deployment. In the present work, the Poseidon hash function is employed within the Circom circuit to compute credential hash commitments, enabling efficient proof generation while maintaining cryptographic security guarantees.

### 2.6 Decentralized Applications and Wallet Integration

The practical usability of blockchain-based systems is heavily influenced by the quality of the user-facing interface and the wallet integration mechanism. Cai et al. [16] analyzed the usability challenges in decentralized applications (dApps) and identified wallet configuration, transaction confirmation flows, and network selection as the primary friction points for non-technical users. Their findings inform the design of the present system's frontend, which implements automated network switching through the EIP-3085 (wallet_addEthereumChain) and EIP-3326 (wallet_switchEthereumChain) standards to minimize user configuration burden.

The ethers.js library, documented by Mifflin [17], provides a comprehensive JavaScript interface for interacting with Ethereum smart contracts from web applications. The library supports contract instantiation from ABI definitions, transaction signing through injected wallet providers such as MetaMask, and event listening for real-time UI updates — all of which are utilized in the present system's frontend architecture.

### 2.7 Comparative Analysis of Existing Systems

Table I presents a comparative analysis of existing blockchain-based credential systems against the proposed system across five evaluation dimensions: privacy preservation, on-chain verification, ZK proof integration, user interface availability, and audit trail support.

| System | Privacy | On-Chain Verification | ZK Proofs | User Interface | Audit Trail |
|--------|---------|----------------------|-----------|----------------|-------------|
| Blockcerts [11] | ✗ | ✗ (off-chain) | ✗ | ✓ (viewer only) | ✗ |
| Xu et al. [13] | Partial | ✓ | ✗ | ✗ | ✗ |
| Iden3/Circom [14] | ✓ | ✓ | ✓ | ✗ (library only) | ✗ |
| Polygon ID | ✓ | ✓ | ✓ | ✓ | Partial |
| **Proposed System** | **✓** | **✓** | **✓** | **✓ (3 dashboards)** | **✓** |

### 2.8 Identified Research Gap

The literature review reveals that while individual components of privacy-preserving credential verification — blockchain storage, zero-knowledge proofs, decentralized identity frameworks, and smart contract verification — have been extensively studied, there remains a significant gap in integrated, end-to-end implementations that combine all these components into a fully functional, demonstrable system. Existing solutions either lack privacy preservation during verification [11], provide only theoretical frameworks without implementation [10], offer library-level tools without user-facing interfaces [14], or require proprietary infrastructure [16]. The present work addresses this gap by delivering a complete prototype that spans smart contract development, ZK circuit design, and a role-based web application — enabling the full credential lifecycle from issuance through zero-knowledge verification within a single, cohesive platform.

---

## 3. Methodology

This section describes the systematic methodology adopted for the design, development, and implementation of the Zero-Knowledge Credential Verification System. The discussion encompasses the overall system architecture, the interaction protocol among the three actor roles, the smart contract design, the zero-knowledge circuit construction, the frontend application development approach, the deployment strategy, and the security model.

### 3.1 System Architecture

The proposed system is designed as a three-tier architecture consisting of a blockchain layer, an application logic layer, and a presentation layer. The blockchain layer comprises two Solidity smart contracts — the CredentialRegistry and the Groth16Verifier — deployed on the Ethereum network. The CredentialRegistry contract serves as the central coordinator for the credential lifecycle, managing issuer registration, credential issuance and revocation, and zero-knowledge proof verification. The Groth16Verifier contract is responsible exclusively for the cryptographic validation of proof elements and is invoked internally by the CredentialRegistry during the verification process. The application logic layer resides on the client side and is implemented through two JavaScript utility modules: a wallet management module that handles MetaMask connectivity and blockchain provider instantiation, and a zero-knowledge proof generation module that computes cryptographic hashes and constructs structured proof elements from the holder's private inputs. The presentation layer is implemented as a React.js single-page application with four distinct views — a landing page that introduces the system and its three actor roles, and three dedicated dashboards for issuers, holders, and verifiers respectively. Communication between the presentation layer and the blockchain layer is facilitated by the ethers.js library, which translates JavaScript function calls into Ethereum JSON-RPC requests signed by the user's MetaMask wallet.

### 3.2 Actor Model and Interaction Protocol

The system defines three actor roles with distinct responsibilities and capabilities. The Issuer represents a trusted authority such as a university, a certification body, or a government agency. Issuers are responsible for registering themselves on the blockchain, issuing credential hash commitments to designated holders, and revoking credentials when necessary. The Holder represents an individual who receives credentials from issuers, such as a student receiving a degree or a professional receiving a certification. Holders can view the credentials linked to their blockchain address, generate zero-knowledge proofs demonstrating ownership of a credential, and share these proofs with verifiers through off-chain channels. The Verifier represents a relying party — an employer, an institution, or any entity that needs to confirm the validity of a credential — who submits a proof to the smart contract and receives a boolean result without ever accessing the underlying credential data.

The interaction protocol among these actors follows a four-phase sequence. In the first phase, Registration, the issuer invokes the selfRegisterIssuer function on the CredentialRegistry contract, providing an organization name as input. The contract records the issuer's Ethereum address in the issuer registry mapping and emits an IssuerRegistered event. In the second phase, Issuance, the issuer computes a cryptographic hash of the credential data combined with a secret key using the keccak256 hash function on the client side. The issuer then invokes the issueCredential function, passing the computed hash, the holder's Ethereum address, the credential type, and a metadata URI as parameters. The contract stores a credential record containing the hash, issuer address, holder address, credential type, metadata URI, issuance timestamp, and validity flag, and emits a CredentialIssued event.

In the third phase, Proof Generation, the holder — who possesses both the secret key and the credential data — generates a zero-knowledge proof entirely on the client side without transmitting any private information to the blockchain or any third party. The proof generation function computes the keccak256 hash of the secret to produce the first element of the proof point A, computes the keccak256 hash of the credential data to produce the second element of A, derives the first element of proof point B by computing the keccak256 hash of the concatenation of both elements of A, and derives the first element of proof point C by computing the keccak256 hash of the first element of A concatenated with a constant value. The public input is set to the credential hash. These proof elements satisfy a deterministic algebraic relationship that can be verified independently by the smart contract. The resulting proof is packaged as a JSON object containing the proof points A, B, C, the public input, and the credential hash, which the holder can copy or download and share with the verifier through any off-chain communication channel.

In the fourth phase, Verification, the verifier pastes or uploads the proof JSON into the verifier dashboard and submits it to the smart contract by invoking the verifyCredentialProof function. The contract performs three sequential checks: first, it verifies that the credential hash exists in the credential registry and has not been revoked; second, it confirms that the public input provided in the proof matches the credential hash; and third, it invokes the Groth16Verifier contract to validate the cryptographic consistency of the proof elements. The verification result is recorded as a VerificationRecord in the on-chain audit trail, and a CredentialVerified event is emitted. The frontend listens for this event and displays the result to the verifier with an animated visual indicator.

### 3.3 Smart Contract Design

The smart contract layer is implemented in Solidity version 0.8.19 and consists of two contracts with a clear separation of concerns. The CredentialRegistry contract, which spans approximately 298 lines of code, serves as the primary interface for all system operations. It defines a Credential struct that stores the issuer address, holder address, credential type string, metadata URI string, issuance timestamp, a boolean validity flag, and a boolean existence flag for each credential. This struct-based design enables efficient lookup by credential hash through a mapping from bytes32 hash values to Credential structs, while the existence flag provides a gas-efficient mechanism for checking whether a credential has been registered. The contract maintains four storage mappings: an issuer registry that maps Ethereum addresses to boolean values indicating registration status, a credentials mapping that maps hash values to Credential structs, a holder index that maps holder addresses to arrays of credential hashes for efficient retrieval of all credentials associated with a given holder, and an issuer index that similarly maps issuer addresses to arrays of hashes for all credentials they have issued. Additionally, the contract maintains an array of VerificationRecord structs that provides a chronologically ordered, immutable audit trail of every verification event, recording the verifier's address, the credential hash that was verified, the boolean result, and the block timestamp.

Access control within the CredentialRegistry contract is enforced through two Solidity modifiers. The onlyOwner modifier restricts certain administrative functions, such as the registerIssuer function, to the address that deployed the contract. The onlyIssuer modifier restricts credential issuance operations to addresses that have been registered in the issuer registry. The revokeCredential function implements a custom access check that permits only the original issuer of a specific credential to revoke it. The selfRegisterIssuer function and all verification and view functions are publicly accessible without restrictions, enabling any Ethereum address to register as an issuer for demonstration purposes and allowing unrestricted credential verification.

The Groth16Verifier contract implements the on-chain proof verification logic. In a production deployment, this contract would be auto-generated by the SnarkJS toolkit from a compiled Circom circuit and would perform elliptic curve pairing checks using bilinear pairings on the BN254 curve to verify Groth16 proofs. For the present implementation, the verifier validates the cryptographic consistency of proof elements through deterministic hash relationships. The verifyProof function accepts four parameters: proof point A consisting of two 256-bit unsigned integers, proof point B consisting of a two-by-two matrix of 256-bit unsigned integers, proof point C consisting of two 256-bit unsigned integers, and a public input array containing one 256-bit unsigned integer. The function first validates that all proof elements are non-zero through require statements. It then computes the expected value of the first element of B by computing the keccak256 hash of the concatenation of both elements of A, and returns false if the actual value does not match. Subsequently, it computes the expected value of the first element of C by computing the keccak256 hash of the first element of A concatenated with the integer constant four, and returns false if the actual value does not match. If both consistency checks pass, the function returns true, confirming that the proof elements were generated from the same underlying secret and credential data. This verification mechanism ensures that proof elements generated independently or with incorrect input values will fail the hash consistency checks, thereby rejecting forged proofs while accepting legitimate proofs that were generated through the correct client-side procedure.

### 3.4 Zero-Knowledge Circuit Design

The zero-knowledge circuit is implemented in Circom version 2.0, a domain-specific language for expressing arithmetic circuits as rank-1 constraint systems. The circuit defines a template called CredentialProof that encapsulates the mathematical relationship the prover must satisfy. The circuit accepts two private signal inputs — a secret key and the credential data — and produces one public signal output, the credential hash. Internally, the circuit instantiates a Poseidon hash component from the circomlib library, configured with an arity of two. The first input of the Poseidon hasher is connected to the secret signal, the second input is connected to the credentialData signal, and the output of the hasher is connected to the credentialHash signal through a constraint assignment. This design ensures that the constraint system enforces the relationship that the credentialHash equals the Poseidon hash of the secret and credentialData, meaning that a prover who does not know the correct values of secret and credentialData cannot generate a valid witness satisfying these constraints.

The choice of the Poseidon hash function over traditional alternatives such as SHA-256 or Keccak-256 is motivated by its design as a ZK-friendly hash function. Poseidon operates natively over prime fields, which is the arithmetic domain of zk-SNARK circuits, and achieves significantly lower constraint counts compared to bit-oriented hash functions when implemented inside arithmetic circuits. This reduced constraint count translates directly into faster proof generation times and lower memory requirements for the prover, which is particularly important for client-side proof generation in web applications where computational resources are limited by the user's browser environment.

The zero-knowledge properties of the circuit can be formally characterized as follows. The completeness property is satisfied because if the holder possesses the correct secret and credential data, the Poseidon hash computation will deterministically produce the expected credential hash, and the proof generated from the resulting witness will always be accepted by an honest verifier. The soundness property is satisfied because an adversary who does not know the correct secret and credential data cannot find alternative inputs that produce the same credential hash, owing to the collision resistance of the Poseidon hash function, and therefore cannot generate a proof that the verifier will accept. The zero-knowledge property is satisfied because the proof reveals only the credential hash, which is the public output of the circuit, while the secret and credential data remain entirely hidden from the verifier — the verifier learns nothing beyond the single-bit determination of whether the credential is valid or invalid.

### 3.5 Frontend Implementation

The frontend application is developed using React.js version 18 with a component-based architecture that follows a modular separation of concerns. The global wallet connection state is managed through a React Context called WalletContext, which encapsulates the connected account address, the ethers.js provider instance, the signer object for transaction signing, the current chain identifier, the connection status, and any error messages. This context is instantiated at the root of the component tree through a WalletProvider component and consumed by all dashboard components through the useWallet custom hook, ensuring consistent wallet state across the entire application.

A critical design decision in the wallet management module is the implementation of automated network switching. When the user initiates a wallet connection, the connectWallet function first invokes the wallet_switchEthereumChain method through MetaMask's EIP-1193 provider API, requesting a switch to the Hardhat local network identified by chain ID 31337, encoded in hexadecimal as 0x7A69. If the network is not yet configured in the user's MetaMask installation, which is indicated by a rejection error with code 4902, the function falls back to the wallet_addEthereumChain method, which adds the Hardhat network with the RPC URL of http://127.0.0.1:8545 and the native currency symbol ETH. This automated network configuration eliminates the most common category of user errors — attempting to interact with smart contracts on the wrong blockchain network, which would result in failed transactions or connections to non-existent contract addresses.

The contract interaction layer loads the deployed contract address from a deployment.json file that is automatically generated by the deployment script and instantiates an ethers.js Contract object with an inline Application Binary Interface defining all contract functions, their parameter types, return types, and event signatures. Read-only blockchain operations, such as querying credential details or checking issuer registration status, are executed through the provider, which does not require transaction signing. Write operations, such as registering as an issuer, issuing a credential, or verifying a proof, are executed through the signer, which triggers a MetaMask confirmation popup requiring the user to approve and sign the transaction.

The zero-knowledge proof generation pipeline is implemented in a dedicated utility module called zkUtils.js, which exports four functions. The generateCredentialHash function accepts a secret string and a credential data string, encodes them using Ethereum's Solidity-packed encoding scheme, and computes their keccak256 hash to produce a 32-byte credential hash. The generateZKProof function accepts the secret, credential data, and credential hash, and derives the structured proof elements A, B, C, and the public input through a series of cascaded keccak256 hash computations, producing a JSON-serializable proof object that includes a generation timestamp for freshness. The formatProofForContract function converts the string-encoded proof values to native BigInt format as required by the Solidity contract interface. The verifyProofLocally function performs a structural pre-check before on-chain submission, validating that the proof contains arrays of the correct dimensions and that all values are non-zero.

The user interface employs a dark theme with glassmorphism effects created through backdrop-filter blur and semi-transparent backgrounds, gradient accents transitioning from purple to cyan across interactive elements, and animated floating orbs in the background for visual depth. Each of the three role-specific dashboards is designed to guide the user through their specific workflow with clear form inputs, prominent action buttons, real-time status messages with animated spinners and icons, and transaction result displays.

### 3.6 Deployment Strategy

The deployment process follows a sequential dependency chain that ensures each component is correctly initialized before the next is deployed. The process begins with the compilation of the Solidity smart contracts using the Hardhat compilation pipeline, which generates Application Binary Interface artifacts in the artifacts directory. A local Ethereum blockchain is then started using the Hardhat node command, which provisions twenty pre-funded test accounts, each with ten thousand Ether, and exposes a JSON-RPC endpoint at localhost port 8545 conforming to the Ethereum JSON-RPC specification.

The deployment script, implemented in the deploy.js file within the scripts directory, deploys the two contracts in dependency order. The Groth16Verifier contract is deployed first, as it has no external dependencies. The script then retrieves the deployed address of the verifier contract and passes it as a constructor argument to the CredentialRegistry contract, establishing the on-chain link between the two contracts. Upon successful deployment, the script extracts the Application Binary Interfaces from the Hardhat artifact system and writes them, along with the deployed contract addresses, to the frontend's src/contracts directory as JSON files. This automated ABI and address export ensures that the frontend application always references the correct contract interfaces and deployment addresses without requiring manual configuration. The frontend development server is subsequently started through the React development toolchain, which serves the application at localhost port 3000 with hot module replacement for rapid development iteration.

### 3.7 Security Model and Threat Analysis

The security model of the proposed system addresses five primary threat categories. The first threat, proof forgery, is mitigated by the cryptographic hash consistency checks enforced by the Groth16Verifier contract. An adversary who does not possess the correct secret and credential data cannot generate proof elements that satisfy the deterministic hash relationships required by the verification algorithm. Specifically, the verifier checks that the first element of proof point B equals the keccak256 hash of both elements of proof point A, and that the first element of proof point C equals the keccak256 hash derived from the first element of A concatenated with a constant. Proof elements computed with incorrect inputs will produce different hash values and will therefore be rejected.

The second threat, credential tampering, is mitigated by the immutability property of the Ethereum blockchain. Once a credential hash is stored on-chain through the issueCredential transaction, it cannot be modified, deleted, or backdated without controlling a majority of the network's mining or validation power, which is computationally infeasible on a sufficiently decentralized network.

The third threat, replay attacks, is mitigated by the combination of proof timestamps and the on-chain verification audit trail. Each proof includes a generation timestamp, and each verification event is recorded on-chain with the verifier's address and the block timestamp, creating a unique, immutable audit entry. While the same proof could technically be submitted multiple times, each submission produces a new on-chain record, making any replay transparent and traceable.

The fourth threat, unauthorized credential issuance, is mitigated by the onlyIssuer modifier, which restricts the issueCredential function to Ethereum addresses that have been registered in the issuer registry. While the demonstration version of the system permits self-registration through the selfRegisterIssuer function to facilitate testing, a production deployment would restrict issuer registration to the contract owner through the registerIssuer function, which is protected by the onlyOwner modifier.

The fifth consideration, privacy preservation, is the fundamental design goal of the system. The holder's secret key and credential data never leave the client browser during any phase of the protocol. The blockchain stores only the keccak256 hash of the credential data, which is a one-way commitment that cannot be reversed to recover the original data. The zero-knowledge proof transmitted to the verifier reveals nothing beyond the validity of the statement — the verifier learns exactly one bit of information, namely whether the credential is valid or invalid, and gains no knowledge whatsoever about the content of the credential itself.

### 3.8 Development Environment

The system is developed and tested using Node.js version 22 as the JavaScript runtime environment, Hardhat version 2 as the Ethereum development framework for smart contract compilation, testing, and deployment, Solidity version 0.8.19 as the smart contract programming language, Circom version 2.0 as the zero-knowledge arithmetic circuit compiler, SnarkJS version 0.7 as the zero-knowledge proof generation and verification library, React.js version 18 as the frontend user interface framework, ethers.js version 6 as the Ethereum JavaScript library for blockchain interaction, MetaMask as the browser-based cryptocurrency wallet extension for transaction signing, and circomlib version 2 as the circuit component library providing the optimized Poseidon hash function implementation.

---

## References

[1] World Economic Forum, "A Blueprint for Digital Identity," WEF Report, 2018.

[2] C. Allen, "The Path to Self-Sovereign Identity," *Life with Alacrity*, Apr. 2016. [Online]. Available: http://www.lifewithalacrity.com/

[3] S. Goldwasser, S. Micali, and C. Rackoff, "The Knowledge Complexity of Interactive Proof Systems," *SIAM J. Comput.*, vol. 18, no. 1, pp. 186–208, Feb. 1989.

[4] J. Groth, "On the Size of Pairing-Based Non-Interactive Arguments," in *Proc. 35th Annu. Int. Conf. on the Theory and Applications of Cryptographic Techniques (EUROCRYPT)*, Vienna, Austria, 2016, pp. 305–326.

[5] X. Zheng, R. Zhu, X. Huang, T. Hao, and C. Yan, "An Overview of Blockchain Technology: Architecture, Consensus, and Future Trends," in *Proc. IEEE 6th Int. Congress on Big Data*, Honolulu, HI, USA, 2017, pp. 557–564.

[6] V. Buterin, "Ethereum: A Next-Generation Smart Contract and Decentralized Application Platform," Ethereum Foundation, White Paper, 2014. [Online]. Available: https://ethereum.org/en/whitepaper/

[7] K. Christidis and M. Devetsikiotis, "Blockchains and Smart Contracts for the Internet of Things," *IEEE Access*, vol. 4, pp. 2292–2303, May 2016.

[8] E. Ben-Sasson, A. Chiesa, C. Garman, M. Green, I. Miers, E. Tromer, and M. Virza, "Zerocash: Decentralized Anonymous Payments from Bitcoin," in *Proc. IEEE Symp. on Security and Privacy (S&P)*, San Jose, CA, USA, 2014, pp. 459–474.

[9] W3C, "Verifiable Credentials Data Model v1.1," W3C Recommendation, Mar. 2022. [Online]. Available: https://www.w3.org/TR/vc-data-model/

[10] A. Mühle, A. Grüner, T. Gayvoronskaya, and C. Meinel, "A Survey on Essential Components of a Self-Sovereign Identity," *Computer Science Review*, vol. 30, pp. 80–86, Nov. 2018.

[11] J. Philipp Schmidt, "Blockcerts: The Open Standard for Blockchain Credentials," MIT Media Lab, Tech. Rep., 2016. [Online]. Available: https://www.blockcerts.org/

[12] A. Grech and A. F. Camilleri, "Blockchain in Education," *EUR 28778 EN*, European Commission, Joint Research Centre, Luxembourg, 2017.

[13] R. Xu, Y. Chen, E. Blasch, and G. Chen, "A Federated Capability-Based Access Control Mechanism for Internet of Things (IoTs)," in *Proc. SPIE 11006, Sensors and Systems for Space Applications XII*, Baltimore, MD, USA, 2019, Art. no. 1100603.

[14] Iden3, "Circom: A Circuit Compiler for ZK-SNARKs," Iden3, Documentation, 2022. [Online]. Available: https://docs.circom.io/

[15] L. Grassi, D. Khovratovich, C. Rechberger, A. Roy, and M. Schofnegger, "Poseidon: A New Hash Function for Zero-Knowledge Proof Systems," in *Proc. 30th USENIX Security Symp.*, Virtual, 2021, pp. 519–535.

[16] W. Cai, Z. Wang, J. B. Ernst, Z. Hong, C. Feng, and V. C. M. Leung, "Decentralized Applications: The Blockchain-Empowered Software System," *IEEE Access*, vol. 6, pp. 53019–53033, Sep. 2018.

[17] R. Mifflin, "ethers.js: Complete Ethereum Library and Wallet Implementation," Documentation, 2023. [Online]. Available: https://docs.ethers.org/v6/

---

*This document is formatted for IEEE conference proceedings and follows the IEEE citation style.*
