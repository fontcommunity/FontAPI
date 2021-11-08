
const extract = require('extract-zip');
const fs = require("fs"); // Or `import fs from "fs";` with ESM
var read = require('fs-readdir-recursive')
var path = require('path');
var fontkit = require('fontkit'); 
var _ = require('underscore');
var fsextra = require('fs-extra');
var rimraf = require("rimraf");
var request = require('sync-request');



// ******************************************************* //
// ********************** Settings *********************** //
// ******************************************************* //

const OUTPUT_DIR_BASE = '/tmp/foco/makers.font.community/preview/web';
const OUTPUT_DIR_BASE_EMBED = '/tmp/foco/makers.font.community/preview/embed';

const API_GET_FONT_FILES = 'https://backend.font.community/api/font_files/{font_id}?detail=1';

// ****************** Settings END  *********************** //


// **************** Functions starts ******************** //

function prepare_all_embed_fonts(){
  //get all the font files 
  var font_files = _get_font_files_data();
  if(!font_files) {
    console.log("remote data not loading");
    return false;
  }

  for(let f in font_files) {
    var font = font_files[f];
    if(font.free_file) {
      var src_dir = OUTPUT_DIR_BASE + "/fonts/" + font.id + '/fontfiles';



      var _font_files = read(src_dir);



      if(_font_files && _.size(_font_files)) {
        var dst_dir = OUTPUT_DIR_BASE_EMBED + '/fonts/' + font.id;
        fs.mkdirSync(dst_dir, { recursive: true });        
        for(var _ff in _font_files) {
          var _src_file = src_dir + '/' + _font_files[_ff];
          var _dst_file = dst_dir + '/' + _font_files[_ff];
          //console.log(_src_file, _dst_file);
          fsextra.copySync(_src_file, _dst_file);
        }
      //break;        
      }
      else {

      }
      
    }
    
  }

}



//Process each unzipped fonts and extract the data
function _process_all_font_metadata(skip_existing = true) {

  var start_time = Math.floor(Date.now() / 1000);

  var font_files = _get_font_files_data();
  if(!font_files) {
    console.log("remote data not loading");
    return false;
  }
  
  //unzip the file first
  for(let font_id in font_files) {
    var font_file = font_files[font_id];
    _unpack_font(font_file); 
  }

  var end_time = Math.floor(Date.now() / 1000);

  console.log("total time :: ", end_time-start_time );
}


//Get the font files from remote data
function _get_font_files_data(){
  var res = request('GET', 'http://appold.font.community/export/all_font_files.json');
  var font_files = JSON.parse(res.getBody('utf8'));
  if(font_files && _.size(font_files)) {
    return font_files;
  }
  return false;
}

async function _get_font_files_by_id(font_id) {

  var _Url = API_GET_FONT_FILES.split('{font_id}').join(font_id)
  var res = request('GET', _Url);
  var font_file_uploaded = JSON.parse(res.getBody('utf8')); 

  
  
  if(font_file_uploaded && font_file_uploaded.file_count) {

    for(let i in font_file_uploaded.file_url) {
      var zipfile = font_file_uploaded.file_url[i];
      
      if(!fs.existsSync(zipfile)){
        console.log("zipfile file not exist for font id :: ", font_file_uploaded.id, " :: ", zipfile);
        
      }  
      var targetDir = OUTPUT_DIR_BASE + '/fonts/' + font_file_uploaded.id + '/fontfiles_src';
      fs.mkdirSync(targetDir, { recursive: true });
      extract(zipfile, { dir: targetDir })
    }
    await waitforme(1000);

    //Get the font files 
    var targetDir = OUTPUT_DIR_BASE + '/fonts/' + font_file_uploaded.id;

    var font_files = _get_all_font_files_from_font(targetDir);

    if(!_.size(font_files)) {
      return false;
    }

    var parsedData = _unpack_font2(font_file_uploaded, true);

    return parsedData;
  }
  return false;  
}

