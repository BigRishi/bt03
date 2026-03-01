import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../utils/WalletContext';

const LandingPage = () => {
    const { connectWallet, isConnected, isConnecting } = useWallet();

    return (
        <div className="page">
            <div className="container">
                {/* Hero Section */}
                <section className="hero">
                    <div className="hero-badge">
                        🔐 Zero-Knowledge Proofs × Blockchain
                    </div>
                    <h1>
                        Verify Credentials<br />
                        <span className="gradient-text">Without Revealing Data</span>
                    </h1>
                    <p>
                        A decentralized credential verification system powered by zk-SNARKs and Ethereum.
                        Prove what you know without showing what you have.
                    </p>
                    <div className="hero-buttons">
                        {!isConnected ? (
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={connectWallet}
                                disabled={isConnecting}
                                id="connect-wallet-btn"
                            >
                                {isConnecting ? (
                                    <><span className="spinner"></span> Connecting...</>
                                ) : (
                                    <>🦊 Connect MetaMask</>
                                )}
                            </button>
                        ) : (
                            <Link to="/issuer" className="btn btn-primary btn-lg" id="get-started-btn">
                                🚀 Get Started
                            </Link>
                        )}
                        <a href="#features" className="btn btn-outline btn-lg">
                            Learn More ↓
                        </a>
                    </div>
                </section>

                {/* Role Cards */}
                <div className="role-cards">
                    <Link to="/issuer" className="glass-card role-card issuer" id="issuer-card">
                        <div className="role-icon">🏛️</div>
                        <h3>Issuer</h3>
                        <p>
                            Universities and organizations can issue verifiable credentials
                            stored as cryptographic hashes on the blockchain.
                        </p>
                    </Link>

                    <Link to="/user" className="glass-card role-card user" id="user-card">
                        <div className="role-icon">👤</div>
                        <h3>Credential Holder</h3>
                        <p>
                            Generate zero-knowledge proofs for your credentials.
                            Prove validity without revealing any personal data.
                        </p>
                    </Link>

                    <Link to="/verifier" className="glass-card role-card verifier" id="verifier-card">
                        <div className="role-icon">✅</div>
                        <h3>Verifier</h3>
                        <p>
                            Employers and organizations can verify credential proofs
                            on-chain without accessing the original documents.
                        </p>
                    </Link>
                </div>

                {/* Features Section */}
                <section className="features" id="features">
                    <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 800 }}>
                        Why <span className="gradient-text" style={{
                            background: 'linear-gradient(135deg, #6C63FF, #00D2FF)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>Zero-Knowledge</span>?
                    </h2>
                    <div className="features-grid">
                        <div className="feature-item">
                            <div className="feature-icon">🛡️</div>
                            <h4>Complete Privacy</h4>
                            <p>Your data never leaves your device. Only mathematical proofs are shared.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">⛓️</div>
                            <h4>Blockchain Secured</h4>
                            <p>Credential hashes are immutably stored on Ethereum for tamper-proof verification.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🔑</div>
                            <h4>Decentralized Trust</h4>
                            <p>No central authority needed. Smart contracts handle verification automatically.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">⚡</div>
                            <h4>Instant Verification</h4>
                            <p>Proofs are verified on-chain in seconds with cryptographic certainty.</p>
                        </div>
                    </div>
                </section>

                {/* Architecture Flow */}
                <section style={{ padding: '40px 0' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 800, marginBottom: '40px' }}>
                        How It <span className="gradient-text" style={{
                            background: 'linear-gradient(135deg, #6C63FF, #00D2FF)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>Works</span>
                    </h2>
                    <div className="features-grid">
                        <div className="glass-card" style={{ textAlign: 'center', padding: '28px' }}>
                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>1️⃣</div>
                            <h4 style={{ marginBottom: '8px' }}>Issue</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                Issuer creates credential, computes hash, and stores it on blockchain
                            </p>
                        </div>
                        <div className="glass-card" style={{ textAlign: 'center', padding: '28px' }}>
                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>2️⃣</div>
                            <h4 style={{ marginBottom: '8px' }}>Prove</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                User generates a ZK proof showing they know the credential data
                            </p>
                        </div>
                        <div className="glass-card" style={{ textAlign: 'center', padding: '28px' }}>
                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>3️⃣</div>
                            <h4 style={{ marginBottom: '8px' }}>Verify</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                Verifier submits proof to smart contract — gets Valid or Invalid result
                            </p>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="footer">
                    <p>Built with Zero-Knowledge Proofs & Ethereum</p>
                    <div className="footer-tech">
                        <span className="tech-badge">Solidity</span>
                        <span className="tech-badge">zk-SNARKs</span>
                        <span className="tech-badge">React</span>
                        <span className="tech-badge">Ethers.js</span>
                        <span className="tech-badge">Hardhat</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
