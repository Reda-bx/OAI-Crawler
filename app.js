const fetch = require('node-fetch')
const fs = require('fs')
const parseString = require('xml2js').parseString
const cheerio = require("cheerio")

var nextRequest = (orm, resToken) => orm.split('?')[0]+'?verb=ListRecords&resumptionToken='+resToken

var total;
var progress = 0;
var run = (url) =>
  fetch(url)
    .then(response => response.text())
    .then( xml => {
      var xml2js
      $ = cheerio.load(xml)

      parseString(xml, function(err, res){
        xml2js = res
      })
      var dir = './publicData';
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
      }
      total = total || parseInt(xml2js["OAI-PMH"].ListRecords[0].resumptionToken[0].$.completeListSize) // Total Records
      progress = progress + parseInt(xml2js["OAI-PMH"].ListRecords[0].record.length)
      console.log("Hi Im a Bot, Please wait im fetching the godamn XML data: "+ progress +"/"+total);

      $("metadata").each(function(i){
        var fileName = xml2js["OAI-PMH"].ListRecords[0].record[i].header[0].identifier[0].split(':')
        var fileContentXML =  $(this).html()
        fs.writeFile('publicData/'+fileName[fileName.length - 1]+'.xml', fileContentXML, function (err) {
          if (err) throw err;
        });
      });
      if(xml2js["OAI-PMH"].ListRecords[0].resumptionToken[0] == ''){
        return
      }else{
        firstRequest = xml2js["OAI-PMH"].ListRecords[0].record.length
        totalRecods = xml2js["OAI-PMH"].ListRecords[0].resumptionToken[0].$.completeListSize
      }
      return xml2js
    })
    .then( data => {
      return (typeof data === 'undefined') ? false : data["OAI-PMH"].ListRecords[0].resumptionToken[0]._
    })
    .then( resumptionToken => {
      !resumptionToken ? console.log("Im done") : run(nextRequest(url, resumptionToken))
    })
    .catch(error => console.error(error))

run("http://oai.unice.fr/Wims/oaiRepository?verb=ListRecords&metadataPrefix=lom")

// http://ori-repository.univ-lille1.fr/OAIHandler?verb=ListRecords&metadataPrefix=lom 260 Records
// http://oai.unice.fr/Wims/oaiRepository?verb=ListRecords&metadataPrefix=lom 945 Records
// http://orioaiserv.emi.ac.ma:8180/ori-oai-repository/OAIHandler?verb=ListRecords&metadataPrefix=lom 49
