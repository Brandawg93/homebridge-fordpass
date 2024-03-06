<p align="center">
  <a href="https://github.com/homebridge/verified/blob/master/verified-plugins.json"><img alt="Homebridge Verified" src="https://raw.githubusercontent.com/Brandawg93/homebridge-fordpass/master/branding/Homebridge_x_FordPass.svg?sanitize=true" width="500px"></a>
</p>

# homebridge-fordpass

Control your Ford vehicle in HomeKit using [Homebridge](https://github.com/nfarina/homebridge) with this plugin.

[![NPM](https://nodei.co/npm/homebridge-fordpass.png?compact=true)](https://nodei.co/npm/homebridge-fordpass/)

[![PayPal](https://img.shields.io/badge/paypal-donate-blue?logo=paypal)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=CEYYGVB7ZZ764&item_name=homebridge-fordpass&currency_code=USD&source=url)

[![verified-by-homebridge](https://img.shields.io/badge/homebridge-verified-blueviolet?color=%23491F59)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
![build](https://github.com/Brandawg93/homebridge-fordpass/workflows/build/badge.svg)
[![Discord](https://camo.githubusercontent.com/7494d4da7060081501319a848bbba143cbf6101a/68747470733a2f2f696d672e736869656c64732e696f2f646973636f72642f3433323636333333303238313232363237303f636f6c6f723d373238454435266c6f676f3d646973636f7264266c6162656c3d646973636f7264)](https://discord.gg/8fVmcU)
[![Downloads](https://img.shields.io/npm/dt/homebridge-fordpass?logo=npm)](https://nodei.co/npm/homebridge-fordpass/)

[![npm (tag)](https://img.shields.io/npm/v/homebridge-fordpass/latest?logo=npm)](https://www.npmjs.com/package/homebridge-fordpass/v/latest)
[![npm (tag)](https://img.shields.io/npm/v/homebridge-fordpass/test?logo=npm)](https://www.npmjs.com/package/homebridge-fordpass/v/test)
[![GitHub commits since latest release (by date)](https://img.shields.io/github/commits-since/brandawg93/homebridge-fordpass/latest?logo=github)](https://github.com/Brandawg93/homebridge-fordpass/releases/latest)

## WARNING
Ford is locking accounts of users who use this plug-in. See #196 for more info. 

## Prerequisites
Your vehicle must be connected to [FordPass Connect](https://owner.ford.com/fordpass/fordpass-sync-connect.html). Download the app or contact your local dealer to see if your vehicle is compatible with FordPass Connect.

<a href="https://play.google.com/store/apps/details?id=com.ford.fordpass&hl=en_US&gl=US" aria-label="Google Play store opens in new tab or window" target="_blank" class="cx-cta cx-cta--image"></a>&nbsp;
<a href="https://apps.apple.com/us/app/fordpass/id1095418609" aria-label="Apple App Store opens in new tab or window" target="_blank" class="cx-cta cx-cta--image"></a>

## Installation
1. Install this plugin using: `npm install -g --unsafe-perm homebridge-fordpass`
2. Add username, passwrod, and vehicles to `config.json`
3. Run [Homebridge](https://github.com/nfarina/homebridge)

### Config.json Example
```
{
    "batteryName": "Battery",
    "autoRefresh": true,
    "refreshRate": 30,
    "chargingSwitch": true,
    "plugSwitch": true,
    "application_id": "APPLICATION_ID",
    "client_id": "CLIENT_ID",
    "client_secret": "SECRET_ID",
    "code": "FORD_AUTH_CODE",
    "platform": "FordPass"
}
```

## FordPass API Signup Process

1. First, you MUST have a FordPass account. If you don't, you will need to do that first and that's outside of the scope for these instructions. [Start here](https://www.ford.com/support/how-tos/fordpass/getting-started-with-fordpass/download-fordpass/)
2. Sign up at FordPass API program at [developer.ford.com](https://developer.ford.com/).
3. Go to [FordConnect](https://developer.ford.com/apis/fordconnect) and request access.
4. Create Application Credentials at [https://developer.ford.com/my-developer-account/my-dashboard](https://developer.ford.com/my-developer-account/my-dashboard) and copy Secret 1 Hint.
5. Paste Secret into "client_secret" property of config.
6. Construct this URL in your Browser: 

https://fordconnect.cv.ford.com/common/login/?make=F&application_id=AFDC085B-377A-4351-B23E-5E1D35FB3700&client_id=30990062-9618-40e1-a27b-7c6bcb23658a&response_type=code&state=123&redirect_uri=https%3A%2F%2Flocalhost%3A3000&scope=access

7. application_id and client_id may be different.  Review the FordPass API Documentation found in the Ford Developer website to verify if different. application_id goes into "application_id" of config and client_id goes into "client_id" of config. 
8. Sign in with your FordPass login that you use for FordPass' app. 
9. Select the car you wish to integrate with.
10. Click Authorize
11. The page will eventually send you to an invalid page.  This is normal. Copy the URL into a notepad, delete everything from the beginning of the url until after code=
12. Take the remaining text and copy it for the FordPass Plugin config's "code" property.

## Things to try
- "Hey siri, turn on my car."
- "Hey siri, is the mustang locked?"
- "Hey siri, lock the raptor."
- "Hey siri, what is the fuel level of my fusion?"

## Donate to Support homebridge-fordpass
This plugin was made with you in mind. If you would like to show your appreciation for its continued development, please consider [sponsoring me on Github](https://github.com/sponsors/Brandawg93).

<sub><sup>**Disclaimer:** This plugin and its contributers are not affiliated with Ford Motor Company in any way.</sub></sup>
