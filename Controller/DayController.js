exports.onFetchDay = function (req, response)
{
    var request = require("request");
    var yaml = require("js-yaml");
    var fs = require("fs");
    var jsdom = require("jsdom");

    var config = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));

    function toUTF8(body)
    {
        // convert from iso-8859-1 to utf-8
        var ic = new iconv.Iconv('windows-1252', 'UTF-8');
        var buf = ic.convert(body);
        return buf.toString('UTF-8');
    }

    function processPlan(htmlPage)
    {

        function fetchTextByClass(day, className)
        {
            try {
                return day.window.document.getElementsByClassName(className).item(0).textContent;
            }catch (e) {
                return "";
            }
        }

        function convertDate(date)
        {
            var splitted = date.split(" ");

            var day = parseInt(splitted[0].replace(".", ""));

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
            date.setFullYear(parseInt(year));

            return date;
        }

        function convertDate2(date, time)
        {
            var splittedDate = date.split(".");
            var splittedTime = time.split(":");

            var tmpDate = new Date();
            tmpDate.setDate(parseInt(splittedDate[0]));
            tmpDate.setMonth(parseInt(splittedDate[1]) - 1);
            tmpDate.setFullYear(parseInt(splittedDate[2]));

            tmpDate.setHours(parseInt(splittedTime[0]));
            tmpDate.setMinutes(parseInt(splittedTime[1]));

            return tmpDate;
        }

        var day = new jsdom.JSDOM(htmlPage);

        var processedPlan = {};
        processedPlan.date = convertDate(fetchTextByClass(day, "Titel").split(",")[1].replace("�", "ä").substr(1));
        processedPlan.state = convertDate2(fetchTextByClass(day, "Stand").match(/\d{2}[./-]\d{2}[./-]\d{4}/)[0], fetchTextByClass(day, "Stand").match(/([01]?[0-9]|2[0-3]):[0-5][0-9]/)[0]);
        processedPlan.usedTeachers = fetchTextByClass(day, "LehrerVerplant").replace("\n", "").replace("\n", "").replace("�", "ü");
        processedPlan.missingTeachers = fetchTextByClass(day, "Abwesenheiten-Lehrer").replace("\n", "").replace("\n", "").replace("�", "ü");

        function processTable(day, table)
        {
            var tables = [];
            var rows = table.rows;
            for (var i = 1; i < rows.length; i++)
            {
                var tmpTable = {};
                tmpTable.hour = rows.item(i).cells[0].textContent.trim();
                tmpTable.class = rows.item(i).cells[1].textContent.trim();
                tmpTable.subject = rows.item(i).cells[2].textContent.trim();
                tmpTable.teacher = rows.item(i).cells[3].textContent.trim();
                tmpTable.replacement = rows.item(i).cells[4].textContent.trim();
                tmpTable.room = rows.item(i).cells[5].textContent.trim();
                tmpTable.comment = rows.item(i).cells[6].textContent.trim();
                tables.push(tmpTable);
            }
            return tables;
        }

        processedPlan.lessons = processTable(day, day.window.document.getElementsByTagName("table")[0]);

        return processedPlan;
    }

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
        },
        encoding: "latin1"
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
                response.json(processPlan(body.replace(/\r?\n|\r/g, ""))); // remove escape characters
            } catch (e)
            {
                response.json({error: "Wrong server response"});
                console.log(e.stack)
            }
        }
    });
};