exports.onMoodleSession = function (req, response)
{
    var request = require("request");
    var yaml = require("js-yaml");
    var fs = require("fs");

    var config = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));

    if (req.query["username"] !== undefined && req.query["username"] !== undefined)
    {
        var username = req.query["username"];
        var password = req.query["password"];
    } else
    {
        response.json({
            error: "please provide username and password"
        });
        return;
    }
    request({
        url: config.moodle.loginUrl,
        method: "POST",
        form: {
            username: username,
            password: password
        }
    }, function (err, res)
    {
        if (!res)
        {
            response.json({error: "Moodle server did not respond"});
            return;
        } else if (res.headers["location"] === "http://www.leoninum.org/moodle2/login/index.php")
        {
            response.json({error: "Wrong username or password"});
            return;
        }

        try
        {
            var moodleSession = res.headers["set-cookie"][0].replace("MoodleSession=", "").split(";")[0];
            response.json({
                moodleSession: moodleSession
            });
        } catch (e)
        {
            response.json({error: "Wrong server response"});
        }
    });
};