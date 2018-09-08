"use strict";

const request = require("request");
const staticMethods = require("./staticMethods.js");
const EventEmitter = require("events");

let stack = [];

class RequestsDebugger extends EventEmitter {
	
	constructor () {
		super();
	}

	//Push to debugger
	push (type = "response", data) {
		let self = this;
		
		let logData = {
			type: type.toString(),
			data: data
		};
		
		stack.splice(0, 1); 
		stack.push(logData);
		
		self.emit("push", logData);

		return (stack.length - 1);
	}

	//Get last log from stack
	lastLog () {
		return stack[stack.length - 1];
	}
}

module.exports = RequestsDebugger;