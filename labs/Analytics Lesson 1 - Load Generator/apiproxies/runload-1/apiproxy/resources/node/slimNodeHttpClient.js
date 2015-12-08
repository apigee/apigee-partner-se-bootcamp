#! /usr/local/bin/node
/*jslint node:true */

// slimNodeHttpClient.js
// ------------------------------------------------------------------
//
// Development for a very slim, minimialistic http client for node.js.
// With promises?  Derived from https://github.com/mikeal/request.
// Omigosh this is complicated.
//
// to use this you may need to:
//
//     npm install url util stream http https json-stringify-safe
//
// created: Fri Aug  2 21:21:03 2013
// last saved: <2014-May-30 06:56:01>
// ------------------------------------------------------------------
//
// Copyright © 2013 Dino Chiesa
// All rights reserved.
//
// ------------------------------------------------------------------

var http = require('http'),
    https = require('https'),
    stream = require('stream'),
    url = require('url'),
    util = require('util'),
    safeStringify = require('json-stringify-safe'),
    isUrl = new RegExp('^https?://[-a-z0-9\\.]+($|/)', 'i'),

    debug = (/\brequest\b/.test(process.env.NODE_DEBUG)) ?
  function() { console.error('REQUEST %s', util.format.apply(util, arguments)); } :
  function() {};


function copy (obj) {
  var o = {};
  Object.keys(obj).forEach(function (i) {
    o[i] = obj[i];
  });
  return o;
}


function HttpClientRequest(options) {
  stream.Stream.call(this);
  this.readable = true;
  this.writable = true;
  if (typeof options === 'string') {
    options = {uri:options};
  }
  var reserved = Object.keys(HttpClientRequest.prototype);
  for (var i in options) {
    if (reserved.indexOf(i) === -1) {
      this[i] = options[i];
    }
    else {
      if (typeof options[i] === 'function') {
        delete options[i];
      }
    }
  }
  this.init(options);
}

util.inherits(HttpClientRequest, stream.Stream);


