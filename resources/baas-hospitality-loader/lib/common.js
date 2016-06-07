// common.js
// ------------------------------------------------------------------
//
// common functions used by the loader and deleteAllItems scripts.
//
// created: Mon Jun  6 17:32:20 2016
// last saved: <2016-June-06 20:20:00>

(function (globalScope){
  var util = require('util'), 
      usergrid = require('usergrid');

  function logWrite() {
    var time = (new Date()).toString(),
        tstr = '[' + time.substr(11, 4) + '-' +
      time.substr(4, 3) + '-' + time.substr(8, 2) + ' ' +
      time.substr(16, 8) + '] ';
    console.log(tstr + util.format.apply(null, arguments));
  }


  function elapsedToHHMMSS (elapsed) {
    function leadingPad(n, p, c) {
      var pad_char = typeof c !== 'undefined' ? c : '0';
      var pad = new Array(1 + p).join(pad_char);
      return (pad + n).slice(-pad.length);
    }
    elapsed = (typeof(elapsed) != 'number') ? parseInt(elapsed, 10) : elapsed;
    var hours   = Math.floor(elapsed / (3600 * 1000)),
        minutes = Math.floor((elapsed - (hours * 3600 * 1000)) / (60 * 1000)),
        seconds = Math.floor((elapsed - (hours * 3600 * 1000) - (minutes * 60 * 1000)) / 1000),
        ms = elapsed - (hours * 3600 * 1000) - (minutes * 60 * 1000) - seconds * 1000;

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds + '.' + leadingPad(ms, 3);
    return time;
  }

  function usergridAuth(baasConn, fn) {
    var ugClient;
    if (baasConn.username && baasConn.password) {
      ugClient = new usergrid.client({
        orgName: baasConn.org,
        appName: baasConn.app,
        buildCurl: true,
        logging: baasConn.wantLogging || false,
        //authType: usergrid.AUTH_CLIENT_ID,
        // clientId: baasConn.clientId,
        // clientSecret: baasConn.clientSecret
      });
      ugClient.login(baasConn.username, baasConn.password,
                     function (e) {
                       if (e) {
                         fn({error:"could user login failed", baasError: e});
                       }
                       else {
                         // make a new client just for the app user, then use this
                         // client to make calls against the API.
                         fn(null, new usergrid.client({
                           orgName: baasConn.org,
                           appName: baasConn.app,
                           authType:usergrid.AUTH_APP_USER,
                           token:ugClient.token
                         }));
                       }
                     });
    }
    else if (baasConn.clientId && baasConn.clientSecret) {
      fn(null, new usergrid.client({
        orgName: baasConn.org,
        appName: baasConn.app,
        buildCurl: true,
        logging: baasConn.wantLogging || false,
        authType: usergrid.AUTH_CLIENT_ID,
        clientId: baasConn.clientId,
        clientSecret: baasConn.clientSecret
      }));
    }
    else {
      fn({error: "missing credentials"});
    }
  }


  module.exports = {
    logWrite : logWrite,
    elapsedToHHMMSS : elapsedToHHMMSS,
    usergridAuth : usergridAuth
  };


}(this));
