runload-proxy
==============

Monday, 29 June 2015, 23:02

This is an Apigee Edge proxy that lets you generate and run load against
a different API.

The API endpoints to invoke, as well as the headers, query params, and
payloads to send, are all defined in a job file, which is in json
format.

The tool to run the load is a nodejs script, runLoad.js. This is set as
the "target" of this API Proxy.  When you deploy this API proxy, the
load begins to run.  It runs until you undeploy, or tell it to stop.
More on that later. 


Pre-requisites
========================

Apigee Edge . 



Usage
========================

To use:

  1. in the apiproxy/resources/node directory, 
     edit the model.json file to specify the job to run. 


  3. packup the bundle and deploy it.  You can use the Edge UI for this
     purpose , or a tool like pushapi from
     https://github.com/carloseberhardt/apiploy, or your own tool.


The process runs forever. It invokes the API, maybe sleeps a little, and then
does it again.  To stop it, you can send a /control action=stop request to the
proxy. (see later in this readme.)  Or, undeploy the proxy. 



Defining Jobs
========================

To define a job, you need to write a JSON file.  Here's a very simple example. 

    {
      "name": "job1",
      "description": "Login to the Sonoa service",
      "defaultProperties": {
        "scheme": "https",
        "host": "api.sonoasystems.net",
        "port": 9001,
        "headers" : {
          "Accept" : "application/json",
          "content-type" : "application/json"
        }
      },

      "initialContext" : {
          "username":"Chris", "password":"Haljous#"
      },

      "sequences" : [{
        "description" : "login",
        "iterations" : 1,
        "requests" : [ {
          "url" : "/v1/login",
          "method" : "post",
          "payload" : {
            "username":"{username}",
            "password":"{password}"
          }
        }]
      }]
    }

In English, what this says is: the job will invoke urls on the server at
https://api.sonoasystems.net:9001. (Don't be confused: This is a fake
endpoint, just for example purposes.) It will send HTTP headers (Accept
and content-type) that indicate the request is sending and receiving
application/json. There will be just one sequence of requests, and in
that sequence just one request. That request will POST to the url path
/v1/login . It will provide as a payload, a json object containing a
username and password. The values for the username and password are
obtained from the job context.  

All the properties in the job definition have case-sensitive names. 

Running this job would exercise the login function of a fictitious
sonoasystems API.  The runload proxy defaults to run the job once per
minute, forever.

The initialContext property on the job provides the initial set of
context data items. In this case, the job context gets hard-coded login
credentials.  These values will be accessible via "templates" that you
can apply to headers or urls or payloads on requests. In this example,
the json payload gets its values from the context. If you wanted to use a
context value to construct a url path, you could do it with a template,
this way:

   /v1/test/{href} 

runload will replace {href} with the value of the href property from the
context.

The url property in the request specifies a relative or absolute URL. If
you specify a relative url which begins with a slash, then the scheme
and domain name from the "job defaults" will be prepended to the url
before it is used.  If you specify a fully qualified url, which begins
with a scheme (http or https), then the "job defaults" values are ignored
for that request.

Notes on the properties in that job description: 

