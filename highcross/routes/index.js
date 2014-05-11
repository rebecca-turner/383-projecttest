

//This processes the rejected image
exports.reject = function(req, res){
    var MongoClient = require('mongodb').MongoClient;
    MongoClient.connect("mongodb://localhost:27017/highcrosscc", function(err, db) {
        if(err) {
            console.log("Error connecting to db: ", err);
        } else {
            console.log('Working on the collection');
            var collection = db.collection('entriesForCC');
            collection.update({guid:req.params.id}, {$set:{rejected:true}}, {w:1}, function(err, result) {
                if (err){
                    //console.log(err); 
                }else{
                    console.log('Rejected!!');
                    res.send("rejecting id: " + req.params.id); //this sends a result to the client - which triggers the reloading of the page.
                    db.close(function (err,result){ console.log('bye');});
                }
               
            });
        } 
    });
   
};


//This processes the approved images

exports.approve = function(req, res){
    var MongoClient = require('mongodb').MongoClient;
    // Connect to the db
    MongoClient.connect("mongodb://localhost:27017/highcrosscc", function(err, db) {
        if(err) {
            console.log("Error connecting to db: ", err);
        } else {
            console.log('Working on the collection');
            var collection = db.collection('entriesForCC');
            collection.update({guid:req.params.id}, {$set:{approved:true}}, {w:1}, function(error, result) {
                if (error){
                   // console.log(error); 
                } else {
                    console.log('Accepted'); //Confirm the change has been made. 
                    res.send("approving id: " + req.params.id); //this sends a result to the client - which triggers the reloading of the page. 
                    db.close(function (err,result){ console.log('bye');});
                }
            });
        } 
    });
   
};







//This is the main index page. It pulls in the API then puts it into an array of documents then writes those documents to a collection in MongoDB. 
exports.index = function(req, res) {
    var http = require('http');
    var url = 'http://636486fb26aaadf68e9e-674241615f951c6aec78bfae8eed09cb.r71.cf3.rackcdn.com/data.json';
    http.get(url, function(res) {
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            var parsed = JSON.parse(body);
            var imageEntries = []; 
            console.log("fetching from api");
            for(var i = 0; i < parsed.data.count; i++) {
                var jsonitem = parsed.data.items[i];    
                if(jsonitem.type=='instagram:video') { continue; } // assuming that they don't want instagram videos
                if(jsonitem.type == "twitter:tweet"){ 
                    if(jsonitem.is_retweet==true || jsonitem.urls.length == 0) {continue;} //ignore the retweets and ones without images/urls
                    var tweeturls = jsonitem.urls; 
                    //loop through the urls array using the key
                    var  image="";
                    for (var key in tweeturls) {
                        var isimage=jsonitem.urls[key].indexOf('.jpg'); // searching for .jpg in the string
                        if (isimage >=1) {
                            image=jsonitem.urls[key];  //if it has .jpg in the string then it's classed as an image
                        }else{
                           
                        }
                    }
                    if (image==""){
                         //if images is empty then that entry will be ignored. 
                          continue;
                    }
                }
                if (jsonitem.type=="instagram:image"){ //images are different on instagram
                    var image = jsonitem.image_standard;
                }
                var userid = jsonitem.user_id;
                var username = jsonitem.username;
                var source = jsonitem.service;
                var imported = jsonitem.imported;
                var guid = jsonitem.guid; //this is to be used as a unique identifier to stop duplicates - once I find out how
                var imageEntry={'guid':guid, 'userid':userid, 'username':username, 'source': source, 'imported':imported, 'image':image};  
                imageEntries.push(imageEntry);
            }

            console.log("about to connect to db.");
            var MongoClient = require('mongodb').MongoClient;
      // Connect to the db
            MongoClient.connect("mongodb://localhost:27017/highcrosscc", function(err, db) {
                if(err) {
                    console.log("Error connecting to db: ", err);
                } else {
                    console.log("We are connected to the db.");
//creating the collection - if it already exists it'll just ignore creating it
                    db.createCollection('entriesForCC', function(err, collection) {
                        if(err) { 
                            console.log("Error creating collection: ", err); 
                        } else {
                           
                            // Loop through the array to do an upsert (this means there's not duplicates (yay!)!!!) 
                            for(var i = 0; i < imageEntries.length; i++) {
                                    collection.update({guid:imageEntries[i].guid}, {$set:{guid:imageEntries[i].guid, userid:imageEntries[i].userid, username:imageEntries[i].username, source: imageEntries[i].source, imported:imageEntries[i].imported, image:imageEntries[i].image}}, {upsert:true, w: 1}, function(err, result) {});
                            
                            }
                          
                        }
                    });
                }
            });
        });

    }).on('error', function(e) {
         console.log("Got error: ", e);
    });
    
    //This reads all the images from the Database and prints them on screen. This may need to go into another page/place in order to print the correct data.
    var entryarray = [];
    var MongoClient = require('mongodb').MongoClient;
// Connect to the db
    MongoClient.connect("mongodb://localhost:27017/highcrosscc", function(err, db) {
		  if(err) {
            console.log("Error connecting to db: ", err);
		  } else {
            console.log('Working on the collection');
			 var collection = db.collection('entriesForCC');
            var stream = collection.find({rejected:{$ne:true},$or:[{approved:{$ne:true}}]}).stream();
                stream.on("data", function(item) {
					//console.log(item.image);
                    entryarray.push({'image':item.image, 'id':item.guid});
                });
                stream.on("end", function() {	
                    db.close(function (err,result){ console.log('bye');});	
                    res.render('index', { title: "Highcross Celebrate Colour", images:entryarray});
				    });
         } 
    });
};// JavaScript Document