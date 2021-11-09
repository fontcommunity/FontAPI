const extract = require('extract-zip');
const fs = require("fs");
var fsextra = require('fs-extra');
var rimraf = require("rimraf");
var read = require('fs-readdir-recursive')
var path = require('path');

var fontkit = require('fontkit'); 

var _ = require('underscore');
var async = require("async");
var crypto = require('crypto');
var request = require('sync-request');


var print = require('pretty-print');
const log = require ('ololog')


//Settings 

const OUTPUT_DIR = '/tmp/foco/fontparser/output/fonts';
const TMP_DIR = '/tmp/foco/fontparser/input';
const FONT_API_BASE = 'http://backend.font.community/api/font/';
const FONT_API_FILE_BASE = 'http://backend.font.community/api/font_files/';
const FONT_API_SETTINGS = 'http://backend.font.community/api/settings';

const API_GET_FONT_FILES = 'https://backend.font.community/api/font_files/{font_id}?detail=1';

const API_GET_FONT_DATA_FULL = 'https://backend.font.community/api/font/';

const API_GET_FONT_ENTITY = 'https://backend.font.community/api/font/{font_id}/entity.json';

_entry_point();


async function _entry_point() {


  var all_font_ids = await _get_all_font_ids();
  var options = {};

  for(let i in all_font_ids) {
    var font_id = all_font_ids[i];
    var metadata_filename = await _process_single_font(font_id, options);
    console.log(font_id, metadata_filename);
  }

}


async function generateFontCache(font_id) {
  //generate the metadata json and store 
  var metadata = await _process_single_font(font_id);

  //pull the images and store in disk 
  var images = await _save_font_images(font_id);

  //save data.json 
  var data = await _save_font_data_full(font_id);

  //save entitu.json 
  var entity = await _save_font_data_entity(font_id);

  //Generate zip file for download 
  //@todo 


  //generate NFT json 
  //@todo

  //Genereate license sales data 
  //@todo

  //generate revisions 
  //@todo

  //generate license data 
  //@todo

  return {
    metadata: metadata ? true : false,
    images: images ? true : false,
    data: data ? true : false,
    entity: entity ? true : false,
  }

}


//this is entry
async function _process_single_font(font_id, options) {

  var files = await _get_remote_font_files_by_id(font_id);

  if(!files) {
    return false;
  }

  //get all the font files from multiple formats like zip
  var font_files = await _prepare_font_files_by_font_project(files, font_id);
  //Extract the metadata from all the font files
  var metadata_raw = await _extract_font_file_metadata_multiple(font_files, font_id);
  //Parse the metadata into consumable formats
  var metadata_parsed  = await _font_variations_extensions_collector(metadata_raw, font_id);


  

  var _total_count = 0;
  for(let m in metadata_parsed) {
    _total_count = _total_count + _.size(metadata_parsed[m])
  }

  //Generate the embed files
  var dst_dir_font_file_embed = OUTPUT_DIR + '/' + font_id + '/embed';
  var embed_files = await _generate_font_files_for_embed(metadata_parsed, dst_dir_font_file_embed);


  var metadata_altered_file_paths = await _metadata_alter_file_paths(metadata_parsed, embed_files, font_id);


  //Store the data to metadata.json
  var metadata_filename = await _save_json_to_file_from_parsed_metadata(metadata_altered_file_paths, font_id);

 

  //console.log("Total variaton", drupal_api_json);  
  return metadata_altered_file_paths;

}




//Get the font data from drupal api
async function _get_drupal_font_api(font_id){
  var api_url = FONT_API_BASE + font_id;
  var res = request('GET', api_url);
  var font_data = await JSON.parse(res.getBody('utf8'));
  if(_is_non_empty_object(font_data)) {
    return font_data;
  }
  return false;


}

