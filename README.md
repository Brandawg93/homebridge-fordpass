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

<a href="https://play.google.com/store/apps/details?id=com.ford.fordpass&hl=en_US&gl=US" aria-label="Google Play store opens in new tab or window" target="_blank" class="cx-cta cx-cta--image">  
<img alt="Google Play" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAABWRJREFUaEPtmm1QVFUYx//PvcsuCwKyopmZ0zRp71kqA5Yy04fePjX1rS+NHxvBiEwhMpFwxFUbYXCk6UVnCoeKsmIUdEpAFJVdfEnIl8kiUHGDcSF53bfzNEtuLcPe3bvLXcCZ9huzzzn39zvn2eec5w6EO/xDdzg/QgswCASerqLBBfrycsFiI4g7wZSL5G3V001EWaA392UA348BJq4BSdlI2npluogoC9gLzKCR9eNAGQ4QtmPYWIx5m4amWkRZ4BdPGZL2P44460oQSQFArwPIR7L586mUUBY4z7tAyITxjBWmrxeCMDMgqBB1gG4NZhVfmAqR0AJeKl13B+bucgDORQEhGS4QlcMtNmD2tv7JFFEnMErkGsGcciv0XSuDAHYBeHcy0yoMgdvYSYePYUZdGoj0iiIsGoCYNTBtaYv2boQv4CUytF9EyicJIDFfWeJ2WonY9zFr061oiUQm4KWRBuy4q6Qd8sDS4HB8A6A8zDR/EY0TPXKBUQmPB0mVxxHXqlRq/dy4EUxZMJlbtdyNiQn4SIwtVpi+US61vjhmN0jaDeaNMJn/0kJEGwE1pdaflmADI1eLtNJOwFdqU8pbENu1Qt3qCiskORNJW63q4sdHaSwQRqn9L60ESNoHmXKQWHwzXJHoCIyW2t8uIuWzRJC4RxUUww7CB5hpLANtEqrGAEEaGt9dSO1MgeKkfjvmll6FNLBYzTTpw10NdVcrk43szqd01KgZE70d8D1dRakl5sHt3UfPr+2zLPeD/gky51Aqgp7m0RfwEcVbLUje/yDASf4rGytc7cc7Kmmp03bfuBUfvSRyEaWjSGk3Jk/ASxDz5x+YXeaC5F7o/fNhR88Ja0fF4nh2xQdNF+IMSsOxQDGTK+AlIMegPKfs7Nr+WmHuqc9Qk+cAFVO6yJ8WArLH3XVw54beZ/uO9uvfaXkKMR5DaAkqonSxccoF7r3ZbbEWZi5KHuz/p7szuC/r1p1KlOYM3a0owRBgXkZP4+xUCrhftTY2VXy8ZaUsMKa/FuBe/arWTmmJLVCptYM4h9Kg2HdH/TcgC4/t29KC7pfaWp5QWmUGWF5sa9atak2DzN7XaN4WdS+cYgNloCdYikVVIOVW38/WwtXz5/XZZ4XOc4BMw2di8k50It6dR6m4rGqMYtBETmIGP99mafyupGCFDiyrAQFwhYG3Yi2HD6qMHw3TfAckj8e+Z++O3187Wb9MDQiDhwjSdr2diulKrUPNGP8YTQUShocuWApXJ97fY1PulccSHhA6Oct4oqYjXHBfvDYCDM64dO7YgZL30g1uj/Lbin8p+TJDyo61HDocKbhmAiRE/4dfftSWeaTa/yIWkIuBQQLt0A8kbKELVc6Jwk/4N2B0jFw6VZQV99CNawuCwXjLJEFUuDhm/QxrjU0L8AnvwGPX2puOb85eYnQ5jSHgz8lCZMW0/NikJfhEBIbzf6g4XVBdEbTvFYJ7SaZCw4LEXVRV5YkGfNgppHe52uuL3/Ys6/j1AeVTlQWB9+ldurV0tjboKaqFlOoq9MiNzqbGouwnExzDind3FjgtyVKWvrn2lBZwauYILcBwvFFf3Vy6b3ewu/tNJhQZmpeXEdQ35GoAQ8UEFZCF+5XRu/vFc48GmogZboD2GMiVT5YjYb8SCQWn5ntFgdfLawvMX32aYxoaGNPD+iZl8FGSdWsMJ2s0fdepBlrVVcKZ+kIJE7LHTch8HSStM1gOVYb7sGjEK+7ASOqLbxJxqd+KOwm0Ux/n2EwNDQPRgIlkTkWBwWeem6dzUR2D5jPhAHmoILblkKo7eiQgkY4J/a8Gkc48SeP+F5ikhVZ8zN8UqEtPoeEaTAAAAABJRU5ErkJggg=="></a>&nbsp;
<a href="https://apps.apple.com/us/app/fordpass/id1095418609" aria-label="Apple App Store opens in new tab or window" target="_blank" class="cx-cta cx-cta--image"><img alt="Apple App Store" src="data:image/jpeg;base64,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"></a>

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
