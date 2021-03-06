﻿// Copyright 2010 Hoonto (mmullens@hoonto.com)

// This project is free software provided by hoonto.com and clipwidget.com released under the MIT license: http://www.opensource.org/licenses/mit-license.php 

// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


// # ShiftRegister 
// Provides a wrapper around the arrays that aid the PQ-Gram algorithm

//module.exports = ShiftRegister;

// ## ShiftRegister Constructor

//    * size: the size of the register (size of the array).
function ShiftRegister(size) {
    var self = this;
    if(!(self instanceof ShiftRegister)){ return new ShiftRegister(size); }
    self.register = [];
    for(var i=0; i<size; i++){
        self.register.push("*");
    }
}

// ### ShiftRegister.concatenate

//    * reg: the ShiftRegister that should be concatenated with this ShiftRegister
ShiftRegister.prototype.concatenate = function(reg){
    var self = this;
    var temp = self.register.slice(0);//self.list(self.register);
    var arr = temp.concat(reg.register);
    return arr;
};

// ### ShiftRegister.shift
// shift removes an element from the front of the list and pushes the provided element to the back of the list.  So in essence, it does a shift() then a push() on the internal array that this ShiftRegister wraps.

//    * el: the element to push.
ShiftRegister.prototype.shift = function(el){
    var self = this;
    self.register.shift();
    self.register.push(el);
};

// ### ShiftRegister.len
// len provides the length of this ShiftRegister (the internal array that this ShiftRegister represents), or the ShiftRegister itself.

//    * reg: a ShiftRegister that if provided the length is desired, otherwise if not provided, the length of this ShiftRegister is returned. 
ShiftRegister.prototype.len = function(reg) {
    var self = this;
    if(typeof reg === 'undefined'){
        return self.register.length;
    }else{
        return reg.register.length;
    }
};

//---------------------------------------------------------------------


// # Node
// Provides ability to create a raw node with no children, or a root node
// of a hierarchy from which a tree will be derived provided the label 
// and children callback functions, lfn and cfn respectively.
// To create a simple Node with no children provide


//module.exports = Node;

// ## Node Constructor
//    * label: a string for simple Node with no children or an object from which the root node of the tree will be derived provided lfn and cfn label and callbacck functions provided.
//    * lfn: the label callback function, which must return a string label.  Ignored if label is a string
//    * cfn: the children callback function, which must return an array of children from which child nodes will be derived.  Ignored if label is a string. 
function Node(label, lfn, cfn){
    var self = this;
    if(!(self instanceof Node)){ return new Node(label, lfn, cfn); }

    if(typeof label === 'string' && label.length > 0){
        self.tedlabel = label;
        self.tedchildren = [];
    }else if(typeof label === 'object' && !! lfn && !! cfn){
        self.tedlabel = lfn(label);
        self.tedchildren = [];
        if(typeof self.tedlabel === 'string'){
            var kids = cfn(label);
            if(!! kids){
                for(var i=0; i<kids.length; i++){
                    var n = new Node(kids[i],lfn,cfn);
                    if(!! n && !! n.tedlabel){
                        self.addkid(n);
                    }
                }
            }
        }
    }
}

// ### Node.addkid
// Create a node and add it as a child to an existing node or to a basic node created with only a string label.

//    * node: The parent Node.
//    * before: boolean true indicates that the new node should be prepended to existing children of the parent node, false to append, default false.
Node.prototype.addkid = function(node, before){
    var self = this;
    before = before || false;
    if(before){
        self.tedchildren.unshift(node);
    }else{
        if(!self.tedchildren){ try{ throw new Error('yo'); }catch(e){ console.log(e.stack); } }
        self.tedchildren.push(node);
    }
    return self;
};

//---------------------------------------------------------------------


// # Profile
// Creates a PQ-Gram profile from a Node, using p and q values 

//var ShiftRegister = require("./shiftregister.js");

//module.exports = Profile;

// ## Profile Constructor