//Cleanup the font source files
function _cleaup_font_src_files() {
  var font_files = _get_font_files_data();
  if(!font_files) {
    console.log("remote data not loading");
    return false;
  }

  for(let font_id in font_files) {
    var font_file_src_dir = OUTPUT_DIR_BASE + '/fonts/' + font_id + '/fontfiles_src';
    rimraf.sync(font_file_src_dir);
    fs.rmdirSync(font_file_src_dir, { recursive: true });
  }    
}


//Unzip all the font files 
function _unzip_all_font_files(){
  var font_files = _get_font_files_data();
  if(!font_files) {
    console.log("remote data not loaded");
    return false;
  }  
  for(let font_id in font_files) {
    var zipfile = font_files[font_id].file_url;
    if(!fs.existsSync(zipfile)){
      console.log("zipfile file not exist for font id :: ", font_id, " :: ", zipfile);
      return false;
    }
    var targetDir = OUTPUT_DIR_BASE + '/fonts/' + font_id + '/fontfiles_src';
    fs.mkdirSync(targetDir, { recursive: true });
    extract(zipfile, { dir: targetDir })
  }      
}


//@moved
function _unzip_single_font_file(font_file){
  var zipfile = font_file.file_url;
  if(!fs.existsSync(zipfile)){
    console.log("zipfile file not exist for font id :: ", font_file.id, " :: ", zipfile);
    return false;
  }  
  var targetDir = OUTPUT_DIR_BASE + '/fonts/' + font_file.id + '/fontfiles_src';
  fs.mkdirSync(targetDir, { recursive: true });
  extract(zipfile, { dir: targetDir })
}


