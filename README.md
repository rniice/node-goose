# node-goose | Dobot SerialPort Driver and Gcode Interpreter Service

## update: 
- complete: refactor to socket.io complete to reduce i/o overhead
- pending: change camera service from periodic http:GET to stream

![logo by https://thenounproject.com/creativestall/](/../screenshots/screenshots/noun_394753_cc_square.png?raw=true "Logo By: Creative Stall TheNounProject")

## installation: 

### install core modules
- install nodeJS: https://nodejs.org/en/ 
- git clone https://github.com/rniice/node-goose.git 
- cd node-goose
- npm install

### install openCV binaries
- install OpenCV 2.3.1 or newer: http://opencv.org/downloads.html
- make OpenCV_DIR\bin available on system path

### install node-opencv
- git submodule init
- git submodule update
- cd private/node-opencv
- npm install

## usage:

- node server.js
- access controls at localhost:8080 via web browser

## demo laser cutting

- https://vimeo.com/album/3902621/video/164880605

- https://vimeo.com/album/3902621/video/162934513

## GUI v0.2

![GUI V0.2](/../screenshots/screenshots/dobot-control-v0.2.jpg?raw=true "GUI V0.2")

## System Architecture

![System Architecture V0.1](/../screenshots/screenshots/node-goose-app-architecture.jpg?raw=true "System Architecture V0.1")

## driver details (/private/drivers)

| Component                 | Description                                                                   |
| ------------------------- |-------------------------------------------------------------------------------|
| Dobot.js                  | top level dobot class                                                         |
| DobotCommandBuffer.js     | writes buffer dobot can understand for each command                           |
| DobotCommandBuffer.js     | writes buffer dobot can understand for each command                           |
| DobotCommandBuffer.js     | writes buffer dobot can understand for each command                           |




- Dobot.js                 //top level dobot class
- DobotCommandBuffer.js    //writes buffer dobot can understand for each command
- DobotCommandQueue.js     //state management and queueing of gcode program commands
- DobotComputerVision.js   //camera and vision tracking methods using opencv
- DobotFileManager.js      //file management for gcode programs
- DobotGcodeInterpreter.js //parses gcode command string and dispatches object to send to commandbuffer 
- DobotJogCommand.js	     //parses request for jog move and dispatches object to send to commandbuffer
- DobotResponseParser.js   //parses response from dobot into state values (position, rotation, etc).
- DobotSerial.js		       //creates, maintains, and controls serialport connection to dobot

## check back for updates soon


