#! /usr/local/bin/node
/*jslint node:true */

// runLoad-cli.js
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
// To run it:
//
//    node ./runLoad-cli.js  <job-definition-filename>
//
//
// created: Wed Jul 17 18:42:20 2013
// last saved: <2016-June-06 16:56:21>
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
    WeightedRandomSelector = require('./weightedRandomSelector.js'),
    globalTimeout = 8000, // in ms
    defaultRunsPerHour = 60,
    oneHourInMs = 60 * 60 * 1000,
    version = '20160427-1340',
    minSleepTimeInMs = 1200,
    ipForCities = 'https://api.usergrid.com/mukundha/testdata/cities',
    citiesAndPopulation = 'https://api.usergrid.com/dino/loadgen1/cities',
    log = new Log(),
    isUrl = new RegExp('^https?://[-a-z0-9\\.]+($|/)', 'i'),
    wantMasking = true,
    sleepTimeInMs = 5 * 60 * 1000,  // not really - this discounts runtime
    rStringChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';


function Log(id) { }

Log.prototype.write = function(str) {
  var time = (new Date()).toString(), me = this;
  console.log('[' + time.substr(11, 4) + '-' +
              time.substr(4, 3) + '-' + time.substr(8, 2) + ' ' +
              time.substr(16, 8) + '] ' + str );
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
  var names = ['Ashish', 'Nikhil', 'Seshadri', 'Kyle', 'Jeff', 'Neha', 'Jin', 'Lewis', 'Fernando', 'Rajeev', 'Mary', 'Sophia', 'Rose', 'Julianna', 'Grace', 'Janice', 'Niko'],
  n = names[Math.floor((Math.random() * names.length))];
  return n;
}

function copyHash(obj) {
  var copy = {};
  if (null !== obj && typeof obj == "object") {
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) {copy[attr] = obj[attr];}
    }
  }
  return copy;
}

