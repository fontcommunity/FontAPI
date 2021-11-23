var DB = require('./DBlib');




var test = DB.initiateRow(129, '0x668AE94D0870230AC007a01B471D02b2c94DDcB9', '0x668AE94D0870230AC007a01B471D02b2c94DDcB9', 1, 1, "font_name", "creator_name").then(function(er,ts){
   console.log("asd", er, ts);
});
