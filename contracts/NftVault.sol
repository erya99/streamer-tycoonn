// contracts/NftVault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract NftVault is Ownable, IERC721Receiver {
    struct DepositInfo {
        address owner;       // NFT'yi kimin adına tuttuğumuz
        address token;       // NFT kontrat adresi
        uint256 tokenId;
        bool deposited;
    }

    // key = keccak256(token, tokenId)
    mapping(bytes32 => DepositInfo) public deposits;

    event Deposited(
        address indexed owner,
        address indexed token,
        uint256 indexed tokenId
    );

    event Withdrawn(
        address indexed owner,
        address indexed token,
        uint256 indexed tokenId
    );

    event TransferredOnSale(
        address indexed oldOwner,
        address indexed newOwner,
        address indexed token,
        uint256 tokenId
    );

    function _key(address token, uint256 tokenId) internal pure returns (bytes32) {
        return keccak256(abi.encode(token, tokenId));
    }

    /// @notice Kullanıcı, NFT'yi bu fonksiyonla kasaya yatırır
    function deposit(address token, uint256 tokenId) external {
        IERC721 nft = IERC721(token);

        // Önce NFT'nin sahibi mi kontrol et
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");

        bytes32 key = _key(token, tokenId);
        require(!deposits[key].deposited, "Already deposited");

        // NFT'yi kasaya transfer et
        nft.safeTransferFrom(msg.sender, address(this), tokenId);

        deposits[key] = DepositInfo({
            owner: msg.sender,
            token: token,
            tokenId: tokenId,
            deposited: true
        });

        emit Deposited(msg.sender, token, tokenId);
    }

    /// @notice Satış iptal olursa NFT'yi geri almak için
    function withdraw(address token, uint256 tokenId) external {
        bytes32 key = _key(token, tokenId);
        DepositInfo memory info = deposits[key];

        require(info.deposited, "Not deposited");
        require(info.owner == msg.sender, "Not deposit owner");

        delete deposits[key];

        IERC721(token).safeTransferFrom(address(this), msg.sender, tokenId);

        emit Withdrawn(msg.sender, token, tokenId);
    }

    /// @notice Backend/admin, satış gerçekleştiğinde NFT'yi alıcıya yollar
    function transferOnSale(
        address token,
        uint256 tokenId,
        address newOwner
    ) external onlyOwner {
        bytes32 key = _key(token, tokenId);
        DepositInfo memory info = deposits[key];

        require(info.deposited, "Not deposited");

        delete deposits[key];

        IERC721(token).safeTransferFrom(address(this), newOwner, tokenId);

        emit TransferredOnSale(info.owner, newOwner, token, tokenId);
    }

    /// @dev safeTransferFrom için gerekli receiver implementasyonu
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
