import braces from 'braces';
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
	handlers = {
		toObject(parts) {
			return parts;
		},
		toString(parts) {
			return `${parts.source}::${parts.noun}::${parts.verb}`;
		},
		fromString(v) {
			return /^(?<source>.+?)::(?<noun>.+?)::(?<verb>.+)$/.exec(v)?.groups
				|| (()=> { throw new Error(`Invalid input format "${v}" - expected format "SOURCE::NOUN::VERB"`) })();
		},
		masks: {
			ignore: ['...', '@'],
		},
	}
	// }}}

	// Settings {{{
	settings = {
		extendBraces: true,
	};


	/**
	* Set a single setting or overwrite existing settings
	* @param {String|Object} option Either the single setting to set OR an object to merge
	* @returns {LatchSet} This LatchSet instance
	*/
	setOption(option, value) {
		if (typeof option == 'string') {
			if (Object.hasOwn(this.settings, option)) throw new Error('Unknown sestting "${option}"');
			this.settings[option] = value;
		} else if (typeof option == 'object' && !value) {
			Object.assign(this.settings, option);
		} else {
			throw new Error('Unknown option type');
		}

		return this;
	}
	// }}}

	// Membership - add(), clear(), rebuild() {{{
	/**
	* Extend the current latchSet members with additional members
	* @param {Latch|String|Array<Latch>|Array<String>} members... Additional memberships to award
	* @returns {LatchSet} This LatchSet instance
	*/
	add(...members) {
		this.#members = this.#members.concat(
			members
				.flat(2) // Flatten arrays of arrays etc.
				.flatMap(member => typeof member == 'string' && this.settings.extendBraces // Extend braces
					? braces(member, {expand: true})
					: member
				)
				.map(member => // Accept either primative strings or Latch objects (with reparenting)
					member instanceof Latch
						? member
							.setParent(this)
						: new Latch()
							.setParent(this)
							.set(member) // Actually set the ID last so it inherits the parser
				)
		);

		return this.rebuild();
	}


	/**
	* Remove + reset all membership for a LatchSet()
	* @returns {LatchSet} This LatchSet instance
	*/
	clear() {
		this.#members = [];
		return this.rebuild();
	}


	/**
	* Recompute member lookup
	* This is triggered internally if the parser changes
	* @returns {LatchSet} This LatchSet instance
	*/
	rebuild() {
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

	// Masking - mask() {{{
	/**
	* Return a clone of this LatchSet with masking applied
	* @param {Latch|String|Object} mask Input mask to use
	* @returns {LatchSet} A NEW LatchSet instance to query (so the original is not mutated)
	*/
	mask(mask) {
		return this
			.clone({
				members: false,
			})
			.add(this.#members.map(member =>
				member
					.clone()
					.mask(mask)
			))
	}
	// }}}

	// Handler overrides - setHandler(), setParser(), setStringify() {{{
	/**
	* Set a handler function
	* This really just overrides the local `handler.*` function
	* @param {String} handler The handler to override
	* @param {Function} parser The new function to use in place of the existing handler
	* @returns {Latch} This latch instance
	*/
	setHandler(handler, parser) {
		this.handlers[handler] = parser;
		return this;
	}


	/**
	* Set the parser (really `handler.fromString()`)
	* @param {Function} parser The new parser to use
	* @returns {Latch} This latch instance
	*/
	setParser(parser) {
		return this.setHandler('fromString', parser);
	}


	/**
	* Set the stringifier function (really `handler.fromString()`)
	* @param {Function} stringify The new stringifier to use
	* @returns {Latch} This latach instance
	*/
	setStringify(stringifier) {
		return this.setHandler('toString', stringifier);
	}
	// }}}

	// Output - toArray() {{{
	toArray() {
		return Object.keys(this.#membersById);
	}
	// }}}

	// Constructor + clone() {{{
	/**
	* Create a new LatchSet copying all settings of this instance
	* @param {Object} [options] Options to mutate behvaiour
	* @param {Boolean} [options.members=true] Copy existing members + reparent
	* @param {Boolean} [options.settings=true] Copy settings
	* @returns {LatchSet} A new LatchSet instance, cloned from this instance
	*/
	clone(options) {
		let settings = {
			members: true,
			settings: true,
			...options,
		};

		let clonedSet = new LatchSet();

		if (settings.members) clonedSet.add(this.#members.map(member =>
			member.clone()
		));

		if (settings.settings) clonedSet.setOption(this.settings)

		return clonedSet;
	}
	// }}}
}
