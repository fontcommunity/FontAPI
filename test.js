#!/usr/bin/env nodejs

const FTM_RPC = 'https://rpc.ftm.tools';
const FTM_NFTEX_ADDRESS = '0x9c05005073218c4Ab688D092E8476D2F2a81b458';



var filesys = require('fs');
var Web3 = require('web3');
//var web3 = new Web3(FTM_RPC);
var web3 = new Web3(new Web3.providers.HttpProvider(FTM_RPC));







  var ABI_NFTex = JSON.parse(filesys.readFileSync('./ABI/fontnftex.json'));
  var ContractNFTEx = new web3.eth.Contract(ABI_NFTex, FTM_NFTEX_ADDRESS);

  var NFT =  ContractNFTEx.methods.FontERC20Address().call().then(function(result){
   console.log("FONT ERC20 Address", result);
  });

  //var NFT =  ContractNFTEx.methods;//.FontERC20Address().call({}, function(error, result){


   web3.eth.getBlockNumber().then(function(a,b,c) {
      console.log(a,b,c);
   }

   );;

   
 //  filesys.writeFileSync("./test.logs.txt", result);
 //  filesys.writeFileSync("./test.logs1.txt", error); 

 // });



async function getNFT(nftID) {
   var ABI_NFTex = JSON.parse(filesys.readFileSync('./ABI/fontnftex.json'));

   var ContractNFTEx = new web3.eth.Contract(ABI_NFTex, FTM_NFTEX_ADDRESS);

   var NFT = ContractNFTEx.methods.viewNFT(nftID).call().then(function(result){
      return result;
   });

   return NFT;
}