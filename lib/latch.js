export default class Latch {
	// State {{{
	/**
	* Identity string for this latch
	* @type {String}
	*/
	#id;


	/**
	* Identity components of this latch
	* @type {Object}
	*/
	#parts = {};


	/**
	* Upstream LatchSet component, if any
	* If present delegates various functionality upstream
	* @type {LatchSet}
	*/
	parent;


	/**
	* Internal function handlers
	* These default to a simple 'source::noun::verb' parser by default but can be overrideen by providing a #latchSet
	* @type {Object<Function>}
	*/
	#handlers = {
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
	};


	/**
	* Boolean flag if the default latch handlers have been overriden by parent handlers
	* @type {Boolean}
	*/
	#handlersInherited = false;
	// }}}

	// Setters / getters - set(), toString() {{{
	/**
	* Set this latch ID with validation
	* @param {String|Object} id The latch string or object parts to set
	* @returns {Latch} This latch instance
	*/
	set(id) {
		if (typeof id == 'string') {
			this.#id = id;
			this.#parts = this.#handlers.fromString(id);
		} else if (typeof id == 'object') {
			this.#parts = id;
			this.#id = this.#handlers.toString(this.#parts);
		} else {
			throw new Error('Unknown input to Latch.set() - requires String or Object');
		}

		return this;
	}

	/**
	* Convert the current Latch entry to a string
	* @returns {String} The latch entry expressed as a string
	*/
	toString() {
		return this.#parts
			? this.#handlers.toString.call(this, this.#parts)
			: 'EMPTY'
	}


	/**
	* Output this Latch as an object
	* @returns {Object} All extracted parts of this Latch instance
	*/
	toObject() {
		return this.#parts
			? this.#handlers.toObject.call(this, this.#parts)
			: {}
	}
	// }}}

	// Providence & Parentage - setParent() {{{
	/**
	* Set this Latch instances' parent
	* This will also overwrite `#handlers` with any `LatchSet.handlers` it finds
	* @param {LatchSet} parent New parent LatchSet to set
	* @returns {Latch} This latch instance
	*/
	setParent(parent) {
		if (parent) { // Actually given something?
			this.parent = parent;
			this.#handlers = parent.handlers; // Link to parent handler set
			this.#handlersInherited = true;
		}

		// Parser has changed? Reparse ID into parts
		if (this.#id)
			this.set(this.#id); // Force reparse if reparenting

		return this;
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
		this.#handlers[handler] = parser;
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

	// Querying - matches(), isEqual() {{{
	/**
	* Determine if this Latch is value-equal to another
	* @param {Latch|String} subject The subject latch to compare to
	* @returns {Boolean} True if the latches are syntactically equal, false otherwise
	*/
	matches(subject) {
		let subjectLatch = subject instanceof Latch
			? subject
			: new Latch(subject);

		return subjectLatch.isEqual(this.#parts);
	}


	/**
	* Challenge one latch part-object against another
	* This is really just a single-level object comparison worker
	* @param {Object} parts The Latch parts of the other entity to compare
	* @returns {Boolean} True if the latches are syntactically equal, false otherwise
	*/
	isEqual(parts) {
		return Object.entries(parts)
			.every(([key, val]) => this.#parts[key] == val);
	}


	/**
	* Replace various missing fields with any from the incomming context
	* @param {Latch|String|Object} mask Input mask to use
	* @returns {Latch} A NEW Latch instance to query (so the original is not mutated)
	*/
	mask(mask) {
		let prune = obj => Object.fromEntries(
			Object.entries(obj)
				.filter(([key, val]) => !this.#handlers.masks.ignore.includes(val))
		);

		return this.clone({
			...prune(this.toObject()),
			...prune(this.clone(mask).toObject()),
		});
	}
	// }}}

	// Constructor + new() {{{
	/**
	* Constructor
	* Optionally also calls `set(id)` if a value is given
	* @param {String} [id] Initial ID to set
	* @returns {Latch} This latch instance
	*/
	constructor(id) {
		if (id) this.set(id);
		return this;
	}


	/**
	* Create a new Latch cloning all details of this instance
	* @param {String} [id] Initial ID to set
	* @returns {Latch} A new Latch instance, cloned from this instance
	*/
	clone(id) {
		return new Latch()
			.setParent(this.parent)
			.set(id || this.#id)
	}
	// }}}

	// Utilities {{{
	/**
	* node:util.inspect() override for display
	* @returns {String} A nicer string tagging of this Latch
	*/
	get [Symbol.toStringTag]() {
		return this.#id;
	}
	// }}}
}
