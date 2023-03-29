import Latch from '#lib/latch';

export default class LatchSet {
	// State {{{
	/**
	* Latch members of this set
	* @type {Object<Latch>}
	*/
	#members = [];


	/**
	* Latch members by ID
	* @type {Object<Latch>}
	*/
	#membersById = {};


	/**
	* Downstream functoinality inherited by member latches
	* @type {Object<Function>}
	*/
	handlers = {};
	// }}}

	// Membership - add() {{{
	/**
	* Extend the current latchSet members with additional members
	* @param {Latch|String|Array<Latch>|Array<String>} members... Additional memberships to award
	* @returns {LatchSet} This LatchSet instance
	*/
	add(...members) {
		this.#members = this.#members.concat(
			members.flat(2).map(member => // Flatten arrays of arrays etc.
				member instanceof Latch
					? member
						.setParent(this)
					: new Latch(member)
						.setParent(this)
			)
		);

		// Rebuild ID lookup table
		this.#membersById =
			Object.fromEntries(
				this.#members
					.map(member => [member.toString(), member])
			);

		return this;
	}
	// }}}

	// Sub-membership - grant() {{{
	/**
	* Grant a sub-membership based on the presence of an existing membership
	* @param {Latch|String} existing Existing Latch(es) which implies the membership
	* @param {Latch|String|Array<Latch>|Array<String>} members... Additional memberships to award
	* @returns {LatchSet} This LatchSet instance
	*/
	grant(existing, ...members) {
		if (this.hasAll(existing)) { // Grant only if hasAll() passes
			this.add(members);
		}

		return this;
	}
	// }}}

	// Presence querying - has{,All,Any}() {{{
	/**
	* Query if a given member exists within the latch set
	* @param {Latch|String} member The member to query
	* @returns {Boolean} Boolean true if the member exists, false otherwise
	*/
	has(member) {
		return Object.hasOwn(this.#membersById, member);
	}


	/**
	* Query if ALL specified members exists within this latch set
	* @param {Latch|String|Array<Latch>|Array<String>} members The members to query
	* @returns {Boolean} Boolean true if ALL members exist, false otherwise
	*/
	hasAll(...members) {
		return members.flat().every(m => this.has(m));
	}


	/**
	* Query if SOME of the specified members exist within this latch set
	* @param {Latch|String|Array<Latch>|Array<String>} members The members to query
	* @returns {Boolean} Boolean true if SOME members exist, false otherwise
	*/
	hasAny(...members) {
		return members.flat().some(m => this.has(m));
	}
	// }}}

	// Output - asArray() {{{
	asArray() {
		return Object.keys(this.#membersById);
	}
	// }}}
}
