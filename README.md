<p align="center">
  <a href="https://github.com/homebridge/verified/blob/master/verified-plugins.json"><img alt="Homebridge Verified" src="https://raw.githubusercontent.com/Brandawg93/homebridge-fordpass/master/branding/Homebridge_x_FordPass.svg?sanitize=true" width="500px"></a>
</p>

# homebridge-fordpass

Control your Ford vehicle in HomeKit using [Homebridge](https://github.com/nfarina/homebridge) with this plugin.

[![NPM](https://nodei.co/npm/homebridge-fordpass.png?compact=true)](https://nodei.co/npm/homebridge-fordpass/)

[![PayPal](https://img.shields.io/badge/paypal-donate-blue?logo=paypal)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=CEYYGVB7ZZ764&item_name=homebridge-fordpass&currency_code=USD&source=url)
[![BuyMeACoffee](https://img.shields.io/badge/coffee-donate-orange?logo=buy-me-a-coffee&logoColor=yellow)](https://www.buymeacoffee.com/L1FgZTD)

[![verified-by-homebridge](https://img.shields.io/badge/homebridge-verified-blueviolet?color=%23491F59)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
![build](https://github.com/Brandawg93/homebridge-fordpass/workflows/build/badge.svg)
[![Discord](https://camo.githubusercontent.com/7494d4da7060081501319a848bbba143cbf6101a/68747470733a2f2f696d672e736869656c64732e696f2f646973636f72642f3433323636333333303238313232363237303f636f6c6f723d373238454435266c6f676f3d646973636f7264266c6162656c3d646973636f7264)](https://discord.gg/8fVmcU)
[![Downloads](https://img.shields.io/npm/dt/homebridge-fordpass?logo=npm)](https://nodei.co/npm/homebridge-fordpass/)

[![npm (tag)](https://img.shields.io/npm/v/homebridge-fordpass/latest?logo=npm)](https://www.npmjs.com/package/homebridge-fordpass/v/latest)
[![npm (tag)](https://img.shields.io/npm/v/homebridge-fordpass/test?logo=npm)](https://www.npmjs.com/package/homebridge-fordpass/v/test)
[![GitHub commits since latest release (by date)](https://img.shields.io/github/commits-since/brandawg93/homebridge-fordpass/latest?logo=github)](https://github.com/Brandawg93/homebridge-fordpass/releases/latest)

## Prerequisites
Your vehicle must be connected to [FordPass Connect](https://owner.ford.com/fordpass/fordpass-sync-connect.html). Download the app or contact your local dealer to see if your vehicle is compatible with FordPass Connect.

<a href="https://c00.adobe.com/v3/6b72dd687901669e3ed55059dd6f60d5d3c844c25518eefaff82ed287725d462/start?a_dl=5ad0dab8511fb41c63233b99" aria-label="Google Play store opens in new tab or window" target="_blank" class="cx-cta cx-cta--image">  
<img alt="Google Play" src="https://owner.ford.com/ownerlibs/content/dam/ford-dot-com/cx_en_english/FordPass/1_LINCOLN-GOOGLE-store.png"></a>
<a href="https://c00.adobe.com/v3/6b72dd687901669e3ed55059dd6f60d5d3c844c25518eefaff82ed287725d462/start?a_dl=5ad0da2e511fb41c63233b8e" aria-label="Apple App Store opens in new tab or window" target="_blank" class="cx-cta cx-cta--image"><img alt="Apple App Store" src="https://owner.ford.com/ownerlibs/content/dam/ford-dot-com/cx_en_english/FordPass/1_LINCOLN-APPLE-store.png"></a>

## Installation
1. Install this plugin using: `npm install -g --unsafe-perm homebridge-fordpass`
2. Add username, passwrod, and vehicles to `config.json`
3. Run [Homebridge](https://github.com/nfarina/homebridge)

### Config.json Example
```
{
    "username": "YOUR_USERNAME",
    "password": "YOUR_PASSWORD",
    "vehicles": [
        {
            "name": "VEHICLE NAME",
            "vin": "YOUR_VIN"
        }
    ],
    "options": {
        "autoRefresh": false
    },
    "platform": "FordPass"
}
```

## Things to try
- "Hey siri, turn on my car."
- "Hey siri, is the mustang locked?"
- "Hey siri, lock the raptor."
- "Hey siri, what is the fuel level of my fusion?"

## Donate to Support homebridge-fordpass
This plugin was made with you in mind. If you would like to show your appreciation for its continued development, please consider making [a small donation](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=CEYYGVB7ZZ764&item_name=homebridge-fordpass&currency_code=USD&source=url).

<sub><sup>**Disclaimer:** This plugin and its contributers are not affiliated with Ford Motor Company in any way.</sub></sup>
