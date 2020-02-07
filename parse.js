const EasyDocx = require('node-easy-docx')
const fs = require('fs')

const easyDocx = new EasyDocx({
  path: '/home/dima/Downloads/Telegram\ Desktop/сп54.13330.2016.docx'
})

function get_basic_statements(document) {
	var text_regexp = /[а-яА-ЯёЁ ]+/g;
	var index_regexp = /[0-9]+/g;
	var started = false;
	var section_index = 0;
	results = []
	for (block of document){
		let matching_result = block.text.match(text_regexp)
		let matching_index_result = block.text.match(index_regexp)
  		if (matching_result){
  			if (matching_result[0].toLowerCase().trim() == "основные положения"){
  				started = true;
  				section_index = parseInt(matching_index_result[0]);
  				continue;
  			}
  			if (started && matching_index_result && (parseInt(matching_index_result[0]) == section_index + 1)){
  				started = false;
  				break;
  			}
  			if (started){
  				results.push(matching_result.reduce((accumulator, new_item) => accumulator + new_item, '').toLowerCase().split(/\s+/g).filter(item => item != ''))
  			}
  		}
	}
	return results
}

function get_terms_and_definitions(document) {
	var text_regexp = /(\:|[а-яА-ЯёЁ ]+)/g;
	var index_regexp = /[0-9]+/g;
	var started = false;
	var section_index = 0;
	results = []
	for (block of document){
		let matching_result = block.text.match(text_regexp)
		let matching_index_result = block.text.match(index_regexp)
  		if (matching_result){
  			if (matching_result[0].toLowerCase().trim() == "термины и определения"){
  				started = true;
  				section_index = parseInt(matching_index_result[0]);
  				continue;
  			}
  			if (started && matching_index_result && (parseInt(matching_index_result[0]) == section_index + 1)){
  				started = false;
  				break;
  			}
  			if (started && matching_result.indexOf(':') < matching_result.length - 1){
  				let tokens = matching_result.reduce((accumulator, new_item) => accumulator + ' ' + new_item, '').toLowerCase().split(/\s+/g).filter(item => item != '');
  				results.push({'term': tokens.slice(0, tokens.indexOf(':')), 'definition': tokens.slice(tokens.indexOf(':') + 1, tokens.length)});
  			}
  		}
	}
	return results
}

mergeTexts = (document) => document.map(block => 
		block.text ? 
			block : 
			block.items ? 
				block.items.reduce(
					function(accumulator, current_block){
						new_block = {"text": accumulator.text + (current_block.text ? current_block.text : '')}
						if (current_block.format && !accumulator.format) {
							new_block.format = current_block.format
						} else if (accumulator.format){
							new_block.format = accumulator.format
						}
						return new_block
					}, block.format ? {"text": "", "format": block.format} : {"text" : ""}
				)
			: ''
	).filter(block => block != '')

easyDocx.parseDocx()
  .then(data => {
  	//getRequirements(data);
    // JSON data as result
    result = {}

    merged_texts = mergeTexts(data);
    console.log(merged_texts);
    result["basic-statements"] = get_basic_statements(merged_texts);
    result.terms = get_terms_and_definitions(merged_texts);
    console.log(result);

    fs.writeFile('doc.json', JSON.stringify(mergeTexts(data), null, 2), function (err) {
	  if (err) throw err;
	  console.log('Saved!');
	});
	fs.writeFile('structured-doc.json', JSON.stringify(result, null, 2), function (err) {
	  if (err) throw err;
	  console.log('Saved!');
	});
  })
  .catch(err => {
    console.error(err)
  })