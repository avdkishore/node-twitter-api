"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _querystring = _interopRequireDefault(require("querystring"));

var _oauth = _interopRequireDefault(require("oauth"));

var _request = _interopRequireDefault(require("request"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

const VERSION = '1.8.0';
const baseURL = 'https://api.twitter.com/1.1/';
const uploadBaseURL = 'https://upload.twitter.com/1.1/';
const authURL = 'https://twitter.com/oauth/authenticate?oauth_token=';

let Twitter =
/*#__PURE__*/
function () {
  function Twitter({
    consumerKey,
    consumerSecret,
    x_auth_access_type,
    callback
  }) {
    _classCallCheck(this, Twitter);

    this.VERSION = VERSION;
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.x_auth_access_type = x_auth_access_type;
    this.callback = callback;
    this.oa = new _oauth.default.OAuth('https://twitter.com/oauth/request_token', 'https://twitter.com/oauth/access_token', this.consumerKey, this.consumerSecret, '1.0A', this.callback, 'HMAC-SHA1');
  }

  _createClass(Twitter, [{
    key: "checkIfCallbackIsSent",
    value: function checkIfCallbackIsSent(callback) {
      return typeof callback === 'function';
    }
  }, {
    key: "getAuthUrl",
    value: function getAuthUrl(requestToken, options) {
      let extraArgs = '';

      if (options && options.force_login) {
        extraArgs = `${extraArgs}&force_login=1`;
      }

      if (options && options.screen_name) {
        extraArgs = `${extraArgs}&screen_name=${options.screen_name}`;
      }

      return `${authURL}${requestToken}${extraArgs}`;
    }
  }, {
    key: "response",
    value: function response({
      callback,
      promiseHandler,
      success,
      error,
      ...rest
    }) {
      const isCallback = this.checkIfCallbackIsSent(callback);
      return isCallback ? success ? callback(null, { ...rest
      }) : callback(error) : success ? promiseHandler({ ...rest
      }) : promiseHandler(error);
    }
  }, {
    key: "getRequestToken",
    value: function getRequestToken(callback) {
      return new Promise((resolve, reject) => {
        return this.oa.getOAuthRequestToken({
          x_auth_access_type: this.x_auth_access_type
        }, (error, oauthToken, oauthTokenSecret, results) => {
          if (error) {
            return this.response({
              callback,
              promiseHandler: reject,
              success: false,
              error
            });
          }

          return this.response({
            callback,
            promiseHandler: resolve,
            success: true,
            oauthToken,
            oauthTokenSecret,
            results
          });
        });
      });
    }
  }, {
    key: "getAccessToken",
    value: function getAccessToken(requestToken, requestTokenSecret, oauth_verifier, callback) {
      return new Promise((resolve, reject) => {
        return this.oa.getOAuthAccessToken(requestToken, requestTokenSecret, oauth_verifier, (error, oauthAccessToken, oauthAccessTokenSecret, results) => {
          if (error) {
            return this.response({
              callback,
              promiseHandler: reject,
              success: false,
              error
            });
          }

          return this.response({
            callback,
            promiseHandler: resolve,
            success: true,
            oauthAccessToken,
            oauthAccessTokenSecret,
            results
          });
        });
      });
    }
  }, {
    key: "verifyCredentials",
    value: function verifyCredentials(accessToken, accessTokenSecret, params, callback) {
      let url = `${baseURL}account/verify_credentials.json`;

      if (typeof params == 'function') {
        callback = params;
      } else {
        const query = _querystring.default.stringify(params);

        url = `${url}?${query}`;
      }

      return new Promise((resolve, reject) => {
        return this.oa.get(url, accessToken, accessTokenSecret, (error, data, response) => {
          if (error) {
            return this.response({
              callback,
              promiseHandler: reject,
              success: false,
              error
            });
          }

          try {
            const parsedData = JSON.parse(data);
            return this.response({
              callback,
              promiseHandler: resolve,
              success: true,
              data: parsedData,
              response
            });
          } catch (e) {
            return this.response({
              callback,
              promiseHandler: reject,
              sucess: false,
              error: e
            });
          }
        });
      });
    }
  }]);

  return Twitter;
}();

var _default = Twitter;
exports.default = _default;