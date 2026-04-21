// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MicroEscrow
 * @dev Escrow contract that releases funds when a valid signature from the Arbiter is provided.
 * Note: On Arc L1, USDC is the native gas token, so msg.value represents USDC.
 */
contract MicroEscrow {
    address public arbiterPublicKey;
    
    // Tracks executed actions to prevent replay attacks
    mapping(bytes32 => bool) public executedTransactions;

    event ActionExecuted(bytes32 indexed actionId, address indexed target, uint256 amount);
    event Deposited(address indexed user, uint256 amount);

    constructor(address _arbiterPublicKey) {
        require(_arbiterPublicKey != address(0), "Invalid arbiter address");
        arbiterPublicKey = _arbiterPublicKey;
    }

    /**
     * @dev Accept native token deposits (USDC on Arc L1).
     */
    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Executes an action if the arbiter has signed the payload.
     * @param actionId Unique ID for the action to prevent replay attacks.
     * @param target The address to send funds to.
     * @param amount The amount of funds (USDC native) to send.
     * @param signature The ECDSA signature from the arbiter.
     */
    function executeAction(
        bytes32 actionId,
        address target,
        uint256 amount,
        bytes memory signature
    ) external {
        require(!executedTransactions[actionId], "Action already executed");
        require(address(this).balance >= amount, "Insufficient escrow balance");
        require(target != address(0), "Invalid target address");

        // Recreate the message hash that the arbiter signed
        bytes32 messageHash = keccak256(abi.encodePacked(address(this), block.chainid, actionId, target, amount));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        // Recover the signer address
        address signer = recoverSigner(ethSignedMessageHash, signature);
        require(signer == arbiterPublicKey, "Invalid arbiter signature");

        // Mark as executed
        executedTransactions[actionId] = true;

        // Execute transfer
        (bool success, ) = target.call{value: amount}("");
        require(success, "Transfer failed");

        emit ActionExecuted(actionId, target, amount);
    }

    /**
     * @dev Internal function to recover the signer from an ECDSA signature.
     */
    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) internal pure returns (address) {
        require(_signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            // First 32 bytes, after the length prefix
            r := mload(add(_signature, 32))
            // Second 32 bytes
            s := mload(add(_signature, 64))
            // Final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(_signature, 96)))
        }

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }
}