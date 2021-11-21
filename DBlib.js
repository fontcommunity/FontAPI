const Database = require('better-sqlite3');

const NFTDB_FILE = 'db/nftdb.db';

const db = new Database(NFTDB_FILE, { verbose: console.log });

async function _createTable() {
    var sql = `
    CREATE TABLE IF NOT EXISTS nfts (
        nft_id INTEGER PRIMARY KEY,
        owner_address text,
        creator_address text, 
        mapped BOOLEAN,
        minted BOOLEAN,
        custody BOOLEAN, 
        font_name TEXT,
        creator_name TEXT, 
        NFT_auction BOOLEAN,
        NFT_status INTEGER,
        NFT_royality INTEGER,
        NFT_referralCommission INTEGER,
        NFT_owner text,
        NFT_token text, 
        orderID INTEGER,
        price text, 
        minPrice text,
        highestBidID INTEGER,
        boost text, 
        licenses_sales_count INTEGER, 
        licenses_sales_amount text


    );`;
    
}

//Create nft rows if not exists
async function initiateRows(items) {
    
}

async function initiateRow(nft_id, owner_address, creator_address, mapped, minted, font_name, creator_name) {

}

async function updateNFTObj(nft_id ) {

}

async function updateNFTBoost(nft_id, boost) {

}

async function updateFontLicensesSales(nft_id, count, amount) {

}

async function checkIfFontExists(nft_id) {

}

async function loadNFT(nft_id) {

}

async function loadNFTsByOwner(owner_address) {

}

module.exports = { 

    NFTDB_FILE: NFTDB_FILE,
    initiateRow: initiateRow,
    initiateRows: initiateRows,

};