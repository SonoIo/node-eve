// Import model and collections from the main project
// import Customers from "../../lib/collections/Customers";

const assert = chai.assert;

describe('Customers', () => {

	before((done) => {
		done();
	});

	beforeEach((done) => {
		done();
	});

	afterEach((done) => {
		done();
	});

	after((done) => {
		done();
	});

	it('should fetch all users', (done) => {
		setTimeout(() => done(), 500);
	});

	it('should use async/await', async (done) => {
		const wait = () => {
			return new Promise((resolve, reject) => {
				setTimeout(() => resolve(true), 2000);
			});
		};
		const result = await wait();
		assert.isTrue(result, 'It should have been true');
		done(); // Remember to call done!
	});

});
