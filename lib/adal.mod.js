"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _adal = _interopRequireDefault(require("./adal"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
/**
 * Validates each resource token in cache againt current user
 */
_adal["default"].prototype.invalidateResourceTokens = function () {
  var _this = this;
  if (!this.config.endpoints) {
    return;
  }
  var idToken = this._getItem(this.CONSTANTS.STORAGE.IDTOKEN);
  if (!idToken) {
    return;
  }
  var _this$_extractIdToken = this._extractIdToken(idToken),
    upn = _this$_extractIdToken.upn;
  var resources = Object.values(this.config.endpoints);
  resources.forEach(function (r) {
    return _this._clearStaleResourceToken(r, upn);
  });
};

/**
 * Clears cache for the given resource if it doesn't belong to current user's UPN
 * @param {string} currentUserUpn Unique user identifier
 * @param {string} resource a URI that identifies the resource
 */
_adal["default"].prototype._clearStaleResourceToken = function (resource, currentUserUpn) {
  var resourceToken = this.getCachedToken(resource);
  if (resourceToken) {
    var _this$_extractIdToken2 = this._extractIdToken(resourceToken),
      upn = _this$_extractIdToken2.upn;
    if (typeof upn == 'string' && typeof currentUserUpn == 'string' && upn.toLowerCase() !== currentUserUpn.toLowerCase()) {
      this.info("Clearing invalid cache of resource ".concat(resource));
      this.clearCacheForResource(resource);
    }
  }
};
var _default = exports["default"] = _adal["default"];