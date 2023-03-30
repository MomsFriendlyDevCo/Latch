import {expect} from 'chai';
import Latch from '#lib/latch';

describe('@MomsFriendlyDevCo/Latch # Latch Class', ()=> {

	it('permission parsing', ()=> {
		expect(()=>
			new Latch('foo::bar::baz')
		).to.not.throw;

		expect(()=>
			new Latch('foo:bar::baz')
		).to.throw;

		expect(
			new Latch({
				source: 'foo',
				noun: 'bar',
				verb: 'baz',
			})
				.toString()
		).to.equal('foo::bar::baz');

		expect(
			new Latch('foo::bar::baz')
				.toObject()
		).to.deep.equal({
			source: 'foo',
			noun: 'bar',
			verb: 'baz',
		});

		expect(
			new Latch('foo::bar::baz')
				.setParser(v => /^(?<one>.+?)::(?<two>.+?)::(?<three>.+)$/.exec(v)?.groups)
				.matches(
					new Latch('foo::bar::baz')
						.setParser(v => /^(?<one>.+?)::(?<two>.+?)::(?<three>.+)$/.exec(v)?.groups)
				)
		).to.be.true;
	});

	it('permission match checking', ()=> {
		expect(
			new Latch('foo::bar::baz').matches('foo::bar::baz')
		).to.be.true;

		expect(
			new Latch('foo::bar::baz').matches('foo::bar::quz')
		).to.be.false;

		expect(
			new Latch('foo::bar::baz').matches(new Latch('foo::bar::baz'))
		).to.be.true;

		expect(
			new Latch('foo::bar::baz').matches(new Latch('foo::bar::quz'))
		).to.be.false;
	});

	it('permission masking', ()=> {
		expect(
			new Latch('foo::@::@')
				.mask('...::bar::baz')
				.toString()
		).to.equal('foo::bar::baz')

		expect(
			new Latch('foo::@::@')
				.mask({
					noun: 'BAR',
					verb: 'BAZ',
				})
				.toString()
		).to.equal('foo::BAR::BAZ')
	});

});
