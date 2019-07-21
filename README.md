# node-twitter-client #

Simple module for using Twitter's API in Node.js

## Installation ##

With npm: `npm install node-twitter-client`

With yarn: `yarn add node-twitter-client`

## Usage ##

### Step 1: Initialization ###

```javascript
const twitterAPI = require('node-twitter-api');
const twitter = new twitterAPI({
  consumerKey: 'your consumer Key',
  consumerSecret: 'your consumer secret',
  callback: 'http://yoururl.tld/something'
});
```

Optionally you can add `x_auth_access_type: "read"` or `x_auth_access_type: "write"` ([see here](https://dev.twitter.com/oauth/reference/post/oauth/request_token)).

### Step 2: Getting a Request token ###

```javascript
// callback style
twitter.getRequestToken((error, { requestToken, requestTokenSecret, results }) => {
  if (error) {
    console.log("Error getting OAuth request token : " + error);
  } else {
    //store token and tokenSecret somewhere, you'll need them later; redirect user
  }
});

// promise style
const { requestToken, requestTokenSecret, results } = await twitter.getRequestToken();

```

If no error has occured, you now have a `requestToken` and its corresponding `requestTokenSecret`. You should store them somewhere (e.g. in a session, if you are using express), because you will need them later to get the current user's access token, which is used for authentication.

You can also make use of redis store or memcache for storing `requestToken` and `requestTokenSecret` if maintaining sessions is not possible. (This will happen if the backend is initiating twitter auth on a host and frontend is initiating twitter auth on a different auth and it is impossible to maintain sessions as both the requests are completely treated as different requests).

### Step 3: Getting an Access Token ###

Redirect the user to `https://twitter.com/oauth/authenticate?oauth_token=[requestToken]`.  

`twitter.getAuthUrl(requestToken, options)` also returns that URL (the options parameter is optional and may contain a boolean `force_login` and a String `screen_name` - see the Twitter API Documentation for more information on these parameters).

If the user allows your app to access his data, Twitter will redirect him to your callback-URL (defined in Step 1) containing the get-parameters: `oauth_token` and `oauth_verifier`. You can use `oauth_token` (which is the `requestToken` in Step 2) to find the associated `requestTokenSecret`. You will need `requestToken`, `requestTokenSecret` and `oauth_verifier` to get an Access Token.

```javascript
// callback style
twitter.getAccessToken(requestToken, requestTokenSecret, oauth_verifier, (error, { accessToken, accessTokenSecret, results }) => {
  if (error) {
    console.log(error);
  } else {
    //store accessToken and accessTokenSecret somewhere (associated to the user)
    //Step 4: Verify Credentials belongs here
  }
});

// promise style
const { accessToken, accessTokenSecret, results } = await twitter.getAccessToken(requestToken, requestTokenSecret, oauth_verifier);
```

If no error occured, you now have an `accessToken` and an `accessTokenSecret`. You need them to authenticate later API-calls.

### Step 4: (Optional) Verify Credentials ###

```javascript
// callback style
twitter.verifyCredentials(accessToken, accessTokenSecret, params, (error, { data, response }) => {
 if (error) {
   //something was wrong with either accessToken or accessTokenSecret
   //start over with Step 1
 } else {
   //accessToken and accessTokenSecret can now be used to make api-calls (not yet implemented)
   //data contains the user-data described in the official Twitter-API-docs
   //you could e.g. display his screen_name
   console.log(data["screen_name"]);
 }
});

// promise style
const { data, response } = await twitter.verifyCredentials(accessToken, accessTokenSecret, params);
```

In the above example, `params` is an optional object containing extra parameters to be sent to the Twitter endpoint ([see here](https://dev.twitter.com/rest/reference/get/account/verify_credentials))

## Methods *****(MIGRATING SOON)***** ##

(Almost) all function names replicate the endpoints of the Twitter API 1.1.
If you want to post a status e. g. - which is done by posting data to statuses/update - you can just do the following:

```javascript
twitter.statuses("update",
  {
    status: "Hello world!"
  },
  accessToken,
  accessTokenSecret,
  function(error, data, response) {
    if (error) {
      // something went wrong
    } else {
      // data contains the data sent by twitter
    }
  }
);
```

Most of the functions use the scheme:
`twitter.[namespace]([type], [params], [accessToken], [accessTokenSecret], [callback]);`

* _namespace_ is the word before the slash (e.g. "statuses", "search", "direct_messages" etc.)
* _type_ is the word after the slash (e.g. "create", "update", "show" etc.)
* _params_ is an object containing the parameters you want to give to twitter (refer to the Twitter API Documentation for more information)
* _accessToken_ and _accessTokenSecret_ are the token and secret of the authenticated user
* _callback_ is a function with the parameters _error_ (either null or an error object), _data_ (data object) and _response_ (unprocessed response from Twitter)

For Timelines you can also use the function _getTimeline_ which has the following types:

* `user` or `user_timeline` (Note that you need to either specify user_id or screen_name when using this timeline)
* `home` or `home_timeline`
* `mentions` or `mentions_timeline`
* `retweets` or `retweets_of_me`

For more information on the different types of timelines [see here](https://dev.twitter.com/rest/reference/get/statuses/home_timeline) (analog for the other types)

For Streams you must use _getStream_ which has two instead of just one callback: a dataCallback and an endCallback. (c.f. data and end events of node's http response)

## How to upload media ##

To upload media to Twitter, call `twitter.uploadMedia(params, accessToken, accessTokenSecret, callback)` with params containing the following:

* _media_: Either the raw binary content of the image, the binary base64 encoded (see isBase64 below) or the path to the file containing the image.
* _isBase64_: Set to true, if media contains base64 encoded data
For a example result see https://dev.twitter.com/rest/reference/post/media/upload. You can pass multiple media_ids to the statuses/update endpoint by seperating them with commas (e.g. "[id1],[id2],[id3],[id4]").

## How to upload Video ##

To upload video to Twitter, call `twitter.uploadVideo(params, accessToken, accessTokenSecret, callback)` with params containing the following:

* _media_: Path to the file containing the video.

You can pass media_id to the statuses/update endpoint and video will be uploaded to twitter. Please note that video should be less than 15mb or 30 sec in length.
