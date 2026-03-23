import hre from "hardhat";

const [signer] = await hre.ethers.getSigners();
const tx = await signer.sendTransaction({
    to: "0x42Ae2fBbD456892f00438586Ad9Ba3044F6161Dd",
    value: hre.ethers.parseEther("1000")
});
await tx.wait();
console.log("✅ Sent 100 ETH to 0x42Ae2fBbD456892f00438586Ad9Ba3044F6161Dd");
console.log("TX Hash:", tx.hash);
