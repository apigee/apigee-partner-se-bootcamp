#! /usr/local/bin/node
/*jslint node:true */
// loader.js
// ------------------------------------------------------------------
//
// Load JSON collections into an API BaaS organization + app.
//
// created: Thu Feb  5 19:29:44 2015
// last saved: <2016-June-06 20:08:28>

var fs = require('fs'),
    path = require('path'),
    common = require('./lib/common.js'),
    _ = require('lodash'),
    startTime,
    dataDir = path.join('./', 'data'),
    baasConn = require('./config/baas-connection.json'),
    usergrid = require('usergrid'),
    re1 = new RegExp('\\s{2,}', 'g'),
    batchNum = 0,
    batchSize = 25,
    count = 0;

// monkeypatch ug client to allow batch create.
// http://stackoverflow.com/a/24334895/48082
usergrid.client.prototype.batchCreate = function (type, entities, callback) {
  if (!entities.length) { callback(); }

  var data = _.map(entities, function(entity) {
    var data = (entity instanceof usergrid.entity) ? entity.get() : entity;
    return _.omit(data, 'metadata', 'created', 'modified', 'type', 'activated');
  });

  var options = {
    method: 'POST',
    endpoint: type,
    body: data
  };

  var self = this;
  this.request(options, function (e, data) {
    var entities = [];
    if (e) {
      if (self.logging) { common.logWrite('could not save entities'); }
      if (typeof(callback) === 'function') { callback(e, data); }
      return;
    }

    if (data && data.entities) {
      entities = _.map(data.entities, function(data) {
            var options = {
                  type: type,
                  client: self,
                  uuid: data.uuid,
                  data: data || {}
                };
            var entity = new usergrid.entity(options);
            entity._json = JSON.stringify(options.data, null, 2);
            return entity;
          });
    }
    else {
      e = "No data available";
    }
    if (typeof(callback) === 'function') {
      return callback(e, entities);
    }
  });
};


function postBatch(batch, ugClient, collection, cb) {
  var splitTime = new Date(),
      value = splitTime - startTime;
  batchNum++;
  common.logWrite('batch %d', batchNum);
  ugClient.batchCreate(collection, batch, function (e, entities) {
    cb(e, entities);
  });
}



function doUploadWork (ugClient, collectionName, data, cb) {
  var outstandingRequests = 0,
      stack = [];

  data.forEach(function(item){
    count++;
    stack.push(item);
    // if (count % 100 === 0) {
    //   process.stdout.write('.');
    // }
    if (count % batchSize === 0) {
      //process.stdout.write('.');
      postBatch(stack, ugClient, collectionName, function(e, data) {
        stack = [];
        if (count == data.length) {
          cb(null);
        }
      });
    }
    if ((count != data.length) && (count % (100 * batchSize) === 0)) {
      var splitTime = new Date(),
          value = splitTime - startTime;
      common.logWrite(' %d elapsed %s', count, common.elapsedToHHMMSS(value));
    }
  });

  if (stack.length > 0) {
    //process.stdout.write('.');
    postBatch(stack, ugClient, collectionName, function(e, data) {
      stack = [];
      cb(null);
    });
  }
}



function main(args) {
  var collection;
  try {

    args.forEach(function(arg) {
      if ((arg === '-?') || (arg === '-h')) {
        usage();
        process.exit(0);
      }
      else {
        common.logWrite('error - no parameters supported.');
        usage();
        process.exit(0);
      }
    });

    common.logWrite('start');
    startTime = new Date();
    common.usergridAuth(baasConn, function (e, ugClient){
      if (e) {
        common.logWrite(JSON.stringify(e, null, 2) + '\n');
        process.exit(1);
      }
      common.logWrite('token: %s', ugClient.token);
      fs.readdir(dataDir, function (err,files){
        files.forEach(function(filename) {
          if (filename.indexOf('.json') > 0) {
            var shortname = filename.split('.json')[0];
            console.log('uploading ' + shortname);
            var data = JSON.parse(fs.readFileSync(path.join(dataDir, filename), 'utf8'));
            doUploadWork(ugClient, shortname, data, function(e) {
              var endTime = new Date(), value = endTime - startTime;
              common.logWrite('finis');
              common.logWrite('elapsed %d: %s', value, common.elapsedToHHMMSS(value));
            });
          }
        });
      });
    });
  }
  catch (exc1) {
    console.log("Exception:" + exc1);
    console.log(exc1.stack);
  }
}

main(process.argv.slice(2));
