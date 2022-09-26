FROM node:16

# Prepare packages
RUN apt-get update -q && apt-get install -y bluetooth bluez libbluetooth-dev libudev-dev \
    build-essential

COPY . /app
WORKDIR /app

RUN npm install -g n 
RUN node --version

## install dependencies
RUN npm install

## cd into node_modules
## clone git repo for mac noble 
## cd back to root

EXPOSE 8080

CMD ["node", "xsensDotServer"]