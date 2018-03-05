var express = require('express');
var yaml = require("js-yaml");
var fs = require("fs");
var app = express();
var port = process.env.PORT || 3000;

var request = require("request");
var bodyParser = require("body-parser");
var jsdom = require("jsdom");

var config = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));

app.use(bodyParser.urlencoded({extended: true}));

app.get("/", function (req, res)
{
    res.send("<h1>This is middleware server - WOHOO!</h1></h1><a href='https://i.imgflip.com/esdxb.jpg'><img src='https://i.imgflip.com/esdxb.jpg'/></a><br><a href='https://imgflip.com/gif-maker'> via Imgflip GIF Maker</a> ");
});

app.get("/moodleSession", function (req, response)
{

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
        url: "http://www.leoninum.org/moodle2/login/index.php",
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
});

function processPlan(htmlPage)
{

    function fetchTextByClass(day, className)
    {
        return day.window.document.getElementsByClassName(className).item(0).textContent;
    }

    function convertDate(date)
    {
        var splitted = date.split(" ");

        var day = parseInt(splitted[0].replace(".", ""))

        var month;

        switch (splitted[1].toUpperCase())
        {
            case "JANUAR":
                month = 0;
                break;
            case "FEBRUAR":
                month = 1;
                break;
            case "MÄRZ":
                month = 2;
                break;
            case "APRIL":
                month = 3;
                break;
            case "MAI":
                month = 4;
                break;
            case "JUNI":
                month = 5;
                break;
            case "JULI":
                month = 6;
                break;
            case "AUGUST":
                month = 7;
                break;
            case "SEPTEMBER":
                month = 8;
                break;
            case "OKTOBER":
                month = 9;
                break;
            case "NOVEMBER":
                month = 10;
                break;
            case "DEZEMBER":
                month = 11;
                break;
        }

        var year = splitted[2];

        var date = new Date();
        date.setDate(day);
        date.setMonth(month);
        date.setFullYear(year);

        return date;
    }

    function convertDate2(date)
    {
        var splitted = date.split(" ");
        var splittedDate = splitted[0].split(".");
        var splittedTime = splitted[1].split(":");

        var tmpDate = new Date();
        tmpDate.setDate(parseInt(splittedDate[0]));
        tmpDate.setMonth(parseInt(splittedDate[1]) - 1);
        tmpDate.setFullYear(parseInt(splittedDate[2]));

        tmpDate.setHours(parseInt(splittedTime[0]));
        tmpDate.setMinutes(parseInt(splittedTime[1]));
        tmpDate.setSeconds(parseInt(splittedTime[2]));

        return tmpDate;
    }

    var day = new jsdom.JSDOM(htmlPage);

    var processedPlan = {};
    processedPlan.date = convertDate(fetchTextByClass(day, "Titel").split(",")[1].replace("�", "ä").substr(1));
    processedPlan.state = convertDate2(fetchTextByClass(day, "Stand").split("Stand:")[1].replace(" ", "", 1));
    processedPlan.usedTeachers = fetchTextByClass(day, "LehrerVerplant").replace("\n", "").replace("\n", "").replace("�", "ü");
    processedPlan.missingTeachers = fetchTextByClass(day, "Abwesenheiten-Lehrer").replace("\n", "").replace("\n", "").replace("�", "ü");

    function processTable(day, table)
    {
        var tables = [];
        var rows = table.rows;
        for (var i = 1; i < rows.length; i++)
        {
            var tmpTable = {};
            tmpTable.hour = rows.item(i).cells[0].textContent;
            tmpTable.class = rows.item(i).cells[1].textContent;
            tmpTable.subject = rows.item(i).cells[2].textContent;
            tmpTable.teacher = rows.item(i).cells[3].textContent.replace("�", "ä").replace("�", "ü");
            tmpTable.replacement = rows.item(i).cells[4].textContent.replace("�", "ä").replace("�", "ü");
            tmpTable.room = rows.item(i).cells[5].textContent;
            tmpTable.comment = rows.item(i).cells[6].textContent.replace("�", "ä").replace("\n", "");
            tables.push(tmpTable);
        }
        return tables;
    }

    processedPlan.lessons = processTable(day, day.window.document.getElementsByTagName("table")[0]);

    return processedPlan;
}

app.get("/fetch/:day", function (req, response)
{

    var url;
    if (req.params["day"] === "today")
    {
        url = config.moodle.todayUrl;
    } else if (req.params["day"] === "tomorrow")
    {
        url = config.moodle.tomorrowUrl;
    } else
    {
        response.json({error: "Please provide valid day"});
        return;
    }

    if (req.query["moodleSession"] === undefined)
    {
        response.json({error: "Please provide moodle session"});
        return;
    }

    request({
        url: url,
        method: "GET",
        headers: {
            Cookie: "MoodleSession=" + req.query["moodleSession"]
        }
    }, function (req, res, body)
    {
        if (!res)
        {
            res.json({error: "Moodle server did not respond"});
            return;
        } else if (res.headers["location"] === "http://www.leoninum.org/moodle2/login/index.php")
        {
            response.json({error: "User not logged in"});
            return;
        } else
        {
            try
            {
                response.json(processPlan(body));
            } catch (e)
            {
                response.json({error: "Wrong server response"});
                console.log(e.stack)
            }
        }
    });
});


app.listen(port);

console.log('Vertretungsplan Leoninum RESTful API started on port  ' + port);