// contracts/GemTreasury.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GemTreasury is Ownable {
    IERC20 public immutable usdc;

    mapping(uint256 => uint256) public packPrice; // packId -> USDC (6 decimals)
    mapping(uint256 => uint256) public packGems;  // packId -> gems

    event GemsPurchased(
        address indexed buyer,
        uint256 indexed packId,
        uint256 usdcAmount,
        uint256 gems
    );

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    function setPack(
        uint256 packId,
        uint256 price,
        uint256 gems
    ) external onlyOwner {
        require(price > 0 && gems > 0, "Invalid pack");
        packPrice[packId] = price;
        packGems[packId] = gems;
    }

    function buy(uint256 packId) external {
        uint256 price = packPrice[packId];
        uint256 gems = packGems[packId];
        require(price > 0 && gems > 0, "Pack not available");

        bool ok = usdc.transferFrom(msg.sender, address(this), price);
        require(ok, "USDC transfer failed");

        emit GemsPurchased(msg.sender, packId, price, gems);
    }
}
