## Aggregator of climbing shoes prices

> javascript web scrapper that finds climbing shoes and stores it in a google sheet

#### How to use it

Install a recent node version and run `npm install` to install all dependencies

Change the google sheet id code in `index.js` to your own google sheet

```
...
const sheet = new GoogleSheetWrite('<insert your own here>');
...
```

Run it using `npm start`

The first run will require you to generate a OAuth2.0 token, follow the instructions that should add a `client_secret.json` to the directory of this code.

Then run it again and follow Google's instructions to get the code, write it on the console and voilá! It should work.