function _unpack_font2(font_data = false, ret = true) {
  //parse the incoming data
  //create needed folders
  var _font_data = {
    'id': font_data.id,
    'files_count': font_data.file_count,
    'file_url': font_data.file_url,
    'fids': font_data.fids,
    'free_file': font_data.free_file, //private or public
    'filetypes': [],
    'glyphs': 0,
    'features': [],
    'updated': Math.floor(Date.now() / 1000),
    'free_to_use': font_data.free_file ? 'free_to_use' : 'need_license',
    'total_variations': 0, //@todo
    'styles': [],
    'filesize': 0,
    'familyName': '',
  }

  if(!(_font_data && _font_data.id && _font_data.files_count)) {
    console.log("wrong font_data");
    return false;
  }

  var targetDir = OUTPUT_DIR_BASE + '/fonts/' + _font_data.id;
  fs.mkdirSync(targetDir, { recursive: true });


  //var zipfile = '/var/www/html/makers.font.community/preview/fonts/45-biker-whiskey.zip';
  zipfile = _font_data.file_url;

  /*
  //later @todo
  if(fs.existsSync(_font_data.file_url)){
    var stats = fs.statSync(_font_data.file_url);
    _font_data.filesize = stats.size;
  }  
  */

  var font_files = _get_all_font_files_from_font(targetDir);

  if(!font_files) {
    console.log("error font_files");
    return false;
  }
  var font_files_parsed_data = _extract_data_from_font_files(font_files);

  if(!(font_files_parsed_data && _.size(font_files_parsed_data))) {
    console.log("error in parsing the font data")
    return false;
  }
    
  
  //Generate the previews 
  var Glyphs = [];
  var availableFeatures = [];
  var total_variations = 0;
  var _Styles = [];
  var VariationEntities = [];
  var VariationsIndex = (_font_data.id * 1000);
  for(let font_name in font_files_parsed_data) {

    if(!_.isEmpty(font_files_parsed_data[font_name])) {

      for(let variation in font_files_parsed_data[font_name]) {
        
        Glyphs.push(font_files_parsed_data[font_name][variation].Glyphs);
        total_variations++;
        _Styles.push(variation);
        var _tmp_variation_entity = _parse_data_for_font_variation(
          font_files_parsed_data[font_name][variation], font_name, variation, _font_data.id, VariationsIndex, font_files_parsed_data[font_name][variation].familyName );
        VariationEntities.push(_tmp_variation_entity);
        
        

        //availableFeatures
        if(!_.isEmpty(font_files_parsed_data[font_name][variation]) 
          &&  _.has(font_files_parsed_data[font_name][variation], 'availableFeatures') 
          && _.size(font_files_parsed_data[font_name][variation].availableFeatures)) {

          for(let _f in font_files_parsed_data[font_name][variation].availableFeatures) {
            availableFeatures.push(font_files_parsed_data[font_name][variation].availableFeatures[_f]);
          }
        }

        //console.log(font_name, variation);
        if(!_.isEmpty(font_files_parsed_data[font_name][variation]) 
          &&  _.has(font_files_parsed_data[font_name][variation], 'files') 
          && _.size(font_files_parsed_data[font_name][variation].files)) {
          
          for(let file_index in font_files_parsed_data[font_name][variation].files) {
            var file = font_files_parsed_data[font_name][variation].files[file_index];

            //console.log("asd", font_name, " :: ", variation, file);
            //console.log(font_name, variation, file);
            //var _preview_status = false;
            //@todo reamove this comment
            //var _preview_status = _generate_previews_from_font(file, _font_data.id, VariationsIndex); 
            //if(_preview_status) {
            //  continue;
            //}
          }
        }
        VariationsIndex++;
      }
    }
  }

  //

  //Generate the fonts to embed. 
  var targetDir = OUTPUT_DIR_BASE + '/fonts/' + _font_data.id + '/fontfiles';  
  fs.mkdirSync(targetDir, { recursive: true });


  //create embed font files and clean up the jsao data 
  var new_json_data = _cleanup_json_data_create_embed_files(font_files_parsed_data, _font_data.id,  font_data.free_file);


  //Delete the source file 
  try {
    targetDir = OUTPUT_DIR_BASE + '/fonts/' + _font_data.id + '/fontfiles_src'; 
    //console.log("ls -al ", targetDir);
    //rimraf.sync(targetDir);

    //fs.rmdirSync(targetDir, { recursive: true });
  }
  catch (err) {
    console.log("error in deleting folder", err);
  }

  _font_data.data = new_json_data.data;
  _font_data.filetypes = new_json_data.exts; 
  _font_data['glyphs'] = _.max(Glyphs);
  _font_data['features'] = _.uniq(availableFeatures);
  _font_data['styles'] = _.uniq(_Styles);
  _font_data['total_variations'] = total_variations;
  _font_data['variations'] = VariationEntities;


  var file_url_prefixes = [
    '/var/www/html/makers.font.community/drupal/web/sites/default/files/',

  ];

  for(let _i in file_url_prefixes) {
    //_font_data['file_url'] = _font_data['file_url'].replace(file_url_prefixes[_i], "");

  }
  
  var json_string = JSON.stringify(_font_data);
  var json_file = OUTPUT_DIR_BASE + '/fonts/' + _font_data.id + '/data.json';
  fs.writeFileSync(json_file, json_string);    

  if(ret) {
    return _font_data;
  }

}


