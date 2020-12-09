var fetch = require('node-fetch');
var fs = require('fs');
var xml2js = require('xml2js').parseString;
const icsToJson = require('ics-to-json');
const ics = require('ics');
let events = [];
let crenarr = [{ id: 1, start: "08:30", end: "10:00" }, { id: 2, start: "10:30", end: "12:00" }, { id: 3, start: "12:00", end: "13:30" }, { id: 4, start: "13:30", end: "15:00" }, { id: 5, start: "15:15", end: "16:45" }, { id: 6, start: "17:00", end: "18:30" }]
var data = "";
const { exec } = require("child_process");
let res;
fetch("https://eleves.groupe3il.fr/edt_eleves/I1%20Groupe%205%20Apprentis.xml", {
    headers: {
        "Content-Type": 'text/plain; charset=UTF-8',
    }
})
    .then(response => response.text())
    .then((data) => {

        xml2js(data, function (err, result) {
            res = (JSON.stringify(result));
            fs.writeFileSync('./test.json', res)
            //console.dir(res);
        });


        JSON.parse(res).DOCUMENT.GROUPE[0].PLAGES.map((plage) => {
            plage.SEMAINE.map((sem) => {
                sem.JOUR.map((day) => {
                    let date = day.Date[0];
                    let crenau;
                    let title;
                    let salle;
                    let duration = { hours: 1, minutes: 30 }
                    day.CRENEAU.map((cren) => {
                        if (Array.isArray(cren.Activite)) {
                            //console.log(cren.Creneau[0])
                            title = cren.Activite[0];
                            crenau = parseInt(cren.Creneau[0]);
                            salle = cren.Salles[0];

                        } else {
                            title = undefined;
                            crenau = undefined;
                            salle = undefined;
                        }
                        if (crenau != undefined) {
                            //console.log(date , title , crenau);
                            crenarr.map((el) => {
                                if (el.id == crenau) {
                                    let arrdate = date.split('/');
                                    let arrtime = el.start.split(':');
                                    //console.log(arrtime);
                                    events.push({
                                        title: title,
                                        start: [parseInt(arrdate[2]), parseInt(arrdate[1]), parseInt(arrdate[0]), parseInt(arrtime[0]), parseInt(arrtime[1])],
                                        duration: duration,
                                        location: salle
                                    })
                                }
                            })

                        }
                    })

                })

            })




            const { error, value } = ics.createEvents(events)

            if (error) {
                console.log(error)
                return
            }



           // console.log(events)


            const convert = async (fileLocation) => {
                const icsRes = await fetch(fileLocation)
                const icsData = await icsRes.text()
                // Convert
                const data = icsToJson(icsData)
                return data
            }


            let prevEvents = convert("./i1g5.ics");
            console.log(prevEvents);

            fs.writeFileSync("./i1g5.ics", value);



            exec("upload.bat", (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
            });





        })










    })







