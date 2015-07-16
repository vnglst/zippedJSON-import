var unzip = require('unzip');
var JSONStream = require('JSONStream');
var fs = require('fs');
var path = require('path');
var inputZipFile = process.argv[2];
var mongoCollection = process.argv[3];

// Example usage:
//
// node index.js IATE-nl.json.zip termentries
//

// init stream
var SaveToMongo = require('save-to-mongo');

var saveToMongo = SaveToMongo({
	uri: 'mongodb://127.0.0.1:27017/glossai-01',
	collection: mongoCollection,
	bulk: {
		mode: 'unordered'
	}
});

fs.createReadStream(inputZipFile)
	.pipe(unzip.Parse())
	.on('entry', function (entry) {
		var fileName = entry.path;
		var jsonExtension = fileName.match(/.json/g);
		var type = entry.type; // 'Directory' or 'File'
		var size = entry.size;
		if (jsonExtension) {
			console.log('.json file found in zip file');
			entry
				.pipe(JSONStream.parse('*'))
				.pipe(saveToMongo)
				.on('execute-error', function (err) {
					console.log(err);
				})
				.on('done', function () {
					console.log('All done!');
					process.exit(0);
				});
		} else {
			console.log('no .json file found in zip file');
			entry.autodrain();
		}
	})
	.on('error', function (e) {
		console.log('An error has occured. Did you specify a zip file? Error: ' + e);
	});
