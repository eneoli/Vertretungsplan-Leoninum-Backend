let securityService = require("./Security/SecurityService");
let request = require("request");
let yaml = require("js-yaml");
let fs = require("fs");
let config = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));

function obtainMoodleSession(username, password, onResult, onError) {

  request({
    url: config.moodle.loginUrl,
    method: "POST",
    form: {
      username: username || "",
      password: password || ""
    }
  }, function (err, res) {
    if (!res) {
      onError("Moodle-Server hat nicht geantwortet");

    } else if (res.headers["location"] === config.moodle.loginUrl) {
      onError("Passwort oder Benutzername falsch!");

    } else {

      try {
        let moodleSession = res.headers["set-cookie"][0].replace("MoodleSession=", "").split(";")[0];
        onResult(moodleSession);
      } catch (e) {
        onError("Falsche Serverantwort");
      }
    }
  });
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
      error: "Bitte gib Nutzername und Passwort an"
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

  if (req.query.secret !== undefined) {
    let decrypted = null;
    try {
      decrypted = securityService.decryptCredentials(req.query.secret);
    } catch (e) {
      res.send({error: "Serverfehler"});
    }

    decrypted = JSON.parse(decrypted);
    obtainMoodleSession(decrypted.username, decrypted.password, (moodleSession) => {
      res.send({moodleSession: moodleSession});
    }, (error) => {
      res.send({error: error});
    });
  } else {
    res.send({error: "Bitte gib Benutzername und Passwort an"});
  }
};

exports.validateMoodleSession = function (req, response) {
  let moodleSession = req.query['moodleSession'];
  request({
    url: "http://www.leoninum.org/moodle2/mod/resource/view.php?id=360",
    method: "POST",
    headers: {
      Cookie: "MoodleSession=" + moodleSession + ";"
    }
  }, function (err, res) {
    if (!res) {
      response.json({error: "Moodle Server hat nicht geantwortet"});
      return;
    } else if (res.headers["location"] === "http://www.leoninum.org/moodle2/login/index.php") {
      response.json({valid: false});
      return;
    }

    response.json({valid: true});
  });

};