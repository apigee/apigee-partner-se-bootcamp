#! /usr/local/bin/node
/*jslint node:true */
// deleteAllItems.js
// ------------------------------------------------------------------
//
// Demonstrate how to iteratively delete all items in a BaaS collection.
//
// created: Mon Feb  9 11:18:18 2015
// last saved: <2016-June-06 19:36:02>

/*
* ugCollectionForEach
*
* iterates through all items in a collection within Apigee Edge BaaS.
* Uses the Usergrid client object from the usergrid module.
*
* @param ugClient - the authenticated client object
* @param options - the options for a collection. Pass type and qs.
* @param f - function called with each UG entity. Accepts a single argument.
* @param doneCb - called in case of error or success.
*
*********************************************/

var util = require('util'),
    // _ = require('lodash'),
    baasConn = require('./config/baas-connection.json'),
    usergrid = require('usergrid'),
    readlineSync = require('readline-sync'), 
    common = require('./lib/common.js'),
    pageSize = 120,
    ugClient;


function ugCollectionForEach (ugClient, options, f, doneCb) {
  // call the function f once for each item in a collection
  var results = {count: 0, failCount: 0, page: 0};
  if ( ! options.qs) {
    doneCb(new Error('missing qs property in the options argument'), null);
  }
  if ( ! options.type) {
    doneCb(new Error('missing type property in the options argument'), null);
  }

  ugClient.createCollection(options, function (e, collection) {
    var e2;
    function doOnePage(collection, cb) {
      while(collection.hasNextEntity()) {
        f(collection.getNextEntity(), results);
        results.count++;
      }
      if (collection.hasNextPage()) {
        collection.getNextPage(function(e){
          if (e) {
            e2 = new Error('could not get next page of entities');
            e2.wrappedError = e;
            cb(e2, results);
          }
          else {
            results.page++;
            common.logWrite('page %d', results.page);
            doOnePage(collection, cb);
          }
        });
      }
      else {
        cb(null, results);
      }
    }

    if (e) {
      e2 = new Error('could not make or get collection');
      e2.wrappedError = e;
      doneCb(e2, null);
    }
    else {
      doOnePage(collection, doneCb);
    }
  });
}


function deleteOneEntity(entity, status) {
  // delete the entity from the DB
  entity.destroy(function(e){
    if (e){
      status.failCount++;
    }
  });
}

function allDone(e, startTime) {
  var endTime = new Date(),
      value = endTime - startTime;
  common.logWrite('finis');
  common.logWrite('duration: %s', common.elapsedToHHMMSS(value));

  if (e) {
    console.log("error:" + JSON.stringify(e, null, 2));
  }
}


// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

function usage() {
  console.log("deleteAllItems.js - delete all items in a collection within usergrid");
  console.log("  *** DANGER: this will delete data.");
  console.log("usage:");
  console.log("   node ./deleteAllItems.js  <collection-name>");
  console.log();
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
        if ( ! collection) { 
          collection = arg;
        }
        else {
          common.logWrite('error - specify just one collection.');
          usage();
          process.exit(0);
        }
      }
    });
    
    if (collection) {
      console.log('using org:%s app:%s, delete all items from collection: %s\n',
                  baasConn.org, baasConn.app, collection);
      console.log('** YOU WILL LOSE DATA.');
      if (!readlineSync.keyInYN('Are you sure? : ')) {
        // Key that is not `Y` was pressed.
        console.log('abort.');
        process.exit();
      }      
      common.logWrite('start');
      var startTime = new Date();
      common.usergridAuth(baasConn, function (e, ugClient) {
        if (e) {
          common.logWrite(JSON.stringify(e, null, 2) + '\n');
          process.exit(1);
        }
        common.logWrite('token: %s', ugClient.token);
        ugCollectionForEach(ugClient,
                            { type:collection, qs:{limit:pageSize} },
                            deleteOneEntity,
                            function(e) { allDone(e, startTime); });
      });
    }
    else {
      usage();
    }
    
  }
  catch (exc1) {
    console.log("Exception:" + exc1);
    console.log(exc1.stack);
  }
}

main(process.argv.slice(2));


