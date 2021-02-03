// Dependencies
var config = require('../config/paperwatch.json');
var logger = require('./lib/logger');
var winston = require('winston');
require('winston-papertrail').Papertrail;

var transports = {};

// Handler function
exports.handler = function(event, context, callback){

  // Extract data from event
  logger.extract(event, function(err, data){
    if(err)
      return callback(err);

    var hostname = "Lambda_" + data.owner + "_" + process.env.AWS_REGION;
    var program = data.logGroup.split('/').pop();

    // Build a dictionary of hostname and programs
    if(!(hostname in transports)){
      transports[hostname] = {};
    }

    var papertrail;
    if(program in transports[hostname]){
      papertrail = transports[hostname][program]
    }else{
      // Construct the winston transport for forwarding lambda logs to papertrail
      papertrail = new winston.transports.Papertrail({
        level: 'silly',
        host: config.host,
        port: config.port,
        hostname: hostname,
        program: program,
        logFormat: function (level, message){
          return message;
        }
      });
      // Store the transport globally
      transports[hostname][program] = papertrail
    }
    // post the logs
    logger.post(data, papertrail, callback);
  });
};
