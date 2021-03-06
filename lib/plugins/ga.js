"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.googleAnalytics = googleAnalytics;

var _log = _interopRequireDefault(require("../log"));

function googleAnalytics(key) {
  return function ($) {
    _log["default"].assert(key, '[plugin.ga] key required');

    $('body').append("<script> \nvar disableStr = 'ga-disable-".concat(key, "';\n\nfunction gaOptout() {\n    document.cookie = disableStr + '=true; expires=Thu, 31 Dec 2099 23:59:59 UTC; path=/';\n    window[disableStr] = true;\n    alert('Google Analytics tracking has been disabled.');\n}\n\nif (!((window.navigator && window.navigator['doNotTrack'] == 1) || (document.cookie && document.cookie.indexOf(disableStr + '=true') !== -1))) {    \n    window.dataLayer = window.dataLayer || [];\n    function gtag(){ \n        window.dataLayer.push(arguments);\n    }\n    gtag('js', new Date());\n    gtag('config', '").concat(key, "', { 'anonymize_ip': true });\n    \n    var script = document.createElement('script');\n    script.setAttribute('async', 'async');\n    script.setAttribute('defer', 'defer');\n    script.setAttribute('src', \"https://www.googletagmanager.com/gtag/js?id=").concat(key, "\")\n    document.body.appendChild(script)\n\n    console.log('Visit has been tracked by Google Analytics.');\n} else {\n    console.log('Visit has NOT been tracked by Google Analytics.');\n}\n</script>"));
  };
}