HttpClientRequest.prototype.init = function (options) {
  var self = this;
  if (!options) options = {};

  if (!self.method) {self.method = options.method || 'GET';}

  debug(options);

  // Protect against double callback
  if (!self._callback && self.callback) {
    self._callback = self.callback;
    self.callback = function () {
      if (self._callbackCalled) return; // Print a warning maybe?
      self._callbackCalled = true;
      self._callback.apply(self, arguments);
    };
    self.on('error', self.callback.bind());
    self.on('complete', self.callback.bind(self, null));
  }

  if (!self.uri) {
    // this will throw if unhandled but is handleable when in a redirect
    return self.emit('error', new Error("options.uri is a required argument"));
  }

  if (typeof self.uri == "string") {self.uri = url.parse(self.uri);}

  if (!self.uri.pathname) {self.uri.pathname = '/';}

  if (!self.uri.host) {
    // Invalid URI: it may generate lot of bad errors, like "TypeError:
    // Cannot call method 'indexOf' of undefined" in CookieJar Detect
    // and reject it as soon as possible
    self.emit('error', new Error('Invalid URI "' + url.format(self.uri) + '"'));
    return;
  }

  self._redirectsFollowed = self._redirectsFollowed || 0;
  self.maxRedirects = (self.maxRedirects !== undefined) ? self.maxRedirects : 10;
  self.followRedirect = (self.followRedirect !== undefined) ? self.followRedirect : false;
  self.followAllRedirects = (self.followAllRedirects !== undefined) ? self.followAllRedirects : false;
  if (self.followRedirect || self.followAllRedirects) {
    self.redirects = self.redirects || [];
  }

  self.headers = self.headers ? copy(self.headers) : {};

  self.setHost = false;
  if (!self.hasHeader('host')) {
    self.setHeader('host', self.uri.hostname);
    if (self.uri.port) {
      if ( !(self.uri.port === 80 && self.uri.protocol === 'http:') &&
           !(self.uri.port === 443 && self.uri.protocol === 'https:') )
        self.setHeader('host', self.getHeader('host') + (':'+self.uri.port) );
    }
    self.setHost = true;
  }

  if (!self.uri.port) {
    if (self.uri.protocol == 'http:') {self.uri.port = 80;}
    else if (self.uri.protocol == 'https:') {self.uri.port = 443;}
  }

  self.port = self.uri.port;
  self.host = self.uri.hostname;

  self.clientErrorHandler = function (error) {
    if (self._aborted) {return;}

    if (self.req && self.req._reusedSocket && error.code === 'ECONNRESET' &&
        self.agent.addRequestNoreuse) {
      self.agent = { addRequest: self.agent.addRequestNoreuse.bind(self.agent) };
      self.start();
      self.req.end();
      return;
    }
    if (self.timeout && self.timeoutTimer) {
      clearTimeout(self.timeoutTimer);
      self.timeoutTimer = null;
    }
    self.emit('error', error);
  };

  self._parserErrorHandler = function (error) {
    if (this.res) {
      if (this.res.request) {
        this.res.request.emit('error', error);
      } else {
        this.res.emit('error', error);
      }
    } else {
      this._httpMessage.emit('error', error);
    }
  };


  self.path = (self.uri.path)? self.uri.path : self.uri.pathname + (self.uri.search || "");

  if (self.path.length === 0) {self.path = '/';}

  if (options.json) {
    self.json(options.json);
  }
  // else if (options.multipart) {
  //   self.boundary = uuid();
  //   self.multipart(options.multipart);
  // }

  if (self.body) {
    var length = 0;
    if (!Buffer.isBuffer(self.body)) {
      if (Array.isArray(self.body)) {
        for (var i = 0; i < self.body.length; i++) {
          length += self.body[i].length;
        }
      } else {
        self.body = new Buffer(self.body);
        length = self.body.length;
      }
    } else {
      length = self.body.length;
    }
    if (length) {
      if (!self.hasHeader('content-length')) self.setHeader('content-length', length);
    } else {
      throw new Error('Argument error, options.body.');
    }
  }

  var protocol = self.uri.protocol,
  defaultModules = {'http:':http, 'https:':https};

  self.httpModule = defaultModules[protocol];

  process.nextTick(function () {
    if (self._aborted) {return;}

    if (self._form) {
      self.setHeaders(self._form.getHeaders());
      self._form.pipe(self);
    }

    if (self.body) {
      if (Array.isArray(self.body)) {
        self.body.forEach(function (part) {
          self.write(part);
        });
      } else {
        self.write(self.body);
      }
      self.end();
    }
    else if (!self.src) {
      if (self.method !== 'GET' && typeof self.method !== 'undefined') {
        self.setHeader('content-length', 0);
      }
      self.end();
    }
  });
};



// Safe toJSON

function getSafe (self, uuid) {
  var safe, recurse = [], i, attrs;

  if (typeof self === 'object' || typeof self === 'function') { safe = {};}
  if (Array.isArray(self)) {safe = []; }

  Object.defineProperty(self, uuid, {});

  attrs = Object.keys(self).filter(function (i) {
    if (i === uuid) return false;
    if ( (typeof self[i] !== 'object' && typeof self[i] !== 'function') || self[i] === null) return true;
    return !(Object.getOwnPropertyDescriptor(self[i], uuid));
  });


  for (i=0;i<attrs.length;i++) {
    if ( (typeof self[attrs[i]] !== 'object' && typeof self[attrs[i]] !== 'function') ||
          self[attrs[i]] === null
        ) {
      safe[attrs[i]] = self[attrs[i]];
    } else {
      recurse.push(attrs[i]);
      Object.defineProperty(self[attrs[i]], uuid, {});
    }
  }

  for (i=0;i<recurse.length;i++) {
    safe[recurse[i]] = getSafe(self[recurse[i]], uuid);
  }

  return safe;
}
function toJSON () {
  return getSafe(this, '__' + (((1+Math.random())*0x10000)|0).toString(16));
}

