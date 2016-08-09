// runLoad-proxy.js
// ------------------------------------------------------------------
//
// Run a set of REST requests from Node, as specified in a job
// definition file. This is to generate load for API Proxies.
//
// This script uses various npm modules. You may need to do the
// following to get pre-requisites before running this script:
//
//   npm install
//
// There is an API for this target.
//
// GET /status
//   returns a json payload providing status of the service.
//   Keep in mind the status is for the nodejs logic on a single MP only.
//   There are typically multiple MPs, so invoking GET /status multiple
//   times in succession will likely deliver different responses. A response
//   looks like this:
//
//   {
//     "loadGenVersion": "Saturday, 31 January 2015, 14:38",
//     "times": {
//       "start": "Fri Feb 13 2015 02:58:10 GMT-0000 (UTC)",
//       "lastRun": "Fri Feb 13 2015 03:07:28 GMT-0000 (UTC)",
//       "wake": "Fri Feb 13 2015 03:08:38 GMT-0000 (UTC)",
//       "current": "Fri Feb 13 2015 03:08:06 GMT-0000 (UTC)"
//     },
//     "loglevel": 2,
//     "nRequests": 42,
//     "jobId": "hnacino-azure-job1",
//     "description": "drive Henry's Azure-hosted APIs",
//     "status": "waiting",
//     "responseCounts": {
//       "total": 42,
//       "200": 41,
//       "401": 1
//     },
//     "statusCacheKey": "runload-status-hnacino-azure-job1",
//     "loglevelCacheKey": "runload-loglevel-hnacino-azure-job1",
//     "nCycles": null,
//     "durationOfLastRunInMs": 1632,
//     "currentRunsPerHour": 51,
//     "cachedStatus": "-none-"
//   }
//
// POST /control
//   pass a x-www-form-urlencoded payload . eg, Use this header:
//        Content-type:application/x-www-form-urlencoded
//
//   Option 1: start or stop the calls being emitted from the nodejs script.
//   use param action=start or action=stop
//
//   You need to send this request just once, to stop all MPs
//   that are generating load.
//
//   Option 2: set the log level.
//   use param action=setlog&loglevel=N
//
//   where N = [0,10]
//     0 = almost no logging
//     2 = very minimal logging - only wake/sleep and errors
//     3 = see each API call out.
//      progressively more info
//    10 = max logging
//
// created: Wed Jul 17 18:42:20 2013
// last saved: <2015-July-01 14:11:35>
// ------------------------------------------------------------------
//
// Copyright © 2013-2016 Dino Chiesa and Apigee Corp
// All rights reserved.
//
// ------------------------------------------------------------------

var assert = require('assert'),
    http = require('http'),
    Base64 = require('./base64'),
    q = require ('q'),
    request = require('./slimNodeHttpClient.js'),
    express = require('express'),
    fs = require('fs'),
    apigee = require('apigee-access'),
    cache = apigee.getCache(undefined, {scope: 'application'}), // get the default cache
    gStatusCacheKey, gLoglevelCacheKey,
    WeightedRandomSelector = require('./weightedRandomSelector.js'),
    app = express(),
    globalTimeout = 8000, // in ms
    defaultRunsPerHour = 60,
    oneHourInMs = 60 * 60 * 1000,
    minSleepTimeInMs = 800,
    ipForCities = 'https://api.usergrid.com/mukundha/testdata/cities',
    citiesAndPopulation = 'https://api.usergrid.com/dino/loadgen1/cities',
    log = new Log(),
    isUrl = new RegExp('^https?://[-a-z0-9\\.]+($|/)', 'i'),
    wantMasking = true,
    gModel,
    gDefaultLogLevel = 2,
    gStatus = {
      loadGenVersion: '20160427-1341',
      times : {
        start : (new Date()).toString(),
        lastRun : (new Date()).toString(),
      },
      nRequests : 0,
      jobId : '',
      description : '',
      status : 'none',
      responseCounts : { total: 0 }
    },
    globals = {},
    rStringChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';