//get list of all parsed metadata and create files 
async function _generate_font_files_for_embed(variations, dst_dir) {
  var output = {};

  await _cleaupdir(dst_dir);
  
  if(!fs.existsSync(dst_dir)) {
    fs.mkdirSync(dst_dir, { recursive: true });
  }  

  for(let v in variations) {
    if(_.size(variations[v])) {
      for(let h in variations[v]) {
        if(_.size(variations[v][h].font_files)) {
          for(var _font_file in variations[v][h].font_files) {
            var filename_old = variations[v][h].font_files[_font_file];
            var filename_new = v + "_" + variations[v][h].characterSet_hash + "." + path.extname(filename_old).split('.').pop();
            output[filename_old] = dst_dir + '/' + filename_new;
            await fsextra.copySync(filename_old, output[filename_old]);
          }
        }
        
      }
    }
  }  
  return output;
}


//get list of all font files and font id and return the medata data
async function _extract_font_file_metadata_multiple(font_files, font_id) {
  var _is_array = await _is_non_empty_array(font_files);
  if(_is_array) {
    var output = [];
    for(let f in font_files) {
      var font_file = TMP_DIR + '/' + font_id + '/' + font_files[f];
      var font_file_metadata = await _extract_font_file_metadata_single(font_file);
      if(font_file_metadata) {
        output.push(font_file_metadata);
      }      
    }
    return output;
  }
  return false;
}

//Get a single font file and parse the metadata
async function _extract_font_file_metadata_single(font_file) {

  if(!fs.existsSync(font_file)){
    return false;
  }
  try{
    var font = fontkit.openSync(font_file);
    if(!(_.isObject(font) || _.isArray(font))) {
      return false;
    }
    var obj2 = JSON.parse(JSON.stringify(font));
    if(!(_.isObject(obj2) || _.isArray(obj2))) {
      return false;
    }
    if(_.has(obj2, 'stream')) {
      //delete obj2.stream;  
    }
    var output = {};
    var _keys = [
      //MEtadata
      'postscriptName', 'fullName', 'familyName', 'subfamilyName', 'copyright', 'version',
      //Metrics
      'unitsPerEm', 'ascent', 'descent', 'lineGap', 'underlinePosition', 'underlineThickness', 'italicAngle', 'capHeight', 'xHeight', 'bbox',
      //Other properties
      'numGlyphs', 'characterSet', 'availableFeatures',
      //variation fonts 
      'variationAxes', 'namedVariations',
    ];

    //@todos 
    //https://github.com/foliojs/fontkit#font-collection-objects

    for(let _k in _keys) {
      var _key  = _keys[_k];
      if(!_.isUndefined(font[_key])) {
        output[_key] = await font[_key]; 
      }
      else {
        output[_key] = null;
      }
    }

    //do other process 


    //Add variable font
    output['variableFont'] = false;
    if(!_.isEmpty(font.variationAxes)) {
      output['variableFont'] = true;
    }
    if(!_.isEmpty(font.namedVariations)) {
      output['variableFont'] = true;
    }    

    output['machine_name'] = await _generate_machinename_from_font_properities(output.fullName, output.subfamilyName);
    
    //Get the hash of charactersets 
    output['characterSet_hash'] = null;
    if(!_.isEmpty(font.characterSet)) {
      var characterSet = await _.sortBy(font.characterSet, function(num) {
        return num;
      });
      characterSet = await JSON.stringify(characterSet);
      output['characterSet_hash'] = await crypto.createHash('md5').update(characterSet).digest('hex');
    }


    //Add the file and extension 
    output['_font_file'] = font_file;
    output['_extension'] = (path.extname(font_file)).split('.').pop();   

    output['font_files'] = [];
    output['extensions'] = [];


    return output;
  } catch (err) {
    console.log("error in _parse_single_font_file", err, font_file);
    return false; 
  } 
  return false; 
}