HttpClientRequest.prototype.start = function () {
  // start() is called once we are ready to send the outgoing HTTP request.
  // this is usually called on the first write(), end() or on nextTick()
  var self = this;

  if (self._aborted) return;

  self._started = true;
  self.method = self.method || 'GET';
  self.href = self.uri.href;

  if (self.src && self.src.stat && self.src.stat.size && !self.hasHeader('content-length')) {
    self.setHeader('content-length', self.src.stat.size);
  }
  if (self._aws) {
    self.aws(self._aws, true);
  }

  // We have a method named auth, which is completely different from the http.request
  // auth option.  If we don't remove it, we're gonna have a bad time.
  var reqOptions = copy(self);
  delete reqOptions.auth;

  debug('make request', self.uri.href);

  self.req = self.httpModule.request(reqOptions, self.onResponse.bind(self));

  if (self.timeout && !self.timeoutTimer) {
    self.timeoutTimer = setTimeout(function () {
      var e = new Error("ETIMEDOUT");
      self.req.abort();
      e.code = "ETIMEDOUT";
      self.emit("error", e);
    }, self.timeout);

    // Set additional timeout on socket - in case if remote
    // server freeze after sending headers
    if (self.req.setTimeout) { // only works on node 0.6+
      self.req.setTimeout(self.timeout, function () {
        if (self.req) {
          var e = new Error("ESOCKETTIMEDOUT");
          self.req.abort();
          e.code = "ESOCKETTIMEDOUT";
          self.emit("error", e);
        }
      });
    }
  }

  self.req.on('error', self.clientErrorHandler);
  self.req.on('drain', function() {
     self.emit('drain');
  });
  self.on('end', function() {
    if ( self.req.connection ) self.req.connection.removeListener('error', self._parserErrorHandler);
  });
  self.emit('request', self.req);
};


