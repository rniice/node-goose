var usb = require('usb'); //NEEDS LIBUSB Binaries to work

var _vid = 0x2A89;
var _pid = 0x8889;


var dobot = new usb.findByIds(_vid,_pid);


dobot.open();

var usbInterface = dobot.interface(0);
usbInterface.claim();

var __endpointRead = usbInterface.endpoint(0x81);
var __endpointWrite = usbInterface.endpoint(0x1);


dobot.endpointWrite.transferType = usb.LIBUSB_TRANSFER_TYPE_BULK; //change to bulk transfer mode


__endpointRead.startPoll(3,100); //open a streaming transfer from the endpoint
__endpointRead.on("data", function (data) { //start the event loop listening
        console.log(data);
});

__endpointRead.on('error', function(error) {
    logger.warn('Error on USB read end point: ', error);
    logger.warn('Error #' + error.errno);
    if (error.errno === usb.LIBUSB_TRANSFER_STALL || error.errno === 1) { // USB was pulled out.
        usbInterface.release(false, function(error) {
	        if (error) {
	            logger.error('Error when releasing USB interface: ', error);
	        } else {
	            logger.warn('USB interface released');
	        }
	    });
    }
});