//    * root: the root Node 
//    * p: the p value in the PQ-Gram algorithm
//    * q: the q value in the PQ-Gram algorithm
function Profile(root, p, q){
    var self = this;
    if(!(self instanceof Profile)){ return new Profile(root, p, q); }
    p = p || 2;
    q = q || 3;
    var ancestors = new ShiftRegister(p);
    self.list = [];
    self.profile(root, p, q, ancestors);
}

// ### Profile.profile 

//    * root: the root Node
//    * p: the p value in the PQ-Gram algorithm
//    * q: the q value in the PQ-Gram algorithm
//    * ancestors: the ancestors
Profile.prototype.profile = function(root, p, q, ancestors){
    var self = this;
    ancestors.shift(root.tedlabel);
    var siblings = new ShiftRegister(q);
    if(root.tedchildren.length === 0){
        self.append(ancestors.concatenate(siblings));
    }else{
        var childs = root.tedchildren;
        for(var i=0; i<childs.length; i++){
            var child = childs[i];
            if(!! child.tedlabel){
                siblings.shift(child.tedlabel);
                self.append(ancestors.concatenate(siblings));
                self.profile(child, p, q, clone(ancestors));
            }
        }
        for(var j=0; j<q-1; j++){
            siblings.shift("*");
            self.append(ancestors.concatenate(siblings));
        }
    }
};

// ### Profile.edit_distance
// Determines the distance of this Profile to another
// Profile.

//    * other: a Profile object representing the other profile against which to compare
//    * returns: the PQ-Gram edit_distance between this Profile and another Profile
Profile.prototype.edit_distance = function(other){
    var self = this;
    var union = self.list.length + other.list.length;
    return 1.0 - 2.0 * (self.intersection(other) / union);
};

// ### Profile.intersection
// Determine the intersection of this Profile with another profile

//    * other: a Profile object representing the other profile against which to obtain the intersection
//    * returns: the intersection between this profile and other profile
Profile.prototype.intersection = function(other){
    var self = this;
    var intersect = 0.0;
    var i = 0;
    var j = 0;
    while(i < self.list.length && j < other.list.length){
        intersect += self.gram_edit_distance(self.list[i], other.list[j]);
        var listi = self.list[i].join();
        var listj = self.list[j].join();
        if(listi === listj){
            i += 1;
            j += 1;
        }else if(listi < listj){
            i += 1;
        }else{
            j += 1;
        }
    }
    return intersect;
};

// ### Profile.compare
// Compare two arrays

//    * a1: the first array
//    * a2: the second array
//    * returns: true of arrays are same, false otherwise
Profile.prototype.compare = function(a1,a2) {
    if (a1.length !== a2.length){ return false; }
    for (var i = 0; i < a2.length; i++) {
        //if (!self.compare(a1[i],a2[i])) return false;
        if (a1[i] !== a2[i]){ return false; }
    }
    return true;
};

// ### Profile.gram_edit_distance
// Get the gram edit distance between two grams by comparing them as arrays and returning one or zero

//    * gram1: the first gram
//    * gram2: the second gtam
//    * returns: 1 if gram1 and gram2 are the same, 0 if they are different
Profile.prototype.gram_edit_distance = function(gram1, gram2){
    var self = this;
    var distance = 0.0;
    if(self.compare(gram1,gram2)){
        distance = 1.0;
    }
    return distance;
};

// ### Profile.append
// Appends a value to the Profile's list array.

//    * value: the value to append
Profile.prototype.append = function(value){
    var self = this;
    self.list.push(value);
};

// ### Profile.len
// Provides the length of the Profile indicated by prof, or the length of this Profile if prof is not provided

//    * prof: the profile for which to obtain list length.
Profile.prototype.len = function(prof) {
    var self = this;
    if(typeof prof === 'undefined'){
        return self.list.length;
    }else{
        return prof.list.length;
    }
};

// ## node-clone provided by Paul Vorbach

// Copyright © 2011-2013 Paul Vorbach

// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