name

    This is used in the job logging output, and also for job control
    inside Apigee Edge. The script will access the Edge cache, using a
    key name which is derived from this job name.  Therefore, use a
    unique name, a string, no spaces. (don't use 'job1')

description

    Used for diagnostic purposes only. The script emits this description
    when launching the job. 

defaultProperties

    These are all obvious. There are no other default properties other
    than those shown in the example. 


---

The payload can be a complex object, in which case the outbound message
will be implicitly sent with content-type = application/json.  Or it can
be a simple string, in which case the outbound message will be sent with
application/x-www-form-urlencoded.

Example of the former: 

          "requests" : [ {
              "method" : "post",
              "url" : "/oauth/client_credentials/accesstoken",
              "headers" : {
                "accept" : "application/json",
              },
              "payload": {
                "grant_type" : "client_credentials",
                "client_id" : "{client_id}",
                "client_secret" : "{client_secret}"
              },
              ....

Example of the latter: 

          "requests" : [ {
              "method" : "post",
              "url" : "/oauth/client_credentials/accesstoken",
              "headers" : {
                "accept" : "application/json",
              },
              "payload": "grant_type=client_credentials&client_id={client_id}&client_secret={client_secret}",
              ....




A More Complex Example
--------------------------------

Consider this job definition:

    {
      "name": "job2",
      "description": "Exercise APIs exposed by Sonoa",
      "geoDistribution": 1,
      "defaultProperties": {
        "scheme": "https",
        "host": "api.sonoasystems.net",
        "headers" : {
          "Accept" : "application/json"
        }
      },

      "initialContext" : {
        "something" : "a-value-here",
        "prop2" : "another-value"
      },

      "invocationsPerHour" : [
          44, 35, 40, 36, 27, 40, 40, 54,
          57, 62, 54, 61, 73, 70, 53, 50,
          47, 62, 74, 88, 83, 77, 70, 51
      ],

      "sequences" : [
        {
          "description" : "login",
          "iterations" : 1,
          "requests" : [ {
            "url" : "/v1/ictrl/login",
            "method" : "post",
            "headers" : {
              "content-type" : "application/json"
            },
            "payload" : {
              "username":"test",
              "password":"password"
            }, 
            "delayBefore" : 0,
            "extracts" : [
              {
                "description" : "extract the login token",
                "fn" : "function(obj) {return obj.login.token;}",
                "valueRef" : "oauth_bearer_token"
              }, 
              {
                "description" : "extract the user and site hrefs",
                "fn" : "function(obj) {var re1=new RegExp('^/[^/]+/[^/]+(/.*)$'), m1,m2; m1=re1.exec(obj.login.user.href); m2=re1.exec(obj.login.site.href); return {user:m1[1],site:m2[1]};}",
                "valueRef" : "hrefs"
              }
            ]
          }]
        },
        {
          "description" : "query user item (self)",
          "iterations" : "Math.floor(Math.random() * 5) + 4",
          "delayBetweenIterations" : "Math.floor(Math.random() * 300) + 120",
          "requests" : [ 
            {
              "url" : "/v1/ictrl/{hrefs.user}",
              "method" : "get",
              "headers" : {
                "authorization" : "Bearer {oauth_bearer_token}"
              }, 
              "delayBefore" : 10
            },
            {
              "description" : "retrieve the site",
              "url" : "/v1/ictrl/{hrefs.site}",
              "method" : "get",
              "headers" : {
                "authorization" : "Bearer {oauth_bearer_token}"
              }, 
              "delayBefore" : 10
            }
          ]
        }
      ]
    }

This job definition adds a few properties: extracts, invocationsPerHour, 
a random number of iterations, delayBetweenIterations, and geoDistribution. 

extracts

    After receiving the response, runLoad calls the functions provided
    in the 'extracts' array, passing the response. The return values of
    those functions get placed as additional values in the job context,
    using the valueRef name. These new values can subsequently be
    referenced as context values via templates, as described
    previously. In this example, the oauth_bearer_token is extracted and
    inserted as a bearer token in all subsequent requests. You can get
    pretty fancy with the extracts, using them to specify values in the
    payload or the url path or headers.

invocationsPerHour 

    The top-level property named "invocationsPerHour" holds an array of
    24 numbers. Each number tells the load runner the number of cycles
    of the job to run for that particular hour of the day, where
    midnight begins the zero hour. These numbers don't specify the
    desired number of requests, it's the desired number of job runs,
    each of which may have multiple sequences, each of which has one or
    more requests.

    If you set this to 60 for a particular hour, runload will try to run
    60 job runs for that hour, one per minute. The runLoad script can't
    guarantee that it will run this number of jobs. For example, suppose
    one job run takes more than 60 seconds to run. If you then specify
    60 jobs per hour as a target, the script will not finish the first
    job before it needs to start the second. But the script runs the
    jobs serial fashion: the first job must complete before runload
    starts the second. So in this case, jobs will run "as fast as they
    can", but it won't reach 60 jobs per hour.

    How many invocations should you run? Hard to say. If you run 60 per
    hour, and each job implies 8 requests, then you will get 8 requests per
    minute, or about 0.13 transactions per second. Not very much. You
    can do the math yourself for your own job description.

geoDistribution

    The geoDistribution property is a single truthy value, which
    specifies whether the runload script should simulate geo-distributed
    load as the job runs, via the X-Forwarded-For header.  Set this
    property to zero or false in the job definition if you do not want
    geo-distributed load. If you omit the property, or set it to a
    truthy value (true, 1, or any string), you get the default behavior,
    which is an X-forwarded-for header that simulates geo distributed
    load.  The runLoad script does this by calling out to two lists in
    App Services to select cities and IP addresses for those cities.

iterations

    This job definition also includes multiple sequences with multiple
    requests in each. The second sequence in this example shows how to
    specify a varying number of iterations. You can use any javascript
    expression that resolves to a number. For example,
    "Math.floor(Math.random() * 3) + 2". If you omit the iterations
    property, it defaults to 1.

delayBetweenIterations

    This can be a pure numeric,
    interpreted as milliseconds to delay, or a string which holds a
    Javascript expression that resolves to a numeric; for example,
    "Math.floor(Math.random() * 500) + 750". delayBetweenIterations defaults
    to zero. 


If you provide bad code in either of iterations or
delayBetweenIterations, the script will fail in an undefined way, so be
sure to test and verify that your logic works properly.

Also, ALL of these properties are case-sensitive. The script doesn't
flag unrecognized properties, so ... if you spell something wrong or use
the wrong case, your job definition might just "not work".  So take
appropriate care.


An Example with Imports
--------------------------------

Consider this job definition: 

    {
      "name": "job1",
      "description": "Login to the Sonoa service",
      "defaultProperties": {
        "scheme": "https",
        "host": "api.sonoasystems.net",
        "headers" : {
          "Accept" : "application/json",
          "content-type" : "application/json"
        }
      },

      "initialContext" : {
        "creds" : [
          {"username":"Chris", "password":"Haljous#"},
          {"username":"Andrea", "password":"92iu2011"},
          {"username":"Jordan", "password":"ikindalikeapis@#"}
        ]
      },

      "sequences" : [{
        "description" : "login",
        "iterations" : 1,
        "requests" : [ {
          "url" : "/v1/login",
          "method" : "post",
          "imports" : [ {
            "description" : "choose a set of credentials",
            "fn" : "function(ctx) {return Math.floor(Math.random() * ctx.creds.length);}",
            "valueRef" : "credNum"
          }],
          "headers" : {
            "authorization" : "Basic {Base64.encode(creds[credNum].username + ':' + creds[credNum].password)}"
          },
          "extracts" : [ {
            "description" : "extract the login token",
            "fn" : "function(obj,hdr,ctx) {return obj.login.token;}",
            "valueRef" : "oauth_bearer_token"
          }]
        }]
      }]
    }

This one includes a new property on the request - "imports" - which is
an array. Each element is an object, which includes a function
definition. The function is code that you provide, which runload will
run prior to sending out the request. runload injects the return value
of each import function into the context, where it is available to
subsequent import functions, or to the template expressions.

The imports are similar to the extract functions; the imports run before
the call and get only the context as a parameter, and not the
response. In contrast, the extract functions run after the call returns,
and get three arguments: payload (objet), headers (Array of strings),
and context (object). Both import and extract functions implicitly
inject values into the context via their return values:
whatever you return from those functions is stuffed into a named property on
the context object. Imports are useful for randomly selecting from a set
of possible values in the context. For example, for selecting an OAuth token,
or for selecting a credential to pass to get a token.

In this example, the import randomly selects one of the N credentials
that are available in the initial context. The number is injected into
the 'credNum' property which will be available in the context. Then, the
payload is contrived using a template that relies on that credNum value.

This example also shows how to use a more complex JavaScript expression
within a template. In the simple case, the thing between the curlies
is just the name of a property in the context. In this case though, the
expression between the curlies is

Base64.encode(creds[credNum].username + ':' + creds[credNum].password)

This expression gets wrapped into a function, which is evaluated at
runtime. In this case it will result in a function that looks like: 

function (creds, credNum) {
  return Base64.encode(creds[credNum].username + ':' + creds[credNum].password);
}

You can get as complex as you like with the expression. The function
gets all the context values as named parameters (eg: creds, credNum), so
your expression can refer to them directly.

This expression shows the use of the Base64 object.  The Base64 object
has 2 methods: encode() and decode(), which do what you think they
should.

You can use such a complex expression in any payload field, header or
url, within curlies.

The imports, extracts, and templating means you can create very dynamic
sequences of API requests, each of which might depend on the results of
prior requests. 


Weighted Random Selection
================================

Another example:

    {
      "id" : "job1",
      "description": "drive the sayHello API in AXP test org with various keys",
      "defaultProperties": {
        "scheme": "http",
        "host": "172.31.35.53",
        "port": 9001,
        "headers" : {
          "Accept" : "application/json"
        }
      },

      "initialContext" : {
        "developerKeys" : [
          ["q1QnpiszT37QnXH5lmuftgjFH8l2KYov", 50],
          ["ZfpZ6ezXue995ZhpG0pSL5IiaSRnaiCA", 30],
          ["T1wPtPJk0MmMPzKMwm94B2Gx1wT949to", 20]
        ]
      },

      "invocationsPerHour" : [
        66, 52, 60, 54, 40, 60, 61, 81,
        88, 93, 81, 90, 103, 105, 80, 76,
        72, 93, 102, 132, 134, 108, 105, 74
      ],

      "sequences" : [
        {
          "iterations" : 1,
          "requests" : [ {
            "imports" : [
              {
                "description" : "setup the weighted random selector",
                "fn" : "function(ctx) {return new WeightedRandomSelector(ctx.developerKeys);}",
                "valueRef" : "wrs"
              },
              {
                "description" : "choose a key",
                "fn" : "function(ctx) {return ctx.wrs.select()[0];}",
                "valueRef" : "key"
              }],
            "url" : "/v1/dp/sayhello?arg0={randomName()}&apikey={key}",
            "method" : "get"
          }]
        }
      ]
    }


This example shows the use of a class, WeightedRandomSelector, which is
available for use within import or extract functions. The constructor
accepts an array of arrays; the inner array should have 2 items, the
value, and its weight. The WeightedRandomSelector exposes just one
method, select(). It randomly selects an item from the array based on
the supplied weightings. In this case, the API has 3 developer keys,
and the import selects from them. The first key is chosen 50% of the
time, the 2nd key 30% of the time, and so on. (The weightings do not
need to sum to 100.)  wrs.select() tem is the array element, so if you
want the selected *value*, then you need to use wrs.select()[0].

This example also shows the use of multiple imports, and the
randomName() function, which does what you think it does.  It does not
run any extracts.

Just for completeness, you could also structure this job like so: 

      "sequences" : [
        {
          "iterations" : 1,
          "requests" : [ {
            "imports" : [
              {
                "description" : "setup the weighted random selector",
                "fn" : "function(ctx) {return new WeightedRandomSelector(ctx.developerKeys);}",
                "valueRef" : "wrs"
              }],
            "url" : "/v1/dp/sayhello?arg0={randomName()}&apikey={wrs.select()[0]}",
            "method" : "get"
          }]
        }
      ]

This definition avoids one of the import calls. Instead, it uses a more
complex expression in the template for the URL. The result is
equivalent. Which you prefer is entirely up to you.


Re-using extracted data items
================================

Consider this example:

    {
      "id" : "job5",
      "description": "drive the EXPE test APIs",
      "defaultProperties": {
        "scheme": "http",
        "host": "api-test.expedia.net",
        "port": "19001",
        "headers" : {
          "Accept" : "application/json"
        }
      },

      "geoDistribution" : 1,

      "initialContext" : {
        "client_id" : "w6aWUphknyBQcwm2kCJIsfzSzNsFQPH8",
        "client_secret" : "rgypratccbL3ByDc"
      },

      "invocationsPerHour" : [
        444, 437, 340, 432, 400, 390, 400, 540,
        550, 620, 540, 600, 710, 720, 500, 480,
        480, 620, 701, 870, 830, 702, 703, 500
      ],

      "sequences" : [
        {
          "iterations" : "1",
          "requests" : [
            {
              "url" : "/oauth/client_credentials/accesstoken",
              "method" : "post",
              "delayBefore" : 0,
              "headers" : {
                "accept" : "application/json",
                "content-type" : "application/json"
              },
              "payload": {
                "grant_type" : "client_credentials",
                "client_id" : "{client_id}",
                "client_secret" : "{client_secret}"
              },
              "extracts" : [
                {
                  "description" : "extract the oauth token",
                  "fn" : "function(obj) {return obj.access_token;}",
                  "valueRef" : "oauth_bearer_token"
                }
              ]
            }
          ]
        },{
          "iterations" : "Math.floor(Math.random() * 5) + 3",
          "requests" : [
            {
              "url" : "/v1/loopback/pass",
              "method" : "get",
              "headers" : {
                "authorization" : "Bearer {oauth_bearer_token}"
              }
            }
          ]
        }
      ]
    }

This one has a sequence with 2 requests. The first request runs once, 
and requests an access token. The second request runs N times, where N
is a random value from 3-8. It passes the token appropriately in the
authorization header. 

delayBefore is specified in milliseconds. 


Varying load by day-of-week
================================

Consider this example:

    {
      "id" : "job5",
      "description": "drive the EXPE test APIs",
      "defaultProperties": {
        "scheme": "http",
        "host": "localhost",
        "port": "19001",
        "headers" : {
          "Accept" : "application/json"
        }
      },

      "geoDistribution" : 1,

      "initialContext" : {
        "client_id" : "w6aWUphknyBQcwm2kCJIsfzSzNsFQPH8",
        "client_secret" : "rgypratccbL3ByDc"
      },

      "invocationsPerHour" : [
        444, 437, 340, 432, 400, 390, 400, 540,
        550, 620, 540, 600, 710, 720, 500, 480,
        480, 620, 701, 870, 830, 702, 703, 500
      ],

      "variationByDayOfWeek" : [
        0.9, 1.0, 1.1, 1.2, 0.8, 1.3, 1.1
      ],

      ....

This example adds a top-level property called variationByDayOfWeek.
This is an array of 7 co-efficients, one for each day of the week. If
this array is present, and if it has exactly 7 members, then the number
of calls to make is multiplied by the Nth member of this array, where N
is the day of the week. (0= Sunday, 1= Monday, etc.)  This allows the
load to vary over the course of the week, to make the analytics charts
look more interesting. Each coefficient should be a floating point
number between 0 and 2. If it fall out of that range, then the script
will use 1. 



Functions and Objects available to templates
================================

randomName() - fn, returns a given name with a number suffix. Examples: 
"Lewis-8938", "Mary-123". 

selectGivenName() - fn, returns a given name. ex: "Lewis", "Jin", "Mary". 

WeightedRandomSelector - object. The constructor accepts an array of
pairs. The first element in each pair is a value, the second is a
weight. This object has just one method, select(). Call it to get a
value from the list of pairs, selected based on the weightings.  You can
use this to vary the key usage, or whatever. 

Base64 - object. Includes 2 functions: encode() and decode(). They do 
what you think they should. You can use this to produce an HTTP Basic
Auth header in an outbound request. 


Running as a server
========================

This code is set up to run as a nodejs target in an Apigee Edge
Proxy. It will begin running, and generating load against your targets,
as soon as you deploy your proxy.

Top stop generating load, you can undeploy the proxy. 

Also, there is an API exposed by this nodejs script. 

You can temporarily stop and start load like this: 

  curl -X POST http://cass1-test.apigee.net/runload1/control  -d 'action=start'
  curl -X POST http://cass1-test.apigee.net/runload1/control  -d 'action=stop

And you can inquire status like this:

  curl -X GET http://cass1-test.apigee.net/runload1/status


The /status request returns information only for the MP you have
contacted. As you know, API Proxies in Apigee Edge can be deployed
across multiple MPs.

The /control endpoint affects all MPs. If you send a stop to any of
them, all instances of the script in the various MPs will stop
generating load. If you send a start to any of them, all instances of
the script in the various MPs will start generating load again.

You can deploy this API proxy in any Edge org, even in a free one, and
you can generate load on any other org. Also, in the job definition, you
specify the targets of the requests as URLs, which of course means you could
define a job that generates load on any system; the target need not be
running in Apigee Edge.
