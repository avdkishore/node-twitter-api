
import fs from 'fs';
import querystring from 'querystring';
import oauth from 'oauth';
import request from 'request';

const VERSION = '1.8.0';
const baseURL = 'https://api.twitter.com/1.1/';
const uploadBaseURL = 'https://upload.twitter.com/1.1/';
const authURL = 'https://twitter.com/oauth/authenticate?oauth_token=';

class Twitter {
  constructor({ consumerKey, consumerSecret, x_auth_access_type, callback}) {
    this.VERSION = VERSION;

    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.x_auth_access_type = x_auth_access_type;
    this.callback = callback;
    
    this.oa = new oauth.OAuth('https://twitter.com/oauth/request_token', 'https://twitter.com/oauth/access_token', 	this.consumerKey, this.consumerSecret, '1.0A', this.callback, 'HMAC-SHA1')

    // this.returnResponse = this.returnResponse.bind(this);
  }

  checkIfCallbackIsSent(callback) {
    return typeof callback === 'function';
  }

  getAuthUrl(requestToken, options) {
    let extraArgs = '';
    if (options && options.force_login) {
      extraArgs = `${extraArgs}&force_login=1`;
    }
    
    if (options && options.screen_name) {
      extraArgs = `${extraArgs}&screen_name=${options.screen_name}`;
    }
    
    return `${authURL}${requestToken}${extraArgs}`;
  }

  response(callback, promiseHandler, success, ...rest) {
    const isCallback = this.checkIfCallbackIsSent(callback);

    return isCallback ? (success ? callback(null, ...rest) : callback(...rest)) : promiseHandler(...rest);
  }

  getRequestToken(callback) {
    const isCallback = typeof callback === 'function';

    return new Promise((resolve, reject) => {
      return this.oa.getOAuthRequestToken({ x_auth_access_type: this.x_auth_access_type }, (error, oauthToken, oauthTokenSecret, results) => {
        if (error) {
          return this.response(callback, reject, false, error);
        } 

        return this.response(callback, resolve, true, oauthToken, oauthTokenSecret, results);
      });
    });
  }

  getAccessToken(requestToken, requestTokenSecret, oauth_verifier, callback) {
    const isCallback = typeof callback === 'function';

    return new Promise((resolve, reject) => {
      return this.oa.getOAuthAccessToken(requestToken, requestTokenSecret, oauth_verifier, (error, oauthAccessToken, oauthAccessTokenSecret, results) => {
        if (error) {
          return this.response(callback, reject, false, error);
        }

        return this.response(callback, resolve, true, oauthAccessToken, oauthAccessTokenSecret, results);
      });
    });
  }

  verifyCredentials(accessToken, accessTokenSecret, params, callback) {
    const isCallback = typeof callback === 'function';

    let url = `${baseURL}account/verify_credentials.json`;

    if (typeof params == 'function') {
      callback = params;
    } else {
      const query = querystring.stringify(params);
      url = `${url}?${query}`;
    }
    
    return new Promise((resolve, reject) => {
      return this.oa.get(url, accessToken, accessTokenSecret, function(error, data, response) {
        if (error) {
          return this.response(callback, reject, false, error);
        }
        
        try {
          const parsedData = JSON.parse(data);

          return this.response(callback, resolve, true, parsedData, response);
        } catch (e) {
        
          return this.response(callback, reject, false, e, data, response);
        }
      });
    })
  }
}

export default Twitter;