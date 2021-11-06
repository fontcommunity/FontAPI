//Libraray that handles all Web 3 stuffs for FONT NFT exchange

const FTM_RPC = 'https://rpc.ftm.tools';
const FTM_NFTEX_ADDRESS = '0x9c05005073218c4Ab688D092E8476D2F2a81b458';

var filesys = require('fs');
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider(FTM_RPC));
var _ = require('underscore');



var ContractNFTEx = loadContract('fontnftex.json');

async function viewNFT(nft_id) {
    var NFT = await ContractNFTEx.methods.viewNFT(nft_id).call(); 
    
    return _nftObj(NFT);
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
        NFT.status = _nft[1];
        NFT.royality = _nft[2];
        NFT.referralCommission = _nft[3];
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
      //Get list of all the texts for preview 
      //cleanup: _cleaup_font_src_files,
    
      //unzip: _unzip_all_font_files,
      
      //single_unzip: _unzip_single_font_file,
      //single_unpack: _unpack_font,
      //test_single_parse: _parse_test_single_font_file,
    
      //Copy the free font files to another embed.font.community directory 
      //copy_embed_fonts: prepare_all_embed_fonts,
}
    
      
    
    