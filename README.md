@MomsFriendlyDevCo/Latch
========================
Permission parsing, masking, verification.

This module provides a simple, extendable permissions language.

Features:
* Chainable - (almost) all functions return the original Latch or LatchSet instance making chainable composition easier
* Paranoia-by-default - No member settings are available outside of getters / setters


```javascript
import {LatchSet} from '@momsfriendlydevco/latch';

let latchSet = new LatchSet();

// ADDING MEMBERS
// --------------
// Add basic members with strings
latchSet.add('foo::bar::one');

// or Latches
latchSet.add(new Latch('foo::bar::two'));

// or Objects
latchSet.add({source: 'foo', noun: 'bar', verb: 'three'});


// QUERYING MEMBERS
// ----------------
// Simple querying for presence
latchSet.has('foo::bar::one') //= true

// ... or by sets
latchSet.hasAll('foo::bar::two', 'foo::bar::three') //= true


// MASKING
// -------
// Fill in missing information for wildcard permissions
latchSet
    .add('mySource::myNoun::@') // Setup a generic permission where '@' signifies any verb
    .mask('...:...:create') // Patch in the 'create' verb - returning a new LatchSet instance (original latch remains as-is)
    .has('mySource::myNoun::create') //= true
```


API
===

new LatchSet()
--------------
Create a new LatchSet.


LatchSet.setOption(option, value)
---------------------------------
Set a single setting or overwrite existing settings.
If given a key + val that single setting is set, if an object is provided this is merged in with the settings.
Returns the LatchSet instance.


LatchSet.add(member)
--------------------
Add a member to the set. Can be string, object or existing Latch instance (which will be reparented).
Returns the LatchSet instance.


LatchSet.clear()
----------------
Remove all existing members from a set.
Returns the LatchSet instance.



LatchSet.grant(existing, members...)
------------------------------------
Grant additional members if the `existing` member is already present.
This provides hierarchical permissioning.
Returns the LatchSet instance.


LatchSet.has(member)
--------------------
Returns a boolean if the provided member (which can be a string or Latch instance) exists.


LatchSet.hasAll(members)
------------------------
Returns a boolean indicating if ALL provided members exist.


LatchSet.hasAny(members)
------------------------
Returns a boolean indicating if ANY of the provided members exist.


LatchSet.toArray()
------------------
Return all member, stringified Latch instances as an array.


LatchSet.mask(mask)
-------------------
Apply a permission mask, returning a new clone of the LatchSet and all member Latch instances.


LatchSet.maskFromRequest(mask)
------------------------------
Compute + apply a mask based on an incoming ExpressRequest(-like) object.

Options are:

| Option    | Type       | Default                 | Description                                                                                               |
|-----------|------------|-------------------------|-----------------------------------------------------------------------------------------------------------|
| `context` | `Function` | `req => req.params?.id` | Function to extract the document being referred to, if any. Usually `req.params.id` but can be repurposed |
| `maskKey` | `String`   | `'verb'`                | Key to set to the eventual extracted verb, prior to masking                                               |

Returns a LatchSet clone with all members masked.


LatchSet.setHandler / setParser / setStringify
----------------------------------------------
Set entire set handler functions. See Latch for documentation on these.
Returns the LatchSet instance.


LatchSet.clone(options)
-----------------------
Clone the current LatchSet with optional settings.

| Option     | Type      | Default | Description                              |
|------------|-----------|---------|------------------------------------------|
| `members`  | `Boolean` | `true`  | Copy + reparent all Latch members        |
| `settings` | `Boolean` | `true`  | Copy all associated LatchSet permissions |



new Latch(id)
-------------
Create a new, single latch object.
The optional ID is passed to `Latch.set()` if present.
Returns the Latch instance.


Latch.setParent(latchSet)
-------------------------
Set the latch parent of the current latch.
This will also overwrite `#handlers` with any `LatchSet.handlers` it finds.
Returns the Latch instance.


Latch.set(id)
-------------
Set the ID of the latch.a
The ID can be an optional string or object parts.
Returns the Latch instance.


Latch.toString()
----------------
Output the current Latch state as a string.


Latch.toObject()
----------------
Output the disected Latch state as a object.


Latch.matches(subject)
----------------------
Return a boolean if the given latch matches an expression.
Subject can be a string or other Latch.


Latch.mask(mask)
----------------
Return a clone of this Latch instance patching in masks data.


Latch.clone(id)
---------------
Clone this match, setting the parent and state.


Latch.setHandler(handler, func)
--------------------------------
Set a local handler function by its string name.
Returns the Latch instance.


Latch.setParser(parser)
-----------------------
Helper function to set the 'fromString' handler.
Returns the Latch instance.


Latch.setStringify(stringifier)
-------------------------------
Helper function to set the 'toString' handler.
Returns the Latch instance.