//Get all the meta data and return te 
async function _font_variations_extensions_collector(metadata, font_id){
  if(!_is_non_empty_array(metadata)) {
    return false;
  }
  var machine_names = await _.pluck(metadata, 'machine_name');
  if(!_is_non_empty_array(machine_names)) {
    return false;
  }
  var machine_names =  await _.countBy(machine_names, function(machine_name) {
    return machine_name;
  });

  
  //Group the whole data by machine name
  var grouped_by_machine_names = await _.groupBy(metadata, function(_md_item){ return _md_item.machine_name; });

  //further group the whole data by charactersets 
  for(let _m in grouped_by_machine_names) {

    var _size_of__grouped_by_machine_names = _.size(grouped_by_machine_names[_m]);
    var _metadata = await grouped_by_machine_names[_m];
    if(!_.size(_metadata)) {
      continue;
    }
    
    //group by characterset hash 
    var grouped_by_characterset_hash =  await _.countBy(_metadata, function(item) {
      return item.characterSet_hash;
    });

    //count number of hashes
    var _size_grouped_by_characterset_hash = await _.size(grouped_by_characterset_hash);

    //get the hashes as array 
    var _hashes = await _.keys(grouped_by_characterset_hash);
    var _hashes_size = _.size(_hashes)
    

    if(_size_of__grouped_by_machine_names) {
      //If the variation is one but file formats are different.
      if(_size_grouped_by_characterset_hash == 1) {
        if(_hashes_size) {
           
          var _extensions = await _.pluck(_metadata, '_extension');
          var _font_files = await _.pluck(_metadata, '_font_file');

          grouped_by_machine_names[_m] = _.first(grouped_by_machine_names[_m]);
          
          grouped_by_machine_names[_m]['extensions'] = _extensions;
          grouped_by_machine_names[_m]['font_files'] = _font_files;
          delete grouped_by_machine_names[_m]['_extension'];
          delete grouped_by_machine_names[_m]['_font_file'];
          grouped_by_machine_names[_m] = [grouped_by_machine_names[_m]];
        }
      }

      //If there are many files with different characterset 
      else if (_size_grouped_by_characterset_hash > 1) {
        if(_hashes_size) {
          //list of items which have 
          var _items = await _.groupBy(grouped_by_machine_names[_m], function(_md_item){ return _md_item.characterSet_hash; });
          var _new_items = [];
          for(let _hash in _items) {
            var _item_size = _.size(_items[_hash]);
            if(_item_size == 1) {
              var _first_item = await _.first(_items[_hash]);  
              var _extension = await _first_item['_extension'];
              var _font_file = await _first_item['_font_file'];
              _first_item['font_files'] = [_font_file];
              _first_item['extensions'] = [_extension];
              delete _first_item['_extension'];
              delete _first_item['_font_file'];         
              _new_items.push(_first_item);  
            }
            else if (_item_size > 1) {
              //@todo merge it all, 
            }
            else {
              //@todo not sure what comes here, just put a log 
              console.log("@alert::DFRTGYH", font_id, _m, _hash);
            }
          } //Endfor 
          grouped_by_machine_names[_m] = _new_items;

        }//endif, not sure why this if
      }

      else {

      }
    }

    else {
      console.log("@alert some error::", font_id, _m)
    }
    
  } //endfor 
  
  //return 1;
  return grouped_by_machine_names; 
}


//alter the metadata with real file names
async function _metadata_alter_file_paths(metadata, files, font_id) {
  if(!_is_non_empty_object(metadata)) {  
    return false;
  }
  if(!_is_non_empty_object(files)) {
    return false;
  }

  for(let m in metadata) {
    if(_.size(metadata[m])) {
      for(let v in metadata[m]) {

        //for files 
        if(_.has(metadata[m][v], 'font_files') && _.size(metadata[m][v].font_files)) {
          //console.log((metadata[m][v].font_files)); 

          var _font_files = metadata[m][v].font_files;
          var _font_files_new = [];
          for(let f in _font_files) {
            var _font_file = _font_files[f];
            if(_.has(files,_font_file) && fs.existsSync(files[_font_file])) {
              var _file_name_new = path.basename(files[_font_file]);
              _font_files_new.push(_file_name_new);
            }
          }
          metadata[m][v].font_files = _font_files_new;
        }
      }      
    }
  }
  return metadata;
}

