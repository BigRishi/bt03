// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Groth16Verifier.sol";

/**
 * @title CredentialRegistry
 * @notice Decentralized credential management with ZK proof verification.
 *         Issuers register and store credential hashes on-chain.
 *         Users prove credential ownership via zero-knowledge proofs.
 */
contract CredentialRegistry {
    
    // ============ State Variables ============
    
    Groth16Verifier public verifier;
    address public owner;
    
    // Registered issuers
    mapping(address => bool) public isIssuer;
    mapping(address => string) public issuerNames;
    
    // Credential storage
    struct Credential {
        address issuer;
        address holder;
        string credentialType;
        string metadataURI;
        uint256 issuedAt;
        bool isValid;
        bool exists;
    }
    
    // credentialHash => Credential
    mapping(bytes32 => Credential) public credentials;
    
    // holder => list of credential hashes
    mapping(address => bytes32[]) public holderCredentials;
    
    // issuer => list of credential hashes
    mapping(address => bytes32[]) public issuerCredentials;
    
    // Verification records
    struct VerificationRecord {
        address verifier;
        bytes32 credentialHash;
        bool result;
        uint256 timestamp;
    }
    
    VerificationRecord[] public verificationHistory;
    
    // ============ Events ============
    
    event IssuerRegistered(address indexed issuer, string name);
    event CredentialIssued(
        bytes32 indexed credentialHash,
        address indexed issuer,
        address indexed holder,
        string credentialType,
        uint256 timestamp
    );
    event CredentialRevoked(bytes32 indexed credentialHash, address indexed issuer);
    event CredentialVerified(
        bytes32 indexed credentialHash,
        address indexed verifierAddress,
        bool result,
        uint256 timestamp
    );
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier onlyIssuer() {
        require(isIssuer[msg.sender], "Caller is not a registered issuer");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _verifier) {
        verifier = Groth16Verifier(_verifier);
        owner = msg.sender;
        
        // Auto-register deployer as an issuer
        isIssuer[msg.sender] = true;
        issuerNames[msg.sender] = "System Admin";
        emit IssuerRegistered(msg.sender, "System Admin");
    }
    
    // ============ Issuer Management ============
    
    /**
     * @notice Register a new issuer (trusted authority)
     * @param _issuer Address of the issuer
     * @param _name Name of the issuing organization
     */
    function registerIssuer(address _issuer, string memory _name) external onlyOwner {
        require(!isIssuer[_issuer], "Issuer already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        isIssuer[_issuer] = true;
        issuerNames[_issuer] = _name;
        
        emit IssuerRegistered(_issuer, _name);
    }
    
    /**
     * @notice Self-register as an issuer (for demo purposes)
     * @param _name Name of the issuing organization
     */
    function selfRegisterIssuer(string memory _name) external {
        require(!isIssuer[msg.sender], "Already registered as issuer");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        isIssuer[msg.sender] = true;
        issuerNames[msg.sender] = _name;
        
        emit IssuerRegistered(msg.sender, _name);
    }
    
    // ============ Credential Issuance ============
    
    /**
     * @notice Issue a new credential
     * @param _credentialHash Hash of the credential data (computed off-chain)
     * @param _holder Address of the credential holder
     * @param _credentialType Type of credential (e.g., "Degree", "Certificate")
     * @param _metadataURI URI pointing to encrypted credential metadata
     */
    function issueCredential(
        bytes32 _credentialHash,
        address _holder,
        string memory _credentialType,
        string memory _metadataURI
    ) external onlyIssuer {
        require(!credentials[_credentialHash].exists, "Credential already exists");
        require(_holder != address(0), "Invalid holder address");
        require(bytes(_credentialType).length > 0, "Credential type required");
        
        credentials[_credentialHash] = Credential({
            issuer: msg.sender,
            holder: _holder,
            credentialType: _credentialType,
            metadataURI: _metadataURI,
            issuedAt: block.timestamp,
            isValid: true,
            exists: true
        });
        
        holderCredentials[_holder].push(_credentialHash);
        issuerCredentials[msg.sender].push(_credentialHash);
        
        emit CredentialIssued(
            _credentialHash,
            msg.sender,
            _holder,
            _credentialType,
            block.timestamp
        );
    }
    
    /**
     * @notice Revoke a credential
     * @param _credentialHash Hash of the credential to revoke
     */
    function revokeCredential(bytes32 _credentialHash) external {
        Credential storage cred = credentials[_credentialHash];
        require(cred.exists, "Credential does not exist");
        require(cred.issuer == msg.sender, "Only issuer can revoke");
        require(cred.isValid, "Credential already revoked");
        
        cred.isValid = false;
        emit CredentialRevoked(_credentialHash, msg.sender);
    }
    
    // ============ ZK Proof Verification ============
    
    /**
     * @notice Verify a zero-knowledge proof for a credential
     * @param _credentialHash The credential hash being verified
     * @param a Proof element A
     * @param b Proof element B
     * @param c Proof element C
     * @param input Public inputs
     * @return True if the proof is valid and credential exists
     */
    function verifyCredentialProof(
        bytes32 _credentialHash,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[1] memory input
    ) external returns (bool) {
        // Check credential exists and is valid
        require(credentials[_credentialHash].exists, "Credential does not exist");
        require(credentials[_credentialHash].isValid, "Credential has been revoked");
        
        // Verify the public input matches the credential hash
        require(
            input[0] == uint256(_credentialHash),
            "Public input does not match credential hash"
        );
        
        // Verify the ZK proof using the Groth16 verifier
        bool proofValid = verifier.verifyProof(a, b, c, input);
        
        // Record verification
        verificationHistory.push(VerificationRecord({
            verifier: msg.sender,
            credentialHash: _credentialHash,
            result: proofValid,
            timestamp: block.timestamp
        }));
        
        emit CredentialVerified(
            _credentialHash,
            msg.sender,
            proofValid,
            block.timestamp
        );
        
        return proofValid;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get credential details by hash
     */
    function getCredential(bytes32 _credentialHash) external view returns (
        address issuer_,
        address holder,
        string memory credentialType,
        string memory metadataURI,
        uint256 issuedAt,
        bool valid
    ) {
        Credential storage cred = credentials[_credentialHash];
        require(cred.exists, "Credential does not exist");
        
        return (
            cred.issuer,
            cred.holder,
            cred.credentialType,
            cred.metadataURI,
            cred.issuedAt,
            cred.isValid
        );
    }
    
    /**
     * @notice Check if a credential exists
     */
    function credentialExists(bytes32 _credentialHash) external view returns (bool) {
        return credentials[_credentialHash].exists;
    }
    
    /**
     * @notice Get all credential hashes for a holder
     */
    function getHolderCredentials(address _holder) external view returns (bytes32[] memory) {
        return holderCredentials[_holder];
    }
    
    /**
     * @notice Get all credential hashes issued by an issuer
     */
    function getIssuerCredentials(address _issuer) external view returns (bytes32[] memory) {
        return issuerCredentials[_issuer];
    }
    
    /**
     * @notice Get verification history count
     */
    function getVerificationHistoryCount() external view returns (uint256) {
        return verificationHistory.length;
    }
    
    /**
     * @notice Get a verification record by index
     */
    function getVerificationRecord(uint256 _index) external view returns (
        address verifierAddr,
        bytes32 credentialHash,
        bool result,
        uint256 timestamp
    ) {
        require(_index < verificationHistory.length, "Index out of bounds");
        VerificationRecord storage record = verificationHistory[_index];
        return (record.verifier, record.credentialHash, record.result, record.timestamp);
    }
}