function clone(parent, circular) {
    if(typeof circular === 'undefined'){
        circular = false;
    }

    var useBuffer = (typeof Buffer !== 'undefined');

    var circularParent = {};
    var circularResolved = {};
    var circularReplace = [];

    function _clone(parent, context, child, cIndex) {
        var i; // Use local context within this function
        // Deep clone all properties of parent into child
        if (typeof parent === 'object') {
            if (parent === null){ return parent; }
            // Check for circular references
            for(i in circularParent){
                if (circularParent[i] === parent) {
                    // We found a circular reference
                    circularReplace.push({'resolveTo': i, 'child': child, 'i': cIndex});
                    return null; //Just return null for now...
                    // we will resolve circular references later
                }
            }

            // Add to list of all parent objects
            circularParent[context] = parent;
            // Now continue cloning...
            if (util.isArray(parent)) {
                child = [];
                for(i in parent){
                    child[i] = _clone(parent[i], context + '[' + i + ']', child, i);
                }
            }else if (util.isDate(parent)){
                child = new Date(parent.getTime());
            }else if (util.isRegExp(parent)){
                child = new RegExp(parent.source);
            }else if (useBuffer && Buffer.isBuffer(parent)) {
                child = new Buffer(parent.length);
                parent.copy(child);
            } else {
                child = {};
                // Also copy prototype over to new cloned object
                // MLM: Not needed. 
                //child.__proto__ = parent.__proto__;
                for(i in parent){
                    // MLM: don't clone on exception:
                    try{
                        child[i] = _clone(parent[i], context + '[' + i + ']', child, i);
                    }catch(e){ }
                }
            }

            // Add to list of all cloned objects
            circularResolved[context] = child;
        }else{
            child = parent; //Just a simple shallow copy will do
        }
        return child;
    }

    var i;
    if (circular) {
        var cloned = _clone(parent, '*');

        // Now this object has been cloned. Let's check to see if there are any
        // circular references for it
        for(i in circularReplace) {
            var c = circularReplace[i];
            if (c && c.child && c.i in c.child) {
                c.child[c.i] = circularResolved[c.resolveTo];
            }
        }
        return cloned;
    } else {
        // Deep clone all properties of parent into child
        var child;
        if (typeof parent === 'object') {
            if (parent === null){
                return parent;
            }
            if (parent.constructor.name === 'Array') {
                child = [];
                for(i in parent){
                    child[i] = clone(parent[i], circular);
                }
            }else if (util.isDate(parent)){
                child = new Date(parent.getTime() );
            }else if (util.isRegExp(parent)){
                child = new RegExp(parent.source);
            }else {
                child = {};
                //MLM: Not needed:
                //child.__proto__ = parent.__proto__;
                for(i in parent){ 
                    child[i] = clone(parent[i], circular);
                }
            }
        }else{ 
            child = parent; // Just a simple shallow clone will do
        }
        return child;
    }
}

var objectToString = function(o) {
    return Object.prototype.toString.call(o);
};

var util = {
    isArray: function (ar) {
        return Array.isArray(ar) || (typeof ar === 'object' && objectToString(ar) === '[object Array]');
    },
    isDate: function (d) {
        return typeof d === 'object' && objectToString(d) === '[object Date]';
    },
    isRegExp: function (re) {
        return typeof re === 'object' && objectToString(re) === '[object RegExp]';
    }
};


//--------------------------------------------------------------------

function dom_label_fun(node) {
	return node.nodeName;
}

function dom_children_fun(node) {
	var c = [];
	for(var i=0; i<node.children.length; ++i) {
		c.push(node.children[i]);
	}
	return c;
}


function pq_gram_distance(dom1, dom2) {
	// default values
	var p = 2;
	var q = 3;
	
	var nodea = new Node(dom1, dom_label_fun, dom_children_fun);
	var nodeb = new Node(dom2, dom_label_fun, dom_children_fun);
	var profa = new Profile(nodea, p, q);
	var profb = new Profile(nodeb, p, q);
	return profa.edit_distance(profb);
}

