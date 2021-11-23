var _ = require('underscore');

//take the db row and convert back to NFT object
function convert_db_to_json_nft(item) {

}

function convert_json_to_db_nft(item) {

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

};
