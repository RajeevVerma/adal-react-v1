"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AuthenticationContext = void 0;
exports.adalFetch = adalFetch;
exports.adalGetToken = adalGetToken;
exports.runWithAdal = runWithAdal;
exports.withAdalLogin = void 0;
var _react = _interopRequireDefault(require("react"));
var _adal = _interopRequireDefault(require("./adal.mod"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } // eslint-disable-next-line
var isSSR = typeof window === 'undefined';

// fake context on SSR
var AuthenticationContext = exports.AuthenticationContext = isSSR ? function () {} : _adal["default"];
var redirectMessages = ['AADSTS16002',
// old sid - https://github.com/salvoravida/react-adal/issues/46
'AADSTS50076',
// MFA support - https://github.com/salvoravida/react-adal/pull/45
'AADSTS50079' // MFA support
];
function shouldAcquireNewToken(message) {
  return redirectMessages.some(function (v) {
    return message.indexOf(v) !== -1;
  });
}
function parseResourceInfo(resourceInfo) {
  return typeof resourceInfo === 'string' ? {
    resourceGuiId: resourceInfo
  } : resourceInfo;
}
function adalGetToken(authContext, resourceInfo, callback) {
  var _parseResourceInfo = parseResourceInfo(resourceInfo),
    resourceGuiId = _parseResourceInfo.resourceGuiId,
    extraQueryParameters = _parseResourceInfo.extraQueryParameters,
    claims = _parseResourceInfo.claims;
  return new Promise(function (resolve, reject) {
    authContext.acquireToken(resourceGuiId, function (message, token, msg) {
      if (!msg) {
        resolve(token);
      } else if (shouldAcquireNewToken(message)) {
        // Default to redirect for multi-factor authentication
        // but allow using popup if a callback is provided
        if (callback) {
          authContext.acquireTokenPopup(resourceGuiId, extraQueryParameters, claims, callback);
        } else {
          authContext.acquireTokenRedirect(resourceGuiId, extraQueryParameters, claims);
        }
      } else reject({
        message: message,
        msg: msg
      }); // eslint-disable-line
    });
  });
}
function runWithAdal(authContext, app, doNotLogin) {
  // SSR support
  if (isSSR) {
    if (doNotLogin) app();
    return;
  }
  // it must run in iframe too for refreshToken (parsing hash and get token)
  authContext.handleWindowCallback();

  // Clear the resource cache on new login
  // https://github.com/salvoravida/react-adal/issues/68
  authContext.invalidateResourceTokens();

  // prevent iframe double app !!!
  if (window === window.parent) {
    if (!authContext.isCallback(window.location.hash)) {
      // adal sdk assigns clientId if loginResource is not provided
      var resource = authContext.config.loginResource;
      var token = authContext.getCachedToken(resource);
      var user = authContext.getCachedUser();
      if (!token || !user) {
        if (doNotLogin) {
          app();
        } else {
          authContext.login();
        }
      } else {
        app();
      }
    }
  }
}
function adalFetch(authContext, resourceInfo, fetch, url, options) {
  return adalGetToken(authContext, resourceInfo).then(function (token) {
    var o = options || {};
    if (!o.headers) o.headers = {};
    o.headers.Authorization = "Bearer ".concat(token);
    return fetch(url, o);
  });
}

// eslint-disable-next-line
var withAdalLogin = exports.withAdalLogin = function withAdalLogin(authContext, resourceInfo) {
  // eslint-disable-next-line
  return function (WrappedComponent, renderLoading, renderError) {
    return /*#__PURE__*/function (_React$Component) {
      function _class(props) {
        var _this;
        _classCallCheck(this, _class);
        _this = _callSuper(this, _class, [props]);
        _defineProperty(_this, "safeSetState", function (state) {
          if (_this.mounted) {
            _this.setState(state);
          } else {
            _this.todoSetState = state;
          }
        });
        _defineProperty(_this, "componentDidMount", function () {
          _this.mounted = true;
          if (_this.todoSetState) {
            _this.setState(_this.todoSetState);
          }
        });
        _defineProperty(_this, "componentWillUnmount", function () {
          _this.mounted = false;
        });
        _this.state = {
          logged: false,
          error: null
        };

        // #67 Using react-adal with Server Side Rendering(Next.js)
        if (!isSSR) {
          adalGetToken(authContext, resourceInfo).then(function () {
            _this.safeSetState({
              logged: true
            });
          })["catch"](function (error) {
            var msg = error.msg;
            console.log('adalGetToken', error); // eslint-disable-line

            // Avoid the infinite loop when access_denied
            // https://github.com/salvoravida/react-adal/issues/33
            var loginError = authContext.getLoginError();
            var loginWasTriedButFailed = loginError !== undefined && loginError !== null && loginError !== '';
            if (loginWasTriedButFailed) {
              _this.safeSetState({
                error: loginError
              });
            } else if (msg === 'login required') {
              authContext.login();
            } else {
              _this.safeSetState({
                error: error
              });
            }
          });
        }
        return _this;
      }
      _inherits(_class, _React$Component);
      return _createClass(_class, [{
        key: "render",
        value: function render() {
          if (isSSR) return null;
          var _this$state = this.state,
            logged = _this$state.logged,
            error = _this$state.error;
          if (logged) return /*#__PURE__*/_react["default"].createElement(WrappedComponent, this.props);
          if (error) return typeof renderError === 'function' ? renderError(error) : null;
          return typeof renderLoading === 'function' ? renderLoading() : null;
        }
      }]);
    }(_react["default"].Component);
  };
};