function Gaussian(mean, stddev) {
  this.mean = mean;
  this.stddev = stddev || mean * 0.1;
  this.next = function() {
    return this.stddev * normal() + 1 * mean;
  };

  /*
     Function normal.

     Generator of pseudo-random number according to a normal distribution
     with mean=0 and variance=1.
     Use the Box-Mulder (trigonometric) method, and discards one of the
     two generated random numbers.
  */

  function normal() {
    var u1 = 0, u2 = 0;
    while (u1 * u2 === 0) {
      u1 = Math.random();
      u2 = Math.random();
    }
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}

function Log() { }

Log.prototype.write = function(level, str) {
  var time = (new Date()).toString();
  if (gStatus.loglevel >= level) {
    console.log('[' + time.substr(11, 4) + '-' +
                time.substr(4, 3) + '-' + time.substr(8, 2) + ' ' +
                time.substr(16, 8) + '] ' + str );
  }
};

function isNumber(n) {
  if (typeof n === 'undefined') { return false; }
  // the variable is defined
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function randomString(length) {
  var i, result = '';
  length = length || Math.ceil((Math.random() * 28)) + 12;
    for (i = length; i > 0; --i) {
      result += rStringChars[Math.round(Math.random() * (rStringChars.length - 1))];
    }
    return result;
}

function randomName() {
  return selectGivenName() + '-' +
    Math.floor((Math.random() * 10000));
}

function selectGivenName() {
  var names = ['Ashish', 'Nikhil', 'Seshadri', 'Kyle', 'Jeff', 'Neha', 'Jin', 'Lewis', 'Fernando', 'Rajeev', 'Mary', 'Sophia', 'Rose', 'Julianna', 'Grace', 'Janice', 'Niko', 'Anish'],
  n = names[Math.floor((Math.random() * names.length))];
  return n;
}

function copyHash(obj) {
  var copy = {};
  if (null !== obj && typeof obj == "object") {
    Object.keys(obj).forEach(function(attr){copy[attr] = obj[attr];});
  }
  return copy;
}

function trackFailure(e) {
  if (e) {
    log.write(0,'failure: ' + e);
    log.write(1, e.stack);
    gStatus.lastError = {
      message: e.stack.toString(),
      time: (new Date()).toString()
    };
  }
  else {
    log.write(0,'unknown failure?');
  }
}

function getType(obj) {
  return Object.prototype.toString.call(obj);
}

function logTransaction(e, req, res, obj, payload) {
  console.log('\n' + req.method + ' ' + req.path);
  console.log('headers: ' + JSON.stringify(req._headers, null, 2));
  if (payload) {
    console.log('payload: ' + JSON.stringify(payload, null, 2));
  }
  console.log('\nresponse status: ' + res.statusCode);
  console.log('response body: ' + JSON.stringify(obj, null, 2) +'\n\n');
  assert.ifError(e);
}

function maskToken(value) {
  if ( ! value ) { return value; }
  if ( ! wantMasking) {return value;}
  if ( ! startsWith(value, 'Bearer ')) return value;
  return 'Bearer *******';
}

function startsWith (str, frag){
  return str && (str.slice(0, frag.length) == frag);
}

function dayNumberToName(name) {
  var map = [ 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday' ],
      n = name.toLowerCase(),
      ix = map.indexOf(n);
  if (ix < 0) {
    ix = map.map(function(s){return s.substring(0, 3);}).indexOf(n);
  }
  return ix;
}


// function cacheKey(httpRequest) {
//   var varnames = [ 'apiproxy.name', 'apiproxy.revision' ],
//       values = varnames.map(function(v, ix){
//         return apigee.getVariable(httpRequest, v);
//       }),
//       key = 'runload-status-' + values.join('-');
//   // side effect - set these global vars
//   if ( ! gOrg) {
//     gOrg = apigee.getVariable(httpRequest, 'organization.name');
//   }
//   if ( ! gEnv) {
//     gEnv = apigee.getVariable(httpRequest, 'environment.name');
//   }
//   return key;
// }


function retrieveCities(ctx) {
  var deferredPromise = q.defer(),
      options = {
        timeout : 66000, // in ms
        uri: citiesAndPopulation + '?limit=350',
        method: 'get',
        headers: {
          'Accept' : 'application/json',
          'user-agent' : 'SlimHttpClient/1.0'
        }
      };

  log.write(8,'retrieveCities');

  request(options, function(e, httpResp, body) {
    var a, type, cities;
    if (e) {
      log.write(2,'retrieveCities, error: ' + e);
    }
    else {
      type = getType(body);
      if (type === "[object String]") {
        try {
          body = JSON.parse(body);
          cities = body.entities.map(function(elt) {
            return [ elt, Number(elt.pop2010) ];
          });
          globals.citySelector = new WeightedRandomSelector(cities);
        }
        catch(exc1) {
          log.write(2,'retrieveCities: cannot parse body :(');
        }
      }
      log.write(8,'retrieveCities done');
    }
    deferredPromise.resolve(ctx);
  });
  return deferredPromise.promise;
}


function chooseRandomIpFromRecord(rec) {
  var ranges, numRanges, selectedRange,
      start, end, index,
      selected, w, x, y, z, allGood;
  if ( ! rec) { return null;}

  // It's possible we'll get bad data from the request, in which case
  // rec.ranges may be invalid. Or, any of the other successive fields
  // may be invalid. In that case, bail.
  allGood = (ranges = rec.ranges) &&
    (numRanges = ranges.length) &&
    (selectedRange = ranges[Math.floor(Math.random() * numRanges)]) &&
    (start = parseInt(selectedRange[0], 10)) &&
    (end = parseInt(selectedRange[1], 10)) &&
    (index = Math.floor(Math.random()*(start-end))) &&
    (selected = start + index) &&
    (w =  Math.floor(( selected / 16777216 ) % 256)) &&
    (x =  Math.floor(( selected / 65536    ) % 256)) &&
    (y =  Math.floor(( selected / 256      ) % 256)) &&
    (z =  Math.floor(( selected            ) % 256));

  if (allGood)
    return w + "." + x + "." + y + "." + z ;

  return null;
}


function contriveIpAddress(context) {
  var city, ql, options, deferred;

  function choose(cityData) {
    context.job.contrivedIp = chooseRandomIpFromRecord(cityData);
    context.job.chosenCity = city.name;
    log.write(8,'contriveIpAddress: ' + city.name + ' ' + context.job.contrivedIp);
  }

  log.write(10,'contriveIpAddress');
  if (!globals.citySelector) {
    return context;
  }

  city = globals.citySelector.select()[0];

  log.write(10,'contriveIpAddress: city: ' + city.name);

  if (globals.hasOwnProperty('cities') && globals.cities[city.name]) {
    // the selected city has been cached.
    choose(globals.cities[city.name]);
    return context;
  }

  // must do a lookup
  ql = "select * where city='" + city.name + "'";
  options = {
    timeout : 16000, // in ms
    uri : ipForCities + '?ql=' + encodeURIComponent(ql),
    method: 'get',
    headers: {
      'Accept' : 'application/json',
      'user-agent' : 'SlimHttpClient/1.0'
    }
  };
  deferred = q.defer();

  request(options, function(e, httpResp, body) {
    var type;
    if (e) {
      log.write(2,'contriveIpAddress, error: ' + e);
    }
    else {
      type = Object.prototype.toString.call(body);
      if (type === "[object String]") {
        try {
          body = JSON.parse(body);
        }
        catch(exc1) {
          log.write(2,'contriveIpAddress: cannot parse body :(');
        }
      }
      if (body.entities && body.entities[0]) {
        if (!globals.cities) { globals.cities = {}; }
        // do not cache this data - see APIRT-1974
        //globals.cities[city.name] = body.entities[0];
        choose(body.entities[0]);
      }
      else {
        log.write(2,'contriveIpAddress: no body entities');
      }
    }
    deferred.resolve(context);
  });
  return deferred.promise;
}


function resolveNumeric(input) {
  var I = input;
  if (typeof input == "undefined") {
    I = 1;
  }
  else if (typeof input == "string") {
    I = eval('(' + input + ')');
  }
  return I;
}


function evalTemplate(ctx, code) {
  var src, f,
      values = [], names = [], result,
      extractContext = ctx.state.extracts;

  // log.write('eval: ' + code);
  // log.write('ctx: ' + JSON.stringify(extractContext, null, 2));
  // TODO: cache this?
  // create the fn signature
  Object.keys(extractContext).forEach(function(prop){
    names.push(prop);
    values.push(extractContext[prop]);
  });

  src = 'return ' + code + ';';
  log.write(9,'evalTemplate: ' + src);
  try {
    f = new Function(names.join(','), src);
    // call the function with all its arguments
    result = f.apply(null, values);
  }
  catch (exc1) {
    log.write(3,'evalTemplate, exception: ' + exc1.toString());
    result = '';
  }
  log.write(6,'evalTemplate, result: ' + result);
  return result;
}


/**
* Replace templates in a single string.
**/
var rt_re1 = new RegExp('(.*)(?!{{){([^{}]+)(?!}})}(.*)'),
    rt_re2 = new RegExp('(.*){{([^{}]+)}}(.*)'); // for double-curlies
function replaceTemplatesInString(ctx, s) {
  var newVal, match;

  for (newVal = s, match = rt_re1.exec(newVal); match; match = rt_re1.exec(newVal)){
    newVal = match[1] + evalTemplate(ctx, match[2]) + match[3];
  }
  for (match = rt_re2.exec(newVal); match; match = rt_re2.exec(newVal)){
    newVal = match[1] + '{' + match[2] + '}' + match[3];
  }
  return newVal;
}


/**
* expandEmbeddedTemplates walks through an object, replacing each embedded
* template as appropriate. This is used to expand a templated payload.
**/
function expandEmbeddedTemplates(ctx, obj) {
  var newObj,
      type = Object.prototype.toString.call(obj), x, i;

  if (type === "[object String]") {
    newObj = replaceTemplatesInString(ctx, obj);
  }
  else if (type === "[object Array]") {
    // iterate
    newObj = [];
    for (i=0; i<obj.length; i++) {
      x = expandEmbeddedTemplates(ctx, obj[i]);
      newObj.push(x);
    }
  }
  else if (type === "[object Object]") {
    newObj = {};
    Object.keys(obj).forEach(function(prop){
      var type = Object.prototype.toString.call(obj[prop]);
        if (type === "[object String]") {
          // replace all templates in a string
          newObj[prop] = replaceTemplatesInString(ctx, obj[prop]);
        }
        else if (type === "[object Object]" || type === "[object Array]") {
          // recurse
          newObj[prop] = expandEmbeddedTemplates(ctx, obj[prop]);
        }
        else {
          // no replacement
          newObj[prop] = obj[prop];
        }
      });
  }
  return newObj;
}


// ==================================================================

function invokeOneRequest(context) {
  var re = new RegExp('(.*){(.+)}(.*)'),
      state = context.state,
      job = context.job,
      sequence = job.sequences[state.sequence],
      req = sequence.requests[state.request],
      url = req.url || req.pathSuffix,
      match = re.exec(url),
      actualPayload,
      headers = (job.defaultProperties && job.defaultProperties.headers) ? job.defaultProperties.headers : {},
      reqOptions = { headers: copyHash(headers)}, // must use a copy here
      p = q.resolve(context);

  log.write(4, job.id + ' invokeOneRequest');

  // 1. delay as appropriate
  if (req.delayBefore) {
    p = p.then(function(ctx){
      var deferredPromise = q.defer(),
          t = resolveNumeric(req.delayBefore);
      setTimeout(function() { deferredPromise.resolve(ctx); }, t);
      return deferredPromise.promise;
    });
  }

  // 2. run any imports.
  if (req.imports && req.imports.length>0) {
    p = p.then(function(ctx){
      var imp, i, L;
      // cache the eval'd import functions
      for (i=0, L=req.imports.length; i<L; i++) {
        imp = req.imports[i];
        if ( ! imp.compiledFn) {
          log.write(5,'eval: ' + imp.fn);
          imp.compiledFn = eval('(' + imp.fn + ')');
        }
        log.write(5, imp.description);
        // actually invoke the compiled fn
        try {
          ctx.state.extracts[imp.valueRef] = imp.compiledFn(ctx.state.extracts);
          log.write(5, imp.valueRef + ':=' + JSON.stringify(ctx.state.extracts[imp.valueRef]));
        }
        catch (exc1) {
          ctx.state.extracts[imp.valueRef] = null;
          log.write(5, imp.valueRef + ':= null (exception: ' + exc1 + ')');
        }
      }
      return ctx;
    });
  }

  // 3. evaluate the url path if required.
  if (match) {
    // The url includes at least one template.
    // Must do replacements within the promise chain.
    p = p.then(function(ctx){
      // there may be multiple templates; must evaluate all of them
      var v = url;
      for (; match && v; match = re.exec(v)) {
        v = evalTemplate(ctx, match[2]);
        v = (v !== null) ? (match[1] + v + match[3]) : null;
      }
      url = v ? v : "";
      return ctx;
    });
  }

  // 4. conditionally set additional headers for this request.
  if (req.headers) {
    p = p.then(function(ctx) {
      Object.keys(req.headers).forEach(function(hdr){
        var value = req.headers[hdr],
            match = re.exec(value);
        if (match) {
          // replace all templates until done
          for (; match; match = re.exec(value)) {
            value = match[1] + evalTemplate(ctx, match[2]) + match[3];
          }
        }
        else {
          value = req.headers[hdr];
        }
        log.write(5,'Header ' + hdr + ': ' + maskToken(value) );
        reqOptions.headers[hdr.toLowerCase()] = value;
      });

      return ctx;
    });
  }

  // 5. actually do the http call, and run the subsequent extracts
  p = p.then(function(ctx) {
    var deferredPromise = q.defer(),
        city,
        method = (req.method)? req.method.toLowerCase() : "get",
        respCallback = function(e, httpResp, body) {
          var i, L, ex, obj, aIndex;
          gStatus.nRequests++;
          if (e) {
            log.write(2, e);
          }
          else {
            log.write(2, "==> " + httpResp.statusCode);
            // keep a count of status codes
            aIndex = httpResp.statusCode + '';
            if (gStatus.responseCounts.hasOwnProperty(aIndex)) {
              gStatus.responseCounts[aIndex]++;
            }
            else {
              gStatus.responseCounts[aIndex] = 1;
            }
            gStatus.responseCounts.total++;
            if (req.extracts && req.extracts.length>0) {
              // cache the eval'd extract functions
              // if ( ! ctx.state.extracts) { ctx.state.extracts = {}; }
              for (i=0, L=req.extracts.length; i<L; i++) {
                ex = req.extracts[i];
                if ( ! ex.compiledFn) {
                  log.write(6,'eval: ' + ex.fn);
                  ex.compiledFn = eval('(' + ex.fn + ')');
                }
                log.write(6, ex.description);
                // actually invoke the compiled fn
                try {
                  // sometimes the body is already parsed into an object?
                  obj = Object.prototype.toString.call(body);
                  if (obj === '[object String]') {
                    try {
                      obj = JSON.parse(body);
                    }
                    catch (exc1){
                      // possibly it was not valid json
                      obj = null;
                    }
                  }
                  else {
                    obj = body;
                  }
                  ctx.state.extracts[ex.valueRef] = ex.compiledFn(obj, httpResp.headers, ctx.state.extracts);
                  log.write(5, ex.valueRef + ':=' + JSON.stringify(ctx.state.extracts[ex.valueRef]));
                }
                catch (exc1) {
                  ctx.state.extracts[ex.valueRef] = null;
                  log.write(5, ex.valueRef + ':= null (exception: ' + exc1 + ')');
                }
              }
            }
          }
          ctx.state.request++;
          deferredPromise.resolve(ctx);
        };

    reqOptions.method = method;
    reqOptions.timeout = globalTimeout;
    reqOptions.followRedirects = false;

    if (isUrl.test(url)) {
      // if it is a complete URL, use it.
      reqOptions.uri = url;
    }
    else if (job.defaultProperties.port) {
      // Url.parse (used by slimhttpclient) is sort of broken.  if the
      // URL specifies the standard port (eg 80 for http), then the Url
      // gets parsed strangely. Therefore, clients must include the port
      // only if it is non-standard.
      reqOptions.uri =
        job.defaultProperties.scheme + '://' +
        job.defaultProperties.host;

      if (((job.defaultProperties.port !== 80) &&
           (job.defaultProperties.scheme.toLowerCase() === 'http')) ||
          ((job.defaultProperties.port !== 443) &&
           (job.defaultProperties.scheme.toLowerCase() === 'https'))){
        reqOptions.uri += ':' + job.defaultProperties.port;
      }

      reqOptions.uri += url;
    }
    else {
      reqOptions.uri =
        job.defaultProperties.scheme + '://' + job.defaultProperties.host + url;
    }

    // var parsedUrl = Url.parse(reqOptions.uri);
    // log.write('parsed URL :' + JSON.stringify(parsedUrl, null, 2));

    if (job.hasOwnProperty('contrivedIp') && job.contrivedIp) {
      reqOptions.headers['x-random-city'] = job.chosenCity;
      reqOptions.headers['x-forwarded-for'] = job.contrivedIp;
    }
    else {
      log.write(5,'no contrived IP');
    }

    log.write(3, method.toUpperCase() + ' ' + reqOptions.uri);

    if (method === "post" || method === "put") {
      actualPayload = expandEmbeddedTemplates(ctx, req.payload);
      var t2 = Object.prototype.toString.call(actualPayload);
      if (t2 == '[object String]') {
        reqOptions.body = actualPayload;
        // set header explicitly if not already set
        if (!reqOptions.headers['content-type']) {
          reqOptions.headers['content-type'] = 'application/x-www-form-urlencoded';
        }
      }
      else {
        // in this case the content-type header gets set implicitly by the library
        reqOptions.json = actualPayload;
      }
      request(reqOptions, respCallback);
    }
    else if (method === "get" || method === "delete") {
      request(reqOptions, respCallback);
    }
    else {
      assert.fail(r.method,"get|post|put|delete", "unsupported method", "<>");
    }
    return deferredPromise.promise;
  });

  return p;
}



// ==================================================================

function reportModel (context) {
  console.log('================================================');
  console.log('==         Job Definition Retrieved           ==');
  console.log('================================================');
  console.log(JSON.stringify(context, null, 2));
  return context;
}


function setInitialContext(ctx) {
  gStatus.status = "initializing";
  return { job: ctx };
}

// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

function runJob(context) {
  var state = context.state,
      job = context.job,
      p, sequence;

  // This is an unrolled version of a 3-level-deep nested loop
  if (state.request === state.R) {
    state.request = 0;
    state.iteration++;
    log.write(3,'runJob: ++Iteration ' + state.iteration);
    return q.resolve(context).then(runJob);
  }
  if ((typeof state.I[state.sequence] === "undefined") && state.sequence < state.S) {
    log.write(5,'runJob: resolveNumeric('+ job.sequences[state.sequence].iterations +')');
    state.I[state.sequence] = resolveNumeric(job.sequences[state.sequence].iterations);
    log.write(5,'runJob: state.I[' + state.sequence + ']= ' + state.I[state.sequence] );
  }
  if (state.iteration >= state.I[state.sequence]) {
    state.iteration = 0;
    state.sequence++;
    log.write(3,'runJob: ++Sequence ' + state.sequence);
    return q.resolve(context).then(runJob, trackFailure);
  }
  if (state.sequence === state.S) {
    // No more work to do. Terminate this sequence.
    state.sequence = 0;
    log.write(3,'runJob: done');
    return q(context).then(setWakeup, trackFailure);
  }

  // Need to verify that all properties are valid.
  // Sometimes they are not due to intermittent data retrieval errors.
  // In which case, just sleep and try again at next interval.
  if ( ! (job.sequences && job.sequences.length && (state.sequence < job.sequences.length) &&
          job.sequences[state.sequence].requests && job.sequences[state.sequence].requests.length)) {
            return q.resolve(context)
      .then(function(c){
        log.write(1,'state error');
        return c;
      })
      .then(setWakeup);
  }

  // set and log counts
  state.S = job.sequences.length;
  state.R = job.sequences[state.sequence].requests.length;
  if ( ! state.I[state.sequence]) {
    state.I[state.sequence] = resolveNumeric(job.sequences[state.sequence].iterations);
  }
  log.write(3,'R ' + (state.request + 1) + '/' + state.R +
            ' I ' + (state.iteration + 1) + '/' + state.I[state.sequence] +
            ' S ' + (state.sequence + 1) + '/' + state.S);


  // if we arrive here we're doing a request, implies an async call
  p = q.resolve(context);

  // generate a random IP address if necessary
  if (state.request === 0 && state.iteration === 0 && state.sequence === 0) {
    if (!job.hasOwnProperty('geoDistribution') || job.geoDistribution == 1) {
      if (!globals.citySelector) {
        p = p.then(retrieveCities, trackFailure);
      }
      p = p.then(contriveIpAddress, trackFailure);
      // Upon failure, no job.contrivedIp gets set in context.
      // This is ok, though. We can still continue.
    }
    else {
      p = p.then(function(ctx){
        log.write(3,'no geo distribution');
        return ctx;
      });
    }
  }

  // do the call
  p = p.then(invokeOneRequest, trackFailure);

  // sleep if necessary
  sequence = job.sequences[state.sequence];
  if (state.request === 0 && state.iteration !== 0) {
    if (sequence.delayBetweenIterations) {
      p = p.then(function(ctx){
        var deferredPromise = q.defer(),
            t = resolveNumeric(sequence.delayBetweenIterations);
        setTimeout(function() { deferredPromise.resolve(ctx); }, t);
        return deferredPromise.promise;
      });
    }
  }

  return p.then(runJob);
}


function initializeJobRun(context) {
  var now = (new Date()).valueOf(),
    // initialize context for running
      newState = {
        state:'run',
        sequence : 0,
        S : context.job.sequences.length,
        request : 0,
        R : context.job.sequences[0].requests.length,
        iteration : 0,
        I : [],
        extracts: copyHash(context.job.initialContext),
        start : now
      };

  gStatus.jobId = context.job.id || "-none-";
  gStatus.description = context.job.description || "-none-";

  // on initial startup, set loglevel and put it into the cache
  if (!context.continuing) {
    gStatus.loglevel = context.job.loglevel || gDefaultLogLevel;
    cache.put(gLoglevelCacheKey, '' + gStatus.loglevel, 18640000, function(e) {});
  }
  // put the run status into the cache.
  // (deploy implies start running)
  cache.put(gStatusCacheKey, "running", 8640000, function(e){});

  // if (gStatus.status == "pending-stop") {
  //   log.write(gStatus.jobId + ' no launch - pending stop');
  //   gStatus.status = "stopped";
  //   return context;
  // }

  // launch the loop
  gStatus.status = "running";

  context.state = newState;

  return q(context)
    .then(runJob);
}



function setWakeup(context) {
  var job = context.job,
      jobid = job.id,
      now = new Date(),
      wakeTime,
      currentHour = now.getHours(),
      nextHour, currentMinute, hourFraction,
      currentDayOfWeek = now.getDay(),
      durationOfLastRun = now - context.state.start,
      runsPerHour = 0, sleepTimeInMs;

  log.write(3,'setWakeup');
  gStatus.nCycles++;
  gStatus.times.lastRun = now.toString();

  if (job.invocationsPerHour) {
    // We want to figure out how long to sleep, in order to
    // reach the configured load target. First, let's figure out
    // how many runs per hour the tool should make, according to
    // linear interpolation betwen the "invocationsPerHour" figures.
    // Interpolating makes the "by minute" graph smoother.
    if (currentHour < 0 || currentHour > 23) { currentHour = 0;}
    nextHour = (currentHour == 23) ? 0 : (currentHour + 1);

    // If one of the invocationsPerHour figures is non-zero, we can interpolate.
    if (job.invocationsPerHour[currentHour] || job.invocationsPerHour[nextHour] ) {
      runsPerHour = job.invocationsPerHour[currentHour];
      currentMinute = now.getMinutes(); // 0 <= x <= 59
      hourFraction = (currentMinute + 1) / 60;
      runsPerHour +=
        hourFraction * (job.invocationsPerHour[nextHour] - job.invocationsPerHour[currentHour]);
    }
  }

  // apply default if necessary
  runsPerHour = runsPerHour || defaultRunsPerHour;
  log.write(5, jobid + ' ' + runsPerHour + ' initial runs per hour');

  // load variation by day of week
  // if (job.variationByDayOfWeek &&
  //     job.variationByDayOfWeek.length &&
  //     job.variationByDayOfWeek.length == 7 &&
  //     job.variationByDayOfWeek[currentDayOfWeek] &&
  //     job.variationByDayOfWeek[currentDayOfWeek] > 0 &&
  //     job.variationByDayOfWeek[currentDayOfWeek] <= 10) {
  //   log.write(5, jobid + ' variation: ' + job.variationByDayOfWeek[currentDayOfWeek]);
  //   runsPerHour = Math.floor(runsPerHour * job.variationByDayOfWeek[currentDayOfWeek]);
  // }

  if (job.variationByDayOfWeek) {
    var vtype = Object.prototype.toString.call(job.variationByDayOfWeek);
    if (vtype === "[object Array]") {
      if (job.variationByDayOfWeek.length &&
          job.variationByDayOfWeek.length == 7 &&
          job.variationByDayOfWeek[currentDayOfWeek] &&
          job.variationByDayOfWeek[currentDayOfWeek] > 0 &&
          job.variationByDayOfWeek[currentDayOfWeek] <= 10) {
        log.write(5, jobid + ' variation: ' + job.variationByDayOfWeek[currentDayOfWeek]);
        runsPerHour = Math.floor(runsPerHour * job.variationByDayOfWeek[currentDayOfWeek]);
      }
      else {
        log.write(2, jobid + ' variationByDayOfWeek seems wrong: ' + dayName);
      }
    }
    else if (vtype === "[object Object]") {
      var dayName = dayNumberToName(currentDayOfWeek);
      if (dayName >=0 &&
          job.variationByDayOfWeek[dayName] > 0 &&
          job.variationByDayOfWeek[dayName] <= 10) {
        log.write(5, jobid + ' variation: ' + job.variationByDayOfWeek[dayName]);
        runsPerHour = Math.floor(runsPerHour * job.variationByDayOfWeek[dayName]);
      }
      else {
        log.write(2, jobid + ' variationByDayOfWeek seems wrong: ' + dayName);
      }
    }
    else {
      //neither an array nor a hash.
      log.write(2, jobid + ' variationByDayOfWeek seems wrong');
    }
  }

  runsPerHour = Math.floor(runsPerHour);

  log.write(5, jobid + ' duration of last run: ' + durationOfLastRun);

  // now, figure out how long to sleep, given the target number of runs per hour.
  var g = new Gaussian(oneHourInMs / runsPerHour);
  sleepTimeInMs = Math.floor(g.next()) - durationOfLastRun;

  // default the sleep time
  if (sleepTimeInMs < minSleepTimeInMs) { sleepTimeInMs = minSleepTimeInMs; }

  log.write(4, jobid + ' ' + runsPerHour + ' actual runs per hour');
  wakeTime = new Date(now.valueOf() + sleepTimeInMs);
  log.write(2, jobid + ' sleep ' + sleepTimeInMs + 'ms, wake at ' +
            wakeTime.toString().substr(16, 8));

  // for diagnostics tracking
  gStatus.durationOfLastRunInMs = durationOfLastRun;
  gStatus.currentRunsPerHour = runsPerHour;
  gStatus.status = "waiting";
  gStatus.times.wake = wakeTime.toString();

  // now, sleep. On wakeup, either run... or sleep again.
  setTimeout(function () {
    log.write(2, jobid + ' awake');
    delete gStatus.times.wake;
    cache.get(gLoglevelCacheKey, function(e, value) {
      if (e) {
        log.write(2, jobid + ' cannot retrieve loglevel. ' + e);
        value = gDefaultLogLevel;
        log.write(2, jobid + ' using default: ' + value);
      }
      else if (typeof value === 'undefined'){
        value = gDefaultLogLevel;
        log.write(2, jobid + ' using default loglevel: ' + value);
      }
      else {
        log.write(2, jobid + ' retrieved loglevel: ' + value);
      }
      gStatus.loglevel = Math.max(0, Math.min(10, parseInt(value, 10)));
      cache.get(gStatusCacheKey, function(e, value) {
        var msg;
        if (e) {
          log.write(2, jobid + ' cannot retrieve status, presumed running.');
        }
        else {
          msg = (typeof value === 'undefined') ? 'undefined, ergo running.' : value;
          log.write(4, jobid + ' cached status: ' + msg);
        }
        gStatus.cachedStatus = value || '-none-';
        if (e || value != "stopped") {
          // failed to get a value, or value is not stopped
          q({job:job, continuing: true})
            .then(initializeJobRun)
            .done(function(){},
                  function(e){
                    log.write(2,'unhandled error: ' + e);
                    log.write(2, e.stack);
                  });
        }
        else {
          // value is stopped. Sleep one cycle, then check again.
          context.state.start = new Date(); // now
          q(context).then(setWakeup, trackFailure);
        }
      });
    });
  }, sleepTimeInMs);
  return context;
}



// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

function kickoff(arg) {
  try {
    if (fs.existsSync(arg)) {
      console.log(arg);
      gModel = JSON.parse(fs.readFileSync(arg, "utf8"));
      if ( ! gModel.id) {
        throw "you must specify a unique id for the job";
      }
      gStatusCacheKey = 'runload-status-' + gModel.id;
      gLoglevelCacheKey = 'runload-loglevel-' + gModel.id;
      gStatus.statusCacheKey = gStatusCacheKey;
      gStatus.loglevelCacheKey = gLoglevelCacheKey;
      q(gModel)
        //.then(reportModel)
        .then(setInitialContext)
        .then(initializeJobRun)
        .done(function() {}, function(e) {
          log.write(2,'unhandled error: ' + e);
          log.write(2, e.stack);
        });
    }
    else {
      console.log("That file does not exist");
    }
  }
  catch (exc1) {
    console.log("Exception:" + exc1);
    console.log(exc1.stack);
  }
}

// =======================================================
//
// The simple API exposed by this script allows POST /control
// and GET /status
//
// =======================================================

app.use(express.urlencoded());

app.get('/status', function(request, response) {
  var payload;
  response.header('Content-Type', 'application/json');
  gStatus.times.current = (new Date()).toString();
  payload = copyHash(gStatus);
  cache.get(gStatusCacheKey, function(e, value) {
    if (e) {
      payload.error = true;
      payload.cacheException = e.toString();
      response.send(500, JSON.stringify(payload, null, 2) + "\n");
    }
    else {
      payload.cachedStatus = value || '-none-';
      response.send(200, JSON.stringify(payload, null, 2) + "\n");
    }
  });
});


app.post('/control', function(request, response) {
  var payload,
      // post body parameter, or query param
      action = request.body.action || request.query.action,
      loglevel = request.body.loglevel || request.query.loglevel,
      putCallback = function(e) {
        cache.get(gStatusCacheKey, function(e, value) {
          if (e) {
            payload.error = true;
            payload.cacheException = e.toString();
            response.send(500, JSON.stringify(payload, null, 2) + "\n");
          }
          else {
            payload.cachedStatus = value;
            response.send(200, JSON.stringify(payload, null, 2) + "\n");
          }
        });
      };

  response.header('Content-Type', 'application/json');
  payload = copyHash(gStatus);
  payload.times.current = (new Date()).toString();


  if (action != "stop" && action != "start" && action != "setlog") {
    payload.error = "unsupported request (action)";
    response.send(400, JSON.stringify(payload, null, 2) + "\n");
    return;
  }

  if (action == "setlog") {

    if (!isNumber(loglevel)) {
      payload.error = "must pass loglevel";
      response.send(400, JSON.stringify(payload, null, 2) + "\n");
      return;
    }
    // coerce
    loglevel = Math.max(0, Math.min(10, parseInt(loglevel, 10)));
    cache.put(gLoglevelCacheKey, '' + loglevel, 18640000, function(e) {
      if (e) {
        payload.error = true;
        payload.cacheException = e.toString();
        response.send(500, JSON.stringify(payload, null, 2) + "\n");
      }
      else {
        payload.loglevel = loglevel;
        response.send(200, JSON.stringify(payload, null, 2) + "\n");
      }
    });
  }
  else {
    cache.get(gStatusCacheKey, function(e, value) {
      if (e) {
        payload.error = true;
        payload.cacheFail = true;
        payload.cacheException =  e.toString();
        response.send(500, JSON.stringify(payload, null, 2) + "\n");
      }
      else {
        payload.cachedStatus = value;
        if (value == "stopped") {
          if (action == "stop") {
            // nothing to do...send a 400.
            payload.error = "already stopped";
            response.send(400, JSON.stringify(payload, null, 2) + "\n");
          }
          else {
            // action == start
            cache.put(gStatusCacheKey, "running", 8640000, putCallback);
          }
        }
        else {
          // is marked "running" now.
          if (action == "stop") {
            cache.put(gStatusCacheKey, "stopped", 8640000, putCallback);
          }
          else {
            // action == start
            // nothing to do, send a 400.
            payload.error = "already running";
            response.send(400, JSON.stringify(payload, null, 2) + "\n");
          }
        }
      }
    });
  }
});


// default behavior
app.all(/^\/.*/, function(request, response) {
  response.header('Content-Type', 'application/json');
  response.send(404, '{ "message" : "This is not the server you\'re looking for." }\n');
});


port = process.env.PORT || 5950;
app.listen(port, function() {
  setTimeout(function() { return kickoff("model.json"); }, 1200);
});
