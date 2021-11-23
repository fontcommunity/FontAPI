API to get All blockchain data from 


List of APIs that needs cache
    All Avaliable NFTs
    User NFTs

Get User NFTs 
    load from Calling URL (bulk as well as individual item)
    load from cron (via drupal api)
    
Middlewares
    NFT data to DB data 
    DB data to NFT data

All APIs are cacheable and resetable 
There is DB maintained in local which will be another layer of cache, especally to fetch the NFTs, orders and bids 

Font API /font/font_id

    1) All drupal (make it cacheable)
        a) licenses from drupal (make it cacheable)
        b) entity (cacheable)
    2) Variations (make it cacheable) from node js 

    3) blockchain 
        owner
        NFT
        BID
        price
        order details 
        History (cacheable)



    
S3 backup 
    font-source-file (private / public based on settings)
        fonts/{font-id}/embed/
    Font files (get from )
        fonts/{font-id}/embed/
    images  
        fonts/{font-id}/embed/

    data
        metadata
            fonts/{font-id}/metadata.json
        full data
            fonts/{font-id}/data.json
        blockchain / nft 
            fonts/{font-id}/nft.json
        drupal data 
            fonts/{font-id}/entity.json
        revisions 
            fonts/{font-id}/revisions/

        others 
