import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) throw new Error('useWallet must be used within WalletProvider');
    return context;
};

export const WalletProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    const HARDHAT_CHAIN_ID = '0x7A69'; // 31337 in hex

    const switchToHardhat = useCallback(async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: HARDHAT_CHAIN_ID }],
            });
        } catch (switchError) {
            // Chain not added yet — add it
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: HARDHAT_CHAIN_ID,
                        chainName: 'Hardhat Local',
                        rpcUrls: ['http://127.0.0.1:8545'],
                        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                    }],
                });
            }
        }
    }, []);

    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            setError('MetaMask is not installed. Please install MetaMask to use this application.');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            // Force switch to Hardhat network first
            await switchToHardhat();

            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const walletSigner = await browserProvider.getSigner();
            const network = await browserProvider.getNetwork();

            setAccount(accounts[0]);
            setProvider(browserProvider);
            setSigner(walletSigner);
            setChainId(Number(network.chainId));
        } catch (err) {
            console.error('Connection error:', err);
            setError(err.message || 'Failed to connect wallet');
        } finally {
            setIsConnecting(false);
        }
    }, [switchToHardhat]);

    const disconnectWallet = useCallback(() => {
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setChainId(null);
        setError(null);
    }, []);

    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else {
                setAccount(accounts[0]);
            }
        };

        const handleChainChanged = () => {
            window.location.reload();
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        // Check if already connected
        window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
            if (accounts.length > 0) {
                connectWallet();
            }
        });

        return () => {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
        };
    }, [connectWallet, disconnectWallet]);

    const shortenAddress = (addr) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <WalletContext.Provider value={{
            account,
            provider,
            signer,
            chainId,
            isConnecting,
            error,
            connectWallet,
            disconnectWallet,
            shortenAddress,
            isConnected: !!account,
        }}>
            {children}
        </WalletContext.Provider>
    );
};

export default WalletContext;