function _unpack_font(font_data = false) {
  //parse the incoming data
  //create needed folders
  var _font_data = {
    'id': font_data.id,
    'files_count': font_data.file_count,
    'file_url': font_data.file_url,
    'fids': font_data.fids,
    'free_file': font_data.free_file, //private or public
    'filetypes': [],
    'glyphs': 0,
    'features': [],
    'updated': Math.floor(Date.now() / 1000),
    'free_to_use': font_data.free_file ? 'free_to_use' : 'need_license',
    'total_variations': 0, //@todo
    'styles': [],
    'filesize': 0,
    'familyName': '',
  }

  if(!(_font_data && _font_data.id && _font_data.files_count && _font_data.file_url)) {
    console.log("wrong font_data");
    return false;
  }

  var targetDir = OUTPUT_DIR_BASE + '/fonts/' + _font_data.id;
  fs.mkdirSync(targetDir, { recursive: true });


  //var zipfile = '/var/www/html/makers.font.community/preview/fonts/45-biker-whiskey.zip';
  zipfile = _font_data.file_url;

  
  if(fs.existsSync(_font_data.file_url)){
    var stats = fs.statSync(_font_data.file_url);
    _font_data.filesize = stats.size;
  }  

  var font_files = _get_all_font_files_from_font(targetDir);

  if(!font_files) {
    console.log("error font_files");
    return false;
  }
  var font_files_parsed_data = _extract_data_from_font_files(font_files);
  if(!(font_files_parsed_data && _.size(font_files_parsed_data))) {
    console.log("error in parsing the font data")
    return false;
  }
    
  
  //Generate the previews 
  var Glyphs = [];
  var availableFeatures = [];
  var total_variations = 0;
  var _Styles = [];
  var VariationEntities = [];
  var VariationsIndex = (_font_data.id * 1000);
  for(let font_name in font_files_parsed_data) {

    if(!_.isEmpty(font_files_parsed_data[font_name])) {

      for(let variation in font_files_parsed_data[font_name]) {
        
        Glyphs.push(font_files_parsed_data[font_name][variation].Glyphs);
        total_variations++;
        _Styles.push(variation);
        var _tmp_variation_entity = _parse_data_for_font_variation(
          font_files_parsed_data[font_name][variation], font_name, variation, _font_data.id, VariationsIndex, font_files_parsed_data[font_name][variation].familyName );
        VariationEntities.push(_tmp_variation_entity);
        
        

        //availableFeatures
        if(!_.isEmpty(font_files_parsed_data[font_name][variation]) 
          &&  _.has(font_files_parsed_data[font_name][variation], 'availableFeatures') 
          && _.size(font_files_parsed_data[font_name][variation].availableFeatures)) {

          for(let _f in font_files_parsed_data[font_name][variation].availableFeatures) {
            availableFeatures.push(font_files_parsed_data[font_name][variation].availableFeatures[_f]);
          }
        }

        //console.log(font_name, variation);
        if(!_.isEmpty(font_files_parsed_data[font_name][variation]) 
          &&  _.has(font_files_parsed_data[font_name][variation], 'files') 
          && _.size(font_files_parsed_data[font_name][variation].files)) {
          
          for(let file_index in font_files_parsed_data[font_name][variation].files) {
            var file = font_files_parsed_data[font_name][variation].files[file_index];

            //console.log("asd", font_name, " :: ", variation, file);
            //console.log(font_name, variation, file);
            //var _preview_status = false;
            //@todo reamove this comment
            //var _preview_status = _generate_previews_from_font(file, _font_data.id, VariationsIndex); 
            //if(_preview_status) {
            //  continue;
            //}
          }
        }
        VariationsIndex++;
      }
    }
  }

  //

  //Generate the fonts to embed. 
  var targetDir = OUTPUT_DIR_BASE + '/fonts/' + _font_data.id + '/fontfiles';  
  fs.mkdirSync(targetDir, { recursive: true });


  //create embed font files and clean up the jsao data 
  var new_json_data = _cleanup_json_data_create_embed_files(font_files_parsed_data, _font_data.id,  font_data.free_file);


  //Delete the source file 
  try {
    targetDir = OUTPUT_DIR_BASE + '/fonts/' + _font_data.id + '/fontfiles_src'; 
    //console.log("ls -al ", targetDir);
    //rimraf.sync(targetDir);

    //fs.rmdirSync(targetDir, { recursive: true });
  }
  catch (err) {
    console.log("error in deleting folder", err);
  }

  _font_data.data = new_json_data.data;
  _font_data.filetypes = new_json_data.exts; 
  _font_data['glyphs'] = _.max(Glyphs);
  _font_data['features'] = _.uniq(availableFeatures);
  _font_data['styles'] = _.uniq(_Styles);
  _font_data['total_variations'] = total_variations;
  _font_data['variations'] = VariationEntities;


  var file_url_prefixes = [
    '/var/www/html/makers.font.community/drupal/web/sites/default/files/',

  ];

  for(let _i in file_url_prefixes) {
    _font_data['file_url'] = _font_data['file_url'].replace(file_url_prefixes[_i], "");

  }
  
  var json_string = JSON.stringify(_font_data);
  var json_file = OUTPUT_DIR_BASE + '/fonts/' + _font_data.id + '/data.json';
  fs.writeFileSync(json_file, json_string);    

}

