import hre from "hardhat";
import fs from "fs";

async function main() {
    const { ethers } = hre;
    const [deployer, holder, verifier] = await ethers.getSigners();
    
    console.log("\n========================================");
    console.log("  ZK PROOF VERIFICATION TEST SUITE");
    console.log("========================================\n");

    // Get deployed contracts
    const deployInfo = JSON.parse(fs.readFileSync("./frontend/src/contracts/deployment.json", "utf8"));
    
    const CredentialRegistry = await ethers.getContractAt(
        (await hre.artifacts.readArtifact("CredentialRegistry")).abi,
        deployInfo.CredentialRegistry
    );
    
    const Groth16Verifier = await ethers.getContractAt(
        (await hre.artifacts.readArtifact("Groth16Verifier")).abi,
        deployInfo.Groth16Verifier
    );

    // ============ SETUP ============
    const SECRET = "mysecret";
    const CREDENTIAL_DATA = "CS Degree, 2024";
    const WRONG_SECRET = "wrongsecret";
    
    // Compute credential hash (new logic matching ZK circuit)
    const secretHash = ethers.keccak256(ethers.toUtf8Bytes(SECRET));
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes(CREDENTIAL_DATA));
    const credentialHash = ethers.keccak256(
        ethers.solidityPacked(['bytes32', 'bytes32'], [secretHash, dataHash])
    );
    
    // Compute proofKeyHash (same as IssuerDashboard)
    const proofKeyHash = ethers.keccak256(ethers.solidityPacked(['uint256'], [BigInt(secretHash)]));
    
    console.log("Secret:", SECRET);
    console.log("Credential Data:", CREDENTIAL_DATA);
    console.log("Credential Hash:", credentialHash);
    console.log("Secret Hash (a[0]):", secretHash);
    console.log("Proof Key Hash (stored):", proofKeyHash);
    
    // ============ REGISTER ISSUER ============
    console.log("\n--- Step 1: Register Issuer ---");
    try {
        const tx1 = await CredentialRegistry.connect(deployer).selfRegisterIssuer("Test University");
        await tx1.wait();
        console.log("✅ Issuer registered");
    } catch (e) {
        console.log("⚠️ Issuer already registered:", e.reason || "ok");
    }
    
    // ============ ISSUE CREDENTIAL ============
    console.log("\n--- Step 2: Issue Credential ---");
    try {
        const tx2 = await CredentialRegistry.connect(deployer).issueCredential(
            credentialHash,
            holder.address,
            "Bachelor's Degree",
            "ipfs://test",
            proofKeyHash
        );
        await tx2.wait();
        console.log("✅ Credential issued to holder:", holder.address);
    } catch (e) {
        console.log("⚠️ Credential issue:", e.reason || e.message);
    }
    
    // ============ GENERATE CORRECT PROOF ============
    console.log("\n--- Step 3: Generate CORRECT proof ---");
    const correctA0 = BigInt(ethers.keccak256(ethers.toUtf8Bytes(SECRET)));
    const correctA1 = BigInt(ethers.keccak256(ethers.toUtf8Bytes(CREDENTIAL_DATA)));
    const correctCombined = ethers.keccak256(
        ethers.solidityPacked(['bytes32', 'bytes32'], [secretHash, ethers.keccak256(ethers.toUtf8Bytes(CREDENTIAL_DATA))])
    );
    const correctC0 = BigInt(ethers.keccak256(
        ethers.solidityPacked(['bytes32', 'uint256'], [secretHash, 4n])
    ));
    
    const correctProof = {
        a: [correctA0, correctA1],
        b: [
            [BigInt(correctCombined), BigInt(ethers.keccak256(ethers.solidityPacked(['bytes32', 'uint256'], [correctCombined, 1n])))],
            [BigInt(ethers.keccak256(ethers.solidityPacked(['bytes32', 'uint256'], [correctCombined, 2n]))), BigInt(ethers.keccak256(ethers.solidityPacked(['bytes32', 'uint256'], [correctCombined, 3n])))]
        ],
        c: [correctC0, BigInt(ethers.keccak256(ethers.solidityPacked(['bytes32', 'uint256'], [ethers.keccak256(ethers.toUtf8Bytes(CREDENTIAL_DATA)), 5n])))],
        input: [BigInt(credentialHash)]
    };
    
    console.log("Correct a[0]:", correctProof.a[0].toString().slice(0, 20) + "...");
    
    // Verify: does keccak256(a[0]) match stored proofKeyHash?
    const computedKeyHash = ethers.keccak256(ethers.solidityPacked(['uint256'], [correctProof.a[0]]));
    console.log("Computed keccak256(a[0]):", computedKeyHash);
    console.log("Stored proofKeyHash:    ", proofKeyHash);
    console.log("MATCH?", computedKeyHash === proofKeyHash ? "✅ YES" : "❌ NO");
    
    // ============ TEST 1: CORRECT PROOF ============
    console.log("\n--- TEST 1: Verify CORRECT proof ---");
    try {
        // First test the Groth16Verifier directly
        const g16Result = await Groth16Verifier.verifyProof(
            correctProof.a, correctProof.b, correctProof.c, correctProof.input
        );
        console.log("Groth16Verifier.verifyProof result:", g16Result);
        
        // Now test via CredentialRegistry
        const tx3 = await CredentialRegistry.connect(verifier).verifyCredentialProof(
            credentialHash,
            correctProof.a,
            correctProof.b,
            correctProof.c,
            correctProof.input
        );
        const receipt3 = await tx3.wait();
        
        // Parse event
        const event3 = receipt3.logs.find(log => {
            try {
                return CredentialRegistry.interface.parseLog(log)?.name === 'CredentialVerified';
            } catch { return false; }
        });
        const parsed3 = CredentialRegistry.interface.parseLog(event3);
        console.log("Correct proof result:", parsed3.args[2] ? "✅ VALID (expected)" : "❌ INVALID (BUG!)");
    } catch (e) {
        console.log("❌ Correct proof REVERTED (BUG!):", e.reason || e.message);
    }
    
    // ============ GENERATE WRONG PROOF (different secret) ============
    console.log("\n--- Step 4: Generate WRONG proof (wrong secret) ---");
    const wrongSecretHash = ethers.keccak256(ethers.toUtf8Bytes(WRONG_SECRET));
    const wrongA0 = BigInt(wrongSecretHash);
    const wrongA1 = BigInt(ethers.keccak256(ethers.toUtf8Bytes(CREDENTIAL_DATA)));
    const wrongCombined = ethers.keccak256(
        ethers.solidityPacked(['bytes32', 'bytes32'], [wrongSecretHash, ethers.keccak256(ethers.toUtf8Bytes(CREDENTIAL_DATA))])
    );
    const wrongC0 = BigInt(ethers.keccak256(
        ethers.solidityPacked(['bytes32', 'uint256'], [wrongSecretHash, 4n])
    ));
    
    const wrongProof = {
        a: [wrongA0, wrongA1],
        b: [
            [BigInt(wrongCombined), BigInt(ethers.keccak256(ethers.solidityPacked(['bytes32', 'uint256'], [wrongCombined, 1n])))],
            [BigInt(ethers.keccak256(ethers.solidityPacked(['bytes32', 'uint256'], [wrongCombined, 2n]))), BigInt(ethers.keccak256(ethers.solidityPacked(['bytes32', 'uint256'], [wrongCombined, 3n])))]
        ],
        c: [wrongC0, BigInt(ethers.keccak256(ethers.solidityPacked(['bytes32', 'uint256'], [ethers.keccak256(ethers.toUtf8Bytes(CREDENTIAL_DATA)), 5n])))],
        input: [BigInt(credentialHash)]
    };
    
    // Verify: does keccak256(wrong a[0]) match stored proofKeyHash?
    const wrongComputedKeyHash = ethers.keccak256(ethers.solidityPacked(['uint256'], [wrongProof.a[0]]));
    console.log("Wrong a[0] keccak256:", wrongComputedKeyHash);
    console.log("Stored proofKeyHash: ", proofKeyHash);
    console.log("MATCH?", wrongComputedKeyHash === proofKeyHash ? "❌ YES (BUG!)" : "✅ NO (correct, should reject)");
    
    // ============ TEST 2: WRONG PROOF ============
    console.log("\n--- TEST 2: Verify WRONG proof (should be INVALID) ---");
    try {
        const tx4 = await CredentialRegistry.connect(verifier).verifyCredentialProof(
            credentialHash,
            wrongProof.a,
            wrongProof.b,
            wrongProof.c,
            wrongProof.input
        );
        const receipt4 = await tx4.wait();
        
        const event4 = receipt4.logs.find(log => {
            try {
                return CredentialRegistry.interface.parseLog(log)?.name === 'CredentialVerified';
            } catch { return false; }
        });
        const parsed4 = CredentialRegistry.interface.parseLog(event4);
        console.log("Wrong proof result:", parsed4.args[2] ? "❌ VALID (BUG! This should be INVALID)" : "✅ INVALID (correct!)");
    } catch (e) {
        console.log("Result: REVERTED -", e.reason || e.message);
        console.log("(This is OK if it rejected the proof, but ideally should return false not revert)");
    }
    
    // ============ TEST 3: RANDOM GARBAGE PROOF ============
    console.log("\n--- TEST 3: Verify RANDOM proof (should be INVALID) ---");
    const randomProof = {
        a: [123456789n, 987654321n],
        b: [[111n, 222n], [333n, 444n]],
        c: [555n, 666n],
        input: [BigInt(credentialHash)]
    };
    
    try {
        const tx5 = await CredentialRegistry.connect(verifier).verifyCredentialProof(
            credentialHash,
            randomProof.a,
            randomProof.b,
            randomProof.c,
            randomProof.input
        );
        const receipt5 = await tx5.wait();
        
        const event5 = receipt5.logs.find(log => {
            try {
                return CredentialRegistry.interface.parseLog(log)?.name === 'CredentialVerified';
            } catch { return false; }
        });
        const parsed5 = CredentialRegistry.interface.parseLog(event5);
        console.log("Random proof result:", parsed5.args[2] ? "❌ VALID (BUG!)" : "✅ INVALID (correct!)");
    } catch (e) {
        console.log("Result: REVERTED -", e.reason || e.message);
    }
    
    console.log("\n========================================");
    console.log("  TEST SUITE COMPLETE");
    console.log("========================================\n");
}

main().catch(console.error);