HttpClientRequest.prototype.onResponse = function (response) {
  var self = this;
  response.on('end', function() { });

  if (response.connection.listeners('error').indexOf(self._parserErrorHandler) === -1) {
    response.connection.once('error', self._parserErrorHandler);
  }

  if (self._aborted) {
    debug('aborted', self.uri.href);
    response.resume();
    return;
  }

  if (self._paused) response.pause();
  else response.resume();

  self.response = response;
  response.request = self;
  response.toJSON = toJSON;

  // XXX This is different on 0.10, because SSL is strict by default
  if (self.httpModule === https &&
      self.strictSSL &&
      !response.client.authorized) {
    debug('strict ssl error', self.uri.href);
    var sslErr = response.client.authorizationError;
    self.emit('error', new Error('SSL Error: '+ sslErr));
    return;
  }

  if (self.setHost && self.hasHeader('host')) delete self.headers[self.hasHeader('host')];
  if (self.timeout && self.timeoutTimer) {
    clearTimeout(self.timeoutTimer);
    self.timeoutTimer = null;
  }

  var addCookie = function (cookie) {
    if (self._jar){
      if(self._jar.add){
        self._jar.add(new Cookie(cookie));
      }
      else cookieJar.add(new Cookie(cookie));
    }
  };

  if (hasHeader('set-cookie', response.headers) && (!self._disableCookies)) {
    var headerName = hasHeader('set-cookie', response.headers);
    if (Array.isArray(response.headers[headerName])) {
      response.headers[headerName].forEach(addCookie);
}
    else {
     addCookie(response.headers[headerName]);
    }
  }

  var redirectTo = null;
  if (response.statusCode >= 300 && response.statusCode < 400 && hasHeader('location', response.headers)) {
    var location = response.headers[hasHeader('location', response.headers)];
    debug('redirect', location);

    if (self.followAllRedirects) {
      redirectTo = location;
    }
    else if (self.followRedirect) {
      switch (self.method) {
        case 'PATCH':
        case 'PUT':
        case 'POST':
        case 'DELETE':
          // Do not follow redirects
          break;
        default:
          redirectTo = location;
          break;
      }
    }
  }
  else if (response.statusCode == 401 && self._hasAuth && !self._sentAuth) {
    var authHeader = response.headers[hasHeader('www-authenticate', response.headers)],
        authVerb = authHeader && authHeader.split(' ')[0],
        matches, challenge, i;
    debug('reauth', authVerb);

    switch (authVerb) {
      case 'Basic':
        self.auth(self._user, self._pass, true);
        redirectTo = self.uri;
        break;

      case 'Digest':
        // TODO: More complete implementation of RFC 2617.  For reference:
        // http://tools.ietf.org/html/rfc2617#section-3
        // https://github.com/bagder/curl/blob/master/lib/http_digest.c

        matches = authHeader.match(new RegExp('([a-z0-9_-]+)="([^"]+)"', 'gi'));
        challenge = {};

        for (i = 0; i < matches.length; i++) {
          var eqPos = matches[i].indexOf('=');
          var key = matches[i].substring(0, eqPos);
          var quotedValue = matches[i].substring(eqPos + 1);
          challenge[key] = quotedValue.substring(1, quotedValue.length - 1);
        }

        var ha1 = md5(self._user + ':' + challenge.realm + ':' + self._pass);
        var ha2 = md5(self.method + ':' + self.uri.path);
        var digestResponse = md5(ha1 + ':' + challenge.nonce + ':1::auth:' + ha2);
        var authValues = {
          username: self._user,
          realm: challenge.realm,
          nonce: challenge.nonce,
          uri: self.uri.path,
          qop: challenge.qop,
          response: digestResponse,
          nc: 1,
          cnonce: ''
        };

        authHeader = [];
        for (var k in authValues) {
          authHeader.push(k + '="' + authValues[k] + '"');
        }
        authHeader = 'Digest ' + authHeader.join(', ');
        self.setHeader('authorization', authHeader);
        self._sentAuth = true;

        redirectTo = self.uri;
        break;
    }
  }

  if (redirectTo) {
    debug('redirect to', redirectTo);

    // ignore any potential response body.  it cannot possibly be useful
    // to us at this point.
    if (self._paused) response.resume();

    if (self._redirectsFollowed >= self.maxRedirects) {
      self.emit('error', new Error("Exceeded maxRedirects. Probably stuck in a redirect loop "+self.uri.href));
      return;
    }
    self._redirectsFollowed += 1;

    if (!isUrl.test(redirectTo)) {
      redirectTo = url.resolve(self.uri.href, redirectTo);
    }

    var uriPrev = self.uri;
    self.uri = url.parse(redirectTo);

    // handle the case where we change protocol from https to http or vice versa
    if (self.uri.protocol !== uriPrev.protocol) {
      self._updateProtocol();
    }

    self.redirects.push(
      { statusCode : response.statusCode, redirectUri: redirectTo }
    );
    if (self.followAllRedirects && response.statusCode != 401) self.method = 'GET'
    // self.method = 'GET' // Force all redirects to use GET || commented out fixes #215
    delete self.src;
    delete self.req;
    delete self.agent;
    delete self._started;
    if (response.statusCode != 401) {
      // Remove parameters from the previous response, unless this is the second request
      // for a server that requires digest authentication.
      delete self.body;
      delete self._form;
      if (self.headers) {
        if (self.hasHeader('host')) delete self.headers[self.hasHeader('host')];
        if (self.hasHeader('content-type')) delete self.headers[self.hasHeader('content-type')];
        if (self.hasHeader('content-length')) delete self.headers[self.hasHeader('content-length')];
      }
    }

    self.emit('redirect');

    self.init();
    return; // Ignore the rest of the response
  }
  else {
    self._redirectsFollowed = self._redirectsFollowed || 0;
    // Be a good stream and emit end when the response is finished.
    // Hack to emit end on close because of a core bug that never fires end
    response.on('close', function () {
      if (!self._ended) self.response.emit('end');
    });

    if (self.encoding) {
      if (self.dests.length !== 0) {
        console.error("Ignoring encoding parameter as this stream is being piped to another stream which makes the encoding option invalid.");
      } else {
        response.setEncoding(self.encoding);
      }
    }

    self.emit('response', response);

    if (self.dests && self.dests.length){
      self.dests.forEach(function (dest) {
        self.pipeDest(dest);
      });
    }

    response.on("data", function (chunk) {
      self._destdata = true;
      self.emit("data", chunk);
    });
    response.on("end", function (chunk) {
      self._ended = true;
      self.emit("end", chunk);
    });
    response.on("close", function () {self.emit("close");});

    if (self.callback) {
      debug('have callback');
      var buffer = [], bodyLen = 0;
      self.on("data", function (chunk) {
        buffer.push(chunk);
        bodyLen += chunk.length;
      });
      self.on("end", function () {
        debug('end event', self.uri.href);
        if (self._aborted) {
          debug('aborted', self.uri.href);
          return;
        }

        if (buffer.length && Buffer.isBuffer(buffer[0])) {
          debug('has body', self.uri.href, bodyLen);
          var body = new Buffer(bodyLen), i = 0;
          buffer.forEach(function (chunk) {
            chunk.copy(body, i, 0, chunk.length);
            i += chunk.length;
          });
          if (self.encoding === null) {
            response.body = body;
          }
          else {
            response.body = body.toString(self.encoding);
          }
        }
        else if (buffer.length) {
          // The UTF8 BOM [0xEF,0xBB,0xBF] is converted to [0xFE,0xFF] in the JS UTC16/UCS2 representation.
          // Strip this value out when the encoding is set to 'utf8', as upstream consumers won't expect it and it breaks JSON.parse().
          if (self.encoding === 'utf8' && buffer[0].length > 0 && buffer[0][0] === "\uFEFF") {
            buffer[0] = buffer[0].substring(1);
          }
          response.body = buffer.join('');
        }

        if (self._json) {
          try {
            response.body = JSON.parse(response.body);
          } catch (e) {}
        }
        debug('emit complete', self.uri.href);
        if(response.body === undefined && !self._json) {
          response.body = "";
        }
        self.emit('complete', response, response.body);
      });
    }
    //if no callback
    else {
      self.on("end", function () {
        if (self._aborted) {
          debug('aborted', self.uri.href);
          return;
        }
        self.emit('complete', response);
      });
    }
  }
  debug('finish onresponse function', self.uri.href);
};




