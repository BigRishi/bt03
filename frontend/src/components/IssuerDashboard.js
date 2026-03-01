import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../utils/WalletContext';
import { generateCredentialHash } from '../utils/zkUtils';

const IssuerDashboard = ({ contract }) => {
    const { account, signer, isConnected, connectWallet, shortenAddress } = useWallet();

    const [isRegistered, setIsRegistered] = useState(false);
    const [orgName, setOrgName] = useState('');
    const [holderAddress, setHolderAddress] = useState('');
    const [credentialType, setCredentialType] = useState('');
    const [credentialData, setCredentialData] = useState('');
    const [secret, setSecret] = useState('');
    const [issuedCredentials, setIssuedCredentials] = useState([]);
    const [status, setStatus] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        checkIssuerStatus();
        loadIssuedCredentials();
    }, [account, contract]);

    const checkIssuerStatus = async () => {
        if (!contract || !account) return;
        try {
            const registered = await contract.isIssuer(account);
            setIsRegistered(registered);
        } catch (err) {
            console.error('Error checking issuer status:', err);
        }
    };

    const loadIssuedCredentials = async () => {
        if (!contract || !account) return;
        try {
            const hashes = await contract.getIssuerCredentials(account);
            const creds = [];
            for (const hash of hashes) {
                try {
                    const cred = await contract.getCredential(hash);
                    creds.push({
                        hash,
                        holder: cred[1],
                        type: cred[2],
                        metadataURI: cred[3],
                        issuedAt: Number(cred[4]),
                        valid: cred[5],
                    });
                } catch (e) {
                    console.error('Error loading credential:', e);
                }
            }
            setIssuedCredentials(creds);
        } catch (err) {
            console.error('Error loading credentials:', err);
        }
    };

    const registerAsIssuer = async () => {
        if (!contract || !signer || !orgName.trim()) return;
        setIsProcessing(true);
        setStatus({ type: 'loading', message: 'Registering as issuer...' });

        try {
            const connectedContract = contract.connect(signer);
            const tx = await connectedContract.selfRegisterIssuer(orgName);
            setStatus({ type: 'loading', message: 'Waiting for transaction confirmation...' });
            await tx.wait();
            setIsRegistered(true);
            setStatus({ type: 'success', message: `Successfully registered as issuer: ${orgName}` });
        } catch (err) {
            console.error('Registration error:', err);
            setStatus({ type: 'error', message: err.reason || err.message || 'Registration failed' });
        } finally {
            setIsProcessing(false);
        }
    };

    const issueCredential = async () => {
        if (!contract || !signer) return;
        if (!holderAddress || !credentialType || !credentialData || !secret) {
            setStatus({ type: 'error', message: 'Please fill in all fields' });
            return;
        }

        if (!ethers.isAddress(holderAddress)) {
            setStatus({ type: 'error', message: 'Invalid holder address' });
            return;
        }

        setIsProcessing(true);
        setStatus({ type: 'loading', message: 'Computing credential hash...' });

        try {
            const credentialHash = generateCredentialHash(secret, credentialData);
            const metadataURI = `ipfs://demo/${Date.now()}`;

            setStatus({ type: 'loading', message: 'Issuing credential on blockchain...' });

            const connectedContract = contract.connect(signer);
            const tx = await connectedContract.issueCredential(
                credentialHash,
                holderAddress,
                credentialType,
                metadataURI
            );

            setStatus({ type: 'loading', message: 'Waiting for confirmation...' });
            await tx.wait();

            setStatus({
                type: 'success',
                message: `Credential issued! Hash: ${credentialHash.slice(0, 18)}...`
            });

            // Clear form
            setHolderAddress('');
            setCredentialType('');
            setCredentialData('');
            setSecret('');

            // Reload credentials
            await loadIssuedCredentials();
        } catch (err) {
            console.error('Issue error:', err);
            setStatus({ type: 'error', message: err.reason || err.message || 'Failed to issue credential' });
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="page">
                <div className="container">
                    <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🦊</div>
                        <h2>Connect Your Wallet</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '12px 0 24px' }}>
                            Please connect MetaMask to access the Issuer Dashboard
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
                        <h1>🏛️ Issuer Dashboard</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                            Issue and manage verifiable credentials
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span className="badge badge-issuer">
                            {isRegistered ? '✓ Registered Issuer' : '○ Not Registered'}
                        </span>
                        <span className="wallet-indicator">
                            <span className="dot"></span>
                            {shortenAddress(account)}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-value">{issuedCredentials.length}</div>
                        <div className="stat-label">Credentials Issued</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{issuedCredentials.filter(c => c.valid).length}</div>
                        <div className="stat-label">Active</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{issuedCredentials.filter(c => !c.valid).length}</div>
                        <div className="stat-label">Revoked</div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    {/* Left: Issue Form */}
                    <div className="glass-card">
                        <div className="section-header">
                            <div className="section-icon">📝</div>
                            <h2>{isRegistered ? 'Issue Credential' : 'Register as Issuer'}</h2>
                        </div>

                        {!isRegistered ? (
                            <>
                                <div className="input-group">
                                    <label>Organization Name</label>
                                    <input
                                        id="org-name-input"
                                        className="input-field"
                                        type="text"
                                        placeholder="e.g., MIT, Stanford University"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        disabled={isProcessing}
                                    />
                                </div>
                                <button
                                    id="register-issuer-btn"
                                    className="btn btn-primary"
                                    onClick={registerAsIssuer}
                                    disabled={isProcessing || !orgName.trim()}
                                    style={{ width: '100%' }}
                                >
                                    {isProcessing ? <><span className="spinner"></span> Registering...</> : 'Register as Issuer'}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="input-group">
                                    <label>Holder Address</label>
                                    <input
                                        id="holder-address-input"
                                        className="input-field"
                                        type="text"
                                        placeholder="0x..."
                                        value={holderAddress}
                                        onChange={(e) => setHolderAddress(e.target.value)}
                                        disabled={isProcessing}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Credential Type</label>
                                    <select
                                        id="credential-type-select"
                                        className="input-field"
                                        value={credentialType}
                                        onChange={(e) => setCredentialType(e.target.value)}
                                        disabled={isProcessing}
                                    >
                                        <option value="">Select type...</option>
                                        <option value="Bachelor's Degree">Bachelor's Degree</option>
                                        <option value="Master's Degree">Master's Degree</option>
                                        <option value="PhD">PhD</option>
                                        <option value="Professional Certificate">Professional Certificate</option>
                                        <option value="Identity Document">Identity Document</option>
                                        <option value="Healthcare License">Healthcare License</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Credential Data</label>
                                    <textarea
                                        id="credential-data-input"
                                        className="input-field"
                                        placeholder="e.g., Computer Science, GPA: 3.8, Year: 2024"
                                        value={credentialData}
                                        onChange={(e) => setCredentialData(e.target.value)}
                                        disabled={isProcessing}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Secret Key (For ZK Proof)</label>
                                    <input
                                        id="secret-key-input"
                                        className="input-field"
                                        type="password"
                                        placeholder="A secret known only to the holder"
                                        value={secret}
                                        onChange={(e) => setSecret(e.target.value)}
                                        disabled={isProcessing}
                                    />
                                </div>
                                <button
                                    id="issue-credential-btn"
                                    className="btn btn-primary"
                                    onClick={issueCredential}
                                    disabled={isProcessing}
                                    style={{ width: '100%' }}
                                >
                                    {isProcessing ? (
                                        <><span className="spinner"></span> Processing...</>
                                    ) : (
                                        '🔏 Issue Credential'
                                    )}
                                </button>
                            </>
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

                    {/* Right: Issued Credentials */}
                    <div className="glass-card">
                        <div className="section-header">
                            <div className="section-icon">📋</div>
                            <h2>Issued Credentials</h2>
                        </div>
                        <div className="credential-list">
                            {issuedCredentials.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📄</div>
                                    <p>No credentials issued yet</p>
                                </div>
                            ) : (
                                issuedCredentials.map((cred, i) => (
                                    <div key={i} className="credential-item">
                                        <div className="cred-info">
                                            <div className="cred-type">{cred.type}</div>
                                            <div className="cred-hash">{cred.hash.slice(0, 22)}...</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                Holder: {cred.holder.slice(0, 10)}...
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
                </div>
            </div>
        </div>
    );
};

export default IssuerDashboard;
