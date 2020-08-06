<p align="center">
  <a href="https://github.com/homebridge/verified/blob/master/verified-plugins.json"><img alt="Homebridge Verified" src="https://raw.githubusercontent.com/Brandawg93/homebridge-fordpass/master/branding/Homebridge_x_FordPass.svg?sanitize=true" width="500px"></a>
</p>

# homebridge-fordpass

Control your Ford vehicle in HomeKit using [Homebridge](https://github.com/nfarina/homebridge) with this plugin.

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
    "platform": "FordPass"
}
```

## Things to try
- "Hey siri, start my car."
- "Hey siri, is the mustang locked?"
- "Hey siri, lock the raptor."

## Donate to Support homebridge-fordpass
This plugin was made with you in mind. If you would like to show your appreciation for its continued development, please consider making [a small donation](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=CEYYGVB7ZZ764&item_name=homebridge-fordpass&currency_code=USD&source=url).

## Disclaimer
This plugin and its contributers are not affiliated with Ford Motor Company in any way.
