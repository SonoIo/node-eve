import Customers from "../../lib/collections/Customers";

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
		const customers = new Customers();
		customers.fetch({
			success: () => {
				assert.lengthOf(customers, 10, 'customers.length should be 10');
				done();
			},
			error: (collection, error, options) => {
				done(error);
			}
		});
	});

});
