class EasyVK {

	/**
	 *
	 *	This function return a GET url with parameters. If you want get url encoded string from object you can use it.
	 *
	 *	@param {Object} object it is clear, man! it just a object.................. :(
	 *	
	 *	@return {String}
     *
	 */

	static urlencode(object = {}) {
	    
	    function serialiseObject (obj) {
		    var pairs = [];
			for (var prop in obj) {
				if (!obj.hasOwnProperty(prop)) {
					continue;
				}
				if (Object.prototype.toString.call(obj[prop]) == '[object Object]') {
					pairs.push(serialiseObject(obj[prop]));
					continue;
				}
				pairs.push(prop + '=' + encodeURIComponent(obj[prop]));
			}

			return pairs.join('&');
	    }

		var str = serialiseObject(object);
		return str;
	}


	// Only for me, but you can use it if understand how

	static checkErrors(rvk) {

		try {
			if (rvk['error']) {
				

				if (rvk['error'] == "need_captcha" || rvk['error']['error_code'] == 14) {
					return rvk;
				} else if (rvk['error'] == "need_validation") {
					var type = "sms";
					if (rvk['validation_type'].match('app')) type = "app";
					return "Please, enter your "+ type +" code in code parameter!";
				}

				if (rvk['error']['error_msg']) {
					return rvk['error']['error_msg'];
				} else if (rvk['error']['message']) {
					return rvk['error']['message'];
				} else {
					return rvk['error_description'];
				}
			}
		} catch (e) {
			return e;
		}
	}
}

module.exports = EasyVK;