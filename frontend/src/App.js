import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import { WalletProvider, useWallet } from './utils/WalletContext';
import LandingPage from './components/LandingPage';
import IssuerDashboard from './components/IssuerDashboard';
import UserDashboard from './components/UserDashboard';
import VerifierDashboard from './components/VerifierDashboard';
import './App.css';

// Contract ABI (inline for simplicity)
const CREDENTIAL_REGISTRY_ABI = [
  "function isIssuer(address) view returns (bool)",
  "function issuerNames(address) view returns (string)",
  "function selfRegisterIssuer(string) external",
  "function registerIssuer(address, string) external",
  "function issueCredential(bytes32, address, string, string) external",
  "function revokeCredential(bytes32) external",
  "function verifyCredentialProof(bytes32, uint256[2], uint256[2][2], uint256[2], uint256[1]) external returns (bool)",
  "function getCredential(bytes32) view returns (address, address, string, string, uint256, bool)",
  "function credentialExists(bytes32) view returns (bool)",
  "function getHolderCredentials(address) view returns (bytes32[])",
  "function getIssuerCredentials(address) view returns (bytes32[])",
  "function getVerificationHistoryCount() view returns (uint256)",
  "function getVerificationRecord(uint256) view returns (address, bytes32, bool, uint256)",
  "event IssuerRegistered(address indexed issuer, string name)",
  "event CredentialIssued(bytes32 indexed credentialHash, address indexed issuer, address indexed holder, string credentialType, uint256 timestamp)",
  "event CredentialRevoked(bytes32 indexed credentialHash, address indexed issuer)",
  "event CredentialVerified(bytes32 indexed credentialHash, address indexed verifierAddress, bool result, uint256 timestamp)"
];

const Navbar = () => {
  const { account, isConnected, connectWallet, disconnectWallet, shortenAddress, isConnecting } = useWallet();
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="logo-icon">🔐</div>
          <span>ZK Verify</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/issuer" className={location.pathname === '/issuer' ? 'active' : ''}>Issuer</Link>
          <Link to="/user" className={location.pathname === '/user' ? 'active' : ''}>Holder</Link>
          <Link to="/verifier" className={location.pathname === '/verifier' ? 'active' : ''}>Verifier</Link>
        </div>

        <div className="navbar-wallet">
          {isConnected ? (
            <>
              <div className="wallet-indicator">
                <span className="dot"></span>
                {shortenAddress(account)}
              </div>
              <button className="btn btn-outline" onClick={disconnectWallet} style={{ padding: '6px 14px', fontSize: '12px' }}>
                Disconnect
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={connectWallet}
              disabled={isConnecting}
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              {isConnecting ? 'Connecting...' : '🦊 Connect'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

const AppContent = () => {
  const { provider } = useWallet();
  const [contract, setContract] = useState(null);

  useEffect(() => {
    loadContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  const loadContract = async () => {
    try {
      const deployment = require('./contracts/deployment.json');

      if (deployment && deployment.CredentialRegistry) {
        // Use MetaMask provider if available, otherwise fallback to localhost
        const activeProvider = provider || new ethers.JsonRpcProvider('http://127.0.0.1:8545');

        const registryContract = new ethers.Contract(
          deployment.CredentialRegistry,
          CREDENTIAL_REGISTRY_ABI,
          activeProvider
        );
        setContract(registryContract);
        console.log('Contract loaded:', deployment.CredentialRegistry);
      }
    } catch (err) {
      console.error('Error loading contract:', err);
    }
  };

  return (
    <>
      <div className="bg-orbs">
        <div className="orb"></div>
        <div className="orb"></div>
        <div className="orb"></div>
      </div>

      <Navbar />

      {!contract && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1001,
          padding: '12px 20px',
          background: 'rgba(255, 140, 66, 0.15)',
          border: '1px solid rgba(255, 140, 66, 0.3)',
          borderRadius: '12px',
          color: '#FF8C42',
          fontSize: '12px',
          maxWidth: '300px',
          backdropFilter: 'blur(10px)',
        }}>
          ⚠️ Contracts not deployed. Run <code style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px'
          }}>npx hardhat node</code> then <code style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px'
          }}>npx hardhat run scripts/deploy.js --network localhost</code>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/issuer" element={<IssuerDashboard contract={contract} />} />
          <Route path="/user" element={<UserDashboard contract={contract} />} />
          <Route path="/verifier" element={<VerifierDashboard contract={contract} />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => {
  return (
    <WalletProvider>
      <Router>
        <AppContent />
      </Router>
    </WalletProvider>
  );
};

export default App;
