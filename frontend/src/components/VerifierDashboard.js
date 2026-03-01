import React, { useState } from 'react';
import { useWallet } from '../utils/WalletContext';
import { verifyProofLocally, formatProofForContract } from '../utils/zkUtils';

const VerifierDashboard = ({ contract }) => {
    const { account, signer, isConnected, connectWallet, shortenAddress } = useWallet();

    const [proofInput, setProofInput] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);
    const [status, setStatus] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationHistory, setVerificationHistory] = useState([]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setProofInput(event.target.result);
            setVerificationResult(null);
            setStatus(null);
        };
        reader.readAsText(file);
    };

    const verifyProof = async () => {
        if (!proofInput.trim()) {
            setStatus({ type: 'error', message: 'Please paste or upload a proof JSON' });
            return;
        }

        setIsVerifying(true);
        setVerificationResult(null);
        setStatus({ type: 'loading', message: 'Parsing proof...' });

        try {
            // Parse the proof
            const proof = JSON.parse(proofInput);

            // Local validation first
            setStatus({ type: 'loading', message: 'Running local validation...' });
            const localValid = verifyProofLocally(proof);

            if (!localValid) {
                setVerificationResult({ valid: false, method: 'local' });
                setStatus({ type: 'error', message: 'Proof failed structural validation' });
                addToHistory(proof.credentialHash, false);
                setIsVerifying(false);
                return;
            }

            // On-chain verification
            if (contract && signer) {
                setStatus({ type: 'loading', message: 'Submitting proof to smart contract...' });

                try {
                    const formattedProof = formatProofForContract(proof);
                    const connectedContract = contract.connect(signer);

                    const tx = await connectedContract.verifyCredentialProof(
                        proof.credentialHash,
                        formattedProof.a,
                        formattedProof.b,
                        formattedProof.c,
                        formattedProof.input
                    );

                    setStatus({ type: 'loading', message: 'Waiting for on-chain verification...' });
                    const receipt = await tx.wait();

                    // Check for CredentialVerified event
                    const event = receipt.logs.find(log => {
                        try {
                            const parsed = contract.interface.parseLog(log);
                            return parsed && parsed.name === 'CredentialVerified';
                        } catch { return false; }
                    });

                    let onChainResult = true;
                    if (event) {
                        const parsed = contract.interface.parseLog(event);
                        onChainResult = parsed.args[2]; // result field
                    }

                    setVerificationResult({ valid: onChainResult, method: 'on-chain' });
                    setStatus({
                        type: onChainResult ? 'success' : 'error',
                        message: onChainResult
                            ? 'Proof verified on-chain! Credential is valid.'
                            : 'On-chain verification failed. Credential is invalid.'
                    });
                    addToHistory(proof.credentialHash, onChainResult);
                } catch (contractErr) {
                    console.error('Contract verification error:', contractErr);
                    // Fallback to local verification
                    setVerificationResult({ valid: localValid, method: 'local-fallback' });
                    setStatus({
                        type: localValid ? 'success' : 'error',
                        message: `Local verification: ${localValid ? 'Valid' : 'Invalid'} (on-chain not available: ${contractErr.reason || 'contract error'})`
                    });
                    addToHistory(proof.credentialHash, localValid);
                }
            } else {
                // No contract, use local verification
                setVerificationResult({ valid: localValid, method: 'local' });
                setStatus({
                    type: localValid ? 'success' : 'error',
                    message: `Local verification: ${localValid ? 'Valid' : 'Invalid'} (connect wallet for on-chain verification)`
                });
                addToHistory(proof.credentialHash || 'unknown', localValid);
            }
        } catch (err) {
            console.error('Verification error:', err);
            if (err instanceof SyntaxError) {
                setStatus({ type: 'error', message: 'Invalid JSON format. Please paste a valid proof.' });
            } else {
                setStatus({ type: 'error', message: err.message || 'Verification failed' });
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const addToHistory = (hash, result) => {
        setVerificationHistory(prev => [{
            hash: hash || 'unknown',
            result,
            timestamp: Date.now(),
        }, ...prev]);
    };

    if (!isConnected) {
        return (
            <div className="page">
                <div className="container">
                    <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🦊</div>
                        <h2>Connect Your Wallet</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '12px 0 24px' }}>
                            Connect MetaMask for on-chain verification, or use local verification below
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
                        <h1>✅ Verifier Dashboard</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                            Verify credential proofs without accessing personal data
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span className="badge badge-verifier">Verifier</span>
                        <span className="wallet-indicator">
                            <span className="dot"></span>
                            {shortenAddress(account)}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-value">{verificationHistory.length}</div>
                        <div className="stat-label">Total Verifications</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{verificationHistory.filter(v => v.result).length}</div>
                        <div className="stat-label">Valid Proofs</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{verificationHistory.filter(v => !v.result).length}</div>
                        <div className="stat-label">Invalid Proofs</div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    {/* Left: Verification Form */}
                    <div className="glass-card">
                        <div className="section-header">
                            <div className="section-icon" style={{ background: 'rgba(0, 210, 255, 0.15)' }}>🔍</div>
                            <h2>Verify Proof</h2>
                        </div>

                        <div className="input-group">
                            <label>Upload Proof File</label>
                            <input
                                id="proof-file-upload"
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                className="input-field"
                                style={{ padding: '10px' }}
                                disabled={isVerifying}
                            />
                        </div>

                        <div className="input-group">
                            <label>Or Paste Proof JSON</label>
                            <textarea
                                id="proof-json-input"
                                className="input-field"
                                placeholder='{"a": [...], "b": [...], "c": [...], "input": [...], "credentialHash": "0x..."}'
                                value={proofInput}
                                onChange={(e) => {
                                    setProofInput(e.target.value);
                                    setVerificationResult(null);
                                    setStatus(null);
                                }}
                                disabled={isVerifying}
                                style={{ minHeight: '150px', fontFamily: 'Courier New, monospace', fontSize: '12px' }}
                            />
                        </div>

                        <button
                            id="verify-proof-btn"
                            className="btn btn-primary"
                            onClick={verifyProof}
                            disabled={isVerifying || !proofInput.trim()}
                            style={{ width: '100%' }}
                        >
                            {isVerifying ? (
                                <><span className="spinner"></span> Verifying on Blockchain...</>
                            ) : (
                                '🔍 Verify Proof'
                            )}
                        </button>

                        {status && (
                            <div className={`status-message ${status.type}`}>
                                {status.type === 'loading' && <span className="spinner"></span>}
                                {status.type === 'success' && '✅'}
                                {status.type === 'error' && '❌'}
                                {status.message}
                            </div>
                        )}
                    </div>

                    {/* Right: Result + History */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Verification Result */}
                        {verificationResult && (
                            <div className="glass-card">
                                <div className="verification-result">
                                    <div className={`result-icon ${verificationResult.valid ? 'valid' : 'invalid'}`}>
                                        {verificationResult.valid ? '✓' : '✗'}
                                    </div>
                                    <h2 style={{ color: verificationResult.valid ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                        {verificationResult.valid ? 'Credential Valid' : 'Credential Invalid'}
                                    </h2>
                                    <p>
                                        {verificationResult.valid
                                            ? 'The zero-knowledge proof is valid. The holder possesses a legitimate credential.'
                                            : 'The proof could not be verified. The credential may be invalid or tampered with.'
                                        }
                                    </p>
                                    <div style={{
                                        marginTop: '16px',
                                        padding: '8px 16px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: 'var(--radius-sm)',
                                        display: 'inline-block'
                                    }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            Verified via: {verificationResult.method === 'on-chain' ? '⛓️ Smart Contract' : '💻 Local Computation'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Verification History */}
                        <div className="glass-card">
                            <div className="section-header">
                                <div className="section-icon" style={{ background: 'rgba(0, 210, 255, 0.15)' }}>📊</div>
                                <h2>Verification History</h2>
                            </div>
                            <div className="credential-list">
                                {verificationHistory.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">📊</div>
                                        <p>No verifications performed yet</p>
                                    </div>
                                ) : (
                                    verificationHistory.map((item, i) => (
                                        <div key={i} className="credential-item">
                                            <div className="cred-info">
                                                <div className="cred-type">
                                                    {item.result ? '✅ Valid' : '❌ Invalid'}
                                                </div>
                                                <div className="cred-hash">
                                                    {typeof item.hash === 'string' ? item.hash.slice(0, 22) : 'unknown'}...
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    {new Date(item.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                            <span className={`cred-status ${item.result ? 'valid' : 'invalid'}`}>
                                                {item.result ? '● Valid' : '● Invalid'}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifierDashboard;
