pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

/**
 * Credential Proof Circuit
 * 
 * Proves knowledge of a credential's private data (secret + credentialData)
 * without revealing it. The circuit computes:
 *   hash = Poseidon(secret, credentialData)
 * and exposes the hash as a public output.
 * 
 * The prover demonstrates they know the preimage of the hash
 * without revealing the actual credential data.
 */
template CredentialProof() {
    // Private inputs (known only to the prover/credential holder)
    signal input secret;           // User's secret key
    signal input credentialData;   // Credential data (e.g., encoded degree info)
    
    // Public output (visible to the verifier)
    signal output credentialHash;  // Hash commitment of the credential
    
    // Compute Poseidon hash of the private inputs
    component hasher = Poseidon(2);
    hasher.inputs[0] <== secret;
    hasher.inputs[1] <== credentialData;
    
    // Output the hash as public signal
    credentialHash <== hasher.out;
}

component main = CredentialProof();
