let VKResponseReturner = function(staticMethods, dataResponse_) {
	
	let response_ = dataResponse_;
	class VKResponse {
		constructor(dataResponse) {
			
			let self = this;

			if (!dataResponse) dataResponse = {}

			let _props = {
				response: dataResponse
			}

			let canChanged = [];
			
			for (let prop in _props) {
				
				let settings = {
					value: _props[prop]
				}

				if (canChanged.indexOf(prop) != -1) {
					settings.configurable = true;
				}

				Object.defineProperty(self, prop, settings);
			}


			//Use session data with methods
			for (let prop in self.response) {
				
				Object.defineProperty(self, prop, {
					enumerable: true,
					configurable: true,
					value: self.response[prop],
				});

			}

			return self;
		}

		getFullResponse() {
			return response_;
		}

	}


	let res = response_.response;

	if (staticMethods.isString(res) || !isNaN(res) || res instanceof Boolean) {
		return res;
	} else if (Array.isArray(res)) {
		
		class VKResponse extends Array {
			constructor () {
				super(...arguments);
			}
		}

		return new VKResponse(...res);

	} else if (staticMethods.isObject(res)) {
		return new VKResponse(res);
	} else {
		return res; //nice, stupid boyyyy
	}

}


module.exports = VKResponseReturner;
