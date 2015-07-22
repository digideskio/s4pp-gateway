(function() {
  var crypto = require('crypto');
  var https = require('https');
  var users = require('./users.js');

  exports.commit = function (user, samples, callback) {
    try{
      var byname = {};
      for (var i = 0; i < samples.length; ++i)
      {
        var entries = byname[samples[i].name] = byname[samples[i].name] || [];
        entries.push({
          time: samples[i].time,
          value: samples[i].value
        });
      }

      var ili_payload = {
        streams: []
      };
      for (var name in byname)
      {
        ili_payload.streams.push({
          name: name,
          data: byname[name]
        });
      }
      var body = JSON.stringify(ili_payload);

      var now = Math.floor(Date.now()/1000);
      var md5 = crypto.createHash("MD5");
      var hmac = crypto.createHmac("SHA256",users.keyFor(user));
      md5.update(body);
      hmac.update("POST");
      hmac.update("/api/v2/streams");
      hmac.update(md5.digest('hex'));
      hmac.update(now.toString());
      var sig = hmac.digest('hex');

      var opts = {
        host: 'api.intelligent.li',
        path: '/api/v2/streams',
        method: 'POST',
        headers: {
          'Unix-time': now,
          'User-key': user,
          'User-token': sig,
        },
        rejectUnauthorized: false
      };
      var req = https.request (opts, function(resp) {
        if (resp.statusCode >= 200 && resp.statusCode < 300)
          callback();
        else
          callback('POST failed: ' + resp.statusCode);
      });
      req.write(body);
      req.end();
    }
    catch(e)
    {
      callback('exception: ' + e.toString());
    }
  };
})();