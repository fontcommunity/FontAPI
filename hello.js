#!/usr/bin/env nodejs



var nftxLib = require('./nftxLib');
const express = require('express');
const asyncify = require('express-asyncify');
var fontlib = require('./fontlib');
var DB = require('./DBlib');
const app = asyncify(express());
var apicache =  require('apicache');
let cache = apicache.middleware;

const onlyStatus200 = (req, res) => res.statusCode === 200;





//app.use(cache('5 minutes', onlyStatus200));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 

//app.all('*', function(req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*');
//});


app.get('/', function (req, res) {
   res.send('hello world')
})

app.get('/test/db/:nftid', async (req, res) => {
   var nft = await DB.loadNFTsByOwner(req.params.nftid);
   res.send(nft);
});   

app.get('/test', cache('5 minutes'), (req, res) => {

   if(req.query.cache == 'reset') {
      apicache.clear(req.originalUrl)
   }

   res.send([
      req.originalUrl, 
      req.path, req.subdomains, req.hostname, req.query.keyword
      //query.keyword
   ]);  
})

app.get('/nft/mynft/:address', cache('15 minutes'), async (req, res) => {
   if(req.query.cache == 'reset') {
      apicache.clear(req.originalUrl)
   }   
   var mynfts =  await nftxLib.getMyNFTs(req.params.address);
   res.send(mynfts);
})

// add route to display cache index
app.get('/api/cache/index', (req, res) => {
   res.json(apicache.getIndex())
 })
 


app.get('/nft/nft/:nftid', cache('15 minutes'), async (req, res) => {
   if(req.query.cache == 'reset') {
      apicache.clear(req.originalUrl)
   }      
   var NFTData = await nftxLib.NFTDetails(req.params.nftid);
   
   res.send(NFTData);
})

app.get('/nft/viewnft/:nftid', cache('5 minutes'), async (req, res) => {
   if(req.query.cache == 'reset') {
      apicache.clear(req.originalUrl)
   }      
   var NFT =  await nftxLib.viewNFT(req.params.nftid);
   res.send(NFT);
})

app.get('/nft/originalcreator/:nftid', cache('5 minutes'), async (req, res) => {
   if(req.query.cache == 'reset') {
      apicache.clear(req.originalUrl)
   }      
   var creator =  await nftxLib.OriginalNFTCreators(req.params.nftid);
   res.send(creator);
})

app.get('/nft/getrealowner/:nftid', cache('5 minutes'), async (req, res) => {
   if(req.query.cache == 'reset') {
      apicache.clear(req.originalUrl)
   }      
   var owner =  await nftxLib.getRealOwner(req.params.nftid);
   res.send(owner);
})

app.get('/nft/ownerof/:nftid', cache('50 minutes'), async (req, res) => {
   if(req.query.cache == 'reset') {
      apicache.clear(req.originalUrl)
   }      
   var owner =  await nftxLib.ownerOf(req.params.nftid);
   res.send(owner);
})

app.get('/nft/viewbid/:bid_id', cache('50 minutes'), async (req, res) => {
   if(req.query.cache == 'reset') {
      apicache.clear(req.originalUrl)
   }      
   var bid =  await nftxLib.viewBid(req.params.bid_id);
   res.send(bid);
})

app.get('/nft/nftboost/:nftid', cache('50 minutes'), async (req, res) => {
   if(req.query.cache == 'reset') {
      apicache.clear(req.originalUrl)
   }      
   var boost =  await nftxLib.NFTBoost(req.params.nftid);
   res.send(boost);
})


app.get('/nft/vieworderbids/:order_id', cache('2 hour'), async (req, res) => {
   if(req.query.cache == 'reset') {
      apicache.clear(req.originalUrl)
   }      
   var bids =  await nftxLib.viewOrderBids(req.params.order_id, true);
   res.send(bids);
})


app.get('/nft/viewpaymentmethod/:address', cache('1 day'), async (req, res) => {
   if(req.query.cache == 'reset') {
      apicache.clear(req.originalUrl)
   }      
   var status =  await nftxLib.viewPaymentMethod(req.params.address);
   res.send(status);
})

app.get('/nft/viewpaymentmethods', cache('1 day'), async (req, res) => {
   if(req.query.cache == 'reset') {
      apicache.clear(req.originalUrl)
   }      
   var status =  await nftxLib.viewPaymentMethods();
   res.send(status);
})

app.get('/nft/settings', cache('1 hour'), async (req, res) => {
   if(req.query.cache == 'reset') {
      apicache.clear(req.originalUrl)
   }      
   var Settings =  await nftxLib.Settings();
   res.send(Settings);
})

app.get('/nft/mintable', cache('2 hour'), async (req, res) => {
   if(req.query.cache == 'reset') {
      apicache.clear(req.originalUrl)
   }      
   var items =  await nftxLib.fontMintableMinted();
   res.send(items);
})

app.get('/nft/mint/:address', cache('1 hour'), async (req, res) => {
   if(req.query.cache == 'reset') {
      apicache.clear(req.originalUrl)
   }      
   var items =  await nftxLib.fontMintableByAddress(req.params.address);
   res.send(items);
})



app.get('/api/fontparse/:font_id', cache('1 day'), async (req, res) => {
   if(req.query.cache == 'reset') {
      apicache.clear(req.originalUrl)
   }      
   var fontFiles = await fontlib.singleFont(req.params.font_id);
   res.send(fontFiles);
})

app.get('/api/fontcache/:font_id', async (req, res) => {
   
   var fontFiles = await fontlib.generateFontCache(req.params.font_id);
   res.send(fontFiles);  
})

app.get('/api/fontcaches3/:font_id', async (req, res) => {
   var status = await fontlib.generateFontCacheS3(req.params.font_id);
   res.send(status);  
})




app.get('/api/testfond/:font_id', async (req, res) => {

   var test = await fontlib._aws_sync_font(req.params.font_id);

   res.send(test);  
})



app.listen(8080, () => console.log(`Listening on: 8080`));


