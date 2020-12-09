var fetch = require('node-fetch');
var fs = require('fs');
var xml2js = require('xml2js').parseString;
const ics = require('ics');
let events = [];
let crenarr = [{ id: 1, start: "08:30", end: "10:00" }, { id: 2, start: "10:30", end: "12:00" }, { id: 3, start: "12:00", end: "13:30" }, { id: 4, start: "13:30", end: "15:00" }, { id: 5, start: "15:15", end: "16:45" }, { id: 6, start: "17:00", end: "18:30" }]
var data = "";
const icsToJson = require('ics-to-json');
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



            //console.log(events)

            //console.log(icsToJson.default)
            const prevEvents = icsToJson.default(fs.readFileSync('./i1g5.ics', 'utf-8'));
            prevEvents.map((prevev) => {
                events.map((ev) => {
                    let hour = ev.start[3] - 1;
                     hour = hour < 10 ? '0' + hour : hour.toString();
                    let minutes = ev.start[4] < 10 ? '0' + ev.start[4] : ev.start[4].toString();
                    let day = ev.start[2] < 10 ? '0' + ev.start[2] : ev.start[2].toString();
                    let month = ev.start[1] < 10 ? '0' + ev.start[1] : ev.start[1].toString();

                    let evdate = ev.start[0].toString() + month + day + 'T' + hour + minutes + '00Z'
                    // console.log(evdate + " "+ prevev.startDate)
                    if (prevev.summary == ev.title && prevev.startDate == evdate) {
                        console.log(true + " " + evdate + " " + ev.title + " " + prevev.summary + " " + prevev.startDate)
                        let index = events.indexOf(ev);
                        events.splice(index, 1);
                    } else {
                        console.log(false + " " + evdate + " " + ev.title + " " + prevev.summary + " " + prevev.startDate)
                    }
                    // console.log(ev)
                })

            })

            if (events.length > 0) {
                if(prevEvents.isArray){
                prevEvents.map((ev) => {
                    let datestr = ev.startDate.replace('00Z' , "").replace('T' , '');
                    let year = parseInt(datestr.substring(0,4));
                    let month = parseInt(datestr.substring(3 , 2));
                    let day = parseInt(datestr.substring(5 , 2 ))
                    let hour = parseInt(datestr.substring(7 , 2))
                    let mins = parseInt(datestr.substring(9 , 2));
                    console.log(year+month+day+hour+mins)
                })
            }

                fs.writeFileSync("./i1g5.ics", value);
            }

            console.log(" # of events "+ events.length);

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