HttpClientRequest.prototype.write = function () {
  if (!this._started) {this.start();}
  return this.req.write.apply(this.req, arguments);
};

HttpClientRequest.prototype.end = function (chunk) {
  if (chunk) {this.write(chunk);}
  if (!this._started) {this.start();}
  this.req.end();
};

// Composable API
HttpClientRequest.prototype.setHeader = function (name, value, clobber) {
  var hasHeader = this.hasHeader(name);
  if (clobber === undefined) {clobber = true;}
  if (clobber || !hasHeader) {this.headers[name] = value;}
  else {this.headers[hasHeader] += ',' + value;}
  return this;
};

HttpClientRequest.prototype.setHeaders = function (headers) {
  for (var i in headers) {this.setHeader(i, headers[i]);}
  return this;
};

HttpClientRequest.prototype.getHeader = function (name, headers) {
  var result, re, match;
  if (!headers) {headers = this.headers;}
  Object.keys(headers).forEach(function (key) {
    if ( ! result) {
      re = new RegExp('^' + name + '$', 'i');
      match = key.match(re);
      if (match) result = headers[key];
    }
  });
  return result;
};

HttpClientRequest.prototype.hasHeader = function (name, headers) {
  var lheaders;
  headers = Object.keys(headers || this.headers);
  lheaders = headers.map(function (h) {return h.toLowerCase();});
  name = name.toLowerCase();
  for (var i=0;i<lheaders.length;i++) {
    if (lheaders[i] === name) {return headers[i];}
  }
  return false;
};


HttpClientRequest.prototype.json = function (val) {
  var self = this;
  if (!self.hasHeader('accept')) {self.setHeader('accept', 'application/json');}
  self._json = true;
  self.body = safeStringify(val);
  self.setHeader('content-type', 'application/json');
  return this;
};

var hasHeader = HttpClientRequest.prototype.hasHeader;

// =======================================================

function request(uri, options, callback) {
  if (typeof uri === 'undefined') {
    throw new Error('undefined is not a valid uri or options object.');
  }
  if ((typeof options === 'function') && !callback) {callback = options;}
  if (options && typeof options === 'object') {
    options.uri = uri;
  }
  else if (typeof uri === 'string') {
    options = {uri:uri};
  }
  else {
    options = uri;
  }

  options = copy(options);

  if (callback) {options.callback = callback;}

  var r = new HttpClientRequest(options);
  return r;
}

// organize params for patch, post, put, head, del
function initParams(uri, options, callback) {
  if ((typeof options === 'function') && !callback) {callback = options;}
  if (options && typeof options === 'object') {
    options.uri = uri;
  }
  else if (typeof uri === 'string') {
    options = {uri:uri};
  }
  else {
    options = uri;
    uri = options.uri;
  }
  return { uri: uri, options: options, callback: callback };
}


request.get = request;
request.post = function (uri, options, callback) {
  var params = initParams(uri, options, callback);
  params.options.method = 'POST';
  return request(params.uri || null, params.options, params.callback);
};
request.put = function (uri, options, callback) {
  var params = initParams(uri, options, callback);
  params.options.method = 'PUT';
  return request(params.uri || null, params.options, params.callback);
};
request.del = function (uri, options, callback) {
  var params = initParams(uri, options, callback);
  params.options.method = 'DELETE';
  return request(params.uri || null, params.options, params.callback);
};


//=========================================================

module.exports = request;