//@todo, parse the data to match the font varition font_migrate_fonts_update_font_variation_from_metadata
function _parse_data_for_font_variation(data, name, font_style, font_id, id, familyName) {
  var output = {
    'font': font_id,
    'font_style': font_style,
    'name': name + ' ' + font_style,
    'id': id ,
    'unicode_range': '',//@todo
    'machine_name': '',
    'font_weight': '', //@todo
    'familyName': familyName,
  };

  if(data) {
    if(_.has(data, 'machine_name')) {
      output.machine_name = data.machine_name;
    }
    if(_.has(data, 'unicode_range')) {
      output.unicode_range = data.unicode_range;
    }
    if(_.has(data, 'font_weight')) {
      output.font_weight = data.font_weight;
    }        
  }

  console.log(data, output);

  return output;
}


//@todo
function _cleanup_json_data_create_embed_files(json_data, font_id, free_font = false, delete_src_files = true) {
  var new_json_data = {};
  var exts = [];

  for(let font_name in json_data) {
    new_json_data[font_name] = json_data[font_name];
    if(!_.isEmpty(json_data[font_name])) {
      for(let variation in json_data[font_name]) {
        
        if(!_.isEmpty(json_data[font_name][variation]) 
          &&  _.has(json_data[font_name][variation], 'files') 
          && _.size(json_data[font_name][variation].files)) {
          new_json_data[font_name][variation].fontfiles = [];
          for(let file_index in json_data[font_name][variation].files) {
            var file = json_data[font_name][variation].files[file_index];
            var ext = file.split('.').pop();
            exts.push(ext);
            if(!fs.existsSync(file)){ 
              continue; 
            }  
          
            if(free_font) {
              var _base_dir = OUTPUT_DIR_BASE + '/fonts/' + font_id + '/'; 
              var src_file_name = file.replace(_base_dir, ''); 
              var dst_file_dir = _base_dir + 'fontfiles/';
              var dst_file_name = json_data[font_name][variation].machine_name + '.' + ext;
              var dst_file_full_path = dst_file_dir + dst_file_name;
              fsextra.copySync(file, dst_file_full_path);
              new_json_data[font_name][variation].fontfiles.push(dst_file_name);
            }

            

          } //end of last for
          if(delete_src_files) {
            delete new_json_data[font_name][variation].files;
            delete json_data[font_name][variation].files;
          }
        }
      }
    }
  }
  return {
    'data': new_json_data,
    'exts': _.uniq(exts),
  };
}


//get all the font files from font src director 
function _get_all_font_files_from_font(targetDir) {

  try {
    targetDir = targetDir + '/fontfiles_src'
    
    var files = read(targetDir);
    var file_types = _get_supported_file_types(true);
    output = [];
    //console.log('Extraction complete. Files'); 
    for (let i in files) {
      let file = targetDir + '/' + files[i];
      if(!fs.existsSync(file)) {continue;}
      if(!fs.lstatSync(file).isFile()) {continue;} 
      output.push(file);      
    }//end for 
    if(_.size(output)) {
      return output; 
    }
    return false
    //Refine the dat
  } catch (err) {
    console.log("error in reading font src files", err);
    return false;
  }  
  return false;
}

