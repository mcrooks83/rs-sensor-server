# XSENS DOT SERVER 

NOTE: this does not work on MAC Montery and has not been test on anything other than RPI Zero 2W
This is a roundabout way of getting the xsens dot server to run on a raspberry pi (it will be improved at somepoint)
I recreated the orignal server and made NO code changes to the actual implementation 
I used the "latest" available node packages for the dependencies. 

origin repo https://github.com/xsens/xsens_dot_server

## versions
node v16.17.1
"@abandonware/noble": "^1.9.2-15",
"@mapbox/node-pre-gyp": "^1.0.10",
"express": "^4.18.1",
"hashmap": "^2.4.0",
"ip": "^1.1.8",
"quaternion": "^1.4.0",
"socket.io": "^4.5.2"

## RPi Zero W

copying repo to RPi as not on git yet
tar zcvf rs-sensor-server.tgz rs-sensor-server
scp -r rs-sensor-server.tgz <user>@raspberrypi: 
sudo tar zxvf rs-sensor-server.tgz

## ISSUES

cannot access https: github repos via package.json (defaults to ssh - THING TO FIX)
Solution: manually cloned  sudo git clone https://github.com/Timeular/noble-mac.git in to node_modules

if your node / npm allows you to you can include https://github.com/Timeular/noble-mac.git  in the dependency list in package.json

start server with  sudo node xsensDotServer.js 

## docker 

install docker on rpi: 
sudo curl -fsSL https://get.docker.com -o get-docker.sh
‍sudo sh get-docker.sh

### add the user to docker group
sudo usermod -aG docker ${USER}
groups ${USER}
sudo su ${USER} 
(should work now..if not reboot pi)

## build container
sudo docker build -t sensor-server . 

## run container
sudo docker run  --net=host --privileged -p 8080:8080 sensor-server

or

docker run  --net=host --privileged  sensor-server

Web GUI Handler instantiated
BLE Handler started.
Webserver listening on port 8080, IP address: 192.168.1.151
blePoweredOn: true

## access from laptop  (assuming rpi is on same network and connected)
<ip>:<8080>


## I used this to create the app itself from scratch
DEV: docker run -it -d --name sensor-server --mount type=bind,source="$(pwd)",target=/app sensor-server
docker exec -it sensor-server /bin/bash

## steps to create dependencies from scratch
node init
(add readme)

npm install @mapbox/node-pre-gyp --save 
npm install @abandonware/noble --save
npm install express
npm install hashmap --save
npm install ip --save
npm install quaternion --save
npm install socket.io --save
npm install noble --save 