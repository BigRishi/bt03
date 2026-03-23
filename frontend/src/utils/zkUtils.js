/* global BigInt */
import { ethers } from 'ethers';

/**
 * Generate a credential hash from secret and credential data.
 * Uses keccak256 as a simplified version of Poseidon hash for the demo.
 */
export const generateCredentialHash = (secret, credentialData) => {
    const secretHash = ethers.keccak256(ethers.toUtf8Bytes(secret));
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes(credentialData));
    return ethers.keccak256(
        ethers.solidityPacked(['bytes32', 'bytes32'], [secretHash, dataHash])
    );
};

/**
 * Generate a zero-knowledge proof for credential verification.
 * In production, this would use snarkjs with a compiled circuit.
 * For the demo, we generate a structured proof that the smart contract can verify.
 */
export const generateZKProof = async (secret, credentialData, credentialHash) => {
    // Simulate proof generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate deterministic proof components from the secret
    const secretHash = ethers.keccak256(ethers.toUtf8Bytes(secret));
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes(credentialData));
    const combinedHash = ethers.keccak256(
        ethers.solidityPacked(['bytes32', 'bytes32'], [secretHash, dataHash])
    );

    // Create proof elements (a, b, c) from the hashes
    // These are structured to pass the Groth16Verifier contract checks
    const a = [
        BigInt(secretHash),
        BigInt(dataHash)
    ];

    const b = [
        [
            BigInt(combinedHash),
            BigInt(ethers.keccak256(ethers.solidityPacked(['bytes32', 'uint256'], [combinedHash, 1n])))
        ],
        [
            BigInt(ethers.keccak256(ethers.solidityPacked(['bytes32', 'uint256'], [combinedHash, 2n]))),
            BigInt(ethers.keccak256(ethers.solidityPacked(['bytes32', 'uint256'], [combinedHash, 3n])))
        ]
    ];

    const c = [
        BigInt(ethers.keccak256(ethers.solidityPacked(['bytes32', 'uint256'], [secretHash, 4n]))),
        BigInt(ethers.keccak256(ethers.solidityPacked(['bytes32', 'uint256'], [dataHash, 5n])))
    ];

    const input = [BigInt(credentialHash)];

    return {
        a: a.map(v => v.toString()),
        b: b.map(row => row.map(v => v.toString())),
        c: c.map(v => v.toString()),
        input: input.map(v => v.toString()),
        credentialHash,
        timestamp: Date.now(),
    };
};

/**
 * Format proof for smart contract call
 */
export const formatProofForContract = (proof) => {
    return {
        a: proof.a.map(v => BigInt(v)),
        b: proof.b.map(row => row.map(v => BigInt(v))),
        c: proof.c.map(v => BigInt(v)),
        input: proof.input.map(v => BigInt(v)),
    };
};

/**
 * Verify a proof locally (quick check before on-chain verification)
 */
export const verifyProofLocally = (proof) => {
    try {
        // Basic structural validation
        if (!proof.a || proof.a.length !== 2) return false;
        if (!proof.b || proof.b.length !== 2) return false;
        if (!proof.c || proof.c.length !== 2) return false;
        if (!proof.input || proof.input.length !== 1) return false;

        // Check all values are non-zero
        const allNonZero = [
            ...proof.a,
            ...proof.b.flat(),
            ...proof.c,
            ...proof.input
        ].every(v => BigInt(v) !== 0n);

        // Security check: public input must match the combined hash b[0][0]
        if (proof.input[0] !== proof.b[0][0]) return false;

        return allNonZero;
    } catch {
        return false;
    }
};
