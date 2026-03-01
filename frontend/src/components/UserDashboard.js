import React, { useState, useEffect } from 'react';
import { useWallet } from '../utils/WalletContext';
import { generateCredentialHash, generateZKProof } from '../utils/zkUtils';

const UserDashboard = ({ contract }) => {
    const { account, isConnected, connectWallet, shortenAddress } = useWallet();

    const [credentials, setCredentials] = useState([]);
    const [secret, setSecret] = useState('');
    const [credentialData, setCredentialData] = useState('');
    const [selectedCredHash, setSelectedCredHash] = useState('');
    const [generatedProof, setGeneratedProof] = useState(null);
    const [status, setStatus] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [proofProgress, setProofProgress] = useState(0);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadCredentials();
    }, [account, contract]);

    const loadCredentials = async () => {
        if (!contract || !account) return;
        try {
            const hashes = await contract.getHolderCredentials(account);
            const creds = [];
            for (const hash of hashes) {
                try {
                    const cred = await contract.getCredential(hash);
                    creds.push({
                        hash,
                        issuer: cred[0],
                        type: cred[2],
                        metadataURI: cred[3],
                        issuedAt: Number(cred[4]),
                        valid: cred[5],
                    });
                } catch (e) {
                    console.error('Error loading credential:', e);
                }
            }
            setCredentials(creds);
        } catch (err) {
            console.error('Error loading credentials:', err);
        }
    };

    const handleGenerateProof = async () => {
        if (!secret || !credentialData) {
            setStatus({ type: 'error', message: 'Please enter your secret and credential data' });
            return;
        }

        setIsGenerating(true);
        setGeneratedProof(null);
        setProofProgress(0);
        setStatus({ type: 'loading', message: 'Initializing proof generation...' });

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProofProgress(prev => {
                    if (prev >= 90) { clearInterval(progressInterval); return 90; }
                    return prev + 10;
                });
            }, 200);

            // Generate credential hash
            const credHash = selectedCredHash || generateCredentialHash(secret, credentialData);

            setStatus({ type: 'loading', message: 'Computing witness...' });

            // Generate proof
            const proof = await generateZKProof(secret, credentialData, credHash);

            clearInterval(progressInterval);
            setProofProgress(100);

            setGeneratedProof(proof);
            setStatus({ type: 'success', message: 'ZK Proof generated successfully!' });
        } catch (err) {
            console.error('Proof generation error:', err);
            setStatus({ type: 'error', message: err.message || 'Failed to generate proof' });
        } finally {
            setIsGenerating(false);
        }
    };

    const copyProof = () => {
        if (!generatedProof) return;
        navigator.clipboard.writeText(JSON.stringify(generatedProof, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadProof = () => {
        if (!generatedProof) return;
        const blob = new Blob([JSON.stringify(generatedProof, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zk-proof-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!isConnected) {
        return (
            <div className="page">
                <div className="container">
                    <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🦊</div>
                        <h2>Connect Your Wallet</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '12px 0 24px' }}>
                            Please connect MetaMask to access your credentials
                        </p>
                        <button className="btn btn-primary btn-lg" onClick={connectWallet}>
                            Connect MetaMask
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <div className="dashboard-header">
                    <div>
                        <h1>👤 Credential Holder</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                            Manage credentials and generate zero-knowledge proofs
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span className="badge badge-user">Holder</span>
                        <span className="wallet-indicator">
                            <span className="dot"></span>
                            {shortenAddress(account)}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-value">{credentials.length}</div>
                        <div className="stat-label">Total Credentials</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{credentials.filter(c => c.valid).length}</div>
                        <div className="stat-label">Active</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{generatedProof ? 1 : 0}</div>
                        <div className="stat-label">Proofs Generated</div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    {/* Left: Proof Generator */}
                    <div className="glass-card">
                        <div className="section-header">
                            <div className="section-icon">🔐</div>
                            <h2>Generate ZK Proof</h2>
                        </div>

                        {credentials.length > 0 && (
                            <div className="input-group">
                                <label>Select Credential</label>
                                <select
                                    id="select-credential"
                                    className="input-field"
                                    value={selectedCredHash}
                                    onChange={(e) => setSelectedCredHash(e.target.value)}
                                    disabled={isGenerating}
                                >
                                    <option value="">Select a credential...</option>
                                    {credentials.filter(c => c.valid).map((cred, i) => (
                                        <option key={i} value={cred.hash}>
                                            {cred.type} — {cred.hash.slice(0, 14)}...
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="input-group">
                            <label>Your Secret Key</label>
                            <input
                                id="user-secret-input"
                                className="input-field"
                                type="password"
                                placeholder="The secret provided during credential issuance"
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                disabled={isGenerating}
                            />
                        </div>

                        <div className="input-group">
                            <label>Credential Data</label>
                            <textarea
                                id="user-credential-data"
                                className="input-field"
                                placeholder="The original credential data"
                                value={credentialData}
                                onChange={(e) => setCredentialData(e.target.value)}
                                disabled={isGenerating}
                            />
                        </div>

                        <button
                            id="generate-proof-btn"
                            className="btn btn-success"
                            onClick={handleGenerateProof}
                            disabled={isGenerating || !secret || !credentialData}
                            style={{ width: '100%' }}
                        >
                            {isGenerating ? (
                                <><span className="spinner"></span> Generating Proof ({proofProgress}%)...</>
                            ) : (
                                '🔏 Generate Zero-Knowledge Proof'
                            )}
                        </button>

                        {isGenerating && (
                            <div style={{ marginTop: '16px' }}>
                                <div style={{
                                    height: '4px',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '2px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${proofProgress}%`,
                                        background: 'var(--gradient-success)',
                                        borderRadius: '2px',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                                    Computing zk-SNARK proof...
                                </p>
                            </div>
                        )}

                        {status && (
                            <div className={`status-message ${status.type}`}>
                                {status.type === 'loading' && <span className="spinner"></span>}
                                {status.type === 'success' && '✅'}
                                {status.type === 'error' && '❌'}
                                {status.message}
                            </div>
                        )}
                    </div>

                    {/* Right: Credentials + Proof Display */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* My Credentials */}
                        <div className="glass-card">
                            <div className="section-header">
                                <div className="section-icon">📜</div>
                                <h2>My Credentials</h2>
                            </div>
                            <div className="credential-list">
                                {credentials.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">📄</div>
                                        <p>No credentials found for this address</p>
                                    </div>
                                ) : (
                                    credentials.map((cred, i) => (
                                        <div key={i} className="credential-item">
                                            <div className="cred-info">
                                                <div className="cred-type">{cred.type}</div>
                                                <div className="cred-hash">{cred.hash.slice(0, 22)}...</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    Issuer: {cred.issuer.slice(0, 10)}...
                                                </div>
                                            </div>
                                            <span className={`cred-status ${cred.valid ? 'valid' : 'invalid'}`}>
                                                {cred.valid ? '● Active' : '● Revoked'}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Generated Proof */}
                        {generatedProof && (
                            <div className="glass-card">
                                <div className="section-header">
                                    <div className="section-icon" style={{ background: 'rgba(0, 229, 160, 0.15)' }}>✨</div>
                                    <h2>Generated Proof</h2>
                                </div>
                                <div className="proof-display">
                                    <button className="copy-btn" onClick={copyProof}>
                                        {copied ? '✓ Copied!' : 'Copy'}
                                    </button>
                                    <pre>{JSON.stringify(generatedProof, null, 2)}</pre>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                    <button className="btn btn-outline" onClick={copyProof} style={{ flex: 1 }}>
                                        📋 {copied ? 'Copied!' : 'Copy Proof'}
                                    </button>
                                    <button className="btn btn-outline" onClick={downloadProof} style={{ flex: 1 }}>
                                        💾 Download JSON
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
