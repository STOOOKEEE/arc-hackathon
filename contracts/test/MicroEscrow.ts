import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("MicroEscrow", function () {
  async function deployEscrowFixture() {
    const [owner, arbiter, user, target] = await ethers.getSigners();

    const MicroEscrow = await ethers.getContractFactory("MicroEscrow");
    const escrow = await MicroEscrow.deploy(arbiter.address);
    const chainId = (await ethers.provider.getNetwork()).chainId;

    return { escrow, owner, arbiter, user, target, chainId };
  }

  it("Should accept deposits", async function () {
    const { escrow, user } = await loadFixture(deployEscrowFixture);

    const depositAmount = ethers.parseEther("1.0");

    await expect(
      user.sendTransaction({
        to: await escrow.getAddress(),
        value: depositAmount,
      })
    ).to.emit(escrow, "Deposited").withArgs(user.address, depositAmount);

    expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(depositAmount);
  });

  it("Should execute an action with a valid signature", async function () {
    const { escrow, arbiter, target, chainId } = await loadFixture(deployEscrowFixture);
    const contractAddress = await escrow.getAddress();

    const depositAmount = ethers.parseEther("2.0");
    await arbiter.sendTransaction({ to: contractAddress, value: depositAmount });

    const actionId = ethers.id("action1");
    const amount = ethers.parseEther("1.0");

    // Recreate the message hash exactly as done in the contract
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint256", "bytes32", "address", "uint256"],
      [contractAddress, chainId, actionId, target.address, amount]
    );

    // Arbiter signs the raw message bytes (ethers will add the \x19Ethereum Signed Message prefix)
    const signature = await arbiter.signMessage(ethers.getBytes(messageHash));

    await expect(escrow.executeAction(actionId, target.address, amount, signature))
      .to.emit(escrow, "ActionExecuted")
      .withArgs(actionId, target.address, amount);
  });

  it("Should reject an action with an invalid signature", async function () {
    const { escrow, user, target, chainId } = await loadFixture(deployEscrowFixture);
    const contractAddress = await escrow.getAddress();

    const depositAmount = ethers.parseEther("2.0");
    await user.sendTransaction({ to: contractAddress, value: depositAmount });

    const actionId = ethers.id("action2");
    const amount = ethers.parseEther("1.0");

    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint256", "bytes32", "address", "uint256"],
      [contractAddress, chainId, actionId, target.address, amount]
    );

    // Signed by USER instead of ARBITER
    const signature = await user.signMessage(ethers.getBytes(messageHash));

    await expect(
      escrow.executeAction(actionId, target.address, amount, signature)
    ).to.be.revertedWith("Invalid arbiter signature");
  });

  it("Should prevent replay of the same actionId", async function () {
    const { escrow, arbiter, target, chainId } = await loadFixture(deployEscrowFixture);
    const contractAddress = await escrow.getAddress();

    const depositAmount = ethers.parseEther("2.0");
    await arbiter.sendTransaction({ to: contractAddress, value: depositAmount });

    const actionId = ethers.id("action3");
    const amount = ethers.parseEther("1.0");

    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint256", "bytes32", "address", "uint256"],
      [contractAddress, chainId, actionId, target.address, amount]
    );

    const signature = await arbiter.signMessage(ethers.getBytes(messageHash));

    await escrow.executeAction(actionId, target.address, amount, signature);

    // Second execution should fail
    await expect(
      escrow.executeAction(actionId, target.address, amount, signature)
    ).to.be.revertedWith("Action already executed");
  });
});
