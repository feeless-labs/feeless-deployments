const { ethers } = require("ethers");
require("@nomiclabs/hardhat-ethers");

async function main() {
    // Carica la rete e le impostazioni degli account da hardhat.config.js
 

    // Assicurati di inserire la tua chiave privata qui
    const privateKey = ''; // Sostituisci con la tua chiave privata reale

    // Crea un provider HTTP per connettersi alla rete Ethereum
    const provider = new ethers.providers.JsonRpcProvider("https://1075.rpc.thirdweb.com");

    // Crea un wallet con la chiave privata e connettilo al provider
    const wallet = new ethers.Wallet(privateKey, provider);

    // Ottieni il saldo del wallet
    const balance = await provider.getBalance(wallet.address);
    console.log(`Il saldo dell'account ${wallet.address} è: ${ethers.utils.formatEther(balance)} ETH`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});