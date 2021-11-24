var _ = require('underscore');

var Web3 = require('web3');
var web3utils = Web3.utils;

//take the db row and convert back to NFT object
function convert_db_to_json_nft(item) {
    if(!(item && item.nft_id && parseInt(item.nft_id))) {
        return false;
    }

    

    var maps = [
        'NFT_auction', 'NFT_status', 'NFT_royality', 'NFT_referralCommission', 'NFT_owner', 'NFT_token', 'NFT_orderID',  'NFT_price', 'NFT_minPrice', 'NFT_highestBidID'
    ];

    var _obj = [];
    for(let m in maps) {
        var field = maps[m];
        _obj.push(item[field]);
    }
    var ret = {
        NFT: ObjNFT(_obj),
        BIDS: [],
        realOwner: item.NFT_owner,
        owner: item.NFT_owner,
        creator: item.creator_address,
        boost: item.boost,
        nft_id: item.nft_id,
        oef: item,
    };

    return ret;
}   

function convert_json_to_db_nft(item, debug = false) {
    if(!(item && item.nft_id && parseInt(item.nft_id))) {
        return false;
    }

    var custody = (parseInt(item.NFT.status) == 1) ? 1 : 0;

    var minted = (parseInt(item.NFT.status) == 0) ? 0 : 1;

    var mapped = 0;

    if(item.creator && web3utils.isAddress(item.creator) && item.creator != "0x0000000000000000000000000000000000000000") {
        mapped = 1;
    }
    
    

    var dbRow = {
        nft_id: parseInt(item.nft_id),
        owner_address: item.NFT.owner,
        creator_address: item.creator, 
        mapped: mapped,
        minted: minted,
        custody: custody, 
        font_name: item.font.name,
        creator_name: item.font.creator_name, 
        NFT_auction: item.NFT.auction,
        NFT_status: item.NFT.status,
        NFT_royality: item.NFT.royality, 
        NFT_referralCommission: item.NFT.referralCommission,
        NFT_owner: item.NFT.owner,
        NFT_token: item.NFT.token, 
        NFT_orderID: parseInt(item.NFT.orderID),
        NFT_price: item.NFT.price, 
        NFT_minPrice: item.NFT.minPrice,
        NFT_highestBidID: item.NFT.highestBidID,
        boost: item.boost, 
        licenses_sales_count: 0, 
        licenses_sales_amount: '0'
    };
    if(!debug) {
        return dbRow;
    }
    

    return {
        'item': item,
        'dbRow': dbRow
    };
}



function ObjBid(_bid) {
    var BID = {
        status: 0, //Bid status : 1/open, 2/filled, 3/cancelled
        bidder: ZERO_ADDRESS, //Address of the bidder
        referral: ZERO_ADDRESS, //referral address
        orderID: "0", //ID of the order 
        offer: "0", //Offer set be the bidder         
    };

    if(_.isArray(_bid)) {
        BID.status = parseInt(_bid[0]);
        BID.bidder = _bid[1];
        BID.referral = _bid[2];
        BID.orderID = _bid[3];
        BID.offer = _bid[4];
    }

    return BID;
}

//Helper function to conver ViewNFT array to object
function ObjNFT(_nft) {

    var NFT = {
        auction: false,
        status: 0,
        royality: 0,
        referralCommission: 0,
        owner: '0x0000000000000000000000000000000000000000',
        token: '0x0000000000000000000000000000000000000000',
        orderID: "0",
        price: "0",
        minPrice: "0",
        highestBidID: "0",

    };

    if(_.isArray(_nft)) {
        NFT.auction = _nft[0];
        NFT.status = parseInt(_nft[1]);
        NFT.royality = parseInt(_nft[2]);
        NFT.referralCommission = parseInt(_nft[3]);
        NFT.owner = _nft[4];
        NFT.token = _nft[5];
        NFT.orderID = _nft[6];
        NFT.price = _nft[7];
        NFT.minPrice = _nft[8];
        NFT.highestBidID = _nft[9];
    }

    return NFT;
}


module.exports = { 
    ObjBid: ObjBid,
    ObjNFT: ObjNFT,
    convert_db_to_json_nft:convert_db_to_json_nft,
    convert_json_to_db_nft:convert_json_to_db_nft,

};
