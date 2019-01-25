
class MiddlewaresMechanism {

	constructor (instance = Object) {
		// this.instance = instance;

		let self = this;

		self.middleWares = [async (data) => {
			let next = data.next;
			data.next = undefined;
			return await next(data);
		}];

		instance.use = function (middleWare = null, rejectMiddleware = Function) {

			if (middleWare && typeof middleWare == "function") {
				self.middleWares.push(async (p) => {
					let next = p.next;
					return new Promise((resolve, reject) => {
						
						middleWare(p).then(resNext => {
							if (resNext) return resolve(p);
							p.next = undefined;
							return resolve(p);
						}).catch(async (e) => {

							if (rejectMiddleware && typeof rejectMiddleware == "function") {
								rejectMiddleware(e)
							} else {
								console.log(e);
							}

							return resolve(await next());
						});

					});

				});
			}

			return this;

		}
	}

	async run (thread = {}) {
		
		let self = this;

		let setupedMiddleWare = 0;

		thread.next = next;
		async function next (changedThread) {
			// If not pushed new thread in next middleware with await next(data)
			if (typeof changedThread != "object" || !changedThread) changedThread = thread;
			
			// Call to next middleware
			setupedMiddleWare += 1;

			for (let prop in changedThread) {
				if (thread[prop] == undefined) { // if it was deleted by middleware, not changed
					thread[prop] = changedThread[prop]; // need add deleted property
				}
			}

			// so, now we can use changed data in this new middleware
			thread.next = next;
			if (self.middleWares[setupedMiddleWare]) {
				let res = await self.middleWares[setupedMiddleWare](thread);
				// console.log('Res from ', setupedMiddleWare)
				if (!res) return thread

				return res;
			} else {
				return thread;
			}
		}

		if (self.middleWares.length) {

			let res = await self.middleWares[setupedMiddleWare](thread);

			if (typeof res != "object" || !res) {
				res = {}
			}	

			for (let prop in thread) {
				if (res[prop] == undefined) {
					res[prop] = thread[prop]
				}
			}

			return res;
		}

		return thread;
	}

}

module.exports = MiddlewaresMechanism;