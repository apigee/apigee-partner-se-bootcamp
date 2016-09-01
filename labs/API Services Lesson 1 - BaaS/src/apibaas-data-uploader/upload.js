var config = require('./config.js');
var base_url = config.uri + '/' + config.org + '/' + config.app +'/';
var request = require('request');
var fs = require('fs');

fs.readdir( './data' , function (err,files){

	for(var i in files){
		var f = files[i];
		if( f.indexOf('.json') > 0 ){
			var name = f.split('.json')[0];
			console.log('uploading ' + name);
			uploadCollection (name, f);
		}
	}	
});

function uploadCollection (name, path){
	var url = base_url + name ;
	fs.createReadStream('data/' + path ).pipe(request.post(url));
}