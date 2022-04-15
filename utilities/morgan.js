const morgan = require("morgan");
const moment = require("moment-timezone");

// tokens from express-useragent
morgan.token("devicetype", function (req, res) {
  return req.device.type;
});

morgan.token("os", function (req, res) {
  return req.useragent.os;
});

morgan.token("browser", function (req, res) {
  return req.useragent.browser;
});

morgan.token("browserVersion", function (req, res) {
  return req.useragent.version;
});

// Create custom client IP token - workaround for docker/nginx proxy
morgan.token("client-addr", (req, res) => {
  return req.headers["x-forwarded-for"] || req.connection.remoteAddress;
});

// Create custom date token with proper timezone infomation - fixes logs so they are not in UTC
morgan.token("date", (req, res, tz) => {
  return moment().tz(tz).format();
});

//This tells express to log via morgan
//and morgan to log in the "combined" pre-defined format
const appmorgan = morgan(
  process.env.ACCESS_LOG_FORMAT || process.env.NODE_ENV === "production"
    ? //then
      `:client-addr - :client-addr [:date[${
        process.env.TZ || "Asia/Calcutta"
      }]] [${
        process.env.APP_NAME || "transportTV"
      }] [ACCESS] - ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms ":devicetype" ":os"`
    : //else
      `[:date[${process.env.TZ || "Asia/Calcutta"}]] [${
        process.env.APP_NAME || "transportTV"
      }] [ACCESS] - ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms`
);

module.exports = appmorgan;

/*

from express-useragent

	{
		isYaBrowser: false,
		isAuthoritative: true,
		isMobile: false,
		isMobileNative: false,
		isTablet: false,
		isiPad: false,
		isiPod: false,
		isiPhone: false,
		isiPhoneNative: false,
		isAndroid: false,
		isAndroidNative: false,
		isBlackberry: false,
		isOpera: false,
		isIE: false,
		isEdge: false,
		isIECompatibilityMode: false,
		isSafari: false,
		isFirefox: false,
		isWebkit: false,
		isChrome: true,
		isKonqueror: false,
		isOmniWeb: false,
		isSeaMonkey: false,
		isFlock: false,
		isAmaya: false,
		isPhantomJS: false,
		isEpiphany: false,
		isDesktop: true,
		isWindows: true,
		isLinux: false,
		isLinux64: false,
		isMac: false,
		isChromeOS: false,
		isBada: false,
		isSamsung: false,
		isRaspberry: false,
		isBot: false,
		isCurl: false,
		isAndroidTablet: false,
		isWinJs: false,
		isKindleFire: false,
		isSilk: false,
		isCaptive: false,
		isSmartTV: false,
		isUC: false,
		isFacebook: false,
		isAlamoFire: false,
		isElectron: false,
		silkAccelerated: false,
		browser: 'Chrome',
		version: '90.0.4430.212',
		os: 'Windows 10.0',
		platform: 'Microsoft Windows',
		geoIp: {},
		source: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
		isWechat: false
	}

*/
