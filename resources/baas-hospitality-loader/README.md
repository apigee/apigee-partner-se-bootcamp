# loader for Baas Hospitality data

This project lets you load data into usergrid (also known as "BaaS"), or remove data from BaaS. Any data.

There are two scripts:
* loader.js - loads data into usergrid
* deleteAllItems.js -deletes the data from a collection when you are finished with it.

In particular, thee tools are handy for loading the hospitality data into any Usergrid organization and application.


## Configuring 

You need to set the organization and application, as well as credentials, either user credentials or client credentials, into the config/baas-connection.json file .

The same configuration is used 

### Example for user credentials

```json
{
  "org": "cheeso",
  "app": "your-application-name",
  "username" : "JoePavelski1",
  "password" : "VerySecret!!"
}
```

You must have created a user in your Usergrid application, to allow this to work.  Do this via the usergrid Admin UI. 


### Example for client credentials

```json
{
  "org": "cheeso",
  "app": "your-application-name",
  "clientId": "CLIENT_ID_GOES_HERE",
  "clientSecret": "CLIENT_SECRET_HERE"
}
```

You can find the client id and secret  in the Usergrid Admin UI for your application. 



## Loading data

1. `npm install`

2. `node ./loader`

This will create a hotels collection and fill it with data from the data/hotels.json file 


## Removing the hotels data

1. `npm install`

2. `node ./deleteAllItems.js hotels`

This will delete all items in the hotels collection. Be careful!


