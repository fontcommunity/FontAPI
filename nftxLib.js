//Libraray that handles all Web 3 stuffs for FONT NFT exchange

const FTM_RPC = 'https://rpc.ftm.tools';
const FTM_NFTEX_ADDRESS = '0x9c05005073218c4Ab688D092E8476D2F2a81b458';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const PaymentTokens = {
    "0xbbc4a8d076f4b1888fec42581b6fc58d242cf2d5": 'FONT',
    "0x74b23882a30290451A17c44f4F05243b6b58C76d": 'ETH',
    "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75": 'USDC',
    "0x321162Cd933E2Be498Cd2267a90534A804051b11": 'WBTC',
    "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E": 'DAI',
    "0x69c744D3444202d35a2783929a0F930f2FBB05ad": 'sFTM',
    "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83": 'wFTM',
    "0x82f0B8B456c1A451378467398982d4834b6829c1": 'MIM',
    "0xdc301622e621166BD8E82f2cA0A26c13Ad0BE355": 'FRAX',
    "0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE": "BOO",
    "0x049d68029688eAbF473097a2fC38ef61633A3C7A": 'fUSDT',

};

var filesys = require('fs');
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider(FTM_RPC));
var _ = require('underscore');



var ContractNFTEx = loadContract('fontnftex.json');

//View an NFT
async function viewNFT(nft_id) {
    var NFT = await ContractNFTEx.methods.viewNFT(nft_id).call(); 
    return _nftObj(NFT);
}

//Get original creator 
async function OriginalNFTCreators(nft_id) {
    var creator = await ContractNFTEx.methods.OriginalNFTCreators(nft_id).call(); 
    return creator;
}   

//Get real owner 
async function getRealOwner(nft_id) {
    owner = false;
    try {
        owner = await ContractNFTEx.methods.getRealOwner(nft_id).call(); 
    }
    catch {

    }
    return owner;
}   


//Get owner of 
async function ownerOf(nft_id) {
    owner = false;
    try {
        owner = await ContractNFTEx.methods.ownerOf(nft_id).call(); 
    }
    catch {

    }
    return owner;
}   


async function NFTBoost(nft_id) {
    var boost = await ContractNFTEx.methods.NFTBoost(nft_id).call(); 
    return boost;
}

async function viewBid(bid_id) {
    bid = false;
    try {
        bid = await ContractNFTEx.methods.viewBid(bid_id).call(); 
    }
    catch {

    }
    return _bidObj(bid);
}

async function viewOrderBids(order_id, load = true) {
    bids = [];
    try {
        bids = await ContractNFTEx.methods.viewOrderBids(order_id).call(); 
    }
    catch {

    }    

    if(load && _.size(bids)) {
       var BIDS = {};
       for(let i in bids) {
           var bid = bids[i];
           BIDS[bid] = await viewBid(bid);
       }
       return BIDS;
    }

    return bids;
}


async function viewPaymentMethod(address){
    var status = await ContractNFTEx.methods.viewPaymentMethod(address).call(); 
    return status;
}


async function FontRewardPerToken(address){
    var status = await ContractNFTEx.methods.FontRewardPerToken(address).call(); 
    return status;
}


async function viewPaymentMethods() {
    
    output = {};
    for(let address in PaymentTokens) {        
        output[address] = await viewPaymentMethod(address);
    }
    return output;
}



async function FontRewardperTokenAll() {
    output = {};
    for(let address in PaymentTokens) {        
        output[address] = await FontRewardPerToken(address);
    }
    return output;    
}

async function viewFontRewards(user) {
    var rewards = await ContractNFTEx.methods.viewFontRewards(address).call(); 
    return rewards;    
}


async function viewEarnings(user, token){
    var status = await ContractNFTEx.methods.viewEarnings(user, token).call(); 
    return status;
}

async function commissionFees(token){
    var status = await ContractNFTEx.methods.commissionFees(token).call(); 
    return status;
}

async function FontRewardPaused() {
    var status = await ContractNFTEx.methods.FontRewardPaused().call(); 
    return status;    
}

async function OrderID() {
    var nextOrderID = await ContractNFTEx.methods.OrderID().call(); 
    return nextOrderID;    
}

async function exchangeFees() {
    var exchangeFees = await ContractNFTEx.methods.exchangeFees().call(); 
    return parseInt(exchangeFees);    
}

async function feesDistributionAddress() { 
    var address = await ContractNFTEx.methods.feesDistributionAddress().call();  
    return address;    
}

async function Settings() {
    var output = {
        FTM_RPC: FTM_RPC,
        FTM_NFTEX_ADDRESS: FTM_NFTEX_ADDRESS,
        feesDistributionAddress: await feesDistributionAddress(),
        exchangeFees: await exchangeFees(),
        OrderID: await OrderID(),
        FontRewardPaused: await FontRewardPaused(),
        FontRewardperTokenAll: await FontRewardperTokenAll(),
        viewPaymentMethods: await viewPaymentMethods(),
        PaymentTokens: PaymentTokens,
    }

    return output;
}

// Load a contract file 
function loadContract(ABI_file) { 
    ABI_file = './ABI/' + ABI_file;
    if(!filesys.existsSync(ABI_file)) {
        return false;
    } 
    var ABI_NFTex = JSON.parse(filesys.readFileSync(ABI_file));

    var ContractNFTEx = new web3.eth.Contract(ABI_NFTex, FTM_NFTEX_ADDRESS);
    return ContractNFTEx;
}


function _bidObj(_bid) {
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
function _nftObj(_nft) {

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
    //Load a Contract
    loadContract: loadContract,
    viewNFT: viewNFT,
    OriginalNFTCreators: OriginalNFTCreators,
    getRealOwner: getRealOwner,
    ownerOf: ownerOf,
    viewBid: viewBid,
    viewOrderBids:viewOrderBids,
    NFTBoost: NFTBoost,
    viewPaymentMethod: viewPaymentMethod,
    viewPaymentMethods: viewPaymentMethods,
    viewFontRewards: viewFontRewards,
    viewEarnings: viewEarnings,
    commissionFees: commissionFees,
    FontRewardPaused: FontRewardPaused,
    FontRewardPerToken: FontRewardPerToken,
    FontRewardperTokenAll: FontRewardperTokenAll,
    Settings: Settings,

      //Get list of all the texts for preview 
      //cleanup: _cleaup_font_src_files,
    
      //unzip: _unzip_all_font_files,
      
      //single_unzip: _unzip_single_font_file,
      //single_unpack: _unpack_font,
      //test_single_parse: _parse_test_single_font_file,
    
      //Copy the free font files to another embed.font.community directory 
      //copy_embed_fonts: prepare_all_embed_fonts,
}
    
      
    
    