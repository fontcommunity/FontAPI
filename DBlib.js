const Database = require('better-sqlite3');

const NFTDB_FILE = 'db/nftdb.db';

var _ = require('underscore');


const db = new Database(NFTDB_FILE, { verbose: console.log });
var Web3 = require('web3');
var web3utils = Web3.utils;

var hlp = require('./helper');



//var test = initiateRow(129, '0x668AE94D0870230AC007a01B471D02b2c94DDcB9', '0x668AE94D0870230AC007a01B471D02b2c94DDcB9', 1, 1, "font_name", "creator_name").then(function(er,ts){
//    console.log("asd", er, ts);
//});

//var item = checkIfFontExists(12993).then(function(er,ts){
//    console.log("asd", er, ts);
//});





//Create the tables in SQLite tables
async function createTables() {
    var tableNFT = await schemas();
    var output = [];
    for(let t in tableNFT) {
        var table = tableNFT[t];
        var _a = db.exec(table);
        output.push(_a);

    }
    return output;
}

//List of all DB schema for Font NFT exchange in fantom network 
async function schemas() {
    var createTableNFTs = `
        CREATE TABLE IF NOT EXISTS nfts (
            nft_id INTEGER PRIMARY KEY,
            owner_address TEXT,
            creator_address TEXT, 
            mapped INTEGER,
            minted INTEGER,
            custody INTEGER, 
            font_name TEXT,
            creator_name TEXT, 
            NFT_auction INTEGER,
            NFT_status INTEGER,
            NFT_royality INTEGER, 
            NFT_referralCommission INTEGER,
            NFT_owner text,
            NFT_token text, 
            NFT_orderID INTEGER,
            NFT_price TEXT, 
            NFT_minPrice TEXT,
            NFT_highestBidID INTEGER,
            boost TEXT, 
            licenses_sales_count INTEGER, 
            licenses_sales_amount TEXT
        );`;

    var createTableBids = `
        CREATE TABLE IF NOT EXISTS bids (
            bid_id INTEGER PRIMART KEY, 
            status INTEGER, 
            bidder TEXT, 
            referral TEXT, 
            orderID INTEGER, 
            offer TEXT, 
            token TEXT, 
            nft_id INTEGER
        );`;

    return {
        nfts: createTableNFTs,
        bids: createTableBids
    };
    
}



//Create nft rows if not exists
async function initiateRows(items) {
    if(!(items && _.size(items))) {
        return false;
    } 

    var output = {};

    for(let i in items) {
        var item = items[i];
        output[item.nft_id] = await initiateRow(item.nft_id, item.owner_address, item.creator_address, item.mapped, item.minted, item.font_name, item.creator_name);
    }

    return output;
}

async function insertRow() {

}

async function upsertRow(item) {
    if(!(item && item.nft_id && parseInt(item.nft_id))) {
        return false;
    }
    var ret;

    
    
    try {



        const stmt = db.prepare('INSERT OR REPLACE INTO nfts (nft_id, owner_address, creator_address, mapped, minted, custody, font_name) VALUES (?, ?, ?, ?, ?, ?, ?)');
        //const stmt = db.prepare('INSERT OR REPLACE INTO nfts VALUES (@nft_id, @owner_address, @NFT_owner)');
        ret = stmt.run(item.nft_id, item.owner_address, item.creator_address, item.mapped, item.minted, item.custody, item.font_name);
    }
    catch(E) {
        ret = E;
    }
    return ret;
}

async function updateRow() {
    //
}

//Initiate a single row.
async function initiateRow(nft_id, owner_address, creator_address, mapped, minted, font_name, creator_name) {
    if(!(parseInt(nft_id) && checkIfFontExists(nft_id))) {
        return false;
    }
    var info;

    if(creator_address) {
        if(!web3utils.isAddress(creator_address)) {
            return false;
        }
    }

    if(owner_address) {
        if(!web3utils.isAddress(owner_address)) {
            owner_address = "";
        }
    }    

    mapped = mapped ? 1 : 0;
    minted = minted ? 1 : 0;


    try {
        const stmt = db.prepare('INSERT OR IGNORE INTO nfts (nft_id, owner_address, creator_address, mapped, minted, font_name, creator_name) VALUES (?, ?, ?, ?, ?, ?, ?)');
        info = stmt.run(nft_id, owner_address, creator_address, mapped, minted, font_name, creator_name);    
    }
    catch(E) {
        info = false;
        console.log("Error in initiateRow", E);
    }

    return info;
    
}



async function updateNFTObj(nft_id ) {

}

async function updateNFTBoost(nft_id, boost) {

}

async function updateFontLicensesSales(nft_id, count, amount) {

}


//Check if NFT ID exists in the database. return bool
async function checkIfFontExists(nft_id) {
    nft_id = parseInt(nft_id);
    const stmt = db.prepare('SELECT nft_id FROM nfts WHERE nft_id = ?');
    const item = stmt.get(nft_id);

    if(item && parseInt(item.nft_id) == nft_id) {
        return true;
    }
    return false;
}

async function loadNFT(nft_id) {
    nft_id = parseInt(nft_id);
    const stmt = db.prepare('SELECT * FROM nfts WHERE nft_id = ?');
    const item = stmt.get(nft_id);    

    if(item && parseInt(item.nft_id) == nft_id) {
        return item;
    }
    return false;

}

//Load NFTs by owner address
async function loadNFTsByOwner(owner_address) {
    if(owner_address) {
        if(!web3utils.isAddress(owner_address)) {
            return false;
        }
    }

    
    const stmt =  db.prepare('SELECT * FROM nfts WHERE owner_address = ?');
    
    const items = stmt.all(owner_address);
    
    if(items && _.size(items)) {
        var output = [];
        for(let i in items) {
            var item = items[i];
            item = hlp.convert_db_to_json_nft(item);
            output.push(item);
        }
        return output;
    }
    return items;
}

module.exports = { 

    NFTDB_FILE: NFTDB_FILE,
    initiateRow: initiateRow,
    initiateRows: initiateRows,
    loadNFT: loadNFT,
    loadNFTsByOwner: loadNFTsByOwner,
    checkIfFontExists: checkIfFontExists,
    createTables: createTables,
    upsertRow:upsertRow,