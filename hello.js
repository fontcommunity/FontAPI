#!/usr/bin/env nodejs

/*
var http = require('http');
http.createServer(function (request, response) {
   response.writeHead(200, {'Content-Type': 'text/plain'});
   response.end('Hello World! Node.js is working correctly.\n');
}).listen(8080);
console.log('Server running at http://127.0.0.1:8880/');

*/

var nftxLib = require('./nftxLib');


const express = require('express');
const asyncify = require('express-asyncify');


//var web3 = new Web3(FTM_RPC);

const app = asyncify(express());




app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', function (req, res) {
   res.send('hello world')
 })

app.get('/api/info', async (req, res) => {
  //var NFT = await getNFT(1);


  //var ABI_NFTex = JSON.parse(filesys.readFileSync('./ABI/fontnftex.json'));
  //var ContractNFTEx = new web3.eth.Contract(ABI_NFTex, FTM_NFTEX_ADDRESS);

   //var NFT = await nftxLib.viewNFT(1);//  ContractNFTEx.methods.viewNFT(1).call();
   var NFT =  await nftxLib.viewNFT("2");
   res.send(NFT);

   /*
   var NFT =   web3.eth.getBlockNumber().then(function(result){
      res.send(NFT);
      return result;
   });;
   */

 //  filesys.writeFileSync("./test.logs.txt", result);
 //  filesys.writeFileSync("./test.logs1.txt", error); 

 // });
  
});


app.post('/api/v1/getback', (req, res) => {
  res.send({ ...req.body });
});


app.get('/users/:userId/books/:bookId', function (req, res) {
   res.send(req.params)
});
 

app.listen(8080, () => console.log(`Listening on: 8080`));


