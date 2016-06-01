// prettyPrint.js
// ------------------------------------------------------------------
//
// pretty print the payload, if it is JSON.
//
// created: Tue Mar  3 11:37:36 2015
// last saved: <2015-March-03 12:40:46>

function convert(data) {
  var body = JSON.parse(data), a;
  if (body.response) {
    a = Object.keys(body);
    if (a.length === 1) {
      body = body.response;
    }
  }
  return body;
}

var body;

try {
  if (response && response.content) {
    body = convert(response.content);
    response.content = JSON.stringify(body, null, 2) + '\n';
  }
  else if (error && error.content) {
    body = convert(error.content);
    error.content = JSON.stringify(body, null, 2) + '\n';
  }
}
catch (exc1) {
  context.setVariable('response.header.x-what', exc1.toString());
  // gulp! - will happen in case the payload is not JSON
}
