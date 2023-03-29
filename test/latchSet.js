import {expect} from 'chai';
import Latch from '#lib/latch';
import LatchSet from '#lib/latchSet';

describe('@MomsFriendlyDevCo/Latch # LatchSet Class', ()=> {

	it('permission checking', ()=> {
		let latchSet = new LatchSet()
			.add(
				new Latch('foo::bar::one'),
				new Latch('foo::bar::two'),
			)
			.add('foo::bar::three');

		expect(latchSet.has('foo::bar::one')).to.be.true;

		expect(latchSet.has(new Latch('foo::bar::one'))).to.be.true;

		expect(latchSet.has(new Latch('foo::bar::four'))).to.be.false;

		expect(latchSet.hasAll(new Latch('foo::bar::one'))).to.be.true;
		expect(latchSet.hasAll(new Latch('foo::bar::one'), 'foo::bar::three')).to.be.true;
		expect(latchSet.hasAll(new Latch('foo::bar::one'), 'foo::bar::four')).to.be.false;

		expect(latchSet.hasAny(new Latch('foo::bar::one'))).to.be.true;
		expect(latchSet.hasAny(new Latch('foo::bar::one'), 'foo::bar::three')).to.be.true;
		expect(latchSet.hasAny(new Latch('foo::bar::one'), 'foo::bar::four')).to.be.true;

		expect(latchSet.asArray()).to.deep.equal([
			'foo::bar::one',
			'foo::bar::two',
			'foo::bar::three',
		]);
	});

	it.skip('permission masking', ()=> {
		let latchSet = new LatchSet()
			.add('foo::bar::@')

		expect(latchSet
			.mask('...::...::baz')
			.matches('foo::bar::baz')
		).to.be.true;

		expect(latchSet
			.mask('...::...::@')
			.matches('foo::bar::@')
		).to.be.true;

		expect(()=> latchSet
			.mask('...::...::@')
			.matches('foo::bar::@')
			.final()
		).to.throw;
	});

	it('hierarchical permissions', ()=> {
		expect(new LatchSet()
			.add('foo::bar::all')
			.grant('foo::bar::all', 'foo::bar::foo')
			.grant('foo::bar::foo', 'foo::bar::flarp')
			.grant('foo::bar::all', ['foo::bar::bar', 'foo::bar::baz'])
			.grant('foo::bar::all', ['foo::bar::corge', new Latch('foo::bar::grault')])
			.asArray()
			.sort()
		).to.deep.equal([
			'foo::bar::all',
			'foo::bar::bar',
			'foo::bar::baz',
			'foo::bar::corge',
			'foo::bar::flarp',
			'foo::bar::foo',
			'foo::bar::grault',
		]);

		// NOTE: This is out of order
		expect(new LatchSet()
			.grant('foo::bar::all', 'foo::bar::foo')
			.add('foo::bar::all')
			.asArray()
		).to.deep.equal([
			'foo::bar::all',
		]);
	});

});
