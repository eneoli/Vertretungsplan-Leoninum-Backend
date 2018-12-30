var securityService = require("./Security/SecurityService");
var request = require("request");
var yaml = require("js-yaml");
var fs = require("fs");
var config = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));

function obtainMoodleSession(username, password, onResult, onError) {

  let result = {moodleSession: null, error: null};

  request({
    url: config.moodle.loginUrl,
    method: "POST",
    form: {
      username: username,
      password: password
    }
  }, (err, res) => {
    if (!res) {
      onError("Moodle server did not respond");
      return;
    } else if (res.headers["location"] === "http://www.leoninum.org/moodle2/login/index.php") {
      onError("Wrong username or password");
      return;
    }

    try {
      let moodleSession = res.headers["set-cookie"][0].replace("MoodleSession=", "").split(";")[0];
      onResult(moodleSession);
    } catch (e) {
      console.log(e);
      onError("Wrong server response");
    }
  });

  return result;
}

/**
 * @deprecated use secureMoodleSession
 * @param req
 * @param response
 */
exports.onMoodleSession = function (req, response) {

  if (req.query["username"] !== undefined && req.query["username"] !== undefined) {
    var username = req.query["username"];
    var password = req.query["password"];
  } else {
    response.json({
      error: "please provide username and password"
    });
    return;
  }
  obtainMoodleSession(username, password, (moodleSession) => {
    response.send({moodleSession: moodleSession});
  }, (error) => {
    response.send({error: error});
  });
};

exports.secureMoodleSession = function (req, res) {
  let decrypted = securityService.decryptCredentials(req.body.secret);
  decrypted = JSON.parse(decrypted);
  obtainMoodleSession(decrypted.username, decrypted.password, (moodleSession) => {
    res.send({moodleSession: moodleSession});
  }, (error) => {
    res.send({error: error}, 500);
  });
};

exports.validateMoodleSession = function (req, response) {
  var request = require("request");
  var moodleSession = req.query['moodleSession'];
  request({
    url: "http://www.leoninum.org/moodle2/mod/resource/view.php?id=360",
    method: "POST",
    headers: {
      Cookie: "MoodleSession=" + moodleSession + ";"
    }
  }, function (err, res) {
    if (!res) {
      response.json({error: "Moodle server did not respond"});
      return;
    } else if (res.headers["location"] === "http://www.leoninum.org/moodle2/login/index.php") {
      response.json({valid: false});
      return;
    }

    response.json({valid: true});
  });

};