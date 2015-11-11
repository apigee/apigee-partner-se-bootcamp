#API Services: Lesson 1 - Backend-as-a-Service

##Overview

##Objectives

##Prerequisites
- [x] Edge Micro ZIP File is downloaded to local folder
- [x] Node 4.2.1 or later is installed
```
node -v
v4.2.1
```
- [x] Have access to Edge Org

##Estimated Time: 15 mins

###Download and configure Edge Micro
Unzip the 
cd cli/bin

###Configure the micro gateway to talk to the Edge deployment on public/private cloud
```
./edgemicro configure
```
Copy the Key and Secret, for later parts of the exercise

```
Success Message
```
###Verify that the edge micro is configured with the Edge Cloud org
/edgemicro verify

###Create a passthrough API Proxy that will run on Edge Micro
Create a Edge Micro Proxy on Edge Public Cloud for your API

###Start the Edge Micro

```
cd agent
npm start
```
Open a new terminal
Start the Edge Micro Agent
```
./edgemicro agent proc -c start -k ....
```

Description of Edge Micro Agent

###Test the API locally
Curl or postman 

base path: http://localhost:8000/,,,,

### Check the analytics

### API Key Validation



