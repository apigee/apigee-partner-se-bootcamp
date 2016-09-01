# Utils for Backup & Restore data from API Baas

There are 3 utils in this repo,

1. Download / Backup the API Bass content
2. Cleanup an Existing Org / App in API Baas
3. Upload data to an API Baas Org / App

## Usage

#Edit config.js

```
var config = {} ;

config.org = 'yourOrg';
config.app = 'yourApp';
config.uri = "http://api.usergrid.com" ;
module.exports = config ;

```

#Sample

#Download/Backup

```
node download.js
```

#Cleanup

```
node cleanup
```

#Upload

```
node upload.js
```

## How it Works?

It uses the API Baas APIs to perform these tasks

1. Read ```/org/app``` -> It returns metadata about Collections in the org, with the count
2. Iterate each collection , ```/org/app/collection``` - to download all entities [it paginates, with page size of 1000]
3. Store the collection array in a file ```data/collection.json```

4. Upload uses these files as source for data
5. Uses the API ```POST /org/app/collection```, with the entire array. [usually worked for more then 1000 elements, We could batch it with a size of 1000 - let me know if you think this is the case]
6. Cleanup again uses the API to delete all entities in a collection

## TODO:
We could even retain all the UUIDs and the Connections, but it will take much longer time to migrate, but it will be worth a try
