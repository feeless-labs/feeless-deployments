const { ethers } = require('ethers');

function generatePrivateKey() {
    const wallet = ethers.Wallet.createRandom();
    console.log("Chiave privata:", wallet.privateKey);
}

generatePrivateKey();