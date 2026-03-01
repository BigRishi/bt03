import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("🚀 Deploying ZK Credential Verification System...\n");

    // Deploy Groth16Verifier first
    console.log("📦 Deploying Groth16Verifier...");
    const Groth16Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
    const verifier = await Groth16Verifier.deploy();
    await verifier.waitForDeployment();
    const verifierAddress = await verifier.getAddress();
    console.log(`   ✅ Groth16Verifier deployed to: ${verifierAddress}`);

    // Deploy CredentialRegistry with verifier address
    console.log("\n📦 Deploying CredentialRegistry...");
    const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
    const registry = await CredentialRegistry.deploy(verifierAddress);
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log(`   ✅ CredentialRegistry deployed to: ${registryAddress}`);

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        Groth16Verifier: verifierAddress,
        CredentialRegistry: registryAddress,
        deployedAt: new Date().toISOString(),
    };

    // Save to frontend contracts directory
    const frontendContractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
    if (!fs.existsSync(frontendContractsDir)) {
        fs.mkdirSync(frontendContractsDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(frontendContractsDir, "deployment.json"),
        JSON.stringify(deploymentInfo, null, 2)
    );

    // Copy ABIs to frontend
    const artifacts = ["Groth16Verifier", "CredentialRegistry"];
    for (const name of artifacts) {
        const artifact = await hre.artifacts.readArtifact(name);
        fs.writeFileSync(
            path.join(frontendContractsDir, `${name}.json`),
            JSON.stringify({ abi: artifact.abi }, null, 2)
        );
    }

    console.log(`\n📋 Deployment info saved to frontend/src/contracts/`);
    console.log("\n🎉 Deployment complete!\n");
    console.log("=".repeat(50));
    console.log("Contract Addresses:");
    console.log(`  Groth16Verifier:     ${verifierAddress}`);
    console.log(`  CredentialRegistry:  ${registryAddress}`);
    console.log("=".repeat(50));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