//store the raw json file in raw.json
async function _save_json_to_file_from_parsed_metadata(metadata, font_id) {
  
  if(!_.isObject(metadata)) {  
    return false;
  }
  var dst_raw_json_file = OUTPUT_DIR + '/' + font_id + '/metadata.json';
  file_data = JSON.stringify(metadata);
  fs.writeFileSync(dst_raw_json_file, file_data);
  if(fs.existsSync(dst_raw_json_file)) {  
    return dst_raw_json_file;
  }
  return false;
}

//get list of all files belongs to font and return the font files
async function _prepare_font_files_by_font_project(files, font_id, cleanup = true) {
  if(!_.isArray(files)) {
    files = [files];
  }  
  var dst_dir = TMP_DIR + '/' + font_id;

  if(cleanup) {
    await fs.rmdirSync(dst_dir, { recursive: true });
    await rimraf.sync(dst_dir);  
  }
  
  
  if(!fs.existsSync(dst_dir)) {
    fs.mkdirSync(dst_dir, { recursive: true });
  }

  var font_extensions = await _get_supported_file_types(true);

  var font_files = [];


  for(let f in files) {
    var file = files[f];
    var ext =  (path.extname(file)).split('.').pop();;
    if(_.contains(font_extensions, ext)) {
      if( fs.existsSync(file)) {
        var _dst_file = dst_dir + '/' + path.basename(file);
        fsextra.copySync(file, _dst_file);
      }
    }
    else {
      await _unzip_single_font_file(file, dst_dir, font_id);
    }    
  }

  var _font_files = read(dst_dir);


  if(_.isArray(_font_files)) {
    for(let f in _font_files) {
      var _font_file = _font_files[f];
      var ext =  (path.extname(_font_file)).split('.').pop();;
      if(_.contains(font_extensions, ext)) {
        font_files.push(_font_file);
      } 
    }
  }

  if(_.isArray(font_files) && _.size(font_files)) {
    return font_files;
  }

  return false;
}


//extract the zipfile to given directory 
async function _unzip_single_font_file(zipfile, dst_dir, font_id){
  if(!fs.existsSync(zipfile)){
    console.log("zipfile file not exist for font id :: ",font_id,  zipfile);
    return false;
  }  
  if(!fs.existsSync(dst_dir)){
    fs.mkdirSync(dst_dir, { recursive: true });
  }
  var status = false;
  try {
    await extract(zipfile, { dir: dst_dir });
    status = true;
  } catch (err) {
    console.log(err);
    status = false;
  }
  
  return status; 
}


//Getnerate the font unique machine name from fullname and subfamily name 
//@todo need lot of samples to test
async function _generate_machinename_from_font_properities(fullName, subfamilyName) {
  var _str = fullName + " " + subfamilyName;
  return await _generate_machinename(_str);
}


//generate the machine name from give string 
async function _generate_machinename(str) {
  if(!str) {
    return false;
  }
  str = await str.toLowerCase(str);
  str = await str.replace(/[^A-Za-z0-9 ]/g,'') // Remove unwanted characters, only accept alphanumeric and space
    .replace(/\s{2,}/g,' ') // Replace multi spaces with a single space
    .replace(/\s/g, "_"); // Replace space with a '-' symbol
  return str;
}


//Get the list of supported font file types
function _get_supported_file_types(all = false){ 
  if(!all) {
    return ['otf', 'ttf'];
  }
  return ['otf', 'ttf', 'woff', 'woff2'];
}

async function _get_remote_json_and_save(api_url, save_to_file = '') {
  
  var res = request('GET', api_url);
  var data = await JSON.parse(res.getBody('utf8'));
  if(_is_non_empty_object(data) || _is_non_empty_array(data)) {
    if(save_to_file) {
      file_data = JSON.stringify(data);
      fs.writeFileSync(save_to_file, file_data);
      if(fs.existsSync(save_to_file)) {  
        return data;
      }        
    }
    return data;
  }
  return false;  
}

