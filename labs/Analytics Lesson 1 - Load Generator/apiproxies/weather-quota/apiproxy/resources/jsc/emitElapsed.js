// emitElapsed.js
// ------------------------------------------------------------------
//
// emit the elapsed time
//
// created: Fri Feb 28 22:59:14 2014
// last saved: <2014-February-28 22:59:25>

var start, end, delta;

start = context.getVariable('target.sent.start.timestamp');
end = context.getVariable('target.received.end.timestamp');
delta = Math.floor(end - start);
context.proxyResponse.headers['X-time-target-elapsed'] = delta;

start = context.getVariable('client.received.start.timestamp');
end = context.getVariable('system.timestamp');
delta = Math.floor(end - start);
context.proxyResponse.headers['X-time-total-elapsed'] = delta;
