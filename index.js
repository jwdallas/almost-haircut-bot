console.log('Almost Haircut Bot Engaged');

var twit = require('twit');
var access = require('./access.json');

var t = new twit({
  consumer_key:         access.twitter.consumer_key,
  consumer_secret:      access.twitter.consumer_secret,
  access_token:         access.twitter.access_token,
  access_token_secret:  access.twitter.access_token_secret
});

var textToSearchFor = "almost cut my hair";

// tweets that mention these words are probably already referencing the song
// or are retweets
var textToAvoid = ['csny', 'police car', 'freak flag',
                   'crosby', 'stills', 'nash', 'rt ',
                   'grooveshark'];

// text that the bot replies with                  
var replyText = "Almost cut your hair? http://www.youtube.com/watch?v=1RPovmMwef8";


// start by getting our most recent tweets so that we can search for tweets since
var recentTweetIDs = [];
var mostRecentTweetID = "";

t.get('statuses/user_timeline',
  {
    count: 10,
    trim_user: true
   },
   function(err, data, response) {
     if(err) console.log(err);
     for(var entryNum in data) {
       recentTweetIDs.push(data[entryNum].id_str);
     }
     findmostRecentTweetID();
   }
);


function findmostRecentTweetID() {
  mostRecentTweetID = recentTweetIDs.sort().pop();
  
  // sweet we’ve got the most recent tweet lets go change the world
  changeTheWorld(mostRecentTweetID);
}


function changeTheWorld(mostRecentTweetID) {
  // search tweets
  t.get('search/tweets', 
    { 
      q: textToSearchFor,
      count: 100,
      result_type: 'recent',
      since_id: mostRecentTweetID, // avoid tweets we’ve already responded to
      until: formattedDateWithModifier(1), // look for tweets from “just the other day”  ♫
      include_entities: false
    },
    function(err, data, response) {
      if(err) console.log(err);
      
      // for each tweet
      for(var entryNum in data.statuses) {
        var text = data.statuses[entryNum].text;
        var tweetID = data.statuses[entryNum].id_str;
        var username = data.statuses[entryNum].user.screen_name;
        var searchText = text.toLowerCase();

        // look to see if it contains exactly the right phrase
        if(searchText.indexOf('almost cut my hair') > -1) {
          // make sure it does not include any words we don’t want
          if (!(new RegExp(textToAvoid.join("|")).test(searchText))) {
            // here we act on the tweets we just found,
            // we need to rate limit account activity to avoid suspension

            // retweet it
            setTimeout(function() {
              t.post('statuses/retweet/'+tweetID, { id: tweetID }, function(err, data, response) {
                if(err) throw err;
              }); 
            }, getRandomInt(30000, 900000)); // wait anywhere from 30secs to 15mins
            
            // reply with a link to the song
            setTimeout(function() {
              t.post('statuses/update',
                { 
                  status: '@'+username+' '+replyText,
                  in_reply_to_status_id: tweetID
                },
                function(err, data, response) {
                  if(err) throw err;
                });
            }, getRandomInt(30000, 900000)); // wait anywhere from 30secs to 15mins
          }
        }
      }
  }); 
}



// -------------------------
//   helper functions
// -------------------------
function formattedDateWithModifier(numberOfDaysAgo) {
  if (!numberOfDaysAgo) numberOfDaysAgo = 0;
  var date = new Date();
  date.setDate(date.getDate()-numberOfDaysAgo);
  var day = ("0" + date.getDate()).slice(-2);
  var month = ("0" + (date.getMonth() + 1)).slice(-2);
  
  return date.getFullYear() + "-" + (month) + "-" + (day);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}