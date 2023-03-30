import {expect} from 'chai';
import Latch from '#lib/latch';
import LatchSet from '#lib/latchSet';

describe.only('@MomsFriendlyDevCo/Latch # custom sets', ()=> {

	let latchSet;
	it('setup LatchSet instance', ()=> {
		let customParser = v =>
			/^role:(?<role>.+)$/.exec(v)?.groups
			|| /^entity:(?<source>.+?)::(?<noun>.+?)::(?<verb>.+)$/.exec(v)?.groups;

		let customStringify = parts =>
			parts.role
				? `role:${parts.role}`
				: `entity:${parts.source}::${parts.noun}::${parts.verb}`;

		latchSet = new LatchSet()
			.setParser(customParser)
			.setStringify(customStringify)

		expect(latchSet.handlers.fromString).to.equal(customParser);
		expect(latchSet.handlers.toString).to.equal(customStringify);
	});

	it('add basic role', ()=> {
		latchSet.add('role:manager');
	});

	it('add multiple roles', ()=> {
		// Throws because the latch can't parse the incoming string without having a parent
		expect(()=> {
			latchSet.add('role:owner' , new Latch('role:sales'));
		}).to.throw;

		// Correct, if long-winded method
		latchSet.add('role:owner' , new Latch().setParent(latchSet).set('role:sales'));
	});

	it('grant fine-grained permissions', ()=> {
		latchSet
			.grant('role:manager', 'entity:acme-co::sales::manage')
			.grant('role:sales', ['entity:acme-co::sales::{manage,create}'])
			.grant('role:owner', 'entity:acme-co::*::*')
	});

	it('create expected roles', ()=> {
		expect(
			latchSet
				.toArray()
				.filter(v => v.startsWith('role:'))
				.sort()
		).to.deep.equal([
			'role:manager',
			'role:owner',
			'role:sales',
		]);
	});

	it('create expected permissions', ()=> {
		expect(
			latchSet
				.toArray()
				.sort()
		).to.deep.equal([
			'entity:acme-co::*::*',
			'entity:acme-co::sales::create',
			'entity:acme-co::sales::manage',
			'role:manager',
			'role:owner',
			'role:sales',
		]);
	});
});