//get a  file of a font and 
function _extract_data_from_font_files(files, font_id = 45) {

  var file_types = _get_supported_file_types();
  output = {};
  try {
    for (let i in files) {
      var file = files[i];
      var ext = file.split('.').pop();

      //dont accept non font formats
      if(!(_.indexOf(file_types, ext) + 1)) {continue;} //@todo check this

      _font_props = _parse_single_font_file(file);
      
      //Add the font name to top level 
      if(!(_.has(_font_props, 'fullName') && _.has(output, _font_props.fullName))) {
        output[_font_props.fullName] = {
        };
      }

      //Add the variations or subfamily 
      if(!(_.has(output[_font_props.fullName], _font_props.subfamilyName))) {
        output[_font_props.fullName][_font_props.subfamilyName] = {
          'ext': [],
          'files': [],
          'Glyphs': [],
          'availableFeatures': [],
          'familyName': _font_props.familyName,
          'machine_name': _generate_machinename((_font_props.fullName + " " + _font_props.subfamilyName)),
        };
      }

      output[_font_props.fullName][_font_props.subfamilyName]['files'].push(file);
      output[_font_props.fullName][_font_props.subfamilyName]['ext'].push(ext);
      output[_font_props.fullName][_font_props.subfamilyName]['Glyphs'].push(_font_props.Glyphs);
      output[_font_props.fullName][_font_props.subfamilyName]['availableFeatures'].push(_font_props.availableFeatures);

    }//end for 

    //Refine the data
    for(let i in output) {
      if(_.size(output[i])) {
        for(let j in output[i]) {
          output[i][j]['ext'] = _.uniq(output[i][j]['ext']);
          output[i][j]['Glyphs'] = _.max(output[i][j]['Glyphs']);
          var _features = [];
          if(_.size(output[i][j]['availableFeatures'])) {
            for(let f in output[i][j]['availableFeatures']) {
              if(_.size(output[i][j]['availableFeatures'][f])) {
                for(let fi in output[i][j]['availableFeatures'][f]) {
                  _features.push(output[i][j]['availableFeatures'][f][fi]);
                }
              }
            }
          }
          output[i][j]['availableFeatures'] = _.uniq(_features);
        }
      }
    }//end for 

    if(_.size(output)) {
      return output;
    }
  } catch (err) {
    console.log(err);
    return false;
  }  
  return false;
}


//open a font file and get the metadata
//@todo more data and glyphs extraction
function _parse_single_font_file(font_file) {
  try{
    
    var font = fontkit.openSync(font_file);
    var output = {
      'postscriptName': font.postscriptName,
      'fullName': font.fullName,
      'familyName': font.familyName,
      'subfamilyName': font.subfamilyName,
      'Glyphs': font.numGlyphs,
      'availableFeatures': font.availableFeatures,
      'variationAxes': font.variationAxes,
      'namedVariations': font.namedVariations,
    };
    return output;
  } catch (err) {
    console.log("error in _parse_single_font_file", font_file);
    return false;
  }  
  return false;  
}


//Get list of font file formats 
//@todo load dynamically from s3 url 
//@moved
function _get_supported_file_types(all = false){ 
  if(all) {
    return ['otf', 'ttf'];
  }
  return  ['otf', 'ttf', 'woff', 'woff2'];
}



//@moved
function _generate_machinename(str) {
  if(!str) {
    return false;
  }
  str = str.toLowerCase(str);
  return str.replace(/[^A-Za-z0-9 ]/g,'') // Remove unwanted characters, only accept alphanumeric and space
    .replace(/\s{2,}/g,' ') // Replace multi spaces with a single space
    .replace(/\s/g, "_"); // Replace space with a '-' symbol
}





function _parse_test_single_font_file(){
    var font = _parse_single_font_file('./aAdelfa.ttf');
var str = JSON.stringify(font, null, 2); // spacing level = 2
	console.log(str);
}


module.exports = { 
//get list of all font sizes 
  start: _process_all_font_metadata,

  //Get list of all the texts for preview 
  cleanup: _cleaup_font_src_files,

  unzip: _unzip_all_font_files,
  
  single_unzip: _unzip_single_font_file,
  single_unpack: _unpack_font,
  test_single_parse: _parse_test_single_font_file,

  //Copy the free font files to another embed.font.community directory 
  copy_embed_fonts: prepare_all_embed_fonts,

  _get_font_files_by_id:_get_font_files_by_id,
}

  

function waitforme(milisec) {
  return new Promise(resolve => {
      setTimeout(() => { resolve('') }, milisec);
  })
}