async function _cleaupdir(dir) {
  await rimraf.sync(dir);
  await fs.rmdirSync(dir, { recursive: true });  
  return null;
}

//Get all the font ids from the remote server
async function _get_all_font_ids() {
  var font_settings = await _get_remote_json_and_save(FONT_API_SETTINGS);
  if(_.has(font_settings, 'font_ids') && _is_non_empty_array(font_settings.font_ids)) {
    return font_settings.font_ids;
  }
  return false;
}


//Save the full font data 
async function _save_font_data_full(font_id) {
  var url = API_GET_FONT_DATA_FULL + font_id;
  var filename = OUTPUT_DIR + '/' + font_id + '/data.json';
  var font_data = await _get_remote_json_and_save(url, filename);

  return font_data ? true : false;
}

//Save the full font entity data 
async function _save_font_data_entity(font_id) {

  var filename = OUTPUT_DIR + '/' + font_id + '/entity.json';

  var url = API_GET_FONT_ENTITY.split('{font_id}').join(font_id);

  var font_data = await _get_remote_json_and_save(url, filename);

  return font_data ? true : false;
}


//get a font ID and save all images to font image folder 
async function _save_font_images(font_id) {
  var url = API_GET_FONT_DATA_FULL + font_id;
  var font_data = await _get_remote_json_and_save(url);


    //main thumb


  if(font_data && font_data.img) {

    var dir_image_main_thumb = OUTPUT_DIR + '/' + font_id + '/img';
    if(!fs.existsSync(dir_image_main_thumb)){
      fs.mkdirSync(dir_image_main_thumb, { recursive: true });
    }          

    var _main_img_file = font_data.img.substr(font_data.img.lastIndexOf('/') + 1);
    dir_image_main_thumb = dir_image_main_thumb + '/' + _main_img_file;

    var res = request('GET', font_data.img);
    var file_content = res.getBody();
    fs.writeFileSync(dir_image_main_thumb, file_content);      
  }  

  if(font_data && _.has(font_data, 'splash_images') && font_data.splash_images.count) {

    var dir_image_thumbs = OUTPUT_DIR + '/' + font_id + '/img/splash/thumb/';
    if(!fs.existsSync(dir_image_thumbs)){
      fs.mkdirSync(dir_image_thumbs, { recursive: true });
    }

    var dir_image_orgn = OUTPUT_DIR + '/' + font_id + '/img/splash/orgn/';
    if(!fs.existsSync(dir_image_orgn)){
      fs.mkdirSync(dir_image_orgn, { recursive: true });
    }    
  
    var tmp_output = [];

    //download and save thumbnails
    for(let t in font_data.splash_images.thumbnail) {
      var _url = font_data.splash_images.thumbnail[t];

      var _file = _url.substr(_url.lastIndexOf('/') + 1);
      _file = dir_image_thumbs + _file;

      var res = request('GET', _url);
      var file_content = res.getBody();
      fs.writeFileSync(_file, file_content);
    }

    //download and save original images
    for(let t in font_data.splash_images.org) {
      var _url = font_data.splash_images.org[t];

      var _file = _url.substr(_url.lastIndexOf('/') + 1);
      _file = dir_image_orgn + _file;
      
      var res = request('GET', _url);
      var file_content = res.getBody();
      fs.writeFileSync(_file, file_content);
    }    


    return font_data.splash_images;
  }
  return font_data;
}

async function _get_remote_font_files_by_id(font_id) {
  const url = 'http://backend.font.community/api/font_files/' + font_id;
  var font_files = await _get_remote_json_and_save(url);
  return font_files;
}

//##################### Heloper functions ############################
async function _is_non_empty_array(_var) {
  if(_var && _.isArray(_var) && _.size(_var)) {
    return _var;
  } 
  return false;
}

async function _is_non_empty_object(_var) {
  if(_var && _.isObject(_var) && _.size(_var)) {
    return true;
  }
  return false; 
}


module.exports = { 
  singleFont: _process_single_font,
  _save_font_images: _save_font_images,
  generateFontCache: generateFontCache, 

};