function trackFailure(e) {
  if (e) {
    log.write('failure: ' + e);
    log.write(e.stack);
  }
  else {
    log.write('unknown failure?');
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
  if ( ! wantMasking) {return value;}
  var re1;
  if ( ! startsWith(value, 'Bearer ')) return value;
  return 'Bearer *******';
}

function startsWith (str, frag){
  return str.slice(0, frag.length) == frag;
}

function retrieveCities(ctx) {
  var deferredPromise = q.defer(),
      options = {
        uri: citiesAndPopulation + '?limit=1000',
        method: 'get',
        headers: {
          'Accept' : 'application/json',
          'user-agent' : 'SlimHttpClient/1.0'
        }
      };

  log.write('retrieveCities');

  request(options, function(e, httpResp, body) {
    var a, type, cities;
    if (e) {
      log.write('retrieveCities, error: ' + e);
    }
    else {
      type = getType(body);
      if (type === "[object String]") { body = JSON.parse(body); }
      cities = body.entities.map(function(elt) {
        return [ elt, Number(elt.pop2010) ];
      });
      ctx.citySelector = new WeightedRandomSelector(cities);
      log.write('retrieveCities done');
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

  log.write('contriveIpAddress');
  if ( ! context.citySelector) {
    return context;
  }

  city = context.citySelector.select()[0],
  ql = 'select * where city=\'' + city.name + '\'' ;
  options = {
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
      log.write('contriveIpAddress, error: ' + e);
    }
    else {
      type = Object.prototype.toString.call(body);
      body = (type === '[object String]') ? JSON.parse(body) : body;
      if (body.entities && body.entities[0]) {
        context.job.contrivedIp = chooseRandomIpFromRecord(body.entities[0]);
        context.job.chosenCity = city.name;
        log.write('contriveIpAddress: ' + city.name + ' ' + context.job.contrivedIp);
      }
      else {
        log.write('contriveIpAddress: no body entities');
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
  var src = '(function (', c = 0, f, values = [], result,
      extractContext = ctx.state.extracts;

  // log.write('eval: ' + code);
  // log.write('ctx: ' + JSON.stringify(extractContext, null, 2));
  // TODO: cache this?
  // create the fn signature
  for (var prop in extractContext) {
    if (extractContext.hasOwnProperty(prop)) {
      if (c > 0) {src += ',';}
      src += prop;
      values.push(extractContext[prop]);
      c++;
    }
  }
  src += '){return ' + code + ';})';
  log.write('evalTemplate: ' + src);
  try {
    f = eval(src);
    // call the function with all its arguments
    result = f.apply(null, values);
  }
  catch (exc1) {
    r = null;
  }
  return result;
}

// expandEmbeddedTemplates: walks through an object, replacing each embedded
// template as appropriate. This is used to expand a templated payload.
// function expandEmbeddedTemplates(ctx, obj) {
//   var re1 = new RegExp('(.*)(?!{{){([^{}]+)(?!}})}(.*)'),
//       re2 = new RegExp('(.*){{([^{}]+)}}(.*)'), // for double-curlies
//       newObj = {}, match, newVal,
//       type = Object.prototype.toString.call(obj), x, i;
//   if (type === "[object Array]") {
//     // iterate
//     newObj = [];
//     for (i=0; i<obj.length; i++) {
//       x = expandEmbeddedTemplates(ctx, obj[i]);
//       newObj.push(x);
//     }
//   }
//   else if (type === "[object Object]") {
//     for (var prop in obj) {
//       if (obj.hasOwnProperty(prop)) {
//         type = Object.prototype.toString.call(obj[prop]);
//         if (type === "[object String]") {
//           // replace all templates in the string
//           for (newVal = obj[prop], match = re1.exec(newVal); match; match = re1.exec(newVal)){
//             newVal = match[1] + evalTemplate(ctx, match[2]) + match[3];
//           }
//           for (match = re2.exec(newVal); match; match = re2.exec(newVal)){
//             newVal = match[1] + '{' + match[2] + '}' + match[3];
//           }
//
//           newObj[prop] = newVal;
//         }
//         else if (type === "[object Array]") {
//           // iterate
//           newObj[prop] = [];
//           for (i=0; i<obj[prop].length; i++) {
//             x = expandEmbeddedTemplates(ctx, obj[prop][i]);
//             newObj[prop].push(x);
//           }
//         }
//         else if (type === "[object Object]") {
//           // recurse
//           newObj[prop] = expandEmbeddedTemplates(ctx, obj[prop]);
//         }
//         else {
//           // no replacement
//           newObj[prop] = obj[prop];
//         }
//       }
//     }
//   }
//   return newObj;
// }

// function expandEmbeddedTemplates(ctx, obj) {
//   var newObj,
//       type = Object.prototype.toString.call(obj), x, i;
//
//   function replaceTemplatesInString(s) {
//     var newVal, match,
//       re1 = new RegExp('(.*)(?!{{){([^{}]+)(?!}})}(.*)'),
//       re2 = new RegExp('(.*){{([^{}]+)}}(.*)'); // for double-curlies
//     for (newVal = s, match = re1.exec(newVal); match; match = re1.exec(newVal)){
//       newVal = match[1] + evalTemplate(ctx, match[2]) + match[3];
//     }
//     for (match = re2.exec(newVal); match; match = re2.exec(newVal)){
//       newVal = match[1] + '{' + match[2] + '}' + match[3];
//     }
//     return newVal;
//   }
//
//   if (type === "[object String]") {
//     newObj = replaceTemplatesInString(obj);
//   }
//   else if (type === "[object Array]") {
//     // iterate
//     newObj = [];
//     for (i=0; i<obj.length; i++) {
//       x = expandEmbeddedTemplates(ctx, obj[i]);
//       newObj.push(x);
//     }
//   }
//   else if (type === "[object Object]") {
//     newObj = {};
//     Object.keys(obj).forEach(function(prop){
//       var type = Object.prototype.toString.call(obj[prop]);
//         if (type === "[object String]") {
//           // replace all templates in a string
//           newObj[prop] = replaceTemplatesInString(obj[prop]);
//         }
//         else if (type === "[object Object]" || type === "[object Array]") {
//           // recurse
//           newObj[prop] = expandEmbeddedTemplates(ctx, obj[prop]);
//         }
//         else {
//           // no replacement
//           newObj[prop] = obj[prop];
//         }
//       });
//   }
//   return newObj;
// }



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
      reqOptions = { headers: headers},
      p = q.resolve(context);

  log.write(job.id + ' invokeOneRequest');

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
          log.write('eval: ' + imp.fn);
          imp.compiledFn = eval('(' + imp.fn + ')');
        }
        log.write(imp.description);
        // actually invoke the compiled fn
        try {
          ctx.state.extracts[imp.valueRef] = imp.compiledFn(ctx.state.extracts);
          log.write(imp.valueRef + ':=' + JSON.stringify(ctx.state.extracts[imp.valueRef]));
        }
        catch (exc1) {
          ctx.state.extracts[imp.valueRef] = null;
          log.write(imp.valueRef + ':= null (exception: ' + exc1 + ')');
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
        v = (v) ? (match[1] + v + match[3]) : null;
      }
      url = v ? v : "";
      return ctx;
    });
  }

  // 4. conditionally set additional headers for this request.
  if (req.headers) {
    p = p.then(function(ctx) {
      var match, value;
      for (var hdr in req.headers) {
        if (req.headers.hasOwnProperty(hdr)) {
          value = req.headers[hdr];
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
          log.write('Header ' + hdr + ': ' + maskToken(value) );
          reqOptions.headers[hdr.toLowerCase()] = value;
        }
      }
      return ctx;
    });
  }

  // 5. actually do the http call, and run the subsequent extracts
  p = p.then(function(ctx) {
    var deferredPromise = q.defer(),
        city,
        method = (req.method)? req.method.toLowerCase() : "get",
        respCallback = function(e, httpResp, body) {
          var i, L, ex, obj;
          if (e) {
            log.write(e);
          }
          else {
            log.write(httpResp.statusCode);
            if (req.extracts && req.extracts.length>0) {
              // cache the eval'd extract functions
              // if ( ! ctx.state.extracts) { ctx.state.extracts = {}; }
              for (i=0, L=req.extracts.length; i<L; i++) {
                ex = req.extracts[i];
                if ( ! ex.compiledFn) {
                  log.write('eval: ' + ex.fn);
                  ex.compiledFn = eval('(' + ex.fn + ')');
                }
                log.write(ex.description);
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
                  log.write(ex.valueRef + ':=' + JSON.stringify(ctx.state.extracts[ex.valueRef]));
                }
                catch (exc1) {
                  ctx.state.extracts[ex.valueRef] = null;
                  log.write(ex.valueRef + ':= null (exception: ' + exc1 + ')');
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
      log.write('no contrived IP');
    }

    log.write(method + ' ' + reqOptions.uri);

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
  return { job: ctx};
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
    log.write('++ Iteration');
    return q.resolve(context).then(runJob);
  }
  if ((typeof state.I[state.sequence] === "undefined") && state.sequence < state.S) {
    log.write('runJob: resolveNumeric('+ job.sequences[state.sequence].iterations +')');
    state.I[state.sequence] = resolveNumeric(job.sequences[state.sequence].iterations);
    log.write('runJob: state.I[' + state.sequence + ']= ' + state.I[state.sequence] );
  }
  if (state.iteration >= state.I[state.sequence]) {
    state.iteration = 0;
    state.sequence++;
    log.write('++ Sequence');
    return q.resolve(context).then(runJob, trackFailure);
  }
  if (state.sequence === state.S) {
    // terminate
    state.sequence = 0;
    return q(context).then(setWakeup, trackFailure);
  }

  // Need to verify that all properties are valid.
  // Sometimes they are not due to intermittent data retrieval errors.
  // in which case, just sleep and try again at next interval.
  if ( ! (job.sequences && job.sequences.length && (state.sequence < job.sequences.length) &&
          job.sequences[state.sequence].requests && job.sequences[state.sequence].requests.length)) {
            return q.resolve(context)
      .then(function(c){
        log.write('state error');
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
  log.write('R ' + (state.request + 1) + '/' + state.R +
            ' I ' + (state.iteration + 1) + '/' + state.I[state.sequence] +
            ' S ' + (state.sequence + 1) + '/' + state.S);


  // if we arrive here we're doing a request, implies an async call
  p = q.resolve(context);

  // generate a random IP address if necessary
  if (state.request === 0 && state.iteration === 0 && state.sequence === 0) {
    if (!job.hasOwnProperty('geoDistribution') || job.geoDistribution == 1) {
      if (!context.citySelector) {
        p = p.then(retrieveCities);
      }
      p = p.then(contriveIpAddress);
    }
    else {
      p = p.then(function(ctx){
        log.write('no geo distribution');
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


function initializeJobRunAndKickoff(context) {
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

  context.state = newState;

  return q(context)
    .then(runJob);
}



function setWakeup(context) {
  var job = context.job,
      jobid = job.id,
      now = new Date(),
      currentHour = now.getHours(),
      currentDayOfWeek = now.getDay(),
      durationOfLastRun = now - context.state.start,
      runsPerHour, sleepTimeInMs;

  log.write('setWakeup');

  // compute and validate the sleep time
  if (currentHour < 0 || currentHour > 23) { currentHour = 0;}
  runsPerHour = (job.invocationsPerHour &&
                 job.invocationsPerHour[currentHour]) ?
    job.invocationsPerHour[currentHour] : defaultRunsPerHour;

  // variation by day of week
  if (job.variationByDayOfWeek &&
                 job.variationByDayOfWeek.length &&
                 job.variationByDayOfWeek.length == 7 &&
                 job.variationByDayOfWeek[currentDayOfWeek] &&
                 job.variationByDayOfWeek[currentDayOfWeek] > 0 &&
                 job.variationByDayOfWeek[currentDayOfWeek] <= 2) {
    runsPerHour = Math.floor(runsPerHour * job.variationByDayOfWeek[currentDayOfWeek]);
  }

  log.write(jobid + ' duration of last run: ' + durationOfLastRun);
  sleepTimeInMs =
    Math.floor(oneHourInMs / runsPerHour) - durationOfLastRun;

  if (sleepTimeInMs < minSleepTimeInMs) { sleepTimeInMs = minSleepTimeInMs; }

  log.write(jobid + ' ' + runsPerHour + ' runs per hour');
  log.write(jobid + ' sleep ' + sleepTimeInMs + 'ms, wake at ' +  new Date(now.valueOf() + sleepTimeInMs).toString().substr(16, 8));

    setTimeout(function () {
      var startMoment = new Date().valueOf();
      log.write(jobid + ' awake');
      q({job:job, citySelector : context.citySelector})
        .then(initializeJobRunAndKickoff)
        .done(function(){},
              function(e){
                log.write('unhandled error: ' + e);
                log.write(e.stack);
              });
    }, sleepTimeInMs);
  return context;
}


// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

function usage() {
  console.log("runLoad-cli.js - runs artificial load on an API");
  console.log("usage:");
  console.log("   node ./runLoad-cli.js  <job-definition-filename>");
  console.log();
}

function main(args) {
  var fs = require('fs'), model;
  try {
    args.forEach(function(arg) {
      if ((arg === '-?') || (arg === '-h')) {
        usage();
        process.exit(0);
      }
      else if (fs.existsSync(arg)) {
        model = JSON.parse(fs.readFileSync(arg, "utf8"));
        q(model)
          .then(reportModel)
          .then(setInitialContext)
          .then(initializeJobRunAndKickoff)
          .done(function() {}, function(e) {
            log.write('unhandled error: ' + e);
            log.write(e.stack);
          });
      }
    });
  }
  catch (exc1) {
    console.log("Exception:" + exc1);
    console.log(exc1.stack);
  }
}

main(process.argv.slice(2));
