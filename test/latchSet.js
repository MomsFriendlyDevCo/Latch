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

		expect(latchSet.toArray()).to.deep.equal([
			'foo::bar::one',
			'foo::bar::two',
			'foo::bar::three',
		]);
	});

	it('permission masking', ()=> {
		let latchSet = new LatchSet()
			.add('foo::bar::@')

		expect(latchSet
			.mask('...::...::baz')
			.toArray()
		).to.deep.equal([
			'foo::bar::baz',
		]);

		expect(latchSet
			.mask('...::...::baz')
			.has('foo::bar::baz')
		).to.be.true;

		expect(latchSet
			.mask({verb: 'baz'})
			.toArray()
		).to.deep.equal(['foo::bar::baz'])
	});

	it('permission masking + guessing verbs from requests', ()=> {
		let latchSet = new LatchSet().add('foo::bar::@');

		expect(latchSet.maskFromRequest({
			method: 'GET',
		})
		.toArray()).to.deep.equal(['foo::bar::query'])

		expect(latchSet.maskFromRequest({
			method: 'GET',
			params: {
				id: '123',
			},
		})
		.toArray()).to.deep.equal(['foo::bar::get'])

		expect(latchSet.maskFromRequest({
			method: 'GET',
			params: {
				id: 'count',
			},
		})
		.toArray()).to.deep.equal(['foo::bar::count'])

		expect(latchSet.maskFromRequest({
			method: 'GET',
			params: {
				id: 'meta',
			},
		})
		.toArray()).to.deep.equal(['foo::bar::meta'])

		expect(latchSet.maskFromRequest({
			method: 'DELETE',
			params: {
				id: '123',
			},
		})
		.toArray()).to.deep.equal(['foo::bar::delete'])

		expect(latchSet.maskFromRequest({
			method: 'POST',
		})
		.toArray()).to.deep.equal(['foo::bar::create'])

		expect(latchSet.maskFromRequest({
			method: 'POST',
			params: {
				id: '123',
			},
		})
		.toArray()).to.deep.equal(['foo::bar::save'])
	});

	it('hierarchical permissions', ()=> {
		expect(new LatchSet()
			.add('foo::bar::all')
			.grant('foo::bar::all', 'foo::bar::foo')
			.grant('foo::bar::foo', 'foo::bar::flarp')
			.grant('foo::bar::all', ['foo::bar::bar', 'foo::bar::baz'])
			.grant('foo::bar::all', ['foo::bar::corge', new Latch('foo::bar::grault')])
			.toArray()
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
			.toArray()
		).to.deep.equal([
			'foo::bar::all',
		]);
	});

});
