import hre from "hardhat";
import { expect } from "chai";

describe("CredentialRegistry", function () {
    let verifier, registry;
    let owner, issuer, holder, verifierUser;

    beforeEach(async function () {
        [owner, issuer, holder, verifierUser] = await hre.ethers.getSigners();

        // Deploy Groth16Verifier
        const Groth16Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
        verifier = await Groth16Verifier.deploy();
        await verifier.waitForDeployment();

        // Deploy CredentialRegistry
        const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
        registry = await CredentialRegistry.deploy(await verifier.getAddress());
        await registry.waitForDeployment();
    });

    describe("Issuer Management", function () {
        it("should auto-register deployer as issuer", async function () {
            expect(await registry.isIssuer(owner.address)).to.be.true;
        });

        it("should allow self-registration as issuer", async function () {
            await registry.connect(issuer).selfRegisterIssuer("Test University");
            expect(await registry.isIssuer(issuer.address)).to.be.true;
            expect(await registry.issuerNames(issuer.address)).to.equal("Test University");
        });

        it("should prevent duplicate issuer registration", async function () {
            await registry.connect(issuer).selfRegisterIssuer("Test Org");
            await expect(
                registry.connect(issuer).selfRegisterIssuer("Another Org")
            ).to.be.revertedWith("Already registered as issuer");
        });
    });

    describe("Credential Issuance", function () {
        const credHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("test-credential"));

        beforeEach(async function () {
            await registry.connect(issuer).selfRegisterIssuer("MIT");
        });

        it("should issue a credential", async function () {
            await registry.connect(issuer).issueCredential(
                credHash, holder.address, "Bachelor's Degree", "ipfs://test"
            );

            const cred = await registry.getCredential(credHash);
            expect(cred[0]).to.equal(issuer.address); // issuer
            expect(cred[1]).to.equal(holder.address); // holder
            expect(cred[2]).to.equal("Bachelor's Degree"); // type
            expect(cred[5]).to.be.true; // valid
        });

        it("should prevent non-issuers from issuing", async function () {
            await expect(
                registry.connect(holder).issueCredential(
                    credHash, holder.address, "Degree", "ipfs://test"
                )
            ).to.be.revertedWith("Caller is not a registered issuer");
        });

        it("should prevent duplicate credentials", async function () {
            await registry.connect(issuer).issueCredential(
                credHash, holder.address, "Degree", "ipfs://test"
            );
            await expect(
                registry.connect(issuer).issueCredential(
                    credHash, holder.address, "Degree", "ipfs://test"
                )
            ).to.be.revertedWith("Credential already exists");
        });

        it("should track holder credentials", async function () {
            await registry.connect(issuer).issueCredential(
                credHash, holder.address, "Degree", "ipfs://test"
            );
            const holderCreds = await registry.getHolderCredentials(holder.address);
            expect(holderCreds.length).to.equal(1);
            expect(holderCreds[0]).to.equal(credHash);
        });
    });

    describe("Credential Revocation", function () {
        const credHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("revoke-test"));

        beforeEach(async function () {
            await registry.connect(issuer).selfRegisterIssuer("Stanford");
            await registry.connect(issuer).issueCredential(
                credHash, holder.address, "PhD", "ipfs://test"
            );
        });

        it("should allow issuer to revoke", async function () {
            await registry.connect(issuer).revokeCredential(credHash);
            const cred = await registry.getCredential(credHash);
            expect(cred[5]).to.be.false;
        });

        it("should prevent non-issuer from revoking", async function () {
            await expect(
                registry.connect(holder).revokeCredential(credHash)
            ).to.be.revertedWith("Only issuer can revoke");
        });
    });
});
