(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.symSpell = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const Helpers = require('./helpers')

/// <summary>
/// Class providing optimized methods for computing Damerau-Levenshtein Optimal String
/// Alignment (OSA) comparisons between two strings.
/// </summary>
/// <remarks>
/// Copyright ©2015-2018 SoftWx, Inc.
/// The inspiration for creating highly optimized edit distance functions was
/// from Sten Hjelmqvist's "Fast, memory efficient" algorithm, described at
/// http://www.codeproject.com/Articles/13525/Fast-memory-efficient-Levenshtein-algorithm
/// The Damerau-Levenshtein algorithm is basically the Levenshtein algorithm with a
/// modification that considers transposition of two adjacent characters as a single edit.
/// The optimized algorithm was described in detail in my post at
/// http://blog.softwx.net/2015/01/optimizing-damerau-levenshtein_15.html
/// Also see http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
/// Note that this implementation of Damerau-Levenshtein is the simpler and faster optimal
/// string alignment (aka restricted edit) distance that difers slightly from the classic
/// algorithm by imposing the restriction that no substring is edited more than once. So,
/// for example, "CA" to "ABC" has an edit distance of 2 by a complete application of
/// Damerau-Levenshtein, but has a distance of 3 by the method implemented here, that uses
/// the optimal string alignment algorithm. This means that this algorithm is not a true
/// metric since it does not uphold the triangle inequality. In real use though, this OSA
/// version may be desired. Besides being faster, it does not give the lower distance score
/// for transpositions that occur across long distances. Actual human error transpositions
/// are most likely for adjacent characters. For example, the classic Damerau algorithm
/// gives a distance of 1 for these two strings: "sated" and "dates" (it counts the 's' and
/// 'd' as a single transposition. The optimal string alignment version of Damerau in this
/// class gives a distance of 2 for these two strings (2 substitutions), as it only counts
/// transpositions for adjacent characters.
/// The methods in this class are not threadsafe. Use the static versions in the Distance
/// class if that is required.</remarks>
class EditDistance {
	constructor () {
		this.baseChar1Costs = []
		this.basePrevChar1Costs = []
	}

	compare (string1, string2, maxDistance) {
		return this.distance(string1, string2, maxDistance)
	}

	/// <summary>Compute and return the Damerau-Levenshtein optimal string
	/// alignment edit distance between two strings.</summary>
	/// <remarks>https://github.com/softwx/SoftWx.Match
	/// This method is not threadsafe.</remarks>
	/// <param name="string1">One of the strings to compare.</param>
	/// <param name="string2">The other string to compare.</param>
	/// <param name="maxDistance">The maximum distance that is of interest.</param>
	/// <returns>-1 if the distance is greater than the maxDistance, 0 if the strings
	/// are equivalent, otherwise a positive number whose magnitude increases as
	/// difference between the strings increases.</returns>
	distance (string1 = null, string2 = null, maxDistance) {
		if (string1 === null || string2 === null) {
			return Helpers.nullDistanceResults(string1, string2, maxDistance)
		}

		if (maxDistance <= 0) {
			return (string1 === string2) ? 0 : -1
		}

		maxDistance = Math.ceil(maxDistance)
		const iMaxDistance = (maxDistance <= Number.MAX_SAFE_INTEGER) ? maxDistance : Number.MAX_SAFE_INTEGER

		// if strings of different lengths, ensure shorter string is in string1. This can result in a little faster speed by spending more time spinning just the inner loop during the main processing.
		if (string1.length > string2.length) {
			const t = string1
			string1 = string2
			string2 = t
		}

		if (string2.length - string1.length > iMaxDistance) {
			return -1
		}

		// identify common suffix and/or prefix that can be ignored
		const { len1, len2, start } = Helpers.prefixSuffixPrep(string1, string2)

		if (len1 === 0) {
			return (len2 <= iMaxDistance) ? len2 : -1
		}

		if (len2 > this.baseChar1Costs.length) {
			this.baseChar1Costs = new Array(len2)
			this.basePrevChar1Costs = new Array(len2)
		}

		if (iMaxDistance < len2) {
			return this._distanceMax(string1, string2, len1, len2, start, iMaxDistance, this.baseChar1Costs, this.basePrevChar1Costs)
		}

		return this._distance(string1, string2, len1, len2, start, this.baseChar1Costs, this.basePrevChar1Costs)
	}

	/// <summary>Internal implementation of the core Damerau-Levenshtein, optimal string alignment algorithm.</summary>
	/// <remarks>https://github.com/softwx/SoftWx.Match</remarks>
	_distance (string1, string2, len1, len2, start, char1Costs, prevChar1Costs) {
		char1Costs = []

		for (let j = 0; j < len2;) {
			char1Costs[j] = ++j
		}

		let char1 = ' '
		let currentCost = 0

		for (let i = 0; i < len1; ++i) {
			const prevChar1 = char1
			char1 = string1[start + i]
			let char2 = ' '
			let aboveCharCost = i
			let leftCharCost = i
			let nextTransCost = 0

			for (let j = 0; j < len2; ++j) {
				const thisTransCost = nextTransCost
				nextTransCost = prevChar1Costs[j]
				currentCost = leftCharCost
				prevChar1Costs[j] = leftCharCost // cost of diagonal (substitution)
				leftCharCost = char1Costs[j] // left now equals current cost (which will be diagonal at next iteration)
				const prevChar2 = char2
				char2 = string2[start + j]

				if (char1 !== char2) {
					// substitution if neither of two conditions below
					if (aboveCharCost < currentCost) {
						currentCost = aboveCharCost // deletion
					}

					if (leftCharCost < currentCost) {
						currentCost = leftCharCost // insertion
					}

					++currentCost

					if ((i !== 0) && (j !== 0) &&
						(char1 === prevChar2) &&
						(prevChar1 === char2) &&
						(thisTransCost + 1 < currentCost)) {
						currentCost = thisTransCost + 1 // transposition
					}
				}

				char1Costs[j] = aboveCharCost = currentCost
			}
		}

		return currentCost
	}

	/// <summary>Internal implementation of the core Damerau-Levenshtein, optimal string alignment algorithm
	/// that accepts a maxDistance.</summary>
	/// <remarks>https://github.com/softwx/SoftWx.Match</remarks>
	_distanceMax (string1, string2, len1, len2, start, maxDistance, char1Costs, prevChar1Costs) {
		char1Costs = []

		for (let j = 0; j < len2; j++) {
			if (j < maxDistance) {
				char1Costs[j] = j + 1
			}
			else {
				char1Costs[j] = maxDistance + 1
			}
		}

		const lenDiff = len2 - len1
		const jStartOffset = maxDistance - lenDiff
		let jStart = 0
		let jEnd = maxDistance
		let char1 = ' '
		let currentCost = 0

		for (let i = 0; i < len1; ++i) {
			const prevChar1 = char1
			char1 = string1[start + i]
			let char2 = ' '
			let leftCharCost = i
			let aboveCharCost = i
			let nextTransCost = 0
			// no need to look beyond window of lower right diagonal - maxDistance cells (lower right diag is i - lenDiff)
			// and the upper left diagonal + maxDistance cells (upper left is i)
			jStart += (i > jStartOffset) ? 1 : 0
			jEnd += (jEnd < len2) ? 1 : 0

			for (let j = jStart; j < jEnd; ++j) {
				const thisTransCost = nextTransCost
				nextTransCost = prevChar1Costs[j]
				currentCost = leftCharCost
				prevChar1Costs[j] = leftCharCost // cost on diagonal (substitution)
				leftCharCost = char1Costs[j] // left now equals current cost (which will be diagonal at next iteration)
				const prevChar2 = char2
				char2 = string2[start + j]

				if (char1 !== char2) {
					// substitution if neither of two conditions below
					if (aboveCharCost < currentCost) {
						currentCost = aboveCharCost // deletion
					}

					if (leftCharCost < currentCost) {
						currentCost = leftCharCost // insertion
					}

					currentCost += 1

					if (i !== 0 && j !== 0 &&
						char1 === prevChar2 &&
						prevChar1 === char2 &&
						thisTransCost + 1 < currentCost) {
						currentCost = thisTransCost + 1 // transposition
					}
				}

				aboveCharCost = currentCost
				char1Costs[j] = currentCost
			}

			if (char1Costs[i + lenDiff] > maxDistance) {
				return -1
			}
		}

		return (currentCost <= maxDistance) ? currentCost : -1
	}
}

module.exports = EditDistance

},{"./helpers":2}],2:[function(require,module,exports){
const difflib = require('difflib')
const itertools = require('iter-tools')

const { zip, zipLongest } = itertools

const isAcronym = (word) => {
	// """Checks is the word is all caps (acronym) and/or contain numbers
	// Parameters
	// ----------
	// word : str
	//     The word to check
	// Returns
	// -------
	// bool
	//     True if the word is all caps and/or contain numbers, e.g.,
	//     ABCDE, AB12C. False if the word contains lower case letters,
	//     e.g., abcde, ABCde, abcDE, abCDe, abc12, ab12c
	// """

	return word.match(/\b[A-Z0-9]{2,}\b/)
}

const parseWordsCase = (phrase, preserveCase) => {
	// """Create a non-unique wordlist from sample text. Language
	// independent (e.g. works with Chinese characters)
	// Parameters
	// ----------
	// phrase : str
	//     Sample text that could contain one or more words
	// preserve_case : bool, optional
	//     A flag to determine if we can to preserve the cases or convert
	//     all to lowercase
	// Returns
	// list
	//     A list of words
	// """
	// # \W non-words, use negated set to ignore non-words and "_"
	// # (underscore). Compatible with non-latin characters, does not
	// # split words at apostrophes

	if (!preserveCase) {
		phrase = phrase.toLowerCase()
	}

	return Array.from(phrase.matchAll(/([^\W_]+['’]*[^\W_]*)/g), (m) => m[0])
}

const transferCasingMatching = (textWithCasing, textWithoutCasing) => {
	// """Transferring the casing from one text to another - assuming that
	// they are 'matching' texts, alias they have the same length.
	// Parameters
	// ----------
	// text_w_casing : str
	//     Text with varied casing
	// text_wo_casing : str
	//     Text that is in lowercase only
	// Returns
	// -------
	// str
	//     Text with the content of `text_wo_casing` and the casing of
	//     `text_w_casing`
	// Raises
	// ------
	// ValueError
	//     If the input texts have different lengths
	// """

	return Array.from(zip(textWithCasing, textWithoutCasing)).map(([x, y]) => {
		return x === x.toUpperCase() ? y.toUpperCase() : y.toLowerCase()
	}).join('')
}

const transferCasingSimilar = (textWithCasing, textWithoutCasing) => {
	// Transferring the casing from one text to another - for similar (not matching) text
	// 1. It will use `difflib`'s `SequenceMatcher` to identify the
	//    different type of changes needed to turn `textWithCasing` into
	//    `textWithoutCasing`
	// 2. For each type of change:
	//    - for inserted sections:
	//      - it will transfer the casing from the prior character
	//      - if no character before or the character before is the\
	//        space, then it will transfer the casing from the following\
	//        character
	//    - for deleted sections: no case transfer is required
	//    - for equal sections: just swap out the text with the original,\
	//      the one with the casings, as otherwise the two are the same
	//    - replaced sections: transfer the casing using\
	//      :meth:`transfer_casing_for_matching_text` if the two has the\
	//      same length, otherwise transfer character-by-character and\
	//      carry the last casing over to any additional characters.
	// Parameters
	// ----------
	// textWithCasing : str
	//     Text with varied casing
	// textWithoutCasing : str
	//     Text that is in lowercase only
	// Returns
	// -------
	// textWithoutCasing : str
	//     If `textWithoutCasing` is empty
	// c : str
	//     Text with the content of `textWithoutCasing` but the casing of
	//     `textWithCasing`
	// Raises
	// ------
	// ValueError
	//     If `textWithCasing` is empty
	// """

	const _sm = new difflib.SequenceMatcher(null, textWithCasing.toLowerCase(), textWithoutCasing)

	// we will collect the case_text:
	let c = ''

	// get the operation codes describing the differences between the
	// two strings and handle them based on the per operation code rules
	_sm.getOpcodes().forEach(([tag, i1, i2, j1, j2]) => {
		// Print the operation codes from the SequenceMatcher:
		// print('{:7}   a[{}:{}] --> b[{}:{}] {!r:>8} --> {!r}'
		//   .format(tag, i1, i2, j1, j2,
		//   textWithCasing.slice(j1, j2),
		//   textWithoutCasing[j1:j2]))

		// inserted character(s)
		if (tag === 'insert') {
			// if this is the first character and so there is no
			// character on the left of this or the left of it a space
			// then take the casing from the following character

			if (i1 === 0 || textWithCasing[i1 - 1] === ' ') {
				if (textWithCasing[i1] && textWithCasing[i1].toUpperCase() === textWithCasing[i1]) {
					c += textWithoutCasing.slice(j1, j2).toUpperCase()
				}
				else {
					c += textWithoutCasing.slice(j1, j2).toLowerCase()
				}
			}
			else {
				// otherwise just take the casing from the prior
				// character
				if (textWithCasing[i1 - 1].toUpperCase() === textWithCasing[i1 - 1]) {
					c += textWithoutCasing.slice(j1, j2).toUpperCase()
				}
				else {
					c += textWithoutCasing.slice(j1, j2).toLowerCase()
				}
			}
		}
		else if (tag === 'equal') {
			// for 'equal' we just transfer the text from the
			// textWithCasing, as anyhow they are equal (without the
			// casing)
			c += textWithCasing.slice(i1, i2)
		}
		else if (tag === 'replace') {
			const _withCasing = textWithCasing.slice(i1, i2)
			const _withoutCasing = textWithoutCasing.slice(j1, j2)

			// if they are the same length, the transfer is easy
			if (_withCasing.length === _withoutCasing.length) {
				c += transferCasingMatching(_withCasing, _withoutCasing)
			}
			else {
				// if the replaced has a different length, then we
				// transfer the casing character-by-character and using
				// the last casing to continue if we run out of the
				// sequence
				let _last = 'lower'

				for (const [w, wo] of zipLongest(_withCasing, _withoutCasing)) {
					if (w && wo) {
						if (w === w.toUpperCase()) {
							c += wo.toUpperCase()
							_last = 'upper'
						}
						else {
							c += wo.toLowerCase()
							_last = 'lower'
						}
					}
					else if (!w && wo) {
						// once we ran out of 'w', we will carry over
						// the last casing to any additional 'wo'
						// characters
						c += _last === 'upper' ? wo.toUpperCase() : wo.toLowerCase()
					}
				}
			}
		}
		// else if (tag === 'delete') {
		//     // for deleted characters we don't need to do anything
		//     continue
		// }
	})

	return c
}

/// <summary>Determines the proper return value of an edit distance function when one or
/// both strings are null.</summary>
const nullDistanceResults = (string1, string2, maxDistance) => {
	if (string1 === null) {
		return string2 === null ? 0 : (string2.length <= maxDistance) ? string2.length : -1
	}

	return string1.length <= maxDistance ? string1.length : -1
}

/// <summary>Calculates starting position and lengths of two strings such that common
/// prefix and suffix substrings are excluded.</summary>
/// <remarks>Expects string1.length to be less than or equal to string2.length</remarks>
const prefixSuffixPrep = (string1, string2) => {
	let len2 = string2.length
	let len1 = string1.length // this is also the minimun length of the two strings

	// suffix common to both strings can be ignored
	while (len1 !== 0 && string1[len1 - 1] === string2[len2 - 1]) {
		len1 = len1 - 1; len2 = len2 - 1
	}

	// prefix common to both strings can be ignored
	let start = 0

	while (start !== len1 && string1[start] === string2[start]) {
		start++
	}

	if (start !== 0) {
		len2 -= start // length of the part excluding common prefix and suffix
		len1 -= start
	}

	return { len1, len2, start }
}

module.exports = {
	isAcronym,
	parseWordsCase,
	transferCasingMatching,
	transferCasingSimilar,
	nullDistanceResults,
	prefixSuffixPrep
}

},{"difflib":163,"iter-tools":229}],3:[function(require,module,exports){
(function (process){(function (){
const fs = require('fs')
const readline = require('readline')
const EditDistance = require('./edit-distance')
const Helpers = require('./helpers')

// Spelling suggestion returned from Lookup.
class SuggestItem {
	// Create a new instance of SuggestItem.
	// term: The suggested word.
	// distance: Edit distance from search word.
	// count: Frequency of suggestion in dictionary.
	constructor (term = '', distance = 0, count = 0) {
		// The suggested correctly spelled word.
		this.term = term
		// Edit distance between searched for word and suggestion.
		this.distance = distance
		// Frequency of suggestion in the dictionary (a measure of how common the word is).
		this.count = count
	}

	compareTo (other) {
		// order by distance ascending, then by frequency count descending
		if (this.distance === other.distance) {
			return this.count - other.count
		}

		return other.distance - this.distance
	}
}

class SymSpell {
	// number of all words in the corpus used to generate the frequency dictionary
	// this is used to calculate the word occurrence probability p from word counts c : p=c/N
	// N equals the sum of all counts c in the dictionary only if the dictionary is complete, but not if the dictionary is truncated or filtered
	static get N () {
		return 1024908267229
	}

	static get Verbosity () {
		// verbosity=Top: the suggestion with the highest term frequency of the suggestions of smallest edit distance found
		// verbosity=Closest: all suggestions of smallest edit distance found, the suggestions are ordered by term frequency
		// verbosity=All: all suggestions <= maxEditDistance, the suggestions are ordered by edit distance, then by term frequency (slower, no early termination)
		return {
			TOP: 0,
			CLOSEST: 1,
			ALL: 2
		}
	}

	constructor (
		maxDictionaryEditDistance = 2,
		prefixLength = 7,
		countThreshold = 1
	) {
		this.maxDictionaryEditDistance = maxDictionaryEditDistance
		this.prefixLength = prefixLength
		this.countThreshold = countThreshold

		this.words = new Map()
		this.maxDictionaryWordLength = 0
		this.deletes = new Map()
		this.belowThresholdWords = new Map()

		this.bigrams = new Map()
		this.bigramCountMin = Number.MAX_SAFE_INTEGER
	}

	// Create/Update an entry in the dictionary.
	// For every word there are deletes with an edit distance of 1..maxEditDistance created and added to the
	// dictionary. Every delete entry has a suggestions list, which points to the original term(s) it was created from.
	// The dictionary may be dynamically updated (word frequency and new words) at any time by calling createDictionaryEntry
	// key: The word to add to dictionary.
	// count: The frequency count for word.
	// staging: Optional staging object to speed up adding many entries by staging them to a temporary structure.
	// returns -> True if the word was added as a new correctly spelled word, or false if the word is added as a below threshold word, or updates an existing correctly spelled word.
	createDictionaryEntry (key, count) {
		if (count <= 0) {
			if (this.countThreshold > 0) return false // no point doing anything if count is zero, as it can't change anything
			count = 0
		}

		let countPrevious = -1

		// look first in below threshold words, update count, and allow promotion to correct spelling word if count reaches threshold
		// threshold must be >1 for there to be the possibility of low threshold words
		if (this.countThreshold > 1 && this.belowThresholdWords.has(key)) {
			countPrevious = this.belowThresholdWords.get(key)

			// calculate new count for below threshold word
			count = (Number.MAX_SAFE_INTEGER - countPrevious > count) ? countPrevious + count : Number.MAX_SAFE_INTEGER

			// has reached threshold - remove from below threshold collection (it will be added to correct words below)
			if (count >= this.countThreshold) {
				this.belowThresholdWords.delete(key)
			}
			else {
				this.belowThresholdWords.set(key, count)

				return false
			}
		}
		else if (this.words.has(key)) {
			countPrevious = this.words.get(key)

			// just update count if it's an already added above threshold word
			count = (Number.MAX_SAFE_INTEGER - countPrevious > count) ? countPrevious + count : Number.MAX_SAFE_INTEGER
			this.words.set(key, count)

			return false
		}
		else if (count < this.countThreshold) {
			// new or existing below threshold word
			this.belowThresholdWords.set(key, count)

			return false
		}

		// what we have at this point is a new, above threshold word
		this.words.set(key, count)

		// edits/suggestions are created only once, no matter how often word occurs
		// edits/suggestions are created only as soon as the word occurs in the corpus,
		// even if the same term existed before in the dictionary as an edit from another word
		if (key.length > this.maxDictionaryWordLength) {
			this.maxDictionaryWordLength = key.length
		}

		// create deletes
		const edits = this.editsPrefix(key)

		// put suggestions directly into main data structure
		edits.forEach((val, del) => {
			if (!this.deletes.has(del)) {
				this.deletes.set(del, [])
			}

			this.deletes.get(del).push(key)
		})

		return true
	}

	// Load multiple dictionary entries from a file of word/frequency count pairs
	// Merges with any dictionary data already loaded.
	// corpus: The path+filename of the file.
	// termIndex: The column position of the word.
	// countIndex: The column position of the frequency count.
	// separator: Separator characters between term(s) and count.
	// returns ->True if file loaded, or false if file not found.
	async loadBigramDictionary (dictFile, termIndex, countIndex, separator = ' ') {
		const lines = readline.createInterface({
			input: fs.createReadStream(dictFile, 'utf8'),
			output: process.stdout,
			terminal: false
		})

		for await (const line of lines) {
			const linePartsLength = (separator === ' ') ? 3 : 2
			const lineParts = line.trim().split(separator)

			if (lineParts.length >= linePartsLength) {
				// if default (whitespace) is defined as separator take 2 term parts, otherwise take only one
				const key = (separator === ' ') ? lineParts[termIndex] + ' ' + lineParts[termIndex + 1] : lineParts[termIndex]
				// Int64 count;
				const count = parseInt(lineParts[countIndex], 10)
				this.bigrams.set(key, count)

				if (count < this.bigramCountMin) {
					this.bigramCountMin = count
				}
			}
		}

		return true
	}

	// Load multiple dictionary entries from a file of word/frequency count pairs
	// Merges with any dictionary data already loaded.
	// corpus: The path+filename of the file.
	// termIndex: The column position of the word.
	// countIndex: The column position of the frequency count.
	// separator: Separator characters between term(s) and count.
	// returns ->True if file loaded, or false if file not found.
	async loadDictionary (dictFile, termIndex, countIndex, separator = ' ') {
		const lines = readline.createInterface({
			input: fs.createReadStream(dictFile, 'utf8'),
			output: process.stdout,
			terminal: false
		})

		for await (const line of lines) {
			const lineParts = line.trim().split(separator)

			if (lineParts.length >= 2) {
				const key = lineParts[termIndex]
				const count = parseInt(lineParts[countIndex], 10)
				this.createDictionaryEntry(key, count)
			}
		}

		return true
	}

	// Load multiple dictionary words from a file containing plain text.
	// Merges with any dictionary data already loaded.
	// corpus: The path+filename of the file.
	// returns ->True if file loaded, or false if file not found.
	async createDictionary (dictFile) {
		const lines = readline.createInterface({
			input: fs.createReadStream(dictFile, 'utf8'),
			output: process.stdout,
			terminal: false
		})

		for await (const line of lines) {
			this.parseWords(line).forEach((key) => {
				this.createDictionaryEntry(key, 1)
			})
		}

		return true
	}

	// Find suggested spellings for a given input word.
	// input: The word being spell checked.
	// verbosity: The value controlling the quantity/closeness of the retuned suggestions.
	// maxEditDistance: The maximum edit distance between input and suggested words.
	// includeUnknown: Include input word in suggestions, if no words within edit distance found.
	// returns ->A List of SuggestItem object representing suggested correct spellings for the input word,
	// sorted by edit distance, and secondarily by count frequency.
	lookup (input, verbosity, maxEditDistance = null, { includeUnknown, ignoreToken, transferCasing } = {}) {
		// maxEditDistance used in Lookup can't be bigger than the maxDictionaryEditDistance
		// used to construct the underlying dictionary structure.
		if (maxEditDistance === null) {
			maxEditDistance = this.maxDictionaryEditDistance
		}

		let suggestions = []
		const inputLen = input.length
		let originalPhrase = ''

		if (transferCasing) {
			originalPhrase = input
			input = input.toLowerCase()
		}

		const earlyExit = () => {
			if (includeUnknown && suggestions.length === 0) {
				suggestions.push(new SuggestItem(input, maxEditDistance + 1, 0))
			}

			return suggestions
		}

		// early exit - word is too big to possibly match any words
		if (inputLen - maxEditDistance > this.maxDictionaryWordLength) {
			return earlyExit()
		}

		// quick look for exact match
		let suggestionCount = 0

		if (this.words.has(input)) {
			suggestionCount = this.words.get(input)
			suggestions.push(new SuggestItem(input, 0, suggestionCount))

			// early exit - return exact match, unless caller wants all matches
			if (verbosity !== SymSpell.Verbosity.ALL) {
				return earlyExit()
			}
		}

		if (ignoreToken && input.match(ignoreToken)) {
			suggestionCount = 1
			suggestions.push(new SuggestItem(input, 0, suggestionCount))

			// early exit - return exact match, unless caller wants all matches
			if (verbosity !== SymSpell.Verbosity.ALL) {
				return earlyExit()
			}
		}

		// early termination, if we only want to check if word in dictionary or get its frequency e.g. for word segmentation
		if (maxEditDistance === 0) {
			return earlyExit()
		}

		const consideredDeletes = new Set()
		const consideredSuggestions = new Set()

		// we considered the input already in the words.has(input) above
		consideredSuggestions.add(input)

		let maxEditDistance2 = maxEditDistance
		let candidatePointer = 0
		const candidates = []

		// add original prefix
		let inputPrefixLen = inputLen

		if (inputPrefixLen > this.prefixLength) {
			inputPrefixLen = this.prefixLength
			candidates.push(input.substr(0, inputPrefixLen))
		}
		else {
			candidates.push(input)
		}

		const distanceComparer = new EditDistance()

		while (candidatePointer < candidates.length) {
			const candidate = candidates[candidatePointer]
			candidatePointer += 1
			const candidateLen = candidate.length
			const lengthDiff = inputPrefixLen - candidateLen

			// save some time - early termination
			// if canddate distance is already higher than suggestion distance, than there are no better suggestions to be expected
			if (lengthDiff > maxEditDistance2) {
				// skip to next candidate if Verbosity.ALL, look no further if Verbosity.TOP or Closest
				// (candidates are ordered by delete distance, so none are closer than current)
				if (verbosity === SymSpell.Verbosity.ALL) {
					continue
				}

				break
			}

			// read candidate entry from dictionary
			if (this.deletes.has(candidate)) {
				const dictSuggestions = this.deletes.get(candidate)

				for (let i = 0; i < dictSuggestions.length; i++) {
					const suggestion = dictSuggestions[i]

					if (suggestion === input) {
						continue
					}

					const suggestionLen = suggestion.length

					if (
						Math.abs(suggestionLen - inputLen) > maxEditDistance2 || // input and sugg lengths diff > allowed/current best distance
						suggestionLen < candidateLen || // sugg must be for a different delete string, in same bin only because of hash collision
						(suggestionLen === candidateLen && suggestion !== candidate) // if sugg len = delete len, then it either equals delete or is in same bin only because of hash collision
					) {
						continue
					}

					const suggPrefixLen = Math.min(suggestionLen, this.prefixLength)

					if (suggPrefixLen > inputPrefixLen && (suggPrefixLen - candidateLen) > maxEditDistance2) {
						continue
					}

					// True Damerau-Levenshtein Edit Distance: adjust distance, if both distances>0
					// We allow simultaneous edits (deletes) of maxEditDistance on on both the dictionary and the input term.
					// For replaces and adjacent transposes the resulting edit distance stays <= maxEditDistance.
					// For inserts and deletes the resulting edit distance might exceed maxEditDistance.
					// To prevent suggestions of a higher edit distance, we need to calculate the resulting edit distance, if there are simultaneous edits on both sides.
					// Example: (bank==bnak and bank==bink, but bank!=kanb and bank!=xban and bank!=baxn for maxEditDistance=1)
					// Two deletes on each side of a pair makes them all equal, but the first two pairs have edit distance=1, the others edit distance=2.
					let distance = 0
					let min = 0

					if (candidateLen === 0) {
						// suggestions which have no common chars with input (inputLen<=maxEditDistance && suggestionLen<=maxEditDistance)
						distance = Math.max(inputLen, suggestionLen)

						if (distance > maxEditDistance2 || consideredSuggestions.has(suggestion)) {
							continue
						}
					}
					else if (suggestionLen === 1) {
						distance = (input.indexOf(suggestion[0]) < 0) ? inputLen : inputLen - 1

						if (distance > maxEditDistance2 || consideredSuggestions.has(suggestion)) {
							continue
						}
					}
					// number of edits in prefix ==maxediddistance  AND no identic suffix , then editdistance>maxEditDistance and no need for Levenshtein calculation (inputLen >= this.prefixLength) && (suggestionLen >= this.prefixLength)
					else {
						if (this.prefixLength - maxEditDistance === candidateLen) {
							min = Math.min(inputLen, suggestionLen) - this.prefixLength
						}

						if (
							this.prefixLength - maxEditDistance === candidateLen &&
							((
								min > 1 &&
								input.substr(inputLen + 1 - min) !== suggestion.substr(suggestionLen + 1 - min)
							) ||
							(
								min > 0 &&
								input[inputLen - min] !== suggestion[suggestionLen - min] &&
								(
									input[inputLen - min - 1] !== suggestion[suggestionLen - min] ||
									input[inputLen - min] !== suggestion[suggestionLen - min - 1]
								)
							))
						) {
							continue
						}
						else {
							// deleteInSuggestionPrefix is somewhat expensive, and only pays off when verbosity is Top or Closest.
							if (
								(
									verbosity !== SymSpell.Verbosity.ALL &&
									!this.deleteInSuggestionPrefix(candidate, candidateLen, suggestion, suggestionLen)
								) || consideredSuggestions.has(suggestion)
							) {
								continue
							}

							consideredSuggestions.add(suggestion)

							distance = distanceComparer.compare(input, suggestion, maxEditDistance2)

							if (distance < 0) {
								continue
							}
						}
					}

					// save some time
					// do not process higher distances than those already found, if verbosity<All (note: maxEditDistance2 will always equal maxEditDistance when Verbosity.ALL)
					if (distance <= maxEditDistance2) {
						const suggestionCount = this.words.get(suggestion)
						const si = new SuggestItem(suggestion, distance, suggestionCount)

						if (suggestions.length > 0) {
							switch (verbosity) {
							case SymSpell.Verbosity.CLOSEST: {
								// we will calculate DamLev distance only to the smallest found distance so far
								if (distance < maxEditDistance2) {
									suggestions = []
								}

								break
							}

							case SymSpell.Verbosity.TOP: {
								if (distance < maxEditDistance2 || suggestionCount > suggestions[0].count) {
									maxEditDistance2 = distance
									suggestions[0] = si
								}

								continue
							}
							}
						}

						if (verbosity !== SymSpell.Verbosity.ALL) {
							maxEditDistance2 = distance
						}

						suggestions.push(si)
					}
				} // end foreach
			} // end if

			// add edits
			// derive edits (deletes) from candidate (input) and add them to candidates list
			// this is a recursive process until the maximum edit distance has been reached
			if (lengthDiff < maxEditDistance && candidateLen <= this.prefixLength) {
				// save some time
				// do not create edits with edit distance smaller than suggestions already found
				if (verbosity !== SymSpell.Verbosity.ALL && lengthDiff >= maxEditDistance2) {
					continue
				}

				for (let i = 0; i < candidateLen; i++) {
					const del = candidate.slice(0, i) + candidate.slice(i + 1, candidate.length)

					if (!consideredDeletes.has(del)) {
						consideredDeletes.add(del)
						candidates.push(del)
					}
				}
			}
		} // end while

		// sort by ascending edit distance, then by descending word frequency
		if (suggestions.length > 1) {
			suggestions.sort((a, b) => a.compareTo(b)).reverse()
		}

		if (transferCasing) {
			suggestions = suggestions.map((s) => {
				return new SuggestItem(Helpers.transferCasingSimilar(originalPhrase, s.term), s.distance, s.count)
			})
		}

		return earlyExit()
	}

	// check whether all delete chars are present in the suggestion prefix in correct order, otherwise this is just a hash collision
	deleteInSuggestionPrefix (del, deleteLen, suggestion, suggestionLen) {
		if (deleteLen === 0) {
			return true
		}

		if (this.prefixLength < suggestionLen) {
			suggestionLen = this.prefixLength
		}

		let j = 0

		for (let i = 0; i < deleteLen; i++) {
			const delChar = del[i]

			while (j < suggestionLen && delChar !== suggestion[j]) {
				j++
			}

			if (j === suggestionLen) {
				return false
			}
		}

		return true
	}

	// create a non-unique wordlist from sample text
	// language independent (e.g. works with Chinese characters)
	parseWords (text) {
		// \w Alphanumeric characters (including non-latin characters, umlaut characters and digits) plus "_"
		// \d Digits
		// Compatible with non-latin characters, does not split words at apostrophes
		const matches = text.toLowerCase().matchAll(/(([^\W_]|['’])+)/g)

		return Array.from(matches, (match) => match[0])
	}

	// inexpensive and language independent: only deletes, no transposes + replaces + inserts
	// replaces and inserts are expensive and language dependent (Chinese has 70,000 Unicode Han characters)
	edits (word, editDistance, deleteWords) {
		editDistance++

		if (word.length > 1) {
			for (let i = 0; i < word.length; i++) {
				const del = word.slice(0, i) + word.slice(i + 1, word.length)

				if (!deleteWords.has(del)) {
					deleteWords.add(del)

					// recursion, if maximum edit distance not yet reached
					if (editDistance < this.maxDictionaryEditDistance) {
						this.edits(del, editDistance, deleteWords)
					}
				}
			}
		}

		return deleteWords
	}

	editsPrefix (key) {
		const hashSet = new Set()

		if (key.length <= this.maxDictionaryEditDistance) {
			hashSet.add('')
		}

		if (key.length > this.prefixLength) {
			key = key.substr(0, this.prefixLength)
		}

		hashSet.add(key)

		return this.edits(key, 0, hashSet)
	}

	// ######################

	// LookupCompound supports compound aware automatic spelling correction of multi-word input strings with three cases:
	// 1. mistakenly inserted space into a correct word led to two incorrect terms
	// 2. mistakenly omitted space between two correct words led to one incorrect combined term
	// 3. multiple independent input terms with/without spelling errors

	// Find suggested spellings for a multi-word input string (supports word splitting/merging).
	// input: The string being spell checked.
	// maxEditDistance: The maximum edit distance between input and suggested words.
	// returns ->A List of SuggestItem object representing suggested correct spellings for the input string.
	lookupCompound (input, maxEditDistance = null, { ignoreNonWords, transferCasing } = {}) {
		if (maxEditDistance === null) {
			maxEditDistance = this.maxDictionaryEditDistance
		}

		// parse input string into single terms
		const termList1 = Helpers.parseWordsCase(input)
		let termList2 = []

		if (ignoreNonWords) {
			termList2 = Helpers.parseWordsCase(input, true)
		}

		let suggestions = [] // suggestions for a single term
		const suggestionParts = [] // 1 line with separate parts
		const distanceComparer = new EditDistance()

		// translate every term to its best suggestion, otherwise it remains unchanged
		let lastCombi = false

		for (let i = 0; i < termList1.length; i++) {
			if (ignoreNonWords) {
				if (parseInt(termList1[i], 10)) {
					suggestionParts.push(new SuggestItem(termList1[i], 0, 0))
					continue
				}

				if (Helpers.isAcronym(termList2[i])) {
					suggestionParts.push(new SuggestItem(termList2[i], 0, 0))
					continue
				}
			}

			suggestions = this.lookup(termList1[i], SymSpell.Verbosity.TOP, maxEditDistance)

			// combi check, always before split
			if (i > 0 && !lastCombi) {
				const suggestionsCombi = this.lookup(termList1[i - 1] + termList1[i], SymSpell.Verbosity.TOP, maxEditDistance)

				if (suggestionsCombi.length > 0) {
					const best1 = suggestionParts[suggestionParts.length - 1]
					let best2 = new SuggestItem()

					if (suggestions.length > 0) {
						best2 = suggestions[0]
					}
					else {
						// unknown word
						best2.term = termList1[i]
						// estimated edit distance
						best2.distance = maxEditDistance + 1
						// estimated word occurrence probability P=10 / (N * 10^word length l)
						best2.count = 10 / Math.pow(10, best2.term.length) // 0;
					}

					// distance1=edit distance between 2 split terms und their best corrections : als comparative value for the combination
					const distance1 = best1.distance + best2.distance

					if (
						distance1 >= 0 &&
						(
							suggestionsCombi[0].distance + 1 < distance1 ||
							(
								suggestionsCombi[0].distance + 1 === distance1 &&
								suggestionsCombi[0].count > best1.count / SymSpell.N * best2.count
							)
						)
					) {
						suggestionsCombi[0].distance++
						suggestionParts[suggestionParts.length - 1] = suggestionsCombi[0]
						lastCombi = true

						continue
					}
				}
			}

			lastCombi = false

			// alway split terms without suggestion / never split terms with suggestion ed=0 / never split single char terms
			if (suggestions.length > 0 && (suggestions[0].distance === 0 || termList1[i].length === 1)) {
				// choose best suggestion
				suggestionParts.push(suggestions[0])
			}
			else {
				// if no perfect suggestion, split word into pairs
				let suggestionSplitBest = null

				// add original term
				if (suggestions.length > 0) {
					suggestionSplitBest = suggestions[0]
				}

				if (termList1[i].length > 1) {
					for (let j = 1; j < termList1[i].length; j++) {
						const part1 = termList1[i].substr(0, j)
						const part2 = termList1[i].substr(j)
						const suggestionSplit = new SuggestItem()
						const suggestions1 = this.lookup(part1, SymSpell.Verbosity.TOP, maxEditDistance)

						if (suggestions1.length > 0) {
							const suggestions2 = this.lookup(part2, SymSpell.Verbosity.TOP, maxEditDistance)

							if (suggestions2.length > 0) {
								// select best suggestion for split pair
								suggestionSplit.term = suggestions1[0].term + ' ' + suggestions2[0].term

								let distance2 = distanceComparer.compare(termList1[i], suggestionSplit.term, maxEditDistance)

								if (distance2 < 0) {
									distance2 = maxEditDistance + 1
								}

								if (suggestionSplitBest !== null) {
									if (distance2 > suggestionSplitBest.distance) {
										continue
									}

									if (distance2 < suggestionSplitBest.distance) {
										suggestionSplitBest = null
									}
								}

								suggestionSplit.distance = distance2

								// if bigram exists in bigram dictionary
								if (this.bigrams.has(suggestionSplit.term)) {
									const bigramCount = this.bigrams.get(suggestionSplit.term)
									suggestionSplit.count = bigramCount

									// increase count, if split.corrections are part of or identical to input
									// single term correction exists
									if (suggestions.length > 0) {
										// alternatively remove the single term from suggestionsSplit, but then other splittings could win
										if ((suggestions1[0].term + suggestions2[0].term === termList1[i])) {
											// make count bigger than count of single term correction
											suggestionSplit.count = Math.max(suggestionSplit.count, suggestions[0].count + 2)
										}
										else if (suggestions1[0].term === suggestions[0].term || suggestions2[0].term === suggestions[0].term) {
											// make count bigger than count of single term correction
											suggestionSplit.count = Math.max(suggestionSplit.count, suggestions[0].count + 1)
										}
									}
									// no single term correction exists
									else if (suggestions1[0].term + suggestions2[0].term === termList1[i]) {
										suggestionSplit.count = Math.max(suggestionSplit.count, Math.max(suggestions1[0].count, suggestions2[0].count) + 2)
									}
								}
								else {
									// The Naive Bayes probability of the word combination is the product of the two word probabilities: P(AB) = P(A) * P(B)
									// use it to estimate the frequency count of the combination, which then is used to rank/select the best splitting variant
									suggestionSplit.count = Math.floor(Math.min(this.bigramCountMin, suggestions1[0].count / SymSpell.N * suggestions2[0].count))
								}

								if (suggestionSplitBest === null || suggestionSplit.count > suggestionSplitBest.count) {
									suggestionSplitBest = suggestionSplit
								}
							}
						}
					}

					if (suggestionSplitBest !== null) {
						// select best suggestion for split pair
						suggestionParts.push(suggestionSplitBest)
					}
					else {
						const si = new SuggestItem()
						si.term = termList1[i]
						// estimated word occurrence probability P=10 / (N * 10^word length l)
						si.count = Math.floor(10 / Math.pow(10, si.term.length))
						si.distance = maxEditDistance + 1
						suggestionParts.push(si)
					}
				}
				else {
					const si = new SuggestItem()
					si.term = termList1[i]
					// estimated word occurrence probability P=10 / (N * 10^word length l)
					si.count = Math.floor(10 / Math.pow(10, si.term.length))
					si.distance = maxEditDistance + 1
					suggestionParts.push(si)
				}
			}
		}

		const suggestion = new SuggestItem()

		let count = SymSpell.N
		let s = ''

		suggestionParts.forEach((si) => {
			s += si.term + ' '
			count *= si.count / SymSpell.N
		})

		suggestion.count = Math.floor(count)
		suggestion.term = s.trimEnd()

		if (transferCasing) {
			suggestion.term = Helpers.transferCasingSimilar(input, suggestion.term)
		}

		suggestion.distance = distanceComparer.compare(input, suggestion.term, Number.MAX_SAFE_INTEGER)

		const suggestionsLine = []
		suggestionsLine.push(suggestion)

		return suggestionsLine
	}

	// ######

	// WordSegmentation divides a string into words by inserting missing spaces at the appropriate positions
	// misspelled words are corrected and do not affect segmentation
	// existing spaces are allowed and considered for optimum segmentation

	// SymSpell.WordSegmentation uses a novel approach *without* recursion.
	// https://medium.com/@wolfgarbe/fast-word-segmentation-for-noisy-text-2c2c41f9e8da
	// While each string of length n can be segmentend in 2^n−1 possible compositions https://en.wikipedia.org/wiki/Composition_(combinatorics)
	// SymSpell.WordSegmentation has a linear runtime O(n) to find the optimum composition

	/// Find suggested spellings for a multi-word input string (supports word splitting/merging).
	/// input: The string being spell checked.
	/// maxSegmentationWordLength: The maximum word length that should be considered.
	/// maxEditDistance: The maximum edit distance between input and corrected words
	/// (0=no correction/segmentation only).
	/// The word segmented string as segmentedString,
	/// the word segmented and spelling corrected string as correctedString,
	/// the Edit distance sum between input string and corrected string as distanceSum,
	/// the Sum of word occurence probabilities in log scale (a measure of how common and probable the corrected segmentation is) as probabilityLogSum.
	wordSegmentation (input, { maxEditDistance = null, maxSegmentationWordLength = null, ignoreToken } = {}) {
		if (maxEditDistance === null) {
			maxEditDistance = this.maxDictionaryEditDistance
		}

		if (maxSegmentationWordLength === null) {
			maxSegmentationWordLength = this.maxDictionaryWordLength
		}

		const arraySize = Math.min(maxSegmentationWordLength, input.length)
		const compositions = new Array(arraySize)
		let circularIndex = -1

		// outer loop (column): all possible part start positions
		for (let j = 0; j < input.length; j++) {
			// inner loop (row): all possible part lengths (from start position): part can't be bigger than longest word in dictionary (other than long unknown word)
			const imax = Math.min(input.length - j, maxSegmentationWordLength)

			for (let i = 1; i <= imax; i++) {
				// get top spelling correction/ed for part
				let part = input.substr(j, i)
				let separatorLength = 0
				let topEd = 0
				let topProbabilityLog = 0
				let topResult = ''

				// if it's whitespace
				if (part[0].match(/\s/)) {
					// remove space for levensthein calculation
					part = part.substr(1)
				}
				else {
					// add ed+1: space did not exist, had to be inserted
					separatorLength = 1
				}

				// remove space from part1, add number of removed spaces to topEd
				topEd += part.length
				// remove space
				part = part.replace(/\s+/g, '') //= System.Text.RegularExpressions.Regex.Replace(part1, @"\s+", "");
				// add number of removed spaces to ed
				topEd -= part.length

				const results = this.lookup(part, SymSpell.Verbosity.TOP, maxEditDistance, { ignoreToken })

				if (results.length > 0) {
					topResult = results[0].term
					topEd += results[0].distance
					// Naive Bayes Rule
					// we assume the word probabilities of two words to be independent
					// therefore the resulting probability of the word combination is the product of the two word probabilities

					// instead of computing the product of probabilities we are computing the sum of the logarithm of probabilities
					// because the probabilities of words are about 10^-10, the product of many such small numbers could exceed (underflow) the floating number range and become zero
					// log(ab)=log(a)+log(b)
					topProbabilityLog = Math.log10(results[0].count / SymSpell.N)
				}
				else {
					topResult = part
					// default, if word not found
					// otherwise long input text would win as long unknown word (with ed=edmax+1 ), although there there should many spaces inserted
					topEd += part.length
					topProbabilityLog = Math.log10(10.0 / (SymSpell.N / Math.pow(10.0, part.length)))
				}

				const destinationIndex = (i + circularIndex) % arraySize

				// set values in first loop
				if (j === 0) {
					compositions[destinationIndex] = { 
						segmentedString: part,
						correctedString: topResult,
						distanceSum: topEd,
						probabilityLogSum: topProbabilityLog
					}
				}
				else if ((i === maxSegmentationWordLength) ||
                    // replace values if better probabilityLogSum, if same edit distance OR one space difference
                    (((compositions[circularIndex].distanceSum + topEd === compositions[destinationIndex].distanceSum) || (compositions[circularIndex].distanceSum + separatorLength + topEd === compositions[destinationIndex].distanceSum)) && (compositions[destinationIndex].probabilityLogSum < compositions[circularIndex].probabilityLogSum + topProbabilityLog)) ||
                    // replace values if smaller edit distance
                    (compositions[circularIndex].distanceSum + separatorLength + topEd < compositions[destinationIndex].distanceSum)) {
					compositions[destinationIndex] = {
						segmentedString: (compositions[circularIndex].segmentedString || '') + ' ' + part,
						correctedString: (compositions[circularIndex].correctedString || '') + ' ' + topResult,
						distanceSum: (compositions[circularIndex].distanceSum || 0) + separatorLength + topEd,
						probabilityLogSum: (compositions[circularIndex].probabilityLogSum || 0) + topProbabilityLog
					}
				}
			}

			circularIndex += 1

			if (circularIndex === arraySize) {
				circularIndex = 0
			}
		}

		return compositions[circularIndex]
	}
}

module.exports = SymSpell

}).call(this)}).call(this,require('_process'))
},{"./edit-distance":1,"./helpers":2,"_process":289,"fs":270,"readline":270}],4:[function(require,module,exports){
module.exports = require("core-js/library/fn/array/from");
},{"core-js/library/fn/array/from":38}],5:[function(require,module,exports){
module.exports = require("core-js/library/fn/array/is-array");
},{"core-js/library/fn/array/is-array":39}],6:[function(require,module,exports){
module.exports = require("core-js/library/fn/date/now");
},{"core-js/library/fn/date/now":40}],7:[function(require,module,exports){
module.exports = require("core-js/library/fn/get-iterator");
},{"core-js/library/fn/get-iterator":41}],8:[function(require,module,exports){
module.exports = require("core-js/library/fn/is-iterable");
},{"core-js/library/fn/is-iterable":42}],9:[function(require,module,exports){
module.exports = require("core-js/library/fn/map");
},{"core-js/library/fn/map":43}],10:[function(require,module,exports){
module.exports = require("core-js/library/fn/object/define-property");
},{"core-js/library/fn/object/define-property":44}],11:[function(require,module,exports){
module.exports = require("core-js/library/fn/object/get-prototype-of");
},{"core-js/library/fn/object/get-prototype-of":45}],12:[function(require,module,exports){
module.exports = require("core-js/library/fn/object/keys");
},{"core-js/library/fn/object/keys":46}],13:[function(require,module,exports){
module.exports = require("core-js/library/fn/promise");
},{"core-js/library/fn/promise":47}],14:[function(require,module,exports){
module.exports = require("core-js/library/fn/set");
},{"core-js/library/fn/set":48}],15:[function(require,module,exports){
module.exports = require("core-js/library/fn/symbol");
},{"core-js/library/fn/symbol":49}],16:[function(require,module,exports){
module.exports = require("core-js/library/fn/symbol/iterator");
},{"core-js/library/fn/symbol/iterator":50}],17:[function(require,module,exports){
var _Symbol = require("../core-js/symbol");

var _Promise = require("../core-js/promise");

var AwaitValue = require("./AwaitValue");

function AsyncGenerator(gen) {
  var front, back;

  function send(key, arg) {
    return new _Promise(function (resolve, reject) {
      var request = {
        key: key,
        arg: arg,
        resolve: resolve,
        reject: reject,
        next: null
      };

      if (back) {
        back = back.next = request;
      } else {
        front = back = request;
        resume(key, arg);
      }
    });
  }

  function resume(key, arg) {
    try {
      var result = gen[key](arg);
      var value = result.value;
      var wrappedAwait = value instanceof AwaitValue;

      _Promise.resolve(wrappedAwait ? value.wrapped : value).then(function (arg) {
        if (wrappedAwait) {
          resume(key === "return" ? "return" : "next", arg);
          return;
        }

        settle(result.done ? "return" : "normal", arg);
      }, function (err) {
        resume("throw", err);
      });
    } catch (err) {
      settle("throw", err);
    }
  }

  function settle(type, value) {
    switch (type) {
      case "return":
        front.resolve({
          value: value,
          done: true
        });
        break;

      case "throw":
        front.reject(value);
        break;

      default:
        front.resolve({
          value: value,
          done: false
        });
        break;
    }

    front = front.next;

    if (front) {
      resume(front.key, front.arg);
    } else {
      back = null;
    }
  }

  this._invoke = send;

  if (typeof gen["return"] !== "function") {
    this["return"] = undefined;
  }
}

if (typeof _Symbol === "function" && _Symbol.asyncIterator) {
  AsyncGenerator.prototype[_Symbol.asyncIterator] = function () {
    return this;
  };
}

AsyncGenerator.prototype.next = function (arg) {
  return this._invoke("next", arg);
};

AsyncGenerator.prototype["throw"] = function (arg) {
  return this._invoke("throw", arg);
};

AsyncGenerator.prototype["return"] = function (arg) {
  return this._invoke("return", arg);
};

module.exports = AsyncGenerator;
},{"../core-js/promise":13,"../core-js/symbol":15,"./AwaitValue":18}],18:[function(require,module,exports){
function _AwaitValue(value) {
  this.wrapped = value;
}

module.exports = _AwaitValue;
},{}],19:[function(require,module,exports){
var _Array$isArray = require("../core-js/array/is-array");

function _arrayWithHoles(arr) {
  if (_Array$isArray(arr)) return arr;
}

module.exports = _arrayWithHoles;
},{"../core-js/array/is-array":5}],20:[function(require,module,exports){
var _Array$isArray = require("../core-js/array/is-array");

function _arrayWithoutHoles(arr) {
  if (_Array$isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }
}

module.exports = _arrayWithoutHoles;
},{"../core-js/array/is-array":5}],21:[function(require,module,exports){
var _Symbol$iterator = require("../core-js/symbol/iterator");

var _Symbol = require("../core-js/symbol");

var _Promise = require("../core-js/promise");

function _asyncGeneratorDelegate(inner, awaitWrap) {
  var iter = {},
      waiting = false;

  function pump(key, value) {
    waiting = true;
    value = new _Promise(function (resolve) {
      resolve(inner[key](value));
    });
    return {
      done: false,
      value: awaitWrap(value)
    };
  }

  ;

  if (typeof _Symbol === "function" && _Symbol$iterator) {
    iter[_Symbol$iterator] = function () {
      return this;
    };
  }

  iter.next = function (value) {
    if (waiting) {
      waiting = false;
      return value;
    }

    return pump("next", value);
  };

  if (typeof inner["throw"] === "function") {
    iter["throw"] = function (value) {
      if (waiting) {
        waiting = false;
        throw value;
      }

      return pump("throw", value);
    };
  }

  if (typeof inner["return"] === "function") {
    iter["return"] = function (value) {
      if (waiting) {
        waiting = false;
        return value;
      }

      return pump("return", value);
    };
  }

  return iter;
}

module.exports = _asyncGeneratorDelegate;
},{"../core-js/promise":13,"../core-js/symbol":15,"../core-js/symbol/iterator":16}],22:[function(require,module,exports){
var _Symbol$iterator = require("../core-js/symbol/iterator");

var _Symbol = require("../core-js/symbol");

function _asyncIterator(iterable) {
  var method;

  if (typeof _Symbol !== "undefined") {
    if (_Symbol.asyncIterator) {
      method = iterable[_Symbol.asyncIterator];
      if (method != null) return method.call(iterable);
    }

    if (_Symbol$iterator) {
      method = iterable[_Symbol$iterator];
      if (method != null) return method.call(iterable);
    }
  }

  throw new TypeError("Object is not async iterable");
}

module.exports = _asyncIterator;
},{"../core-js/symbol":15,"../core-js/symbol/iterator":16}],23:[function(require,module,exports){
var _Promise = require("../core-js/promise");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    _Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new _Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

module.exports = _asyncToGenerator;
},{"../core-js/promise":13}],24:[function(require,module,exports){
var AwaitValue = require("./AwaitValue");

function _awaitAsyncGenerator(value) {
  return new AwaitValue(value);
}

module.exports = _awaitAsyncGenerator;
},{"./AwaitValue":18}],25:[function(require,module,exports){
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

module.exports = _classCallCheck;
},{}],26:[function(require,module,exports){
var _Object$defineProperty = require("../core-js/object/define-property");

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;

    _Object$defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

module.exports = _createClass;
},{"../core-js/object/define-property":10}],27:[function(require,module,exports){
var _Object$defineProperty = require("../core-js/object/define-property");

function _defineProperty(obj, key, value) {
  if (key in obj) {
    _Object$defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

module.exports = _defineProperty;
},{"../core-js/object/define-property":10}],28:[function(require,module,exports){
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

module.exports = _interopRequireDefault;
},{}],29:[function(require,module,exports){
var _Array$from = require("../core-js/array/from");

var _isIterable = require("../core-js/is-iterable");

function _iterableToArray(iter) {
  if (_isIterable(Object(iter)) || Object.prototype.toString.call(iter) === "[object Arguments]") return _Array$from(iter);
}

module.exports = _iterableToArray;
},{"../core-js/array/from":4,"../core-js/is-iterable":8}],30:[function(require,module,exports){
var _getIterator = require("../core-js/get-iterator");

var _isIterable = require("../core-js/is-iterable");

function _iterableToArrayLimit(arr, i) {
  if (!(_isIterable(Object(arr)) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
    return;
  }

  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = _getIterator(arr), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

module.exports = _iterableToArrayLimit;
},{"../core-js/get-iterator":7,"../core-js/is-iterable":8}],31:[function(require,module,exports){
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

module.exports = _nonIterableRest;
},{}],32:[function(require,module,exports){
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

module.exports = _nonIterableSpread;
},{}],33:[function(require,module,exports){
var arrayWithHoles = require("./arrayWithHoles");

var iterableToArrayLimit = require("./iterableToArrayLimit");

var nonIterableRest = require("./nonIterableRest");

function _slicedToArray(arr, i) {
  return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || nonIterableRest();
}

module.exports = _slicedToArray;
},{"./arrayWithHoles":19,"./iterableToArrayLimit":30,"./nonIterableRest":31}],34:[function(require,module,exports){
var arrayWithoutHoles = require("./arrayWithoutHoles");

var iterableToArray = require("./iterableToArray");

var nonIterableSpread = require("./nonIterableSpread");

function _toConsumableArray(arr) {
  return arrayWithoutHoles(arr) || iterableToArray(arr) || nonIterableSpread();
}

module.exports = _toConsumableArray;
},{"./arrayWithoutHoles":20,"./iterableToArray":29,"./nonIterableSpread":32}],35:[function(require,module,exports){
var _Symbol$iterator = require("../core-js/symbol/iterator");

var _Symbol = require("../core-js/symbol");

function _typeof(obj) {
  if (typeof _Symbol === "function" && typeof _Symbol$iterator === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof _Symbol === "function" && obj.constructor === _Symbol && obj !== _Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

module.exports = _typeof;
},{"../core-js/symbol":15,"../core-js/symbol/iterator":16}],36:[function(require,module,exports){
var AsyncGenerator = require("./AsyncGenerator");

function _wrapAsyncGenerator(fn) {
  return function () {
    return new AsyncGenerator(fn.apply(this, arguments));
  };
}

module.exports = _wrapAsyncGenerator;
},{"./AsyncGenerator":17}],37:[function(require,module,exports){
module.exports = require("regenerator-runtime");

},{"regenerator-runtime":268}],38:[function(require,module,exports){
require('../../modules/es6.string.iterator');
require('../../modules/es6.array.from');
module.exports = require('../../modules/_core').Array.from;

},{"../../modules/_core":65,"../../modules/es6.array.from":137,"../../modules/es6.string.iterator":148}],39:[function(require,module,exports){
require('../../modules/es6.array.is-array');
module.exports = require('../../modules/_core').Array.isArray;

},{"../../modules/_core":65,"../../modules/es6.array.is-array":138}],40:[function(require,module,exports){
require('../../modules/es6.date.now');
module.exports = require('../../modules/_core').Date.now;

},{"../../modules/_core":65,"../../modules/es6.date.now":140}],41:[function(require,module,exports){
require('../modules/web.dom.iterable');
require('../modules/es6.string.iterator');
module.exports = require('../modules/core.get-iterator');

},{"../modules/core.get-iterator":135,"../modules/es6.string.iterator":148,"../modules/web.dom.iterable":160}],42:[function(require,module,exports){
require('../modules/web.dom.iterable');
require('../modules/es6.string.iterator');
module.exports = require('../modules/core.is-iterable');

},{"../modules/core.is-iterable":136,"../modules/es6.string.iterator":148,"../modules/web.dom.iterable":160}],43:[function(require,module,exports){
require('../modules/es6.object.to-string');
require('../modules/es6.string.iterator');
require('../modules/web.dom.iterable');
require('../modules/es6.map');
require('../modules/es7.map.to-json');
require('../modules/es7.map.of');
require('../modules/es7.map.from');
module.exports = require('../modules/_core').Map;

},{"../modules/_core":65,"../modules/es6.map":141,"../modules/es6.object.to-string":145,"../modules/es6.string.iterator":148,"../modules/es7.map.from":150,"../modules/es7.map.of":151,"../modules/es7.map.to-json":152,"../modules/web.dom.iterable":160}],44:[function(require,module,exports){
require('../../modules/es6.object.define-property');
var $Object = require('../../modules/_core').Object;
module.exports = function defineProperty(it, key, desc) {
  return $Object.defineProperty(it, key, desc);
};

},{"../../modules/_core":65,"../../modules/es6.object.define-property":142}],45:[function(require,module,exports){
require('../../modules/es6.object.get-prototype-of');
module.exports = require('../../modules/_core').Object.getPrototypeOf;

},{"../../modules/_core":65,"../../modules/es6.object.get-prototype-of":143}],46:[function(require,module,exports){
require('../../modules/es6.object.keys');
module.exports = require('../../modules/_core').Object.keys;

},{"../../modules/_core":65,"../../modules/es6.object.keys":144}],47:[function(require,module,exports){
require('../modules/es6.object.to-string');
require('../modules/es6.string.iterator');
require('../modules/web.dom.iterable');
require('../modules/es6.promise');
require('../modules/es7.promise.finally');
require('../modules/es7.promise.try');
module.exports = require('../modules/_core').Promise;

},{"../modules/_core":65,"../modules/es6.object.to-string":145,"../modules/es6.promise":146,"../modules/es6.string.iterator":148,"../modules/es7.promise.finally":153,"../modules/es7.promise.try":154,"../modules/web.dom.iterable":160}],48:[function(require,module,exports){
require('../modules/es6.object.to-string');
require('../modules/es6.string.iterator');
require('../modules/web.dom.iterable');
require('../modules/es6.set');
require('../modules/es7.set.to-json');
require('../modules/es7.set.of');
require('../modules/es7.set.from');
module.exports = require('../modules/_core').Set;

},{"../modules/_core":65,"../modules/es6.object.to-string":145,"../modules/es6.set":147,"../modules/es6.string.iterator":148,"../modules/es7.set.from":155,"../modules/es7.set.of":156,"../modules/es7.set.to-json":157,"../modules/web.dom.iterable":160}],49:[function(require,module,exports){
require('../../modules/es6.symbol');
require('../../modules/es6.object.to-string');
require('../../modules/es7.symbol.async-iterator');
require('../../modules/es7.symbol.observable');
module.exports = require('../../modules/_core').Symbol;

},{"../../modules/_core":65,"../../modules/es6.object.to-string":145,"../../modules/es6.symbol":149,"../../modules/es7.symbol.async-iterator":158,"../../modules/es7.symbol.observable":159}],50:[function(require,module,exports){
require('../../modules/es6.string.iterator');
require('../../modules/web.dom.iterable');
module.exports = require('../../modules/_wks-ext').f('iterator');

},{"../../modules/_wks-ext":132,"../../modules/es6.string.iterator":148,"../../modules/web.dom.iterable":160}],51:[function(require,module,exports){
module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};

},{}],52:[function(require,module,exports){
module.exports = function () { /* empty */ };

},{}],53:[function(require,module,exports){
module.exports = function (it, Constructor, name, forbiddenField) {
  if (!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)) {
    throw TypeError(name + ': incorrect invocation!');
  } return it;
};

},{}],54:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};

},{"./_is-object":85}],55:[function(require,module,exports){
var forOf = require('./_for-of');

module.exports = function (iter, ITERATOR) {
  var result = [];
  forOf(iter, false, result.push, result, ITERATOR);
  return result;
};

},{"./_for-of":75}],56:[function(require,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = require('./_to-iobject');
var toLength = require('./_to-length');
var toAbsoluteIndex = require('./_to-absolute-index');
module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

},{"./_to-absolute-index":122,"./_to-iobject":124,"./_to-length":125}],57:[function(require,module,exports){
// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx = require('./_ctx');
var IObject = require('./_iobject');
var toObject = require('./_to-object');
var toLength = require('./_to-length');
var asc = require('./_array-species-create');
module.exports = function (TYPE, $create) {
  var IS_MAP = TYPE == 1;
  var IS_FILTER = TYPE == 2;
  var IS_SOME = TYPE == 3;
  var IS_EVERY = TYPE == 4;
  var IS_FIND_INDEX = TYPE == 6;
  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
  var create = $create || asc;
  return function ($this, callbackfn, that) {
    var O = toObject($this);
    var self = IObject(O);
    var f = ctx(callbackfn, that, 3);
    var length = toLength(self.length);
    var index = 0;
    var result = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
    var val, res;
    for (;length > index; index++) if (NO_HOLES || index in self) {
      val = self[index];
      res = f(val, index, O);
      if (TYPE) {
        if (IS_MAP) result[index] = res;   // map
        else if (res) switch (TYPE) {
          case 3: return true;             // some
          case 5: return val;              // find
          case 6: return index;            // findIndex
          case 2: result.push(val);        // filter
        } else if (IS_EVERY) return false; // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
  };
};

},{"./_array-species-create":59,"./_ctx":67,"./_iobject":82,"./_to-length":125,"./_to-object":126}],58:[function(require,module,exports){
var isObject = require('./_is-object');
var isArray = require('./_is-array');
var SPECIES = require('./_wks')('species');

module.exports = function (original) {
  var C;
  if (isArray(original)) {
    C = original.constructor;
    // cross-realm fallback
    if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
    if (isObject(C)) {
      C = C[SPECIES];
      if (C === null) C = undefined;
    }
  } return C === undefined ? Array : C;
};

},{"./_is-array":84,"./_is-object":85,"./_wks":133}],59:[function(require,module,exports){
// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var speciesConstructor = require('./_array-species-constructor');

module.exports = function (original, length) {
  return new (speciesConstructor(original))(length);
};

},{"./_array-species-constructor":58}],60:[function(require,module,exports){
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = require('./_cof');
var TAG = require('./_wks')('toStringTag');
// ES3 wrong here
var ARG = cof(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (e) { /* empty */ }
};

module.exports = function (it) {
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};

},{"./_cof":61,"./_wks":133}],61:[function(require,module,exports){
var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

},{}],62:[function(require,module,exports){
'use strict';
var dP = require('./_object-dp').f;
var create = require('./_object-create');
var redefineAll = require('./_redefine-all');
var ctx = require('./_ctx');
var anInstance = require('./_an-instance');
var forOf = require('./_for-of');
var $iterDefine = require('./_iter-define');
var step = require('./_iter-step');
var setSpecies = require('./_set-species');
var DESCRIPTORS = require('./_descriptors');
var fastKey = require('./_meta').fastKey;
var validate = require('./_validate-collection');
var SIZE = DESCRIPTORS ? '_s' : 'size';

var getEntry = function (that, key) {
  // fast case
  var index = fastKey(key);
  var entry;
  if (index !== 'F') return that._i[index];
  // frozen object case
  for (entry = that._f; entry; entry = entry.n) {
    if (entry.k == key) return entry;
  }
};

module.exports = {
  getConstructor: function (wrapper, NAME, IS_MAP, ADDER) {
    var C = wrapper(function (that, iterable) {
      anInstance(that, C, NAME, '_i');
      that._t = NAME;         // collection type
      that._i = create(null); // index
      that._f = undefined;    // first entry
      that._l = undefined;    // last entry
      that[SIZE] = 0;         // size
      if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.1.3.1 Map.prototype.clear()
      // 23.2.3.2 Set.prototype.clear()
      clear: function clear() {
        for (var that = validate(this, NAME), data = that._i, entry = that._f; entry; entry = entry.n) {
          entry.r = true;
          if (entry.p) entry.p = entry.p.n = undefined;
          delete data[entry.i];
        }
        that._f = that._l = undefined;
        that[SIZE] = 0;
      },
      // 23.1.3.3 Map.prototype.delete(key)
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function (key) {
        var that = validate(this, NAME);
        var entry = getEntry(that, key);
        if (entry) {
          var next = entry.n;
          var prev = entry.p;
          delete that._i[entry.i];
          entry.r = true;
          if (prev) prev.n = next;
          if (next) next.p = prev;
          if (that._f == entry) that._f = next;
          if (that._l == entry) that._l = prev;
          that[SIZE]--;
        } return !!entry;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: function forEach(callbackfn /* , that = undefined */) {
        validate(this, NAME);
        var f = ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3);
        var entry;
        while (entry = entry ? entry.n : this._f) {
          f(entry.v, entry.k, this);
          // revert to the last existing entry
          while (entry && entry.r) entry = entry.p;
        }
      },
      // 23.1.3.7 Map.prototype.has(key)
      // 23.2.3.7 Set.prototype.has(value)
      has: function has(key) {
        return !!getEntry(validate(this, NAME), key);
      }
    });
    if (DESCRIPTORS) dP(C.prototype, 'size', {
      get: function () {
        return validate(this, NAME)[SIZE];
      }
    });
    return C;
  },
  def: function (that, key, value) {
    var entry = getEntry(that, key);
    var prev, index;
    // change existing entry
    if (entry) {
      entry.v = value;
    // create new entry
    } else {
      that._l = entry = {
        i: index = fastKey(key, true), // <- index
        k: key,                        // <- key
        v: value,                      // <- value
        p: prev = that._l,             // <- previous entry
        n: undefined,                  // <- next entry
        r: false                       // <- removed
      };
      if (!that._f) that._f = entry;
      if (prev) prev.n = entry;
      that[SIZE]++;
      // add to index
      if (index !== 'F') that._i[index] = entry;
    } return that;
  },
  getEntry: getEntry,
  setStrong: function (C, NAME, IS_MAP) {
    // add .keys, .values, .entries, [@@iterator]
    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
    $iterDefine(C, NAME, function (iterated, kind) {
      this._t = validate(iterated, NAME); // target
      this._k = kind;                     // kind
      this._l = undefined;                // previous
    }, function () {
      var that = this;
      var kind = that._k;
      var entry = that._l;
      // revert to the last existing entry
      while (entry && entry.r) entry = entry.p;
      // get next entry
      if (!that._t || !(that._l = entry = entry ? entry.n : that._t._f)) {
        // or finish the iteration
        that._t = undefined;
        return step(1);
      }
      // return step by kind
      if (kind == 'keys') return step(0, entry.k);
      if (kind == 'values') return step(0, entry.v);
      return step(0, [entry.k, entry.v]);
    }, IS_MAP ? 'entries' : 'values', !IS_MAP, true);

    // add [@@species], 23.1.2.2, 23.2.2.2
    setSpecies(NAME);
  }
};

},{"./_an-instance":53,"./_ctx":67,"./_descriptors":69,"./_for-of":75,"./_iter-define":88,"./_iter-step":90,"./_meta":93,"./_object-create":96,"./_object-dp":97,"./_redefine-all":111,"./_set-species":115,"./_validate-collection":130}],63:[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var classof = require('./_classof');
var from = require('./_array-from-iterable');
module.exports = function (NAME) {
  return function toJSON() {
    if (classof(this) != NAME) throw TypeError(NAME + "#toJSON isn't generic");
    return from(this);
  };
};

},{"./_array-from-iterable":55,"./_classof":60}],64:[function(require,module,exports){
'use strict';
var global = require('./_global');
var $export = require('./_export');
var meta = require('./_meta');
var fails = require('./_fails');
var hide = require('./_hide');
var redefineAll = require('./_redefine-all');
var forOf = require('./_for-of');
var anInstance = require('./_an-instance');
var isObject = require('./_is-object');
var setToStringTag = require('./_set-to-string-tag');
var dP = require('./_object-dp').f;
var each = require('./_array-methods')(0);
var DESCRIPTORS = require('./_descriptors');

module.exports = function (NAME, wrapper, methods, common, IS_MAP, IS_WEAK) {
  var Base = global[NAME];
  var C = Base;
  var ADDER = IS_MAP ? 'set' : 'add';
  var proto = C && C.prototype;
  var O = {};
  if (!DESCRIPTORS || typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function () {
    new C().entries().next();
  }))) {
    // create collection constructor
    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
    redefineAll(C.prototype, methods);
    meta.NEED = true;
  } else {
    C = wrapper(function (target, iterable) {
      anInstance(target, C, NAME, '_c');
      target._c = new Base();
      if (iterable != undefined) forOf(iterable, IS_MAP, target[ADDER], target);
    });
    each('add,clear,delete,forEach,get,has,set,keys,values,entries,toJSON'.split(','), function (KEY) {
      var IS_ADDER = KEY == 'add' || KEY == 'set';
      if (KEY in proto && !(IS_WEAK && KEY == 'clear')) hide(C.prototype, KEY, function (a, b) {
        anInstance(this, C, KEY);
        if (!IS_ADDER && IS_WEAK && !isObject(a)) return KEY == 'get' ? undefined : false;
        var result = this._c[KEY](a === 0 ? 0 : a, b);
        return IS_ADDER ? this : result;
      });
    });
    IS_WEAK || dP(C.prototype, 'size', {
      get: function () {
        return this._c.size;
      }
    });
  }

  setToStringTag(C, NAME);

  O[NAME] = C;
  $export($export.G + $export.W + $export.F, O);

  if (!IS_WEAK) common.setStrong(C, NAME, IS_MAP);

  return C;
};

},{"./_an-instance":53,"./_array-methods":57,"./_descriptors":69,"./_export":73,"./_fails":74,"./_for-of":75,"./_global":76,"./_hide":78,"./_is-object":85,"./_meta":93,"./_object-dp":97,"./_redefine-all":111,"./_set-to-string-tag":116}],65:[function(require,module,exports){
var core = module.exports = { version: '2.6.11' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef

},{}],66:[function(require,module,exports){
'use strict';
var $defineProperty = require('./_object-dp');
var createDesc = require('./_property-desc');

module.exports = function (object, index, value) {
  if (index in object) $defineProperty.f(object, index, createDesc(0, value));
  else object[index] = value;
};

},{"./_object-dp":97,"./_property-desc":110}],67:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./_a-function');
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

},{"./_a-function":51}],68:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};

},{}],69:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});

},{"./_fails":74}],70:[function(require,module,exports){
var isObject = require('./_is-object');
var document = require('./_global').document;
// typeof document.createElement is 'object' in old IE
var is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};

},{"./_global":76,"./_is-object":85}],71:[function(require,module,exports){
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');

},{}],72:[function(require,module,exports){
// all enumerable object keys, includes symbols
var getKeys = require('./_object-keys');
var gOPS = require('./_object-gops');
var pIE = require('./_object-pie');
module.exports = function (it) {
  var result = getKeys(it);
  var getSymbols = gOPS.f;
  if (getSymbols) {
    var symbols = getSymbols(it);
    var isEnum = pIE.f;
    var i = 0;
    var key;
    while (symbols.length > i) if (isEnum.call(it, key = symbols[i++])) result.push(key);
  } return result;
};

},{"./_object-gops":102,"./_object-keys":105,"./_object-pie":106}],73:[function(require,module,exports){
var global = require('./_global');
var core = require('./_core');
var ctx = require('./_ctx');
var hide = require('./_hide');
var has = require('./_has');
var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var IS_WRAP = type & $export.W;
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE];
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE];
  var key, own, out;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if (own && has(exports, key)) continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function (C) {
      var F = function (a, b, c) {
        if (this instanceof C) {
          switch (arguments.length) {
            case 0: return new C();
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if (IS_PROTO) {
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if (type & $export.R && expProto && !expProto[key]) hide(expProto, key, out);
    }
  }
};
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
module.exports = $export;

},{"./_core":65,"./_ctx":67,"./_global":76,"./_has":77,"./_hide":78}],74:[function(require,module,exports){
module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};

},{}],75:[function(require,module,exports){
var ctx = require('./_ctx');
var call = require('./_iter-call');
var isArrayIter = require('./_is-array-iter');
var anObject = require('./_an-object');
var toLength = require('./_to-length');
var getIterFn = require('./core.get-iterator-method');
var BREAK = {};
var RETURN = {};
var exports = module.exports = function (iterable, entries, fn, that, ITERATOR) {
  var iterFn = ITERATOR ? function () { return iterable; } : getIterFn(iterable);
  var f = ctx(fn, that, entries ? 2 : 1);
  var index = 0;
  var length, step, iterator, result;
  if (typeof iterFn != 'function') throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if (isArrayIter(iterFn)) for (length = toLength(iterable.length); length > index; index++) {
    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
    if (result === BREAK || result === RETURN) return result;
  } else for (iterator = iterFn.call(iterable); !(step = iterator.next()).done;) {
    result = call(iterator, f, step.value, entries);
    if (result === BREAK || result === RETURN) return result;
  }
};
exports.BREAK = BREAK;
exports.RETURN = RETURN;

},{"./_an-object":54,"./_ctx":67,"./_is-array-iter":83,"./_iter-call":86,"./_to-length":125,"./core.get-iterator-method":134}],76:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef

},{}],77:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};

},{}],78:[function(require,module,exports){
var dP = require('./_object-dp');
var createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

},{"./_descriptors":69,"./_object-dp":97,"./_property-desc":110}],79:[function(require,module,exports){
var document = require('./_global').document;
module.exports = document && document.documentElement;

},{"./_global":76}],80:[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function () {
  return Object.defineProperty(require('./_dom-create')('div'), 'a', { get: function () { return 7; } }).a != 7;
});

},{"./_descriptors":69,"./_dom-create":70,"./_fails":74}],81:[function(require,module,exports){
// fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function (fn, args, that) {
  var un = that === undefined;
  switch (args.length) {
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return fn.apply(that, args);
};

},{}],82:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./_cof');
// eslint-disable-next-line no-prototype-builtins
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};

},{"./_cof":61}],83:[function(require,module,exports){
// check on default Array iterator
var Iterators = require('./_iterators');
var ITERATOR = require('./_wks')('iterator');
var ArrayProto = Array.prototype;

module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};

},{"./_iterators":91,"./_wks":133}],84:[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./_cof');
module.exports = Array.isArray || function isArray(arg) {
  return cof(arg) == 'Array';
};

},{"./_cof":61}],85:[function(require,module,exports){
module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

},{}],86:[function(require,module,exports){
// call something on iterator step with safe closing on error
var anObject = require('./_an-object');
module.exports = function (iterator, fn, value, entries) {
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch (e) {
    var ret = iterator['return'];
    if (ret !== undefined) anObject(ret.call(iterator));
    throw e;
  }
};

},{"./_an-object":54}],87:[function(require,module,exports){
'use strict';
var create = require('./_object-create');
var descriptor = require('./_property-desc');
var setToStringTag = require('./_set-to-string-tag');
var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./_hide')(IteratorPrototype, require('./_wks')('iterator'), function () { return this; });

module.exports = function (Constructor, NAME, next) {
  Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });
  setToStringTag(Constructor, NAME + ' Iterator');
};

},{"./_hide":78,"./_object-create":96,"./_property-desc":110,"./_set-to-string-tag":116,"./_wks":133}],88:[function(require,module,exports){
'use strict';
var LIBRARY = require('./_library');
var $export = require('./_export');
var redefine = require('./_redefine');
var hide = require('./_hide');
var Iterators = require('./_iterators');
var $iterCreate = require('./_iter-create');
var setToStringTag = require('./_set-to-string-tag');
var getPrototypeOf = require('./_object-gpo');
var ITERATOR = require('./_wks')('iterator');
var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
var FF_ITERATOR = '@@iterator';
var KEYS = 'keys';
var VALUES = 'values';

var returnThis = function () { return this; };

module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  $iterCreate(Constructor, NAME, next);
  var getMethod = function (kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS: return function keys() { return new Constructor(this, kind); };
      case VALUES: return function values() { return new Constructor(this, kind); };
    } return function entries() { return new Constructor(this, kind); };
  };
  var TAG = NAME + ' Iterator';
  var DEF_VALUES = DEFAULT == VALUES;
  var VALUES_BUG = false;
  var proto = Base.prototype;
  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
  var $default = $native || getMethod(DEFAULT);
  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
  var methods, key, IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if (!LIBRARY && typeof IteratorPrototype[ITERATOR] != 'function') hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() { return $native.call(this); };
  }
  // Define iterator
  if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};

},{"./_export":73,"./_hide":78,"./_iter-create":87,"./_iterators":91,"./_library":92,"./_object-gpo":103,"./_redefine":112,"./_set-to-string-tag":116,"./_wks":133}],89:[function(require,module,exports){
var ITERATOR = require('./_wks')('iterator');
var SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function () { SAFE_CLOSING = true; };
  // eslint-disable-next-line no-throw-literal
  Array.from(riter, function () { throw 2; });
} catch (e) { /* empty */ }

module.exports = function (exec, skipClosing) {
  if (!skipClosing && !SAFE_CLOSING) return false;
  var safe = false;
  try {
    var arr = [7];
    var iter = arr[ITERATOR]();
    iter.next = function () { return { done: safe = true }; };
    arr[ITERATOR] = function () { return iter; };
    exec(arr);
  } catch (e) { /* empty */ }
  return safe;
};

},{"./_wks":133}],90:[function(require,module,exports){
module.exports = function (done, value) {
  return { value: value, done: !!done };
};

},{}],91:[function(require,module,exports){
module.exports = {};

},{}],92:[function(require,module,exports){
module.exports = true;

},{}],93:[function(require,module,exports){
var META = require('./_uid')('meta');
var isObject = require('./_is-object');
var has = require('./_has');
var setDesc = require('./_object-dp').f;
var id = 0;
var isExtensible = Object.isExtensible || function () {
  return true;
};
var FREEZE = !require('./_fails')(function () {
  return isExtensible(Object.preventExtensions({}));
});
var setMeta = function (it) {
  setDesc(it, META, { value: {
    i: 'O' + ++id, // object ID
    w: {}          // weak collections IDs
  } });
};
var fastKey = function (it, create) {
  // return primitive with prefix
  if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return 'F';
    // not necessary to add metadata
    if (!create) return 'E';
    // add missing metadata
    setMeta(it);
  // return object ID
  } return it[META].i;
};
var getWeak = function (it, create) {
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return true;
    // not necessary to add metadata
    if (!create) return false;
    // add missing metadata
    setMeta(it);
  // return hash weak collections IDs
  } return it[META].w;
};
// add metadata on freeze-family methods calling
var onFreeze = function (it) {
  if (FREEZE && meta.NEED && isExtensible(it) && !has(it, META)) setMeta(it);
  return it;
};
var meta = module.exports = {
  KEY: META,
  NEED: false,
  fastKey: fastKey,
  getWeak: getWeak,
  onFreeze: onFreeze
};

},{"./_fails":74,"./_has":77,"./_is-object":85,"./_object-dp":97,"./_uid":128}],94:[function(require,module,exports){
var global = require('./_global');
var macrotask = require('./_task').set;
var Observer = global.MutationObserver || global.WebKitMutationObserver;
var process = global.process;
var Promise = global.Promise;
var isNode = require('./_cof')(process) == 'process';

module.exports = function () {
  var head, last, notify;

  var flush = function () {
    var parent, fn;
    if (isNode && (parent = process.domain)) parent.exit();
    while (head) {
      fn = head.fn;
      head = head.next;
      try {
        fn();
      } catch (e) {
        if (head) notify();
        else last = undefined;
        throw e;
      }
    } last = undefined;
    if (parent) parent.enter();
  };

  // Node.js
  if (isNode) {
    notify = function () {
      process.nextTick(flush);
    };
  // browsers with MutationObserver, except iOS Safari - https://github.com/zloirock/core-js/issues/339
  } else if (Observer && !(global.navigator && global.navigator.standalone)) {
    var toggle = true;
    var node = document.createTextNode('');
    new Observer(flush).observe(node, { characterData: true }); // eslint-disable-line no-new
    notify = function () {
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if (Promise && Promise.resolve) {
    // Promise.resolve without an argument throws an error in LG WebOS 2
    var promise = Promise.resolve(undefined);
    notify = function () {
      promise.then(flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessag
  // - onreadystatechange
  // - setTimeout
  } else {
    notify = function () {
      // strange IE + webpack dev server bug - use .call(global)
      macrotask.call(global, flush);
    };
  }

  return function (fn) {
    var task = { fn: fn, next: undefined };
    if (last) last.next = task;
    if (!head) {
      head = task;
      notify();
    } last = task;
  };
};

},{"./_cof":61,"./_global":76,"./_task":121}],95:[function(require,module,exports){
'use strict';
// 25.4.1.5 NewPromiseCapability(C)
var aFunction = require('./_a-function');

function PromiseCapability(C) {
  var resolve, reject;
  this.promise = new C(function ($$resolve, $$reject) {
    if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject = $$reject;
  });
  this.resolve = aFunction(resolve);
  this.reject = aFunction(reject);
}

module.exports.f = function (C) {
  return new PromiseCapability(C);
};

},{"./_a-function":51}],96:[function(require,module,exports){
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject = require('./_an-object');
var dPs = require('./_object-dps');
var enumBugKeys = require('./_enum-bug-keys');
var IE_PROTO = require('./_shared-key')('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = require('./_dom-create')('iframe');
  var i = enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  require('./_html').appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--) delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty();
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};

},{"./_an-object":54,"./_dom-create":70,"./_enum-bug-keys":71,"./_html":79,"./_object-dps":98,"./_shared-key":117}],97:[function(require,module,exports){
var anObject = require('./_an-object');
var IE8_DOM_DEFINE = require('./_ie8-dom-define');
var toPrimitive = require('./_to-primitive');
var dP = Object.defineProperty;

exports.f = require('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

},{"./_an-object":54,"./_descriptors":69,"./_ie8-dom-define":80,"./_to-primitive":127}],98:[function(require,module,exports){
var dP = require('./_object-dp');
var anObject = require('./_an-object');
var getKeys = require('./_object-keys');

module.exports = require('./_descriptors') ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = getKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) dP.f(O, P = keys[i++], Properties[P]);
  return O;
};

},{"./_an-object":54,"./_descriptors":69,"./_object-dp":97,"./_object-keys":105}],99:[function(require,module,exports){
var pIE = require('./_object-pie');
var createDesc = require('./_property-desc');
var toIObject = require('./_to-iobject');
var toPrimitive = require('./_to-primitive');
var has = require('./_has');
var IE8_DOM_DEFINE = require('./_ie8-dom-define');
var gOPD = Object.getOwnPropertyDescriptor;

exports.f = require('./_descriptors') ? gOPD : function getOwnPropertyDescriptor(O, P) {
  O = toIObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return gOPD(O, P);
  } catch (e) { /* empty */ }
  if (has(O, P)) return createDesc(!pIE.f.call(O, P), O[P]);
};

},{"./_descriptors":69,"./_has":77,"./_ie8-dom-define":80,"./_object-pie":106,"./_property-desc":110,"./_to-iobject":124,"./_to-primitive":127}],100:[function(require,module,exports){
// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toIObject = require('./_to-iobject');
var gOPN = require('./_object-gopn').f;
var toString = {}.toString;

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function (it) {
  try {
    return gOPN(it);
  } catch (e) {
    return windowNames.slice();
  }
};

module.exports.f = function getOwnPropertyNames(it) {
  return windowNames && toString.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(toIObject(it));
};

},{"./_object-gopn":101,"./_to-iobject":124}],101:[function(require,module,exports){
// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
var $keys = require('./_object-keys-internal');
var hiddenKeys = require('./_enum-bug-keys').concat('length', 'prototype');

exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return $keys(O, hiddenKeys);
};

},{"./_enum-bug-keys":71,"./_object-keys-internal":104}],102:[function(require,module,exports){
exports.f = Object.getOwnPropertySymbols;

},{}],103:[function(require,module,exports){
// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has = require('./_has');
var toObject = require('./_to-object');
var IE_PROTO = require('./_shared-key')('IE_PROTO');
var ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};

},{"./_has":77,"./_shared-key":117,"./_to-object":126}],104:[function(require,module,exports){
var has = require('./_has');
var toIObject = require('./_to-iobject');
var arrayIndexOf = require('./_array-includes')(false);
var IE_PROTO = require('./_shared-key')('IE_PROTO');

module.exports = function (object, names) {
  var O = toIObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) if (key != IE_PROTO) has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};

},{"./_array-includes":56,"./_has":77,"./_shared-key":117,"./_to-iobject":124}],105:[function(require,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys = require('./_object-keys-internal');
var enumBugKeys = require('./_enum-bug-keys');

module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};

},{"./_enum-bug-keys":71,"./_object-keys-internal":104}],106:[function(require,module,exports){
exports.f = {}.propertyIsEnumerable;

},{}],107:[function(require,module,exports){
// most Object methods by ES6 should accept primitives
var $export = require('./_export');
var core = require('./_core');
var fails = require('./_fails');
module.exports = function (KEY, exec) {
  var fn = (core.Object || {})[KEY] || Object[KEY];
  var exp = {};
  exp[KEY] = exec(fn);
  $export($export.S + $export.F * fails(function () { fn(1); }), 'Object', exp);
};

},{"./_core":65,"./_export":73,"./_fails":74}],108:[function(require,module,exports){
module.exports = function (exec) {
  try {
    return { e: false, v: exec() };
  } catch (e) {
    return { e: true, v: e };
  }
};

},{}],109:[function(require,module,exports){
var anObject = require('./_an-object');
var isObject = require('./_is-object');
var newPromiseCapability = require('./_new-promise-capability');

module.exports = function (C, x) {
  anObject(C);
  if (isObject(x) && x.constructor === C) return x;
  var promiseCapability = newPromiseCapability.f(C);
  var resolve = promiseCapability.resolve;
  resolve(x);
  return promiseCapability.promise;
};

},{"./_an-object":54,"./_is-object":85,"./_new-promise-capability":95}],110:[function(require,module,exports){
module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

},{}],111:[function(require,module,exports){
var hide = require('./_hide');
module.exports = function (target, src, safe) {
  for (var key in src) {
    if (safe && target[key]) target[key] = src[key];
    else hide(target, key, src[key]);
  } return target;
};

},{"./_hide":78}],112:[function(require,module,exports){
module.exports = require('./_hide');

},{"./_hide":78}],113:[function(require,module,exports){
'use strict';
// https://tc39.github.io/proposal-setmap-offrom/
var $export = require('./_export');
var aFunction = require('./_a-function');
var ctx = require('./_ctx');
var forOf = require('./_for-of');

module.exports = function (COLLECTION) {
  $export($export.S, COLLECTION, { from: function from(source /* , mapFn, thisArg */) {
    var mapFn = arguments[1];
    var mapping, A, n, cb;
    aFunction(this);
    mapping = mapFn !== undefined;
    if (mapping) aFunction(mapFn);
    if (source == undefined) return new this();
    A = [];
    if (mapping) {
      n = 0;
      cb = ctx(mapFn, arguments[2], 2);
      forOf(source, false, function (nextItem) {
        A.push(cb(nextItem, n++));
      });
    } else {
      forOf(source, false, A.push, A);
    }
    return new this(A);
  } });
};

},{"./_a-function":51,"./_ctx":67,"./_export":73,"./_for-of":75}],114:[function(require,module,exports){
'use strict';
// https://tc39.github.io/proposal-setmap-offrom/
var $export = require('./_export');

module.exports = function (COLLECTION) {
  $export($export.S, COLLECTION, { of: function of() {
    var length = arguments.length;
    var A = new Array(length);
    while (length--) A[length] = arguments[length];
    return new this(A);
  } });
};

},{"./_export":73}],115:[function(require,module,exports){
'use strict';
var global = require('./_global');
var core = require('./_core');
var dP = require('./_object-dp');
var DESCRIPTORS = require('./_descriptors');
var SPECIES = require('./_wks')('species');

module.exports = function (KEY) {
  var C = typeof core[KEY] == 'function' ? core[KEY] : global[KEY];
  if (DESCRIPTORS && C && !C[SPECIES]) dP.f(C, SPECIES, {
    configurable: true,
    get: function () { return this; }
  });
};

},{"./_core":65,"./_descriptors":69,"./_global":76,"./_object-dp":97,"./_wks":133}],116:[function(require,module,exports){
var def = require('./_object-dp').f;
var has = require('./_has');
var TAG = require('./_wks')('toStringTag');

module.exports = function (it, tag, stat) {
  if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};

},{"./_has":77,"./_object-dp":97,"./_wks":133}],117:[function(require,module,exports){
var shared = require('./_shared')('keys');
var uid = require('./_uid');
module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};

},{"./_shared":118,"./_uid":128}],118:[function(require,module,exports){
var core = require('./_core');
var global = require('./_global');
var SHARED = '__core-js_shared__';
var store = global[SHARED] || (global[SHARED] = {});

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: core.version,
  mode: require('./_library') ? 'pure' : 'global',
  copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
});

},{"./_core":65,"./_global":76,"./_library":92}],119:[function(require,module,exports){
// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject = require('./_an-object');
var aFunction = require('./_a-function');
var SPECIES = require('./_wks')('species');
module.exports = function (O, D) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
};

},{"./_a-function":51,"./_an-object":54,"./_wks":133}],120:[function(require,module,exports){
var toInteger = require('./_to-integer');
var defined = require('./_defined');
// true  -> String#at
// false -> String#codePointAt
module.exports = function (TO_STRING) {
  return function (that, pos) {
    var s = String(defined(that));
    var i = toInteger(pos);
    var l = s.length;
    var a, b;
    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};

},{"./_defined":68,"./_to-integer":123}],121:[function(require,module,exports){
var ctx = require('./_ctx');
var invoke = require('./_invoke');
var html = require('./_html');
var cel = require('./_dom-create');
var global = require('./_global');
var process = global.process;
var setTask = global.setImmediate;
var clearTask = global.clearImmediate;
var MessageChannel = global.MessageChannel;
var Dispatch = global.Dispatch;
var counter = 0;
var queue = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var defer, channel, port;
var run = function () {
  var id = +this;
  // eslint-disable-next-line no-prototype-builtins
  if (queue.hasOwnProperty(id)) {
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listener = function (event) {
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if (!setTask || !clearTask) {
  setTask = function setImmediate(fn) {
    var args = [];
    var i = 1;
    while (arguments.length > i) args.push(arguments[i++]);
    queue[++counter] = function () {
      // eslint-disable-next-line no-new-func
      invoke(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id) {
    delete queue[id];
  };
  // Node.js 0.8-
  if (require('./_cof')(process) == 'process') {
    defer = function (id) {
      process.nextTick(ctx(run, id, 1));
    };
  // Sphere (JS game engine) Dispatch API
  } else if (Dispatch && Dispatch.now) {
    defer = function (id) {
      Dispatch.now(ctx(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if (MessageChannel) {
    channel = new MessageChannel();
    port = channel.port2;
    channel.port1.onmessage = listener;
    defer = ctx(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if (global.addEventListener && typeof postMessage == 'function' && !global.importScripts) {
    defer = function (id) {
      global.postMessage(id + '', '*');
    };
    global.addEventListener('message', listener, false);
  // IE8-
  } else if (ONREADYSTATECHANGE in cel('script')) {
    defer = function (id) {
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function () {
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function (id) {
      setTimeout(ctx(run, id, 1), 0);
    };
  }
}
module.exports = {
  set: setTask,
  clear: clearTask
};

},{"./_cof":61,"./_ctx":67,"./_dom-create":70,"./_global":76,"./_html":79,"./_invoke":81}],122:[function(require,module,exports){
var toInteger = require('./_to-integer');
var max = Math.max;
var min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};

},{"./_to-integer":123}],123:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

},{}],124:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./_iobject');
var defined = require('./_defined');
module.exports = function (it) {
  return IObject(defined(it));
};

},{"./_defined":68,"./_iobject":82}],125:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./_to-integer');
var min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

},{"./_to-integer":123}],126:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./_defined');
module.exports = function (it) {
  return Object(defined(it));
};

},{"./_defined":68}],127:[function(require,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = require('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};

},{"./_is-object":85}],128:[function(require,module,exports){
var id = 0;
var px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

},{}],129:[function(require,module,exports){
var global = require('./_global');
var navigator = global.navigator;

module.exports = navigator && navigator.userAgent || '';

},{"./_global":76}],130:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function (it, TYPE) {
  if (!isObject(it) || it._t !== TYPE) throw TypeError('Incompatible receiver, ' + TYPE + ' required!');
  return it;
};

},{"./_is-object":85}],131:[function(require,module,exports){
var global = require('./_global');
var core = require('./_core');
var LIBRARY = require('./_library');
var wksExt = require('./_wks-ext');
var defineProperty = require('./_object-dp').f;
module.exports = function (name) {
  var $Symbol = core.Symbol || (core.Symbol = LIBRARY ? {} : global.Symbol || {});
  if (name.charAt(0) != '_' && !(name in $Symbol)) defineProperty($Symbol, name, { value: wksExt.f(name) });
};

},{"./_core":65,"./_global":76,"./_library":92,"./_object-dp":97,"./_wks-ext":132}],132:[function(require,module,exports){
exports.f = require('./_wks');

},{"./_wks":133}],133:[function(require,module,exports){
var store = require('./_shared')('wks');
var uid = require('./_uid');
var Symbol = require('./_global').Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;

},{"./_global":76,"./_shared":118,"./_uid":128}],134:[function(require,module,exports){
var classof = require('./_classof');
var ITERATOR = require('./_wks')('iterator');
var Iterators = require('./_iterators');
module.exports = require('./_core').getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};

},{"./_classof":60,"./_core":65,"./_iterators":91,"./_wks":133}],135:[function(require,module,exports){
var anObject = require('./_an-object');
var get = require('./core.get-iterator-method');
module.exports = require('./_core').getIterator = function (it) {
  var iterFn = get(it);
  if (typeof iterFn != 'function') throw TypeError(it + ' is not iterable!');
  return anObject(iterFn.call(it));
};

},{"./_an-object":54,"./_core":65,"./core.get-iterator-method":134}],136:[function(require,module,exports){
var classof = require('./_classof');
var ITERATOR = require('./_wks')('iterator');
var Iterators = require('./_iterators');
module.exports = require('./_core').isIterable = function (it) {
  var O = Object(it);
  return O[ITERATOR] !== undefined
    || '@@iterator' in O
    // eslint-disable-next-line no-prototype-builtins
    || Iterators.hasOwnProperty(classof(O));
};

},{"./_classof":60,"./_core":65,"./_iterators":91,"./_wks":133}],137:[function(require,module,exports){
'use strict';
var ctx = require('./_ctx');
var $export = require('./_export');
var toObject = require('./_to-object');
var call = require('./_iter-call');
var isArrayIter = require('./_is-array-iter');
var toLength = require('./_to-length');
var createProperty = require('./_create-property');
var getIterFn = require('./core.get-iterator-method');

$export($export.S + $export.F * !require('./_iter-detect')(function (iter) { Array.from(iter); }), 'Array', {
  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
  from: function from(arrayLike /* , mapfn = undefined, thisArg = undefined */) {
    var O = toObject(arrayLike);
    var C = typeof this == 'function' ? this : Array;
    var aLen = arguments.length;
    var mapfn = aLen > 1 ? arguments[1] : undefined;
    var mapping = mapfn !== undefined;
    var index = 0;
    var iterFn = getIterFn(O);
    var length, result, step, iterator;
    if (mapping) mapfn = ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
    // if object isn't iterable or it's array with default iterator - use simple case
    if (iterFn != undefined && !(C == Array && isArrayIter(iterFn))) {
      for (iterator = iterFn.call(O), result = new C(); !(step = iterator.next()).done; index++) {
        createProperty(result, index, mapping ? call(iterator, mapfn, [step.value, index], true) : step.value);
      }
    } else {
      length = toLength(O.length);
      for (result = new C(length); length > index; index++) {
        createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
      }
    }
    result.length = index;
    return result;
  }
});

},{"./_create-property":66,"./_ctx":67,"./_export":73,"./_is-array-iter":83,"./_iter-call":86,"./_iter-detect":89,"./_to-length":125,"./_to-object":126,"./core.get-iterator-method":134}],138:[function(require,module,exports){
// 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
var $export = require('./_export');

$export($export.S, 'Array', { isArray: require('./_is-array') });

},{"./_export":73,"./_is-array":84}],139:[function(require,module,exports){
'use strict';
var addToUnscopables = require('./_add-to-unscopables');
var step = require('./_iter-step');
var Iterators = require('./_iterators');
var toIObject = require('./_to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = require('./_iter-define')(Array, 'Array', function (iterated, kind) {
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var kind = this._k;
  var index = this._i++;
  if (!O || index >= O.length) {
    this._t = undefined;
    return step(1);
  }
  if (kind == 'keys') return step(0, index);
  if (kind == 'values') return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

},{"./_add-to-unscopables":52,"./_iter-define":88,"./_iter-step":90,"./_iterators":91,"./_to-iobject":124}],140:[function(require,module,exports){
// 20.3.3.1 / 15.9.4.4 Date.now()
var $export = require('./_export');

$export($export.S, 'Date', { now: function () { return new Date().getTime(); } });

},{"./_export":73}],141:[function(require,module,exports){
'use strict';
var strong = require('./_collection-strong');
var validate = require('./_validate-collection');
var MAP = 'Map';

// 23.1 Map Objects
module.exports = require('./_collection')(MAP, function (get) {
  return function Map() { return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.1.3.6 Map.prototype.get(key)
  get: function get(key) {
    var entry = strong.getEntry(validate(this, MAP), key);
    return entry && entry.v;
  },
  // 23.1.3.9 Map.prototype.set(key, value)
  set: function set(key, value) {
    return strong.def(validate(this, MAP), key === 0 ? 0 : key, value);
  }
}, strong, true);

},{"./_collection":64,"./_collection-strong":62,"./_validate-collection":130}],142:[function(require,module,exports){
var $export = require('./_export');
// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
$export($export.S + $export.F * !require('./_descriptors'), 'Object', { defineProperty: require('./_object-dp').f });

},{"./_descriptors":69,"./_export":73,"./_object-dp":97}],143:[function(require,module,exports){
// 19.1.2.9 Object.getPrototypeOf(O)
var toObject = require('./_to-object');
var $getPrototypeOf = require('./_object-gpo');

require('./_object-sap')('getPrototypeOf', function () {
  return function getPrototypeOf(it) {
    return $getPrototypeOf(toObject(it));
  };
});

},{"./_object-gpo":103,"./_object-sap":107,"./_to-object":126}],144:[function(require,module,exports){
// 19.1.2.14 Object.keys(O)
var toObject = require('./_to-object');
var $keys = require('./_object-keys');

require('./_object-sap')('keys', function () {
  return function keys(it) {
    return $keys(toObject(it));
  };
});

},{"./_object-keys":105,"./_object-sap":107,"./_to-object":126}],145:[function(require,module,exports){

},{}],146:[function(require,module,exports){
'use strict';
var LIBRARY = require('./_library');
var global = require('./_global');
var ctx = require('./_ctx');
var classof = require('./_classof');
var $export = require('./_export');
var isObject = require('./_is-object');
var aFunction = require('./_a-function');
var anInstance = require('./_an-instance');
var forOf = require('./_for-of');
var speciesConstructor = require('./_species-constructor');
var task = require('./_task').set;
var microtask = require('./_microtask')();
var newPromiseCapabilityModule = require('./_new-promise-capability');
var perform = require('./_perform');
var userAgent = require('./_user-agent');
var promiseResolve = require('./_promise-resolve');
var PROMISE = 'Promise';
var TypeError = global.TypeError;
var process = global.process;
var versions = process && process.versions;
var v8 = versions && versions.v8 || '';
var $Promise = global[PROMISE];
var isNode = classof(process) == 'process';
var empty = function () { /* empty */ };
var Internal, newGenericPromiseCapability, OwnPromiseCapability, Wrapper;
var newPromiseCapability = newGenericPromiseCapability = newPromiseCapabilityModule.f;

var USE_NATIVE = !!function () {
  try {
    // correct subclassing with @@species support
    var promise = $Promise.resolve(1);
    var FakePromise = (promise.constructor = {})[require('./_wks')('species')] = function (exec) {
      exec(empty, empty);
    };
    // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
    return (isNode || typeof PromiseRejectionEvent == 'function')
      && promise.then(empty) instanceof FakePromise
      // v8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
      // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
      // we can't detect it synchronously, so just check versions
      && v8.indexOf('6.6') !== 0
      && userAgent.indexOf('Chrome/66') === -1;
  } catch (e) { /* empty */ }
}();

// helpers
var isThenable = function (it) {
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};
var notify = function (promise, isReject) {
  if (promise._n) return;
  promise._n = true;
  var chain = promise._c;
  microtask(function () {
    var value = promise._v;
    var ok = promise._s == 1;
    var i = 0;
    var run = function (reaction) {
      var handler = ok ? reaction.ok : reaction.fail;
      var resolve = reaction.resolve;
      var reject = reaction.reject;
      var domain = reaction.domain;
      var result, then, exited;
      try {
        if (handler) {
          if (!ok) {
            if (promise._h == 2) onHandleUnhandled(promise);
            promise._h = 1;
          }
          if (handler === true) result = value;
          else {
            if (domain) domain.enter();
            result = handler(value); // may throw
            if (domain) {
              domain.exit();
              exited = true;
            }
          }
          if (result === reaction.promise) {
            reject(TypeError('Promise-chain cycle'));
          } else if (then = isThenable(result)) {
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch (e) {
        if (domain && !exited) domain.exit();
        reject(e);
      }
    };
    while (chain.length > i) run(chain[i++]); // variable length - can't use forEach
    promise._c = [];
    promise._n = false;
    if (isReject && !promise._h) onUnhandled(promise);
  });
};
var onUnhandled = function (promise) {
  task.call(global, function () {
    var value = promise._v;
    var unhandled = isUnhandled(promise);
    var result, handler, console;
    if (unhandled) {
      result = perform(function () {
        if (isNode) {
          process.emit('unhandledRejection', value, promise);
        } else if (handler = global.onunhandledrejection) {
          handler({ promise: promise, reason: value });
        } else if ((console = global.console) && console.error) {
          console.error('Unhandled promise rejection', value);
        }
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      promise._h = isNode || isUnhandled(promise) ? 2 : 1;
    } promise._a = undefined;
    if (unhandled && result.e) throw result.v;
  });
};
var isUnhandled = function (promise) {
  return promise._h !== 1 && (promise._a || promise._c).length === 0;
};
var onHandleUnhandled = function (promise) {
  task.call(global, function () {
    var handler;
    if (isNode) {
      process.emit('rejectionHandled', promise);
    } else if (handler = global.onrejectionhandled) {
      handler({ promise: promise, reason: promise._v });
    }
  });
};
var $reject = function (value) {
  var promise = this;
  if (promise._d) return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  promise._v = value;
  promise._s = 2;
  if (!promise._a) promise._a = promise._c.slice();
  notify(promise, true);
};
var $resolve = function (value) {
  var promise = this;
  var then;
  if (promise._d) return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  try {
    if (promise === value) throw TypeError("Promise can't be resolved itself");
    if (then = isThenable(value)) {
      microtask(function () {
        var wrapper = { _w: promise, _d: false }; // wrap
        try {
          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
        } catch (e) {
          $reject.call(wrapper, e);
        }
      });
    } else {
      promise._v = value;
      promise._s = 1;
      notify(promise, false);
    }
  } catch (e) {
    $reject.call({ _w: promise, _d: false }, e); // wrap
  }
};

// constructor polyfill
if (!USE_NATIVE) {
  // 25.4.3.1 Promise(executor)
  $Promise = function Promise(executor) {
    anInstance(this, $Promise, PROMISE, '_h');
    aFunction(executor);
    Internal.call(this);
    try {
      executor(ctx($resolve, this, 1), ctx($reject, this, 1));
    } catch (err) {
      $reject.call(this, err);
    }
  };
  // eslint-disable-next-line no-unused-vars
  Internal = function Promise(executor) {
    this._c = [];             // <- awaiting reactions
    this._a = undefined;      // <- checked in isUnhandled reactions
    this._s = 0;              // <- state
    this._d = false;          // <- done
    this._v = undefined;      // <- value
    this._h = 0;              // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
    this._n = false;          // <- notify
  };
  Internal.prototype = require('./_redefine-all')($Promise.prototype, {
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    then: function then(onFulfilled, onRejected) {
      var reaction = newPromiseCapability(speciesConstructor(this, $Promise));
      reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail = typeof onRejected == 'function' && onRejected;
      reaction.domain = isNode ? process.domain : undefined;
      this._c.push(reaction);
      if (this._a) this._a.push(reaction);
      if (this._s) notify(this, false);
      return reaction.promise;
    },
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    'catch': function (onRejected) {
      return this.then(undefined, onRejected);
    }
  });
  OwnPromiseCapability = function () {
    var promise = new Internal();
    this.promise = promise;
    this.resolve = ctx($resolve, promise, 1);
    this.reject = ctx($reject, promise, 1);
  };
  newPromiseCapabilityModule.f = newPromiseCapability = function (C) {
    return C === $Promise || C === Wrapper
      ? new OwnPromiseCapability(C)
      : newGenericPromiseCapability(C);
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, { Promise: $Promise });
require('./_set-to-string-tag')($Promise, PROMISE);
require('./_set-species')(PROMISE);
Wrapper = require('./_core')[PROMISE];

// statics
$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
  // 25.4.4.5 Promise.reject(r)
  reject: function reject(r) {
    var capability = newPromiseCapability(this);
    var $$reject = capability.reject;
    $$reject(r);
    return capability.promise;
  }
});
$export($export.S + $export.F * (LIBRARY || !USE_NATIVE), PROMISE, {
  // 25.4.4.6 Promise.resolve(x)
  resolve: function resolve(x) {
    return promiseResolve(LIBRARY && this === Wrapper ? $Promise : this, x);
  }
});
$export($export.S + $export.F * !(USE_NATIVE && require('./_iter-detect')(function (iter) {
  $Promise.all(iter)['catch'](empty);
})), PROMISE, {
  // 25.4.4.1 Promise.all(iterable)
  all: function all(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var values = [];
      var index = 0;
      var remaining = 1;
      forOf(iterable, false, function (promise) {
        var $index = index++;
        var alreadyCalled = false;
        values.push(undefined);
        remaining++;
        C.resolve(promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[$index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if (result.e) reject(result.v);
    return capability.promise;
  },
  // 25.4.4.4 Promise.race(iterable)
  race: function race(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var reject = capability.reject;
    var result = perform(function () {
      forOf(iterable, false, function (promise) {
        C.resolve(promise).then(capability.resolve, reject);
      });
    });
    if (result.e) reject(result.v);
    return capability.promise;
  }
});

},{"./_a-function":51,"./_an-instance":53,"./_classof":60,"./_core":65,"./_ctx":67,"./_export":73,"./_for-of":75,"./_global":76,"./_is-object":85,"./_iter-detect":89,"./_library":92,"./_microtask":94,"./_new-promise-capability":95,"./_perform":108,"./_promise-resolve":109,"./_redefine-all":111,"./_set-species":115,"./_set-to-string-tag":116,"./_species-constructor":119,"./_task":121,"./_user-agent":129,"./_wks":133}],147:[function(require,module,exports){
'use strict';
var strong = require('./_collection-strong');
var validate = require('./_validate-collection');
var SET = 'Set';

// 23.2 Set Objects
module.exports = require('./_collection')(SET, function (get) {
  return function Set() { return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.2.3.1 Set.prototype.add(value)
  add: function add(value) {
    return strong.def(validate(this, SET), value = value === 0 ? 0 : value, value);
  }
}, strong);

},{"./_collection":64,"./_collection-strong":62,"./_validate-collection":130}],148:[function(require,module,exports){
'use strict';
var $at = require('./_string-at')(true);

// 21.1.3.27 String.prototype[@@iterator]()
require('./_iter-define')(String, 'String', function (iterated) {
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var index = this._i;
  var point;
  if (index >= O.length) return { value: undefined, done: true };
  point = $at(O, index);
  this._i += point.length;
  return { value: point, done: false };
});

},{"./_iter-define":88,"./_string-at":120}],149:[function(require,module,exports){
'use strict';
// ECMAScript 6 symbols shim
var global = require('./_global');
var has = require('./_has');
var DESCRIPTORS = require('./_descriptors');
var $export = require('./_export');
var redefine = require('./_redefine');
var META = require('./_meta').KEY;
var $fails = require('./_fails');
var shared = require('./_shared');
var setToStringTag = require('./_set-to-string-tag');
var uid = require('./_uid');
var wks = require('./_wks');
var wksExt = require('./_wks-ext');
var wksDefine = require('./_wks-define');
var enumKeys = require('./_enum-keys');
var isArray = require('./_is-array');
var anObject = require('./_an-object');
var isObject = require('./_is-object');
var toObject = require('./_to-object');
var toIObject = require('./_to-iobject');
var toPrimitive = require('./_to-primitive');
var createDesc = require('./_property-desc');
var _create = require('./_object-create');
var gOPNExt = require('./_object-gopn-ext');
var $GOPD = require('./_object-gopd');
var $GOPS = require('./_object-gops');
var $DP = require('./_object-dp');
var $keys = require('./_object-keys');
var gOPD = $GOPD.f;
var dP = $DP.f;
var gOPN = gOPNExt.f;
var $Symbol = global.Symbol;
var $JSON = global.JSON;
var _stringify = $JSON && $JSON.stringify;
var PROTOTYPE = 'prototype';
var HIDDEN = wks('_hidden');
var TO_PRIMITIVE = wks('toPrimitive');
var isEnum = {}.propertyIsEnumerable;
var SymbolRegistry = shared('symbol-registry');
var AllSymbols = shared('symbols');
var OPSymbols = shared('op-symbols');
var ObjectProto = Object[PROTOTYPE];
var USE_NATIVE = typeof $Symbol == 'function' && !!$GOPS.f;
var QObject = global.QObject;
// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var setter = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = DESCRIPTORS && $fails(function () {
  return _create(dP({}, 'a', {
    get: function () { return dP(this, 'a', { value: 7 }).a; }
  })).a != 7;
}) ? function (it, key, D) {
  var protoDesc = gOPD(ObjectProto, key);
  if (protoDesc) delete ObjectProto[key];
  dP(it, key, D);
  if (protoDesc && it !== ObjectProto) dP(ObjectProto, key, protoDesc);
} : dP;

var wrap = function (tag) {
  var sym = AllSymbols[tag] = _create($Symbol[PROTOTYPE]);
  sym._k = tag;
  return sym;
};

var isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  return it instanceof $Symbol;
};

var $defineProperty = function defineProperty(it, key, D) {
  if (it === ObjectProto) $defineProperty(OPSymbols, key, D);
  anObject(it);
  key = toPrimitive(key, true);
  anObject(D);
  if (has(AllSymbols, key)) {
    if (!D.enumerable) {
      if (!has(it, HIDDEN)) dP(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if (has(it, HIDDEN) && it[HIDDEN][key]) it[HIDDEN][key] = false;
      D = _create(D, { enumerable: createDesc(0, false) });
    } return setSymbolDesc(it, key, D);
  } return dP(it, key, D);
};
var $defineProperties = function defineProperties(it, P) {
  anObject(it);
  var keys = enumKeys(P = toIObject(P));
  var i = 0;
  var l = keys.length;
  var key;
  while (l > i) $defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P) {
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key) {
  var E = isEnum.call(this, key = toPrimitive(key, true));
  if (this === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return false;
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key) {
  it = toIObject(it);
  key = toPrimitive(key, true);
  if (it === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return;
  var D = gOPD(it, key);
  if (D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it) {
  var names = gOPN(toIObject(it));
  var result = [];
  var i = 0;
  var key;
  while (names.length > i) {
    if (!has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META) result.push(key);
  } return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it) {
  var IS_OP = it === ObjectProto;
  var names = gOPN(IS_OP ? OPSymbols : toIObject(it));
  var result = [];
  var i = 0;
  var key;
  while (names.length > i) {
    if (has(AllSymbols, key = names[i++]) && (IS_OP ? has(ObjectProto, key) : true)) result.push(AllSymbols[key]);
  } return result;
};

// 19.4.1.1 Symbol([description])
if (!USE_NATIVE) {
  $Symbol = function Symbol() {
    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor!');
    var tag = uid(arguments.length > 0 ? arguments[0] : undefined);
    var $set = function (value) {
      if (this === ObjectProto) $set.call(OPSymbols, value);
      if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    };
    if (DESCRIPTORS && setter) setSymbolDesc(ObjectProto, tag, { configurable: true, set: $set });
    return wrap(tag);
  };
  redefine($Symbol[PROTOTYPE], 'toString', function toString() {
    return this._k;
  });

  $GOPD.f = $getOwnPropertyDescriptor;
  $DP.f = $defineProperty;
  require('./_object-gopn').f = gOPNExt.f = $getOwnPropertyNames;
  require('./_object-pie').f = $propertyIsEnumerable;
  $GOPS.f = $getOwnPropertySymbols;

  if (DESCRIPTORS && !require('./_library')) {
    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }

  wksExt.f = function (name) {
    return wrap(wks(name));
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, { Symbol: $Symbol });

for (var es6Symbols = (
  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
).split(','), j = 0; es6Symbols.length > j;)wks(es6Symbols[j++]);

for (var wellKnownSymbols = $keys(wks.store), k = 0; wellKnownSymbols.length > k;) wksDefine(wellKnownSymbols[k++]);

$export($export.S + $export.F * !USE_NATIVE, 'Symbol', {
  // 19.4.2.1 Symbol.for(key)
  'for': function (key) {
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(sym) {
    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol!');
    for (var key in SymbolRegistry) if (SymbolRegistry[key] === sym) return key;
  },
  useSetter: function () { setter = true; },
  useSimple: function () { setter = false; }
});

$export($export.S + $export.F * !USE_NATIVE, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
// https://bugs.chromium.org/p/v8/issues/detail?id=3443
var FAILS_ON_PRIMITIVES = $fails(function () { $GOPS.f(1); });

$export($export.S + $export.F * FAILS_ON_PRIMITIVES, 'Object', {
  getOwnPropertySymbols: function getOwnPropertySymbols(it) {
    return $GOPS.f(toObject(it));
  }
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $export($export.S + $export.F * (!USE_NATIVE || $fails(function () {
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({ a: S }) != '{}' || _stringify(Object(S)) != '{}';
})), 'JSON', {
  stringify: function stringify(it) {
    var args = [it];
    var i = 1;
    var replacer, $replacer;
    while (arguments.length > i) args.push(arguments[i++]);
    $replacer = replacer = args[1];
    if (!isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
    if (!isArray(replacer)) replacer = function (key, value) {
      if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
      if (!isSymbol(value)) return value;
    };
    args[1] = replacer;
    return _stringify.apply($JSON, args);
  }
});

// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
$Symbol[PROTOTYPE][TO_PRIMITIVE] || require('./_hide')($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);
// 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setToStringTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setToStringTag(global.JSON, 'JSON', true);

},{"./_an-object":54,"./_descriptors":69,"./_enum-keys":72,"./_export":73,"./_fails":74,"./_global":76,"./_has":77,"./_hide":78,"./_is-array":84,"./_is-object":85,"./_library":92,"./_meta":93,"./_object-create":96,"./_object-dp":97,"./_object-gopd":99,"./_object-gopn":101,"./_object-gopn-ext":100,"./_object-gops":102,"./_object-keys":105,"./_object-pie":106,"./_property-desc":110,"./_redefine":112,"./_set-to-string-tag":116,"./_shared":118,"./_to-iobject":124,"./_to-object":126,"./_to-primitive":127,"./_uid":128,"./_wks":133,"./_wks-define":131,"./_wks-ext":132}],150:[function(require,module,exports){
// https://tc39.github.io/proposal-setmap-offrom/#sec-map.from
require('./_set-collection-from')('Map');

},{"./_set-collection-from":113}],151:[function(require,module,exports){
// https://tc39.github.io/proposal-setmap-offrom/#sec-map.of
require('./_set-collection-of')('Map');

},{"./_set-collection-of":114}],152:[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var $export = require('./_export');

$export($export.P + $export.R, 'Map', { toJSON: require('./_collection-to-json')('Map') });

},{"./_collection-to-json":63,"./_export":73}],153:[function(require,module,exports){
// https://github.com/tc39/proposal-promise-finally
'use strict';
var $export = require('./_export');
var core = require('./_core');
var global = require('./_global');
var speciesConstructor = require('./_species-constructor');
var promiseResolve = require('./_promise-resolve');

$export($export.P + $export.R, 'Promise', { 'finally': function (onFinally) {
  var C = speciesConstructor(this, core.Promise || global.Promise);
  var isFunction = typeof onFinally == 'function';
  return this.then(
    isFunction ? function (x) {
      return promiseResolve(C, onFinally()).then(function () { return x; });
    } : onFinally,
    isFunction ? function (e) {
      return promiseResolve(C, onFinally()).then(function () { throw e; });
    } : onFinally
  );
} });

},{"./_core":65,"./_export":73,"./_global":76,"./_promise-resolve":109,"./_species-constructor":119}],154:[function(require,module,exports){
'use strict';
// https://github.com/tc39/proposal-promise-try
var $export = require('./_export');
var newPromiseCapability = require('./_new-promise-capability');
var perform = require('./_perform');

$export($export.S, 'Promise', { 'try': function (callbackfn) {
  var promiseCapability = newPromiseCapability.f(this);
  var result = perform(callbackfn);
  (result.e ? promiseCapability.reject : promiseCapability.resolve)(result.v);
  return promiseCapability.promise;
} });

},{"./_export":73,"./_new-promise-capability":95,"./_perform":108}],155:[function(require,module,exports){
// https://tc39.github.io/proposal-setmap-offrom/#sec-set.from
require('./_set-collection-from')('Set');

},{"./_set-collection-from":113}],156:[function(require,module,exports){
// https://tc39.github.io/proposal-setmap-offrom/#sec-set.of
require('./_set-collection-of')('Set');

},{"./_set-collection-of":114}],157:[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var $export = require('./_export');

$export($export.P + $export.R, 'Set', { toJSON: require('./_collection-to-json')('Set') });

},{"./_collection-to-json":63,"./_export":73}],158:[function(require,module,exports){
require('./_wks-define')('asyncIterator');

},{"./_wks-define":131}],159:[function(require,module,exports){
require('./_wks-define')('observable');

},{"./_wks-define":131}],160:[function(require,module,exports){
require('./es6.array.iterator');
var global = require('./_global');
var hide = require('./_hide');
var Iterators = require('./_iterators');
var TO_STRING_TAG = require('./_wks')('toStringTag');

var DOMIterables = ('CSSRuleList,CSSStyleDeclaration,CSSValueList,ClientRectList,DOMRectList,DOMStringList,' +
  'DOMTokenList,DataTransferItemList,FileList,HTMLAllCollection,HTMLCollection,HTMLFormElement,HTMLSelectElement,' +
  'MediaList,MimeTypeArray,NamedNodeMap,NodeList,PaintRequestList,Plugin,PluginArray,SVGLengthList,SVGNumberList,' +
  'SVGPathSegList,SVGPointList,SVGStringList,SVGTransformList,SourceBufferList,StyleSheetList,TextTrackCueList,' +
  'TextTrackList,TouchList').split(',');

for (var i = 0; i < DOMIterables.length; i++) {
  var NAME = DOMIterables[i];
  var Collection = global[NAME];
  var proto = Collection && Collection.prototype;
  if (proto && !proto[TO_STRING_TAG]) hide(proto, TO_STRING_TAG, NAME);
  Iterators[NAME] = Iterators.Array;
}

},{"./_global":76,"./_hide":78,"./_iterators":91,"./_wks":133,"./es6.array.iterator":139}],161:[function(require,module,exports){

var Dequeue = exports = module.exports = function Dequeue() {
  this.head = new Node()
  this.length = 0
}

Dequeue.prototype.push = function(d){
  var n = new Node(d)
  this.head.prepend(n)
  this.length += 1
  return this
}

Dequeue.prototype.unshift = function(d){
  var n = new Node(d)
  this.head.append(n)
  this.length += 1
  return this
}

Dequeue.prototype.pop = function(){
  if (this.head.prev === this.head) return
  var n = this.head.prev.remove()
  this.length -= 1
  return n.data
}

Dequeue.prototype.shift = function(){
  if (this.head.next === this.head) return
  var n = this.head.next.remove()
  this.length -= 1
  return n.data
}

Dequeue.prototype.last = function(){
  if (this.head.prev === this.head) return
  return this.head.prev.data
}

Dequeue.prototype.first = function(){
  if (this.head.next === this.head) return
  return this.head.next.data
}

Dequeue.prototype.empty = function(){
  if (this.length === 0 ) return

  //no node points to head; not necessary for GC, but it makes me feel better.
  this.head.next.prev = null
  this.head.prev.next = null

  //head only points to itself; as a fresh node would
  this.head.next = this.head
  this.head.prev = this.head
  
  this.length = 0

  return
}
function Node(d) {
  this.data = d
  this.next = this
  this.prev = this
}

Node.prototype.append = function(n) {
  n.next = this.next
  n.prev = this
  this.next.prev = n
  this.next = n
  return n
}

Node.prototype.prepend = function(n) {
  n.prev = this.prev
  n.next = this
  this.prev.next = n
  this.prev = n
  return n
}

Node.prototype.remove = function() {
  this.next.prev = this.prev
  this.prev.next = this.next
  return this
}
},{}],162:[function(require,module,exports){
exports = module.exports = require("./dequeue")
},{"./dequeue":161}],163:[function(require,module,exports){
module.exports = require('./lib/difflib');

},{"./lib/difflib":164}],164:[function(require,module,exports){
// Generated by CoffeeScript 1.3.1

/*
Module difflib -- helpers for computing deltas between objects.

Function getCloseMatches(word, possibilities, n=3, cutoff=0.6):
    Use SequenceMatcher to return list of the best "good enough" matches.

Function contextDiff(a, b):
    For two lists of strings, return a delta in context diff format.

Function ndiff(a, b):
    Return a delta: the difference between `a` and `b` (lists of strings).

Function restore(delta, which):
    Return one of the two sequences that generated an ndiff delta.

Function unifiedDiff(a, b):
    For two lists of strings, return a delta in unified diff format.

Class SequenceMatcher:
    A flexible class for comparing pairs of sequences of any type.

Class Differ:
    For producing human-readable deltas from sequences of lines of text.
*/


(function() {
  var Differ, Heap, IS_CHARACTER_JUNK, IS_LINE_JUNK, SequenceMatcher, assert, contextDiff, floor, getCloseMatches, max, min, ndiff, restore, unifiedDiff, _any, _arrayCmp, _calculateRatio, _countLeading, _formatRangeContext, _formatRangeUnified, _has,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  floor = Math.floor, max = Math.max, min = Math.min;

  Heap = require('heap');

  assert = require('assert');

  _calculateRatio = function(matches, length) {
    if (length) {
      return 2.0 * matches / length;
    } else {
      return 1.0;
    }
  };

  _arrayCmp = function(a, b) {
    var i, la, lb, _i, _ref, _ref1;
    _ref = [a.length, b.length], la = _ref[0], lb = _ref[1];
    for (i = _i = 0, _ref1 = min(la, lb); 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
      if (a[i] < b[i]) {
        return -1;
      }
      if (a[i] > b[i]) {
        return 1;
      }
    }
    return la - lb;
  };

  _has = function(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  };

  _any = function(items) {
    var item, _i, _len;
    for (_i = 0, _len = items.length; _i < _len; _i++) {
      item = items[_i];
      if (item) {
        return true;
      }
    }
    return false;
  };

  SequenceMatcher = (function() {

    SequenceMatcher.name = 'SequenceMatcher';

    /*
      SequenceMatcher is a flexible class for comparing pairs of sequences of
      any type, so long as the sequence elements are hashable.  The basic
      algorithm predates, and is a little fancier than, an algorithm
      published in the late 1980's by Ratcliff and Obershelp under the
      hyperbolic name "gestalt pattern matching".  The basic idea is to find
      the longest contiguous matching subsequence that contains no "junk"
      elements (R-O doesn't address junk).  The same idea is then applied
      recursively to the pieces of the sequences to the left and to the right
      of the matching subsequence.  This does not yield minimal edit
      sequences, but does tend to yield matches that "look right" to people.
    
      SequenceMatcher tries to compute a "human-friendly diff" between two
      sequences.  Unlike e.g. UNIX(tm) diff, the fundamental notion is the
      longest *contiguous* & junk-free matching subsequence.  That's what
      catches peoples' eyes.  The Windows(tm) windiff has another interesting
      notion, pairing up elements that appear uniquely in each sequence.
      That, and the method here, appear to yield more intuitive difference
      reports than does diff.  This method appears to be the least vulnerable
      to synching up on blocks of "junk lines", though (like blank lines in
      ordinary text files, or maybe "<P>" lines in HTML files).  That may be
      because this is the only method of the 3 that has a *concept* of
      "junk" <wink>.
    
      Example, comparing two strings, and considering blanks to be "junk":
    
      >>> isjunk = (c) -> c is ' '
      >>> s = new SequenceMatcher(isjunk,
                                  'private Thread currentThread;',
                                  'private volatile Thread currentThread;')
    
      .ratio() returns a float in [0, 1], measuring the "similarity" of the
      sequences.  As a rule of thumb, a .ratio() value over 0.6 means the
      sequences are close matches:
    
      >>> s.ratio().toPrecision(3)
      '0.866'
    
      If you're only interested in where the sequences match,
      .getMatchingBlocks() is handy:
    
      >>> for [a, b, size] in s.getMatchingBlocks()
      ...   console.log("a[#{a}] and b[#{b}] match for #{size} elements");
      a[0] and b[0] match for 8 elements
      a[8] and b[17] match for 21 elements
      a[29] and b[38] match for 0 elements
    
      Note that the last tuple returned by .get_matching_blocks() is always a
      dummy, (len(a), len(b), 0), and this is the only case in which the last
      tuple element (number of elements matched) is 0.
    
      If you want to know how to change the first sequence into the second,
      use .get_opcodes():
    
      >>> for [op, a1, a2, b1, b2] in s.getOpcodes()
      ...   console.log "#{op} a[#{a1}:#{a2}] b[#{b1}:#{b2}]"
      equal a[0:8] b[0:8]
      insert a[8:8] b[8:17]
      equal a[8:29] b[17:38]
    
      See the Differ class for a fancy human-friendly file differencer, which
      uses SequenceMatcher both to compare sequences of lines, and to compare
      sequences of characters within similar (near-matching) lines.
    
      See also function getCloseMatches() in this module, which shows how
      simple code building on SequenceMatcher can be used to do useful work.
    
      Timing:  Basic R-O is cubic time worst case and quadratic time expected
      case.  SequenceMatcher is quadratic time for the worst case and has
      expected-case behavior dependent in a complicated way on how many
      elements the sequences have in common; best case time is linear.
    
      Methods:
    
      constructor(isjunk=null, a='', b='')
          Construct a SequenceMatcher.
    
      setSeqs(a, b)
          Set the two sequences to be compared.
    
      setSeq1(a)
          Set the first sequence to be compared.
    
      setSeq2(b)
          Set the second sequence to be compared.
    
      findLongestMatch(alo, ahi, blo, bhi)
          Find longest matching block in a[alo:ahi] and b[blo:bhi].
    
      getMatchingBlocks()
          Return list of triples describing matching subsequences.
    
      getOpcodes()
          Return list of 5-tuples describing how to turn a into b.
    
      ratio()
          Return a measure of the sequences' similarity (float in [0,1]).
    
      quickRatio()
          Return an upper bound on .ratio() relatively quickly.
    
      realQuickRatio()
          Return an upper bound on ratio() very quickly.
    */


    function SequenceMatcher(isjunk, a, b, autojunk) {
      this.isjunk = isjunk;
      if (a == null) {
        a = '';
      }
      if (b == null) {
        b = '';
      }
      this.autojunk = autojunk != null ? autojunk : true;
      /*
          Construct a SequenceMatcher.
      
          Optional arg isjunk is null (the default), or a one-argument
          function that takes a sequence element and returns true iff the
          element is junk.  Null is equivalent to passing "(x) -> 0", i.e.
          no elements are considered to be junk.  For example, pass
              (x) -> x in ' \t'
          if you're comparing lines as sequences of characters, and don't
          want to synch up on blanks or hard tabs.
      
          Optional arg a is the first of two sequences to be compared.  By
          default, an empty string.  The elements of a must be hashable.  See
          also .setSeqs() and .setSeq1().
      
          Optional arg b is the second of two sequences to be compared.  By
          default, an empty string.  The elements of b must be hashable. See
          also .setSeqs() and .setSeq2().
      
          Optional arg autojunk should be set to false to disable the
          "automatic junk heuristic" that treats popular elements as junk
          (see module documentation for more information).
      */

      this.a = this.b = null;
      this.setSeqs(a, b);
    }

    SequenceMatcher.prototype.setSeqs = function(a, b) {
      /* 
      Set the two sequences to be compared. 
      
      >>> s = new SequenceMatcher()
      >>> s.setSeqs('abcd', 'bcde')
      >>> s.ratio()
      0.75
      */
      this.setSeq1(a);
      return this.setSeq2(b);
    };

    SequenceMatcher.prototype.setSeq1 = function(a) {
      /* 
      Set the first sequence to be compared. 
      
      The second sequence to be compared is not changed.
      
      >>> s = new SequenceMatcher(null, 'abcd', 'bcde')
      >>> s.ratio()
      0.75
      >>> s.setSeq1('bcde')
      >>> s.ratio()
      1.0
      
      SequenceMatcher computes and caches detailed information about the
      second sequence, so if you want to compare one sequence S against
      many sequences, use .setSeq2(S) once and call .setSeq1(x)
      repeatedly for each of the other sequences.
      
      See also setSeqs() and setSeq2().
      */
      if (a === this.a) {
        return;
      }
      this.a = a;
      return this.matchingBlocks = this.opcodes = null;
    };

    SequenceMatcher.prototype.setSeq2 = function(b) {
      /*
          Set the second sequence to be compared. 
      
          The first sequence to be compared is not changed.
      
          >>> s = new SequenceMatcher(null, 'abcd', 'bcde')
          >>> s.ratio()
          0.75
          >>> s.setSeq2('abcd')
          >>> s.ratio()
          1.0
      
          SequenceMatcher computes and caches detailed information about the
          second sequence, so if you want to compare one sequence S against
          many sequences, use .setSeq2(S) once and call .setSeq1(x)
          repeatedly for each of the other sequences.
      
          See also setSeqs() and setSeq1().
      */
      if (b === this.b) {
        return;
      }
      this.b = b;
      this.matchingBlocks = this.opcodes = null;
      this.fullbcount = null;
      return this._chainB();
    };

    SequenceMatcher.prototype._chainB = function() {
      var b, b2j, elt, i, idxs, indices, isjunk, junk, n, ntest, popular, _i, _j, _len, _len1, _ref;
      b = this.b;
      this.b2j = b2j = {};
      for (i = _i = 0, _len = b.length; _i < _len; i = ++_i) {
        elt = b[i];
        indices = _has(b2j, elt) ? b2j[elt] : b2j[elt] = [];
        indices.push(i);
      }
      junk = {};
      isjunk = this.isjunk;
      if (isjunk) {
        _ref = Object.keys(b2j);
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          elt = _ref[_j];
          if (isjunk(elt)) {
            junk[elt] = true;
            delete b2j[elt];
          }
        }
      }
      popular = {};
      n = b.length;
      if (this.autojunk && n >= 200) {
        ntest = floor(n / 100) + 1;
        for (elt in b2j) {
          idxs = b2j[elt];
          if (idxs.length > ntest) {
            popular[elt] = true;
            delete b2j[elt];
          }
        }
      }
      this.isbjunk = function(b) {
        return _has(junk, b);
      };
      return this.isbpopular = function(b) {
        return _has(popular, b);
      };
    };

    SequenceMatcher.prototype.findLongestMatch = function(alo, ahi, blo, bhi) {
      /* 
      Find longest matching block in a[alo...ahi] and b[blo...bhi].  
      
      If isjunk is not defined:
      
      Return [i,j,k] such that a[i...i+k] is equal to b[j...j+k], where
          alo <= i <= i+k <= ahi
          blo <= j <= j+k <= bhi
      and for all [i',j',k'] meeting those conditions,
          k >= k'
          i <= i'
          and if i == i', j <= j'
      
      In other words, of all maximal matching blocks, return one that
      starts earliest in a, and of all those maximal matching blocks that
      start earliest in a, return the one that starts earliest in b.
      
      >>> isjunk = (x) -> x is ' '
      >>> s = new SequenceMatcher(isjunk, ' abcd', 'abcd abcd')
      >>> s.findLongestMatch(0, 5, 0, 9)
      [1, 0, 4]
      
      >>> s = new SequenceMatcher(null, 'ab', 'c')
      >>> s.findLongestMatch(0, 2, 0, 1)
      [0, 0, 0]
      */

      var a, b, b2j, besti, bestj, bestsize, i, isbjunk, j, j2len, k, newj2len, _i, _j, _len, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
      _ref = [this.a, this.b, this.b2j, this.isbjunk], a = _ref[0], b = _ref[1], b2j = _ref[2], isbjunk = _ref[3];
      _ref1 = [alo, blo, 0], besti = _ref1[0], bestj = _ref1[1], bestsize = _ref1[2];
      j2len = {};
      for (i = _i = alo; alo <= ahi ? _i < ahi : _i > ahi; i = alo <= ahi ? ++_i : --_i) {
        newj2len = {};
        _ref2 = (_has(b2j, a[i]) ? b2j[a[i]] : []);
        for (_j = 0, _len = _ref2.length; _j < _len; _j++) {
          j = _ref2[_j];
          if (j < blo) {
            continue;
          }
          if (j >= bhi) {
            break;
          }
          k = newj2len[j] = (j2len[j - 1] || 0) + 1;
          if (k > bestsize) {
            _ref3 = [i - k + 1, j - k + 1, k], besti = _ref3[0], bestj = _ref3[1], bestsize = _ref3[2];
          }
        }
        j2len = newj2len;
      }
      while (besti > alo && bestj > blo && !isbjunk(b[bestj - 1]) && a[besti - 1] === b[bestj - 1]) {
        _ref4 = [besti - 1, bestj - 1, bestsize + 1], besti = _ref4[0], bestj = _ref4[1], bestsize = _ref4[2];
      }
      while (besti + bestsize < ahi && bestj + bestsize < bhi && !isbjunk(b[bestj + bestsize]) && a[besti + bestsize] === b[bestj + bestsize]) {
        bestsize++;
      }
      while (besti > alo && bestj > blo && isbjunk(b[bestj - 1]) && a[besti - 1] === b[bestj - 1]) {
        _ref5 = [besti - 1, bestj - 1, bestsize + 1], besti = _ref5[0], bestj = _ref5[1], bestsize = _ref5[2];
      }
      while (besti + bestsize < ahi && bestj + bestsize < bhi && isbjunk(b[bestj + bestsize]) && a[besti + bestsize] === b[bestj + bestsize]) {
        bestsize++;
      }
      return [besti, bestj, bestsize];
    };

    SequenceMatcher.prototype.getMatchingBlocks = function() {
      /*
          Return list of triples describing matching subsequences.
      
          Each triple is of the form [i, j, n], and means that
          a[i...i+n] == b[j...j+n].  The triples are monotonically increasing in
          i and in j.  it's also guaranteed that if
          [i, j, n] and [i', j', n'] are adjacent triples in the list, and
          the second is not the last triple in the list, then i+n != i' or
          j+n != j'.  IOW, adjacent triples never describe adjacent equal
          blocks.
      
          The last triple is a dummy, [a.length, b.length, 0], and is the only
          triple with n==0.
      
          >>> s = new SequenceMatcher(null, 'abxcd', 'abcd')
          >>> s.getMatchingBlocks()
          [[0, 0, 2], [3, 2, 2], [5, 4, 0]]
      */

      var ahi, alo, bhi, blo, i, i1, i2, j, j1, j2, k, k1, k2, la, lb, matchingBlocks, nonAdjacent, queue, x, _i, _len, _ref, _ref1, _ref2, _ref3, _ref4;
      if (this.matchingBlocks) {
        return this.matchingBlocks;
      }
      _ref = [this.a.length, this.b.length], la = _ref[0], lb = _ref[1];
      queue = [[0, la, 0, lb]];
      matchingBlocks = [];
      while (queue.length) {
        _ref1 = queue.pop(), alo = _ref1[0], ahi = _ref1[1], blo = _ref1[2], bhi = _ref1[3];
        _ref2 = x = this.findLongestMatch(alo, ahi, blo, bhi), i = _ref2[0], j = _ref2[1], k = _ref2[2];
        if (k) {
          matchingBlocks.push(x);
          if (alo < i && blo < j) {
            queue.push([alo, i, blo, j]);
          }
          if (i + k < ahi && j + k < bhi) {
            queue.push([i + k, ahi, j + k, bhi]);
          }
        }
      }
      matchingBlocks.sort(_arrayCmp);
      i1 = j1 = k1 = 0;
      nonAdjacent = [];
      for (_i = 0, _len = matchingBlocks.length; _i < _len; _i++) {
        _ref3 = matchingBlocks[_i], i2 = _ref3[0], j2 = _ref3[1], k2 = _ref3[2];
        if (i1 + k1 === i2 && j1 + k1 === j2) {
          k1 += k2;
        } else {
          if (k1) {
            nonAdjacent.push([i1, j1, k1]);
          }
          _ref4 = [i2, j2, k2], i1 = _ref4[0], j1 = _ref4[1], k1 = _ref4[2];
        }
      }
      if (k1) {
        nonAdjacent.push([i1, j1, k1]);
      }
      nonAdjacent.push([la, lb, 0]);
      return this.matchingBlocks = nonAdjacent;
    };

    SequenceMatcher.prototype.getOpcodes = function() {
      /* 
      Return list of 5-tuples describing how to turn a into b.
      
      Each tuple is of the form [tag, i1, i2, j1, j2].  The first tuple
      has i1 == j1 == 0, and remaining tuples have i1 == the i2 from the
      tuple preceding it, and likewise for j1 == the previous j2.
      
      The tags are strings, with these meanings:
      
      'replace':  a[i1...i2] should be replaced by b[j1...j2]
      'delete':   a[i1...i2] should be deleted.
                  Note that j1==j2 in this case.
      'insert':   b[j1...j2] should be inserted at a[i1...i1].
                  Note that i1==i2 in this case.
      'equal':    a[i1...i2] == b[j1...j2]
      
      >>> s = new SequenceMatcher(null, 'qabxcd', 'abycdf')
      >>> s.getOpcodes()
      [ [ 'delete'  , 0 , 1 , 0 , 0 ] ,
        [ 'equal'   , 1 , 3 , 0 , 2 ] ,
        [ 'replace' , 3 , 4 , 2 , 3 ] ,
        [ 'equal'   , 4 , 6 , 3 , 5 ] ,
        [ 'insert'  , 6 , 6 , 5 , 6 ] ]
      */

      var ai, answer, bj, i, j, size, tag, _i, _len, _ref, _ref1, _ref2;
      if (this.opcodes) {
        return this.opcodes;
      }
      i = j = 0;
      this.opcodes = answer = [];
      _ref = this.getMatchingBlocks();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref1 = _ref[_i], ai = _ref1[0], bj = _ref1[1], size = _ref1[2];
        tag = '';
        if (i < ai && j < bj) {
          tag = 'replace';
        } else if (i < ai) {
          tag = 'delete';
        } else if (j < bj) {
          tag = 'insert';
        }
        if (tag) {
          answer.push([tag, i, ai, j, bj]);
        }
        _ref2 = [ai + size, bj + size], i = _ref2[0], j = _ref2[1];
        if (size) {
          answer.push(['equal', ai, i, bj, j]);
        }
      }
      return answer;
    };

    SequenceMatcher.prototype.getGroupedOpcodes = function(n) {
      var codes, group, groups, i1, i2, j1, j2, nn, tag, _i, _len, _ref, _ref1, _ref2, _ref3;
      if (n == null) {
        n = 3;
      }
      /* 
      Isolate change clusters by eliminating ranges with no changes.
      
      Return a list groups with upto n lines of context.
      Each group is in the same format as returned by get_opcodes().
      
      >>> a = [1...40].map(String)
      >>> b = a.slice()
      >>> b[8...8] = 'i'
      >>> b[20] += 'x'
      >>> b[23...28] = []
      >>> b[30] += 'y'
      >>> s = new SequenceMatcher(null, a, b)
      >>> s.getGroupedOpcodes()
      [ [ [ 'equal'  , 5 , 8  , 5 , 8 ],
          [ 'insert' , 8 , 8  , 8 , 9 ],
          [ 'equal'  , 8 , 11 , 9 , 12 ] ],
        [ [ 'equal'   , 16 , 19 , 17 , 20 ],
          [ 'replace' , 19 , 20 , 20 , 21 ],
          [ 'equal'   , 20 , 22 , 21 , 23 ],
          [ 'delete'  , 22 , 27 , 23 , 23 ],
          [ 'equal'   , 27 , 30 , 23 , 26 ] ],
        [ [ 'equal'   , 31 , 34 , 27 , 30 ],
          [ 'replace' , 34 , 35 , 30 , 31 ],
          [ 'equal'   , 35 , 38 , 31 , 34 ] ] ]
      */

      codes = this.getOpcodes();
      if (!codes.length) {
        codes = [['equal', 0, 1, 0, 1]];
      }
      if (codes[0][0] === 'equal') {
        _ref = codes[0], tag = _ref[0], i1 = _ref[1], i2 = _ref[2], j1 = _ref[3], j2 = _ref[4];
        codes[0] = [tag, max(i1, i2 - n), i2, max(j1, j2 - n), j2];
      }
      if (codes[codes.length - 1][0] === 'equal') {
        _ref1 = codes[codes.length - 1], tag = _ref1[0], i1 = _ref1[1], i2 = _ref1[2], j1 = _ref1[3], j2 = _ref1[4];
        codes[codes.length - 1] = [tag, i1, min(i2, i1 + n), j1, min(j2, j1 + n)];
      }
      nn = n + n;
      groups = [];
      group = [];
      for (_i = 0, _len = codes.length; _i < _len; _i++) {
        _ref2 = codes[_i], tag = _ref2[0], i1 = _ref2[1], i2 = _ref2[2], j1 = _ref2[3], j2 = _ref2[4];
        if (tag === 'equal' && i2 - i1 > nn) {
          group.push([tag, i1, min(i2, i1 + n), j1, min(j2, j1 + n)]);
          groups.push(group);
          group = [];
          _ref3 = [max(i1, i2 - n), max(j1, j2 - n)], i1 = _ref3[0], j1 = _ref3[1];
        }
        group.push([tag, i1, i2, j1, j2]);
      }
      if (group.length && !(group.length === 1 && group[0][0] === 'equal')) {
        groups.push(group);
      }
      return groups;
    };

    SequenceMatcher.prototype.ratio = function() {
      /*
          Return a measure of the sequences' similarity (float in [0,1]).
      
          Where T is the total number of elements in both sequences, and
          M is the number of matches, this is 2.0*M / T.
          Note that this is 1 if the sequences are identical, and 0 if
          they have nothing in common.
      
          .ratio() is expensive to compute if you haven't already computed
          .getMatchingBlocks() or .getOpcodes(), in which case you may
          want to try .quickRatio() or .realQuickRatio() first to get an
          upper bound.
          
          >>> s = new SequenceMatcher(null, 'abcd', 'bcde')
          >>> s.ratio()
          0.75
          >>> s.quickRatio()
          0.75
          >>> s.realQuickRatio()
          1.0
      */

      var match, matches, _i, _len, _ref;
      matches = 0;
      _ref = this.getMatchingBlocks();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        match = _ref[_i];
        matches += match[2];
      }
      return _calculateRatio(matches, this.a.length + this.b.length);
    };

    SequenceMatcher.prototype.quickRatio = function() {
      /*
          Return an upper bound on ratio() relatively quickly.
      
          This isn't defined beyond that it is an upper bound on .ratio(), and
          is faster to compute.
      */

      var avail, elt, fullbcount, matches, numb, _i, _j, _len, _len1, _ref, _ref1;
      if (!this.fullbcount) {
        this.fullbcount = fullbcount = {};
        _ref = this.b;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          elt = _ref[_i];
          fullbcount[elt] = (fullbcount[elt] || 0) + 1;
        }
      }
      fullbcount = this.fullbcount;
      avail = {};
      matches = 0;
      _ref1 = this.a;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        elt = _ref1[_j];
        if (_has(avail, elt)) {
          numb = avail[elt];
        } else {
          numb = fullbcount[elt] || 0;
        }
        avail[elt] = numb - 1;
        if (numb > 0) {
          matches++;
        }
      }
      return _calculateRatio(matches, this.a.length + this.b.length);
    };

    SequenceMatcher.prototype.realQuickRatio = function() {
      /*
          Return an upper bound on ratio() very quickly.
      
          This isn't defined beyond that it is an upper bound on .ratio(), and
          is faster to compute than either .ratio() or .quickRatio().
      */

      var la, lb, _ref;
      _ref = [this.a.length, this.b.length], la = _ref[0], lb = _ref[1];
      return _calculateRatio(min(la, lb), la + lb);
    };

    return SequenceMatcher;

  })();

  getCloseMatches = function(word, possibilities, n, cutoff) {
    var result, s, score, x, _i, _j, _len, _len1, _ref, _results;
    if (n == null) {
      n = 3;
    }
    if (cutoff == null) {
      cutoff = 0.6;
    }
    /*
      Use SequenceMatcher to return list of the best "good enough" matches.
    
      word is a sequence for which close matches are desired (typically a
      string).
    
      possibilities is a list of sequences against which to match word
      (typically a list of strings).
    
      Optional arg n (default 3) is the maximum number of close matches to
      return.  n must be > 0.
    
      Optional arg cutoff (default 0.6) is a float in [0, 1].  Possibilities
      that don't score at least that similar to word are ignored.
    
      The best (no more than n) matches among the possibilities are returned
      in a list, sorted by similarity score, most similar first.
    
      >>> getCloseMatches('appel', ['ape', 'apple', 'peach', 'puppy'])
      ['apple', 'ape']
      >>> KEYWORDS = require('coffee-script').RESERVED
      >>> getCloseMatches('wheel', KEYWORDS)
      ['when', 'while']
      >>> getCloseMatches('accost', KEYWORDS)
      ['const']
    */

    if (!(n > 0)) {
      throw new Error("n must be > 0: (" + n + ")");
    }
    if (!((0.0 <= cutoff && cutoff <= 1.0))) {
      throw new Error("cutoff must be in [0.0, 1.0]: (" + cutoff + ")");
    }
    result = [];
    s = new SequenceMatcher();
    s.setSeq2(word);
    for (_i = 0, _len = possibilities.length; _i < _len; _i++) {
      x = possibilities[_i];
      s.setSeq1(x);
      if (s.realQuickRatio() >= cutoff && s.quickRatio() >= cutoff && s.ratio() >= cutoff) {
        result.push([s.ratio(), x]);
      }
    }
    result = Heap.nlargest(result, n, _arrayCmp);
    _results = [];
    for (_j = 0, _len1 = result.length; _j < _len1; _j++) {
      _ref = result[_j], score = _ref[0], x = _ref[1];
      _results.push(x);
    }
    return _results;
  };

  _countLeading = function(line, ch) {
    /*
      Return number of `ch` characters at the start of `line`.
    
      >>> _countLeading('   abc', ' ')
      3
    */

    var i, n, _ref;
    _ref = [0, line.length], i = _ref[0], n = _ref[1];
    while (i < n && line[i] === ch) {
      i++;
    }
    return i;
  };

  Differ = (function() {

    Differ.name = 'Differ';

    /*
      Differ is a class for comparing sequences of lines of text, and
      producing human-readable differences or deltas.  Differ uses
      SequenceMatcher both to compare sequences of lines, and to compare
      sequences of characters within similar (near-matching) lines.
    
      Each line of a Differ delta begins with a two-letter code:
    
          '- '    line unique to sequence 1
          '+ '    line unique to sequence 2
          '  '    line common to both sequences
          '? '    line not present in either input sequence
    
      Lines beginning with '? ' attempt to guide the eye to intraline
      differences, and were not present in either input sequence.  These lines
      can be confusing if the sequences contain tab characters.
    
      Note that Differ makes no claim to produce a *minimal* diff.  To the
      contrary, minimal diffs are often counter-intuitive, because they synch
      up anywhere possible, sometimes accidental matches 100 pages apart.
      Restricting synch points to contiguous matches preserves some notion of
      locality, at the occasional cost of producing a longer diff.
    
      Example: Comparing two texts.
    
      >>> text1 = ['1. Beautiful is better than ugly.\n',
      ...   '2. Explicit is better than implicit.\n',
      ...   '3. Simple is better than complex.\n',
      ...   '4. Complex is better than complicated.\n']
      >>> text1.length
      4
      >>> text2 = ['1. Beautiful is better than ugly.\n',
      ...   '3.   Simple is better than complex.\n',
      ...   '4. Complicated is better than complex.\n',
      ...   '5. Flat is better than nested.\n']
    
      Next we instantiate a Differ object:
    
      >>> d = new Differ()
    
      Note that when instantiating a Differ object we may pass functions to
      filter out line and character 'junk'.
    
      Finally, we compare the two:
    
      >>> result = d.compare(text1, text2)
      [ '  1. Beautiful is better than ugly.\n',
        '- 2. Explicit is better than implicit.\n',
        '- 3. Simple is better than complex.\n',
        '+ 3.   Simple is better than complex.\n',
        '?   ++\n',
        '- 4. Complex is better than complicated.\n',
        '?          ^                     ---- ^\n',
        '+ 4. Complicated is better than complex.\n',
        '?         ++++ ^                      ^\n',
        '+ 5. Flat is better than nested.\n' ]
    
      Methods:
    
      constructor(linejunk=null, charjunk=null)
          Construct a text differencer, with optional filters.
      compare(a, b)
          Compare two sequences of lines; generate the resulting delta.
    */


    function Differ(linejunk, charjunk) {
      this.linejunk = linejunk;
      this.charjunk = charjunk;
      /*
          Construct a text differencer, with optional filters.
      
          The two optional keyword parameters are for filter functions:
      
          - `linejunk`: A function that should accept a single string argument,
            and return true iff the string is junk. The module-level function
            `IS_LINE_JUNK` may be used to filter out lines without visible
            characters, except for at most one splat ('#').  It is recommended
            to leave linejunk null. 
      
          - `charjunk`: A function that should accept a string of length 1. The
            module-level function `IS_CHARACTER_JUNK` may be used to filter out
            whitespace characters (a blank or tab; **note**: bad idea to include
            newline in this!).  Use of IS_CHARACTER_JUNK is recommended.
      */

    }

    Differ.prototype.compare = function(a, b) {
      /*
          Compare two sequences of lines; generate the resulting delta.
      
          Each sequence must contain individual single-line strings ending with
          newlines. Such sequences can be obtained from the `readlines()` method
          of file-like objects.  The delta generated also consists of newline-
          terminated strings, ready to be printed as-is via the writeline()
          method of a file-like object.
      
          Example:
      
          >>> d = new Differ
          >>> d.compare(['one\n', 'two\n', 'three\n'],
          ...           ['ore\n', 'tree\n', 'emu\n'])
          [ '- one\n',
            '?  ^\n',
            '+ ore\n',
            '?  ^\n',
            '- two\n',
            '- three\n',
            '?  -\n',
            '+ tree\n',
            '+ emu\n' ]
      */

      var ahi, alo, bhi, blo, cruncher, g, line, lines, tag, _i, _j, _len, _len1, _ref, _ref1;
      cruncher = new SequenceMatcher(this.linejunk, a, b);
      lines = [];
      _ref = cruncher.getOpcodes();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref1 = _ref[_i], tag = _ref1[0], alo = _ref1[1], ahi = _ref1[2], blo = _ref1[3], bhi = _ref1[4];
        switch (tag) {
          case 'replace':
            g = this._fancyReplace(a, alo, ahi, b, blo, bhi);
            break;
          case 'delete':
            g = this._dump('-', a, alo, ahi);
            break;
          case 'insert':
            g = this._dump('+', b, blo, bhi);
            break;
          case 'equal':
            g = this._dump(' ', a, alo, ahi);
            break;
          default:
            throw new Error("unknow tag (" + tag + ")");
        }
        for (_j = 0, _len1 = g.length; _j < _len1; _j++) {
          line = g[_j];
          lines.push(line);
        }
      }
      return lines;
    };

    Differ.prototype._dump = function(tag, x, lo, hi) {
      /*
          Generate comparison results for a same-tagged range.
      */

      var i, _i, _results;
      _results = [];
      for (i = _i = lo; lo <= hi ? _i < hi : _i > hi; i = lo <= hi ? ++_i : --_i) {
        _results.push("" + tag + " " + x[i]);
      }
      return _results;
    };

    Differ.prototype._plainReplace = function(a, alo, ahi, b, blo, bhi) {
      var first, g, line, lines, second, _i, _j, _len, _len1, _ref;
      assert(alo < ahi && blo < bhi);
      if (bhi - blo < ahi - alo) {
        first = this._dump('+', b, blo, bhi);
        second = this._dump('-', a, alo, ahi);
      } else {
        first = this._dump('-', a, alo, ahi);
        second = this._dump('+', b, blo, bhi);
      }
      lines = [];
      _ref = [first, second];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        g = _ref[_i];
        for (_j = 0, _len1 = g.length; _j < _len1; _j++) {
          line = g[_j];
          lines.push(line);
        }
      }
      return lines;
    };

    Differ.prototype._fancyReplace = function(a, alo, ahi, b, blo, bhi) {
      /*
          When replacing one block of lines with another, search the blocks
          for *similar* lines; the best-matching pair (if any) is used as a
          synch point, and intraline difference marking is done on the
          similar pair. Lots of work, but often worth it.
      
          Example:
          >>> d = new Differ
          >>> d._fancyReplace(['abcDefghiJkl\n'], 0, 1,
          ...                 ['abcdefGhijkl\n'], 0, 1)
          [ '- abcDefghiJkl\n',
            '?    ^  ^  ^\n',
            '+ abcdefGhijkl\n',
            '?    ^  ^  ^\n' ]
      */

      var aelt, ai, ai1, ai2, atags, belt, bestRatio, besti, bestj, bj, bj1, bj2, btags, cruncher, cutoff, eqi, eqj, i, j, la, lb, line, lines, tag, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _n, _o, _ref, _ref1, _ref10, _ref11, _ref12, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      _ref = [0.74, 0.75], bestRatio = _ref[0], cutoff = _ref[1];
      cruncher = new SequenceMatcher(this.charjunk);
      _ref1 = [null, null], eqi = _ref1[0], eqj = _ref1[1];
      lines = [];
      for (j = _i = blo; blo <= bhi ? _i < bhi : _i > bhi; j = blo <= bhi ? ++_i : --_i) {
        bj = b[j];
        cruncher.setSeq2(bj);
        for (i = _j = alo; alo <= ahi ? _j < ahi : _j > ahi; i = alo <= ahi ? ++_j : --_j) {
          ai = a[i];
          if (ai === bj) {
            if (eqi === null) {
              _ref2 = [i, j], eqi = _ref2[0], eqj = _ref2[1];
            }
            continue;
          }
          cruncher.setSeq1(ai);
          if (cruncher.realQuickRatio() > bestRatio && cruncher.quickRatio() > bestRatio && cruncher.ratio() > bestRatio) {
            _ref3 = [cruncher.ratio(), i, j], bestRatio = _ref3[0], besti = _ref3[1], bestj = _ref3[2];
          }
        }
      }
      if (bestRatio < cutoff) {
        if (eqi === null) {
          _ref4 = this._plainReplace(a, alo, ahi, b, blo, bhi);
          for (_k = 0, _len = _ref4.length; _k < _len; _k++) {
            line = _ref4[_k];
            lines.push(line);
          }
          return lines;
        }
        _ref5 = [eqi, eqj, 1.0], besti = _ref5[0], bestj = _ref5[1], bestRatio = _ref5[2];
      } else {
        eqi = null;
      }
      _ref6 = this._fancyHelper(a, alo, besti, b, blo, bestj);
      for (_l = 0, _len1 = _ref6.length; _l < _len1; _l++) {
        line = _ref6[_l];
        lines.push(line);
      }
      _ref7 = [a[besti], b[bestj]], aelt = _ref7[0], belt = _ref7[1];
      if (eqi === null) {
        atags = btags = '';
        cruncher.setSeqs(aelt, belt);
        _ref8 = cruncher.getOpcodes();
        for (_m = 0, _len2 = _ref8.length; _m < _len2; _m++) {
          _ref9 = _ref8[_m], tag = _ref9[0], ai1 = _ref9[1], ai2 = _ref9[2], bj1 = _ref9[3], bj2 = _ref9[4];
          _ref10 = [ai2 - ai1, bj2 - bj1], la = _ref10[0], lb = _ref10[1];
          switch (tag) {
            case 'replace':
              atags += Array(la + 1).join('^');
              btags += Array(lb + 1).join('^');
              break;
            case 'delete':
              atags += Array(la + 1).join('-');
              break;
            case 'insert':
              btags += Array(lb + 1).join('+');
              break;
            case 'equal':
              atags += Array(la + 1).join(' ');
              btags += Array(lb + 1).join(' ');
              break;
            default:
              throw new Error("unknow tag (" + tag + ")");
          }
        }
        _ref11 = this._qformat(aelt, belt, atags, btags);
        for (_n = 0, _len3 = _ref11.length; _n < _len3; _n++) {
          line = _ref11[_n];
          lines.push(line);
        }
      } else {
        lines.push('  ' + aelt);
      }
      _ref12 = this._fancyHelper(a, besti + 1, ahi, b, bestj + 1, bhi);
      for (_o = 0, _len4 = _ref12.length; _o < _len4; _o++) {
        line = _ref12[_o];
        lines.push(line);
      }
      return lines;
    };

    Differ.prototype._fancyHelper = function(a, alo, ahi, b, blo, bhi) {
      var g;
      g = [];
      if (alo < ahi) {
        if (blo < bhi) {
          g = this._fancyReplace(a, alo, ahi, b, blo, bhi);
        } else {
          g = this._dump('-', a, alo, ahi);
        }
      } else if (blo < bhi) {
        g = this._dump('+', b, blo, bhi);
      }
      return g;
    };

    Differ.prototype._qformat = function(aline, bline, atags, btags) {
      /*
          Format "?" output and deal with leading tabs.
      
          Example:
      
          >>> d = new Differ
          >>> d._qformat('\tabcDefghiJkl\n', '\tabcdefGhijkl\n',
          [ '- \tabcDefghiJkl\n',
            '? \t ^ ^  ^\n',
            '+ \tabcdefGhijkl\n',
            '? \t ^ ^  ^\n' ]
      */

      var common, lines;
      lines = [];
      common = min(_countLeading(aline, '\t'), _countLeading(bline, '\t'));
      common = min(common, _countLeading(atags.slice(0, common), ' '));
      common = min(common, _countLeading(btags.slice(0, common), ' '));
      atags = atags.slice(common).replace(/\s+$/, '');
      btags = btags.slice(common).replace(/\s+$/, '');
      lines.push('- ' + aline);
      if (atags.length) {
        lines.push("? " + (Array(common + 1).join('\t')) + atags + "\n");
      }
      lines.push('+ ' + bline);
      if (btags.length) {
        lines.push("? " + (Array(common + 1).join('\t')) + btags + "\n");
      }
      return lines;
    };

    return Differ;

  })();

  IS_LINE_JUNK = function(line, pat) {
    if (pat == null) {
      pat = /^\s*#?\s*$/;
    }
    /*
      Return 1 for ignorable line: iff `line` is blank or contains a single '#'.
        
      Examples:
    
      >>> IS_LINE_JUNK('\n')
      true
      >>> IS_LINE_JUNK('  #   \n')
      true
      >>> IS_LINE_JUNK('hello\n')
      false
    */

    return pat.test(line);
  };

  IS_CHARACTER_JUNK = function(ch, ws) {
    if (ws == null) {
      ws = ' \t';
    }
    /*
      Return 1 for ignorable character: iff `ch` is a space or tab.
    
      Examples:
      >>> IS_CHARACTER_JUNK(' ').should.be.true
      true
      >>> IS_CHARACTER_JUNK('\t').should.be.true
      true
      >>> IS_CHARACTER_JUNK('\n').should.be.false
      false
      >>> IS_CHARACTER_JUNK('x').should.be.false
      false
    */

    return __indexOf.call(ws, ch) >= 0;
  };

  _formatRangeUnified = function(start, stop) {
    /*
      Convert range to the "ed" format'
    */

    var beginning, length;
    beginning = start + 1;
    length = stop - start;
    if (length === 1) {
      return "" + beginning;
    }
    if (!length) {
      beginning--;
    }
    return "" + beginning + "," + length;
  };

  unifiedDiff = function(a, b, _arg) {
    var file1Range, file2Range, first, fromdate, fromfile, fromfiledate, group, i1, i2, j1, j2, last, line, lines, lineterm, n, started, tag, todate, tofile, tofiledate, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
    _ref = _arg != null ? _arg : {}, fromfile = _ref.fromfile, tofile = _ref.tofile, fromfiledate = _ref.fromfiledate, tofiledate = _ref.tofiledate, n = _ref.n, lineterm = _ref.lineterm;
    /*
      Compare two sequences of lines; generate the delta as a unified diff.
    
      Unified diffs are a compact way of showing line changes and a few
      lines of context.  The number of context lines is set by 'n' which
      defaults to three.
    
      By default, the diff control lines (those with ---, +++, or @@) are
      created with a trailing newline.  
    
      For inputs that do not have trailing newlines, set the lineterm
      argument to "" so that the output will be uniformly newline free.
    
      The unidiff format normally has a header for filenames and modification
      times.  Any or all of these may be specified using strings for
      'fromfile', 'tofile', 'fromfiledate', and 'tofiledate'.
      The modification times are normally expressed in the ISO 8601 format.
    
      Example:
    
      >>> unifiedDiff('one two three four'.split(' '),
      ...             'zero one tree four'.split(' '), {
      ...               fromfile: 'Original'
      ...               tofile: 'Current',
      ...               fromfiledate: '2005-01-26 23:30:50',
      ...               tofiledate: '2010-04-02 10:20:52',
      ...               lineterm: ''
      ...             })
      [ '--- Original\t2005-01-26 23:30:50',
        '+++ Current\t2010-04-02 10:20:52',
        '@@ -1,4 +1,4 @@',
        '+zero',
        ' one',
        '-two',
        '-three',
        '+tree',
        ' four' ]
    */

    if (fromfile == null) {
      fromfile = '';
    }
    if (tofile == null) {
      tofile = '';
    }
    if (fromfiledate == null) {
      fromfiledate = '';
    }
    if (tofiledate == null) {
      tofiledate = '';
    }
    if (n == null) {
      n = 3;
    }
    if (lineterm == null) {
      lineterm = '\n';
    }
    lines = [];
    started = false;
    _ref1 = (new SequenceMatcher(null, a, b)).getGroupedOpcodes();
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      group = _ref1[_i];
      if (!started) {
        started = true;
        fromdate = fromfiledate ? "\t" + fromfiledate : '';
        todate = tofiledate ? "\t" + tofiledate : '';
        lines.push("--- " + fromfile + fromdate + lineterm);
        lines.push("+++ " + tofile + todate + lineterm);
      }
      _ref2 = [group[0], group[group.length - 1]], first = _ref2[0], last = _ref2[1];
      file1Range = _formatRangeUnified(first[1], last[2]);
      file2Range = _formatRangeUnified(first[3], last[4]);
      lines.push("@@ -" + file1Range + " +" + file2Range + " @@" + lineterm);
      for (_j = 0, _len1 = group.length; _j < _len1; _j++) {
        _ref3 = group[_j], tag = _ref3[0], i1 = _ref3[1], i2 = _ref3[2], j1 = _ref3[3], j2 = _ref3[4];
        if (tag === 'equal') {
          _ref4 = a.slice(i1, i2);
          for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
            line = _ref4[_k];
            lines.push(' ' + line);
          }
          continue;
        }
        if (tag === 'replace' || tag === 'delete') {
          _ref5 = a.slice(i1, i2);
          for (_l = 0, _len3 = _ref5.length; _l < _len3; _l++) {
            line = _ref5[_l];
            lines.push('-' + line);
          }
        }
        if (tag === 'replace' || tag === 'insert') {
          _ref6 = b.slice(j1, j2);
          for (_m = 0, _len4 = _ref6.length; _m < _len4; _m++) {
            line = _ref6[_m];
            lines.push('+' + line);
          }
        }
      }
    }
    return lines;
  };

  _formatRangeContext = function(start, stop) {
    /*
      Convert range to the "ed" format'
    */

    var beginning, length;
    beginning = start + 1;
    length = stop - start;
    if (!length) {
      beginning--;
    }
    if (length <= 1) {
      return "" + beginning;
    }
    return "" + beginning + "," + (beginning + length - 1);
  };

  contextDiff = function(a, b, _arg) {
    var file1Range, file2Range, first, fromdate, fromfile, fromfiledate, group, i1, i2, j1, j2, last, line, lines, lineterm, n, prefix, started, tag, todate, tofile, tofiledate, _, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
    _ref = _arg != null ? _arg : {}, fromfile = _ref.fromfile, tofile = _ref.tofile, fromfiledate = _ref.fromfiledate, tofiledate = _ref.tofiledate, n = _ref.n, lineterm = _ref.lineterm;
    /*
      Compare two sequences of lines; generate the delta as a context diff.
    
      Context diffs are a compact way of showing line changes and a few
      lines of context.  The number of context lines is set by 'n' which
      defaults to three.
    
      By default, the diff control lines (those with *** or ---) are
      created with a trailing newline.  This is helpful so that inputs
      created from file.readlines() result in diffs that are suitable for
      file.writelines() since both the inputs and outputs have trailing
      newlines.
    
      For inputs that do not have trailing newlines, set the lineterm
      argument to "" so that the output will be uniformly newline free.
    
      The context diff format normally has a header for filenames and
      modification times.  Any or all of these may be specified using
      strings for 'fromfile', 'tofile', 'fromfiledate', and 'tofiledate'.
      The modification times are normally expressed in the ISO 8601 format.
      If not specified, the strings default to blanks.
    
      Example:
      >>> a = ['one\n', 'two\n', 'three\n', 'four\n']
      >>> b = ['zero\n', 'one\n', 'tree\n', 'four\n']
      >>> contextDiff(a, b, {fromfile: 'Original', tofile: 'Current'})
      [ '*** Original\n',
        '--- Current\n',
        '***************\n',
        '*** 1,4 ****\n',
        '  one\n',
        '! two\n',
        '! three\n',
        '  four\n',
        '--- 1,4 ----\n',
        '+ zero\n',
        '  one\n',
        '! tree\n',
        '  four\n' ]
    */

    if (fromfile == null) {
      fromfile = '';
    }
    if (tofile == null) {
      tofile = '';
    }
    if (fromfiledate == null) {
      fromfiledate = '';
    }
    if (tofiledate == null) {
      tofiledate = '';
    }
    if (n == null) {
      n = 3;
    }
    if (lineterm == null) {
      lineterm = '\n';
    }
    prefix = {
      insert: '+ ',
      "delete": '- ',
      replace: '! ',
      equal: '  '
    };
    started = false;
    lines = [];
    _ref1 = (new SequenceMatcher(null, a, b)).getGroupedOpcodes();
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      group = _ref1[_i];
      if (!started) {
        started = true;
        fromdate = fromfiledate ? "\t" + fromfiledate : '';
        todate = tofiledate ? "\t" + tofiledate : '';
        lines.push("*** " + fromfile + fromdate + lineterm);
        lines.push("--- " + tofile + todate + lineterm);
        _ref2 = [group[0], group[group.length - 1]], first = _ref2[0], last = _ref2[1];
        lines.push('***************' + lineterm);
        file1Range = _formatRangeContext(first[1], last[2]);
        lines.push("*** " + file1Range + " ****" + lineterm);
        if (_any((function() {
          var _j, _len1, _ref3, _results;
          _results = [];
          for (_j = 0, _len1 = group.length; _j < _len1; _j++) {
            _ref3 = group[_j], tag = _ref3[0], _ = _ref3[1], _ = _ref3[2], _ = _ref3[3], _ = _ref3[4];
            _results.push(tag === 'replace' || tag === 'delete');
          }
          return _results;
        })())) {
          for (_j = 0, _len1 = group.length; _j < _len1; _j++) {
            _ref3 = group[_j], tag = _ref3[0], i1 = _ref3[1], i2 = _ref3[2], _ = _ref3[3], _ = _ref3[4];
            if (tag !== 'insert') {
              _ref4 = a.slice(i1, i2);
              for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
                line = _ref4[_k];
                lines.push(prefix[tag] + line);
              }
            }
          }
        }
        file2Range = _formatRangeContext(first[3], last[4]);
        lines.push("--- " + file2Range + " ----" + lineterm);
        if (_any((function() {
          var _l, _len3, _ref5, _results;
          _results = [];
          for (_l = 0, _len3 = group.length; _l < _len3; _l++) {
            _ref5 = group[_l], tag = _ref5[0], _ = _ref5[1], _ = _ref5[2], _ = _ref5[3], _ = _ref5[4];
            _results.push(tag === 'replace' || tag === 'insert');
          }
          return _results;
        })())) {
          for (_l = 0, _len3 = group.length; _l < _len3; _l++) {
            _ref5 = group[_l], tag = _ref5[0], _ = _ref5[1], _ = _ref5[2], j1 = _ref5[3], j2 = _ref5[4];
            if (tag !== 'delete') {
              _ref6 = b.slice(j1, j2);
              for (_m = 0, _len4 = _ref6.length; _m < _len4; _m++) {
                line = _ref6[_m];
                lines.push(prefix[tag] + line);
              }
            }
          }
        }
      }
    }
    return lines;
  };

  ndiff = function(a, b, linejunk, charjunk) {
    if (charjunk == null) {
      charjunk = IS_CHARACTER_JUNK;
    }
    /*
      Compare `a` and `b` (lists of strings); return a `Differ`-style delta.
    
      Optional keyword parameters `linejunk` and `charjunk` are for filter
      functions (or None):
    
      - linejunk: A function that should accept a single string argument, and
        return true iff the string is junk.  The default is null, and is
        recommended; 
    
      - charjunk: A function that should accept a string of length 1. The
        default is module-level function IS_CHARACTER_JUNK, which filters out
        whitespace characters (a blank or tab; note: bad idea to include newline
        in this!).
    
      Example:
      >>> a = ['one\n', 'two\n', 'three\n']
      >>> b = ['ore\n', 'tree\n', 'emu\n']
      >>> ndiff(a, b)
      [ '- one\n',
        '?  ^\n',
        '+ ore\n',
        '?  ^\n',
        '- two\n',
        '- three\n',
        '?  -\n',
        '+ tree\n',
        '+ emu\n' ]
    */

    return (new Differ(linejunk, charjunk)).compare(a, b);
  };

  restore = function(delta, which) {
    /*
      Generate one of the two sequences that generated a delta.
    
      Given a `delta` produced by `Differ.compare()` or `ndiff()`, extract
      lines originating from file 1 or 2 (parameter `which`), stripping off line
      prefixes.
    
      Examples:
      >>> a = ['one\n', 'two\n', 'three\n']
      >>> b = ['ore\n', 'tree\n', 'emu\n']
      >>> diff = ndiff(a, b)
      >>> restore(diff, 1)
      [ 'one\n',
        'two\n',
        'three\n' ]
      >>> restore(diff, 2)
      [ 'ore\n',
        'tree\n',
        'emu\n' ]
    */

    var line, lines, prefixes, tag, _i, _len, _ref;
    tag = {
      1: '- ',
      2: '+ '
    }[which];
    if (!tag) {
      throw new Error("unknow delta choice (must be 1 or 2): " + which);
    }
    prefixes = ['  ', tag];
    lines = [];
    for (_i = 0, _len = delta.length; _i < _len; _i++) {
      line = delta[_i];
      if (_ref = line.slice(0, 2), __indexOf.call(prefixes, _ref) >= 0) {
        lines.push(line.slice(2));
      }
    }
    return lines;
  };

  exports._arrayCmp = _arrayCmp;

  exports.SequenceMatcher = SequenceMatcher;

  exports.getCloseMatches = getCloseMatches;

  exports._countLeading = _countLeading;

  exports.Differ = Differ;

  exports.IS_LINE_JUNK = IS_LINE_JUNK;

  exports.IS_CHARACTER_JUNK = IS_CHARACTER_JUNK;

  exports._formatRangeUnified = _formatRangeUnified;

  exports.unifiedDiff = unifiedDiff;

  exports._formatRangeContext = _formatRangeContext;

  exports.contextDiff = contextDiff;

  exports.ndiff = ndiff;

  exports.restore = restore;

}).call(this);

},{"assert":271,"heap":165}],165:[function(require,module,exports){
module.exports = require('./lib/heap');

},{"./lib/heap":166}],166:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
(function() {
  var Heap, defaultCmp, floor, heapify, heappop, heappush, heappushpop, heapreplace, insort, min, nlargest, nsmallest, updateItem, _siftdown, _siftup;

  floor = Math.floor, min = Math.min;


  /*
  Default comparison function to be used
   */

  defaultCmp = function(x, y) {
    if (x < y) {
      return -1;
    }
    if (x > y) {
      return 1;
    }
    return 0;
  };


  /*
  Insert item x in list a, and keep it sorted assuming a is sorted.
  
  If x is already in a, insert it to the right of the rightmost x.
  
  Optional args lo (default 0) and hi (default a.length) bound the slice
  of a to be searched.
   */

  insort = function(a, x, lo, hi, cmp) {
    var mid;
    if (lo == null) {
      lo = 0;
    }
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (lo < 0) {
      throw new Error('lo must be non-negative');
    }
    if (hi == null) {
      hi = a.length;
    }
    while (lo < hi) {
      mid = floor((lo + hi) / 2);
      if (cmp(x, a[mid]) < 0) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    return ([].splice.apply(a, [lo, lo - lo].concat(x)), x);
  };


  /*
  Push item onto heap, maintaining the heap invariant.
   */

  heappush = function(array, item, cmp) {
    if (cmp == null) {
      cmp = defaultCmp;
    }
    array.push(item);
    return _siftdown(array, 0, array.length - 1, cmp);
  };


  /*
  Pop the smallest item off the heap, maintaining the heap invariant.
   */

  heappop = function(array, cmp) {
    var lastelt, returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    lastelt = array.pop();
    if (array.length) {
      returnitem = array[0];
      array[0] = lastelt;
      _siftup(array, 0, cmp);
    } else {
      returnitem = lastelt;
    }
    return returnitem;
  };


  /*
  Pop and return the current smallest value, and add the new item.
  
  This is more efficient than heappop() followed by heappush(), and can be
  more appropriate when using a fixed size heap. Note that the value
  returned may be larger than item! That constrains reasonable use of
  this routine unless written as part of a conditional replacement:
      if item > array[0]
        item = heapreplace(array, item)
   */

  heapreplace = function(array, item, cmp) {
    var returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    returnitem = array[0];
    array[0] = item;
    _siftup(array, 0, cmp);
    return returnitem;
  };


  /*
  Fast version of a heappush followed by a heappop.
   */

  heappushpop = function(array, item, cmp) {
    var _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (array.length && cmp(array[0], item) < 0) {
      _ref = [array[0], item], item = _ref[0], array[0] = _ref[1];
      _siftup(array, 0, cmp);
    }
    return item;
  };


  /*
  Transform list into a heap, in-place, in O(array.length) time.
   */

  heapify = function(array, cmp) {
    var i, _i, _j, _len, _ref, _ref1, _results, _results1;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    _ref1 = (function() {
      _results1 = [];
      for (var _j = 0, _ref = floor(array.length / 2); 0 <= _ref ? _j < _ref : _j > _ref; 0 <= _ref ? _j++ : _j--){ _results1.push(_j); }
      return _results1;
    }).apply(this).reverse();
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      i = _ref1[_i];
      _results.push(_siftup(array, i, cmp));
    }
    return _results;
  };


  /*
  Update the position of the given item in the heap.
  This function should be called every time the item is being modified.
   */

  updateItem = function(array, item, cmp) {
    var pos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    pos = array.indexOf(item);
    if (pos === -1) {
      return;
    }
    _siftdown(array, 0, pos, cmp);
    return _siftup(array, pos, cmp);
  };


  /*
  Find the n largest elements in a dataset.
   */

  nlargest = function(array, n, cmp) {
    var elem, result, _i, _len, _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    result = array.slice(0, n);
    if (!result.length) {
      return result;
    }
    heapify(result, cmp);
    _ref = array.slice(n);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      elem = _ref[_i];
      heappushpop(result, elem, cmp);
    }
    return result.sort(cmp).reverse();
  };


  /*
  Find the n smallest elements in a dataset.
   */

  nsmallest = function(array, n, cmp) {
    var elem, i, los, result, _i, _j, _len, _ref, _ref1, _results;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (n * 10 <= array.length) {
      result = array.slice(0, n).sort(cmp);
      if (!result.length) {
        return result;
      }
      los = result[result.length - 1];
      _ref = array.slice(n);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        if (cmp(elem, los) < 0) {
          insort(result, elem, 0, null, cmp);
          result.pop();
          los = result[result.length - 1];
        }
      }
      return result;
    }
    heapify(array, cmp);
    _results = [];
    for (i = _j = 0, _ref1 = min(n, array.length); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
      _results.push(heappop(array, cmp));
    }
    return _results;
  };

  _siftdown = function(array, startpos, pos, cmp) {
    var newitem, parent, parentpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    newitem = array[pos];
    while (pos > startpos) {
      parentpos = (pos - 1) >> 1;
      parent = array[parentpos];
      if (cmp(newitem, parent) < 0) {
        array[pos] = parent;
        pos = parentpos;
        continue;
      }
      break;
    }
    return array[pos] = newitem;
  };

  _siftup = function(array, pos, cmp) {
    var childpos, endpos, newitem, rightpos, startpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    endpos = array.length;
    startpos = pos;
    newitem = array[pos];
    childpos = 2 * pos + 1;
    while (childpos < endpos) {
      rightpos = childpos + 1;
      if (rightpos < endpos && !(cmp(array[childpos], array[rightpos]) < 0)) {
        childpos = rightpos;
      }
      array[pos] = array[childpos];
      pos = childpos;
      childpos = 2 * pos + 1;
    }
    array[pos] = newitem;
    return _siftdown(array, startpos, pos, cmp);
  };

  Heap = (function() {
    Heap.push = heappush;

    Heap.pop = heappop;

    Heap.replace = heapreplace;

    Heap.pushpop = heappushpop;

    Heap.heapify = heapify;

    Heap.updateItem = updateItem;

    Heap.nlargest = nlargest;

    Heap.nsmallest = nsmallest;

    function Heap(cmp) {
      this.cmp = cmp != null ? cmp : defaultCmp;
      this.nodes = [];
    }

    Heap.prototype.push = function(x) {
      return heappush(this.nodes, x, this.cmp);
    };

    Heap.prototype.pop = function() {
      return heappop(this.nodes, this.cmp);
    };

    Heap.prototype.peek = function() {
      return this.nodes[0];
    };

    Heap.prototype.contains = function(x) {
      return this.nodes.indexOf(x) !== -1;
    };

    Heap.prototype.replace = function(x) {
      return heapreplace(this.nodes, x, this.cmp);
    };

    Heap.prototype.pushpop = function(x) {
      return heappushpop(this.nodes, x, this.cmp);
    };

    Heap.prototype.heapify = function() {
      return heapify(this.nodes, this.cmp);
    };

    Heap.prototype.updateItem = function(x) {
      return updateItem(this.nodes, x, this.cmp);
    };

    Heap.prototype.clear = function() {
      return this.nodes = [];
    };

    Heap.prototype.empty = function() {
      return this.nodes.length === 0;
    };

    Heap.prototype.size = function() {
      return this.nodes.length;
    };

    Heap.prototype.clone = function() {
      var heap;
      heap = new Heap();
      heap.nodes = this.nodes.slice(0);
      return heap;
    };

    Heap.prototype.toArray = function() {
      return this.nodes.slice(0);
    };

    Heap.prototype.insert = Heap.prototype.push;

    Heap.prototype.top = Heap.prototype.peek;

    Heap.prototype.front = Heap.prototype.peek;

    Heap.prototype.has = Heap.prototype.contains;

    Heap.prototype.copy = Heap.prototype.clone;

    return Heap;

  })();

  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      return define([], factory);
    } else if (typeof exports === 'object') {
      return module.exports = factory();
    } else {
      return root.Heap = factory();
    }
  })(this, function() {
    return Heap;
  });

}).call(this);

},{}],167:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedBatch;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function batch(_x, _x2) {
  return _batch.apply(this, arguments);
}

function _batch() {
  _batch = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(number, iterable) {
    var batch, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, item;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(typeof number !== 'number' || number < 1)) {
              _context.next = 2;
              break;
            }

            throw new Error('batch size should be a number, greater than zero');

          case 2:
            batch = [];
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 5;
            _iterator = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 7:
            _context.next = 9;
            return (0, _awaitAsyncGenerator2["default"])(_iterator.next());

          case 9:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 13;
            return (0, _awaitAsyncGenerator2["default"])(_step.value);

          case 13:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 24;
              break;
            }

            item = _value;
            batch.push(item);

            if (!(batch.length === number)) {
              _context.next = 21;
              break;
            }

            _context.next = 20;
            return batch;

          case 20:
            batch = [];

          case 21:
            _iteratorNormalCompletion = true;
            _context.next = 7;
            break;

          case 24:
            _context.next = 30;
            break;

          case 26:
            _context.prev = 26;
            _context.t0 = _context["catch"](5);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 30:
            _context.prev = 30;
            _context.prev = 31;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 35;
              break;
            }

            _context.next = 35;
            return (0, _awaitAsyncGenerator2["default"])(_iterator["return"]());

          case 35:
            _context.prev = 35;

            if (!_didIteratorError) {
              _context.next = 38;
              break;
            }

            throw _iteratorError;

          case 38:
            return _context.finish(35);

          case 39:
            return _context.finish(30);

          case 40:
            if (!batch.length) {
              _context.next = 43;
              break;
            }

            _context.next = 43;
            return batch;

          case 43:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[5, 26, 30, 40], [31,, 35, 39]]);
  }));
  return _batch.apply(this, arguments);
}

function curriedBatch(number, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return batch(number, iterable);
    };
  }

  return batch(number, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],168:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = asyncBufferCurried;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _symbol = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

var _dequeue = _interopRequireDefault(require("dequeue"));

function asyncBuffer(_x, _x2) {
  return _asyncBuffer.apply(this, arguments);
}

function _asyncBuffer() {
  _asyncBuffer = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(bufferSize, iterable) {
    var iterator, buffer, i, _ref, done, value;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            iterator = (0, _ensureAsyncIterable["default"])(iterable, true)[_symbol["default"].asyncIterator]();
            buffer = new _dequeue["default"]();
            _context.prev = 2;

            // fill buffer
            for (i = 0; i < bufferSize; i++) {
              buffer.push(iterator.next());
            }

          case 4:
            if (!true) {
              _context.next = 17;
              break;
            }

            buffer.push(iterator.next());
            _context.next = 8;
            return (0, _awaitAsyncGenerator2["default"])(buffer.shift());

          case 8:
            _ref = _context.sent;
            done = _ref.done;
            value = _ref.value;

            if (!done) {
              _context.next = 13;
              break;
            }

            return _context.abrupt("return");

          case 13:
            _context.next = 15;
            return value;

          case 15:
            _context.next = 4;
            break;

          case 17:
            _context.prev = 17;

            if (!(typeof iterator["return"] === 'function')) {
              _context.next = 21;
              break;
            }

            _context.next = 21;
            return (0, _awaitAsyncGenerator2["default"])(iterator["return"]());

          case 21:
            return _context.finish(17);

          case 22:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[2,, 17, 22]]);
  }));
  return _asyncBuffer.apply(this, arguments);
}

function asyncBufferCurried(bufferSize, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return asyncBuffer(bufferSize, iterable);
    };
  }

  return asyncBuffer(bufferSize, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol":15,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37,"dequeue":162}],169:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = chain;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _asyncGeneratorDelegate2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncGeneratorDelegate"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function chain() {
  return _chain.apply(this, arguments);
}

function _chain() {
  _chain = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee() {
    var _len,
        arrayOfIter,
        _key,
        _i,
        _arrayOfIter,
        iterable,
        _args = arguments;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            for (_len = _args.length, arrayOfIter = new Array(_len), _key = 0; _key < _len; _key++) {
              arrayOfIter[_key] = _args[_key];
            }

            _i = 0, _arrayOfIter = arrayOfIter;

          case 2:
            if (!(_i < _arrayOfIter.length)) {
              _context.next = 8;
              break;
            }

            iterable = _arrayOfIter[_i];
            return _context.delegateYield((0, _asyncGeneratorDelegate2["default"])((0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable)), _awaitAsyncGenerator2["default"]), "t0", 5);

          case 5:
            _i++;
            _context.next = 2;
            break;

          case 8:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _chain.apply(this, arguments);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncGeneratorDelegate":21,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],170:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = compress;

var _compose = _interopRequireDefault(require("./compose"));

var _asyncZip = _interopRequireDefault(require("./async-zip"));

var _asyncFilter = _interopRequireDefault(require("./async-filter"));

var _asyncMap = _interopRequireDefault(require("./async-map"));

function compress() {
  return (0, _compose["default"])((0, _asyncMap["default"])(function (entry) {
    return entry[0];
  }), (0, _asyncFilter["default"])(function (entry) {
    return entry[1];
  }), function (iterable, compress) {
    return (0, _asyncZip["default"])(iterable, compress);
  }).apply(void 0, arguments);
}

module.exports = exports["default"];
},{"./async-filter":179,"./async-map":188,"./async-zip":206,"./compose":211,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],171:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _asyncChain = _interopRequireDefault(require("./async-chain"));

var _default = _asyncChain["default"];
exports["default"] = _default;
module.exports = exports["default"];
},{"./async-chain":169,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],172:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedConsume;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncToGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function consume(_x, _x2) {
  return _consume.apply(this, arguments);
}

function _consume() {
  _consume = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(func, iterable) {
    var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, item;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 2;
            _iterator = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 4:
            _context.next = 6;
            return _iterator.next();

          case 6:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 10;
            return _step.value;

          case 10:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 18;
              break;
            }

            item = _value;
            _context.next = 15;
            return func(item);

          case 15:
            _iteratorNormalCompletion = true;
            _context.next = 4;
            break;

          case 18:
            _context.next = 24;
            break;

          case 20:
            _context.prev = 20;
            _context.t0 = _context["catch"](2);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 24:
            _context.prev = 24;
            _context.prev = 25;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 29;
              break;
            }

            _context.next = 29;
            return _iterator["return"]();

          case 29:
            _context.prev = 29;

            if (!_didIteratorError) {
              _context.next = 32;
              break;
            }

            throw _iteratorError;

          case 32:
            return _context.finish(29);

          case 33:
            return _context.finish(24);

          case 34:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[2, 20, 24, 34], [25,, 29, 33]]);
  }));
  return _consume.apply(this, arguments);
}

function curriedConsume(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return consume(func, iterable);
    };
  }

  return consume(func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/asyncToGenerator":23,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],173:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedAsyncCursor;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _from = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/array/from"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

var _asyncChain = _interopRequireDefault(require("./async-chain"));

var _repeat = _interopRequireDefault(require("./repeat"));

var _circularBuffer = _interopRequireDefault(require("./internal/circular-buffer"));

function asyncCursor(_x, _x2) {
  return _asyncCursor.apply(this, arguments);
}

function _asyncCursor() {
  _asyncCursor = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(_ref, iterable) {
    var size, trailing, filler, circular, index, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, item, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _value2, _item;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            size = _ref.size, trailing = _ref.trailing, filler = _ref.filler;
            circular = new _circularBuffer["default"](size);

            if (typeof filler !== 'undefined') {
              circular.array.fill(filler);
            }

            if (!trailing) {
              _context.next = 44;
              break;
            }

            index = 0;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 7;
            _iterator = (0, _asyncIterator2["default"])((0, _asyncChain["default"])(iterable, (0, _repeat["default"])(filler, size - 1)));

          case 9:
            _context.next = 11;
            return (0, _awaitAsyncGenerator2["default"])(_iterator.next());

          case 11:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 15;
            return (0, _awaitAsyncGenerator2["default"])(_step.value);

          case 15:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 26;
              break;
            }

            item = _value;
            circular.push(item);

            if (!(index + 1 >= size)) {
              _context.next = 22;
              break;
            }

            _context.next = 22;
            return (0, _from["default"])(circular);

          case 22:
            index++;

          case 23:
            _iteratorNormalCompletion = true;
            _context.next = 9;
            break;

          case 26:
            _context.next = 32;
            break;

          case 28:
            _context.prev = 28;
            _context.t0 = _context["catch"](7);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 32:
            _context.prev = 32;
            _context.prev = 33;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 37;
              break;
            }

            _context.next = 37;
            return (0, _awaitAsyncGenerator2["default"])(_iterator["return"]());

          case 37:
            _context.prev = 37;

            if (!_didIteratorError) {
              _context.next = 40;
              break;
            }

            throw _iteratorError;

          case 40:
            return _context.finish(37);

          case 41:
            return _context.finish(32);

          case 42:
            _context.next = 79;
            break;

          case 44:
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _context.prev = 46;
            _iterator2 = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 48:
            _context.next = 50;
            return (0, _awaitAsyncGenerator2["default"])(_iterator2.next());

          case 50:
            _step2 = _context.sent;
            _iteratorNormalCompletion2 = _step2.done;
            _context.next = 54;
            return (0, _awaitAsyncGenerator2["default"])(_step2.value);

          case 54:
            _value2 = _context.sent;

            if (_iteratorNormalCompletion2) {
              _context.next = 63;
              break;
            }

            _item = _value2;
            circular.push(_item);
            _context.next = 60;
            return (0, _from["default"])(circular);

          case 60:
            _iteratorNormalCompletion2 = true;
            _context.next = 48;
            break;

          case 63:
            _context.next = 69;
            break;

          case 65:
            _context.prev = 65;
            _context.t1 = _context["catch"](46);
            _didIteratorError2 = true;
            _iteratorError2 = _context.t1;

          case 69:
            _context.prev = 69;
            _context.prev = 70;

            if (!(!_iteratorNormalCompletion2 && _iterator2["return"] != null)) {
              _context.next = 74;
              break;
            }

            _context.next = 74;
            return (0, _awaitAsyncGenerator2["default"])(_iterator2["return"]());

          case 74:
            _context.prev = 74;

            if (!_didIteratorError2) {
              _context.next = 77;
              break;
            }

            throw _iteratorError2;

          case 77:
            return _context.finish(74);

          case 78:
            return _context.finish(69);

          case 79:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[7, 28, 32, 42], [33,, 37, 41], [46, 65, 69, 79], [70,, 74, 78]]);
  }));
  return _asyncCursor.apply(this, arguments);
}

function curriedAsyncCursor(size, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return asyncCursor(size, iterable);
    };
  }

  return asyncCursor(size, iterable);
}

module.exports = exports["default"];
},{"./async-chain":169,"./internal/circular-buffer":230,"./internal/ensure-async-iterable":233,"./repeat":253,"@babel/runtime-corejs2/core-js/array/from":4,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],174:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = cycle;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _asyncGeneratorDelegate2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncGeneratorDelegate"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function cycle(_x) {
  return _cycle.apply(this, arguments);
}

function _cycle() {
  _cycle = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(iterable) {
    var copy, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, item;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            copy = [];
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 3;
            _iterator = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 5:
            _context.next = 7;
            return (0, _awaitAsyncGenerator2["default"])(_iterator.next());

          case 7:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 11;
            return (0, _awaitAsyncGenerator2["default"])(_step.value);

          case 11:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 20;
              break;
            }

            item = _value;
            copy.push(item);
            _context.next = 17;
            return item;

          case 17:
            _iteratorNormalCompletion = true;
            _context.next = 5;
            break;

          case 20:
            _context.next = 26;
            break;

          case 22:
            _context.prev = 22;
            _context.t0 = _context["catch"](3);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 26:
            _context.prev = 26;
            _context.prev = 27;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 31;
              break;
            }

            _context.next = 31;
            return (0, _awaitAsyncGenerator2["default"])(_iterator["return"]());

          case 31:
            _context.prev = 31;

            if (!_didIteratorError) {
              _context.next = 34;
              break;
            }

            throw _iteratorError;

          case 34:
            return _context.finish(31);

          case 35:
            return _context.finish(26);

          case 36:
            return _context.delegateYield((0, _asyncGeneratorDelegate2["default"])((0, _asyncIterator2["default"])(cycle(copy)), _awaitAsyncGenerator2["default"]), "t1", 37);

          case 37:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3, 22, 26, 36], [27,, 31, 35]]);
  }));
  return _cycle.apply(this, arguments);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncGeneratorDelegate":21,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],175:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedDropWhile;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function dropWhile(_x, _x2) {
  return _dropWhile.apply(this, arguments);
}

function _dropWhile() {
  _dropWhile = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(func, iterable) {
    var drop, c, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, item;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            drop = true;
            c = 0;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 4;
            _iterator = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 6:
            _context.next = 8;
            return (0, _awaitAsyncGenerator2["default"])(_iterator.next());

          case 8:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 12;
            return (0, _awaitAsyncGenerator2["default"])(_step.value);

          case 12:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 29;
              break;
            }

            item = _value;

            if (drop) {
              _context.next = 20;
              break;
            }

            _context.next = 18;
            return item;

          case 18:
            _context.next = 26;
            break;

          case 20:
            _context.next = 22;
            return (0, _awaitAsyncGenerator2["default"])(func(item, c++));

          case 22:
            drop = _context.sent;

            if (drop) {
              _context.next = 26;
              break;
            }

            _context.next = 26;
            return item;

          case 26:
            _iteratorNormalCompletion = true;
            _context.next = 6;
            break;

          case 29:
            _context.next = 35;
            break;

          case 31:
            _context.prev = 31;
            _context.t0 = _context["catch"](4);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 35:
            _context.prev = 35;
            _context.prev = 36;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 40;
              break;
            }

            _context.next = 40;
            return (0, _awaitAsyncGenerator2["default"])(_iterator["return"]());

          case 40:
            _context.prev = 40;

            if (!_didIteratorError) {
              _context.next = 43;
              break;
            }

            throw _iteratorError;

          case 43:
            return _context.finish(40);

          case 44:
            return _context.finish(35);

          case 45:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[4, 31, 35, 45], [36,, 40, 44]]);
  }));
  return _dropWhile.apply(this, arguments);
}

function curriedDropWhile(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return dropWhile(func, iterable);
    };
  }

  return dropWhile(func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],176:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = enumerate;

var _range = _interopRequireDefault(require("./range"));

var _asyncZip = _interopRequireDefault(require("./async-zip"));

function enumerate(iterable) {
  var start = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  return (0, _asyncZip["default"])((0, _range["default"])({
    start: start
  }), iterable);
}

module.exports = exports["default"];
},{"./async-zip":206,"./range":247,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],177:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedEvery;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncToGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function every(_x, _x2) {
  return _every.apply(this, arguments);
}

function _every() {
  _every = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(func, iterable) {
    var c, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, item;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            c = 0;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 3;
            _iterator = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 5:
            _context.next = 7;
            return _iterator.next();

          case 7:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 11;
            return _step.value;

          case 11:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 21;
              break;
            }

            item = _value;
            _context.next = 16;
            return func(item, c++);

          case 16:
            if (_context.sent) {
              _context.next = 18;
              break;
            }

            return _context.abrupt("return", false);

          case 18:
            _iteratorNormalCompletion = true;
            _context.next = 5;
            break;

          case 21:
            _context.next = 27;
            break;

          case 23:
            _context.prev = 23;
            _context.t0 = _context["catch"](3);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 27:
            _context.prev = 27;
            _context.prev = 28;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 32;
              break;
            }

            _context.next = 32;
            return _iterator["return"]();

          case 32:
            _context.prev = 32;

            if (!_didIteratorError) {
              _context.next = 35;
              break;
            }

            throw _iteratorError;

          case 35:
            return _context.finish(32);

          case 36:
            return _context.finish(27);

          case 37:
            return _context.abrupt("return", true);

          case 38:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3, 23, 27, 37], [28,, 32, 36]]);
  }));
  return _every.apply(this, arguments);
}

function curriedEvery(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return every(func, iterable);
    };
  }

  return every(func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/asyncToGenerator":23,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],178:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = execute;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

function execute(_x) {
  return _execute.apply(this, arguments);
}

function _execute() {
  _execute = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(func) {
    var _len,
        args,
        _key,
        _args = arguments;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            for (_len = _args.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
              args[_key - 1] = _args[_key];
            }

          case 1:
            if (!true) {
              _context.next = 6;
              break;
            }

            _context.next = 4;
            return func.apply(void 0, args);

          case 4:
            _context.next = 1;
            break;

          case 6:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _execute.apply(this, arguments);
}

module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],179:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedFilter;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/slicedToArray"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/promise"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _asyncBatch = _interopRequireDefault(require("./async-batch"));

var _zip = _interopRequireDefault(require("./zip"));

function filter(_x, _x2, _x3) {
  return _filter.apply(this, arguments);
}

function _filter() {
  _filter = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(concurrency, func, iterable) {
    var c, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, items, filters, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _step2$value, item, canYield;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            c = 0;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 3;
            _iterator = (0, _asyncIterator2["default"])((0, _asyncBatch["default"])(concurrency, iterable));

          case 5:
            _context.next = 7;
            return (0, _awaitAsyncGenerator2["default"])(_iterator.next());

          case 7:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 11;
            return (0, _awaitAsyncGenerator2["default"])(_step.value);

          case 11:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 47;
              break;
            }

            items = _value;
            _context.next = 16;
            return (0, _awaitAsyncGenerator2["default"])(_promise["default"].all(items.map(function (item) {
              return func(item, c++);
            })));

          case 16:
            filters = _context.sent;
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context.prev = 20;
            _iterator2 = (0, _getIterator2["default"])((0, _zip["default"])(items, filters));

          case 22:
            if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
              _context.next = 30;
              break;
            }

            _step2$value = (0, _slicedToArray2["default"])(_step2.value, 2), item = _step2$value[0], canYield = _step2$value[1];

            if (!canYield) {
              _context.next = 27;
              break;
            }

            _context.next = 27;
            return item;

          case 27:
            _iteratorNormalCompletion2 = true;
            _context.next = 22;
            break;

          case 30:
            _context.next = 36;
            break;

          case 32:
            _context.prev = 32;
            _context.t0 = _context["catch"](20);
            _didIteratorError2 = true;
            _iteratorError2 = _context.t0;

          case 36:
            _context.prev = 36;
            _context.prev = 37;

            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }

          case 39:
            _context.prev = 39;

            if (!_didIteratorError2) {
              _context.next = 42;
              break;
            }

            throw _iteratorError2;

          case 42:
            return _context.finish(39);

          case 43:
            return _context.finish(36);

          case 44:
            _iteratorNormalCompletion = true;
            _context.next = 5;
            break;

          case 47:
            _context.next = 53;
            break;

          case 49:
            _context.prev = 49;
            _context.t1 = _context["catch"](3);
            _didIteratorError = true;
            _iteratorError = _context.t1;

          case 53:
            _context.prev = 53;
            _context.prev = 54;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 58;
              break;
            }

            _context.next = 58;
            return (0, _awaitAsyncGenerator2["default"])(_iterator["return"]());

          case 58:
            _context.prev = 58;

            if (!_didIteratorError) {
              _context.next = 61;
              break;
            }

            throw _iteratorError;

          case 61:
            return _context.finish(58);

          case 62:
            return _context.finish(53);

          case 63:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3, 49, 53, 63], [20, 32, 36, 44], [37,, 39, 43], [54,, 58, 62]]);
  }));
  return _filter.apply(this, arguments);
}

function curriedFilter() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (args.length === 1) {
    return function (iterable) {
      return filter(1, args[0], iterable);
    };
  } else if (args.length === 2 && typeof args[0] === 'number') {
    return function (iterable) {
      return filter(args[0], args[1], iterable);
    };
  } else if (args.length === 2) {
    return filter(1, args[0], args[1]);
  }

  return filter(args[0], args[1], args[2]);
}

module.exports = exports["default"];
},{"./async-batch":167,"./zip":266,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/promise":13,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/slicedToArray":33,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],180:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedFind;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncToGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function find(_x, _x2) {
  return _find.apply(this, arguments);
}

function _find() {
  _find = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(func, iterable) {
    var c, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, item;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            c = 0;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 3;
            _iterator = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 5:
            _context.next = 7;
            return _iterator.next();

          case 7:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 11;
            return _step.value;

          case 11:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 21;
              break;
            }

            item = _value;
            _context.next = 16;
            return func(item, c++);

          case 16:
            if (!_context.sent) {
              _context.next = 18;
              break;
            }

            return _context.abrupt("return", item);

          case 18:
            _iteratorNormalCompletion = true;
            _context.next = 5;
            break;

          case 21:
            _context.next = 27;
            break;

          case 23:
            _context.prev = 23;
            _context.t0 = _context["catch"](3);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 27:
            _context.prev = 27;
            _context.prev = 28;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 32;
              break;
            }

            _context.next = 32;
            return _iterator["return"]();

          case 32:
            _context.prev = 32;

            if (!_didIteratorError) {
              _context.next = 35;
              break;
            }

            throw _iteratorError;

          case 35:
            return _context.finish(32);

          case 36:
            return _context.finish(27);

          case 37:
            return _context.abrupt("return", undefined);

          case 38:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3, 23, 27, 37], [28,, 32, 36]]);
  }));
  return _find.apply(this, arguments);
}

function curriedFind(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return find(func, iterable);
    };
  }

  return find(func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/asyncToGenerator":23,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],181:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = first;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncToGenerator"));

var _asyncSlice = _interopRequireDefault(require("./async-slice"));

var _asyncToArray = _interopRequireDefault(require("./async-to-array"));

function first(_x) {
  return _first.apply(this, arguments);
}

function _first() {
  _first = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(iterable) {
    var arr;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _asyncToArray["default"])((0, _asyncSlice["default"])(1, iterable));

          case 2:
            arr = _context.sent;
            return _context.abrupt("return", arr[0]);

          case 4:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _first.apply(this, arguments);
}

module.exports = exports["default"];
},{"./async-slice":195,"./async-to-array":203,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncToGenerator":23,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],182:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedFlatMap;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _asyncGeneratorDelegate2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncGeneratorDelegate"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _asyncMap = _interopRequireDefault(require("./async-map"));

function flatMap(_x, _x2) {
  return _flatMap.apply(this, arguments);
}

function _flatMap() {
  _flatMap = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(func, iterable) {
    var mapIter, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, item;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            mapIter = (0, _asyncMap["default"])(func);
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 3;
            _iterator = (0, _asyncIterator2["default"])(mapIter(iterable));

          case 5:
            _context.next = 7;
            return (0, _awaitAsyncGenerator2["default"])(_iterator.next());

          case 7:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 11;
            return (0, _awaitAsyncGenerator2["default"])(_step.value);

          case 11:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 18;
              break;
            }

            item = _value;
            return _context.delegateYield((0, _asyncGeneratorDelegate2["default"])((0, _asyncIterator2["default"])(item), _awaitAsyncGenerator2["default"]), "t0", 15);

          case 15:
            _iteratorNormalCompletion = true;
            _context.next = 5;
            break;

          case 18:
            _context.next = 24;
            break;

          case 20:
            _context.prev = 20;
            _context.t1 = _context["catch"](3);
            _didIteratorError = true;
            _iteratorError = _context.t1;

          case 24:
            _context.prev = 24;
            _context.prev = 25;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 29;
              break;
            }

            _context.next = 29;
            return (0, _awaitAsyncGenerator2["default"])(_iterator["return"]());

          case 29:
            _context.prev = 29;

            if (!_didIteratorError) {
              _context.next = 32;
              break;
            }

            throw _iteratorError;

          case 32:
            return _context.finish(29);

          case 33:
            return _context.finish(24);

          case 34:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3, 20, 24, 34], [25,, 29, 33]]);
  }));
  return _flatMap.apply(this, arguments);
}

function curriedFlatMap(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return flatMap(func, iterable);
    };
  }

  return flatMap(func, iterable);
}

module.exports = exports["default"];
},{"./async-map":188,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncGeneratorDelegate":21,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],183:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedAsyncFlat;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _symbol = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol"));

var _iterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol/iterator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _asyncGeneratorDelegate2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncGeneratorDelegate"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

var defaultShouldIFlat = function defaultShouldIFlat(depth) {
  if (typeof depth === 'function') {
    return depth;
  }

  if (typeof depth === 'number') {
    return function (currentDepth, iter) {
      return currentDepth <= depth && (typeof iter[_iterator2["default"]] === 'function' || typeof iter[_symbol["default"].asyncIterator] === 'function') && typeof iter !== 'string';
    };
  }

  throw new Error('async-flat: "depth" can be a function or a number');
};

function asyncFlat(shouldIFlat, iterable) {
  function _asyncFlat(_x, _x2) {
    return _asyncFlat2.apply(this, arguments);
  }

  function _asyncFlat2() {
    _asyncFlat2 = (0, _wrapAsyncGenerator2["default"])(
    /*#__PURE__*/
    _regenerator["default"].mark(function _callee(currentDepth, iterable) {
      var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, iter;

      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return (0, _awaitAsyncGenerator2["default"])(shouldIFlat(currentDepth, iterable));

            case 2:
              if (!_context.sent) {
                _context.next = 38;
                break;
              }

              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _context.prev = 5;
              _iterator = (0, _asyncIterator2["default"])(iterable);

            case 7:
              _context.next = 9;
              return (0, _awaitAsyncGenerator2["default"])(_iterator.next());

            case 9:
              _step = _context.sent;
              _iteratorNormalCompletion = _step.done;
              _context.next = 13;
              return (0, _awaitAsyncGenerator2["default"])(_step.value);

            case 13:
              _value = _context.sent;

              if (_iteratorNormalCompletion) {
                _context.next = 20;
                break;
              }

              iter = _value;
              return _context.delegateYield((0, _asyncGeneratorDelegate2["default"])((0, _asyncIterator2["default"])(_asyncFlat(currentDepth + 1, iter)), _awaitAsyncGenerator2["default"]), "t0", 17);

            case 17:
              _iteratorNormalCompletion = true;
              _context.next = 7;
              break;

            case 20:
              _context.next = 26;
              break;

            case 22:
              _context.prev = 22;
              _context.t1 = _context["catch"](5);
              _didIteratorError = true;
              _iteratorError = _context.t1;

            case 26:
              _context.prev = 26;
              _context.prev = 27;

              if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
                _context.next = 31;
                break;
              }

              _context.next = 31;
              return (0, _awaitAsyncGenerator2["default"])(_iterator["return"]());

            case 31:
              _context.prev = 31;

              if (!_didIteratorError) {
                _context.next = 34;
                break;
              }

              throw _iteratorError;

            case 34:
              return _context.finish(31);

            case 35:
              return _context.finish(26);

            case 36:
              _context.next = 40;
              break;

            case 38:
              _context.next = 40;
              return iterable;

            case 40:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[5, 22, 26, 36], [27,, 31, 35]]);
    }));
    return _asyncFlat2.apply(this, arguments);
  }

  return _asyncFlat(0, (0, _ensureAsyncIterable["default"])(iterable));
}

function curriedAsyncFlat() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (args.length === 0) {
    return function (iterable) {
      return asyncFlat(defaultShouldIFlat(1), iterable);
    };
  } else if (args.length === 1) {
    if (typeof args[0][_iterator2["default"]] === 'function') {
      return asyncFlat(defaultShouldIFlat(1), args[0]);
    } else {
      return function (iterable) {
        return asyncFlat(defaultShouldIFlat(args[0]), iterable);
      };
    }
  } else {
    return asyncFlat(defaultShouldIFlat(args[0]), args[1]);
  }
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol":15,"@babel/runtime-corejs2/core-js/symbol/iterator":16,"@babel/runtime-corejs2/helpers/asyncGeneratorDelegate":21,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],184:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedGroupBy;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _symbol = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function groupBy(_x, _x2) {
  return _groupBy.apply(this, arguments);
}

function _groupBy() {
  _groupBy = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee2(selector, iterable) {
    var iterator, currentItem, currentKey, previousKey, group, _group;

    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _group = function _ref2() {
              _group = (0, _wrapAsyncGenerator2["default"])(
              /*#__PURE__*/
              _regenerator["default"].mark(function _callee() {
                return _regenerator["default"].wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        if (!true) {
                          _context.next = 15;
                          break;
                        }

                        _context.next = 3;
                        return currentItem.value;

                      case 3:
                        _context.next = 5;
                        return (0, _awaitAsyncGenerator2["default"])(iterator.next());

                      case 5:
                        currentItem = _context.sent;

                        if (!currentItem.done) {
                          _context.next = 8;
                          break;
                        }

                        return _context.abrupt("return");

                      case 8:
                        _context.next = 10;
                        return (0, _awaitAsyncGenerator2["default"])(selector(currentItem.value));

                      case 10:
                        currentKey = _context.sent;

                        if (!(previousKey !== currentKey)) {
                          _context.next = 13;
                          break;
                        }

                        return _context.abrupt("return");

                      case 13:
                        _context.next = 0;
                        break;

                      case 15:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee);
              }));
              return _group.apply(this, arguments);
            };

            group = function _ref() {
              return _group.apply(this, arguments);
            };

            selector = selector || function (key) {
              return key;
            };

            iterator = (0, _ensureAsyncIterable["default"])(iterable)[_symbol["default"].asyncIterator]();
            _context2.prev = 4;
            _context2.next = 7;
            return (0, _awaitAsyncGenerator2["default"])(iterator.next());

          case 7:
            currentItem = _context2.sent;

          case 8:
            if (!true) {
              _context2.next = 25;
              break;
            }

            if (!currentItem.done) {
              _context2.next = 11;
              break;
            }

            return _context2.abrupt("return");

          case 11:
            _context2.next = 13;
            return (0, _awaitAsyncGenerator2["default"])(selector(currentItem.value));

          case 13:
            currentKey = _context2.sent;

            if (!(previousKey !== currentKey)) {
              _context2.next = 20;
              break;
            }

            previousKey = currentKey;
            _context2.next = 18;
            return [currentKey, group()];

          case 18:
            _context2.next = 23;
            break;

          case 20:
            _context2.next = 22;
            return (0, _awaitAsyncGenerator2["default"])(iterator.next());

          case 22:
            currentItem = _context2.sent;

          case 23:
            _context2.next = 8;
            break;

          case 25:
            _context2.prev = 25;

            if (!(typeof iterator["return"] === 'function')) {
              _context2.next = 29;
              break;
            }

            _context2.next = 29;
            return (0, _awaitAsyncGenerator2["default"])(iterator["return"]());

          case 29:
            return _context2.finish(25);

          case 30:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[4,, 25, 30]]);
  }));
  return _groupBy.apply(this, arguments);
}

function curriedGroupBy(selector, iterable) {
  if (typeof iterable === 'undefined') {
    return function (iterable) {
      return groupBy(selector, iterable);
    };
  }

  return groupBy(selector, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol":15,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],185:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedInterpose;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function interpose(_x, _x2) {
  return _interpose.apply(this, arguments);
}

function _interpose() {
  _interpose = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(interposeItem, iterable) {
    var first, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, item;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            first = true;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 3;
            _iterator = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 5:
            _context.next = 7;
            return (0, _awaitAsyncGenerator2["default"])(_iterator.next());

          case 7:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 11;
            return (0, _awaitAsyncGenerator2["default"])(_step.value);

          case 11:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 23;
              break;
            }

            item = _value;

            if (first) {
              _context.next = 17;
              break;
            }

            _context.next = 17;
            return interposeItem;

          case 17:
            _context.next = 19;
            return item;

          case 19:
            first = false;

          case 20:
            _iteratorNormalCompletion = true;
            _context.next = 5;
            break;

          case 23:
            _context.next = 29;
            break;

          case 25:
            _context.prev = 25;
            _context.t0 = _context["catch"](3);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 29:
            _context.prev = 29;
            _context.prev = 30;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 34;
              break;
            }

            _context.next = 34;
            return (0, _awaitAsyncGenerator2["default"])(_iterator["return"]());

          case 34:
            _context.prev = 34;

            if (!_didIteratorError) {
              _context.next = 37;
              break;
            }

            throw _iteratorError;

          case 37:
            return _context.finish(34);

          case 38:
            return _context.finish(29);

          case 39:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3, 25, 29, 39], [30,, 34, 38]]);
  }));
  return _interpose.apply(this, arguments);
}

function curriedInterpose(interposeItem, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return interpose(interposeItem, iterable);
    };
  }

  return interpose(interposeItem, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],186:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = asyncIter;
exports.silence = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _symbol = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _asyncGeneratorDelegate2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncGeneratorDelegate"));

var _iter = _interopRequireDefault(require("./iter"));

var deprecationWarning = 'asyncIter() is deprecated! ' + 'If you were using it to cast a sync iterable to an async iterable, you should ' + 'use the new ensureAsyncIterable function instead. Otherwise it should be safe to remove the call.';
var warnedDeprecation = false;

var silence = function silence() {
  return warnedDeprecation = true;
};

exports.silence = silence;

function asyncIter(_x) {
  return _asyncIter.apply(this, arguments);
}

function _asyncIter() {
  _asyncIter = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(iterable) {
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            !warnedDeprecation && console.warn(deprecationWarning);
            warnedDeprecation = true;

            if (!(iterable && iterable[_symbol["default"].asyncIterator])) {
              _context.next = 6;
              break;
            }

            return _context.delegateYield((0, _asyncGeneratorDelegate2["default"])((0, _asyncIterator2["default"])(iterable), _awaitAsyncGenerator2["default"]), "t0", 4);

          case 4:
            _context.next = 7;
            break;

          case 6:
            return _context.delegateYield((0, _asyncGeneratorDelegate2["default"])((0, _asyncIterator2["default"])((0, _iter["default"])(iterable)), _awaitAsyncGenerator2["default"]), "t1", 7);

          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _asyncIter.apply(this, arguments);
}
},{"./iter":238,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol":15,"@babel/runtime-corejs2/helpers/asyncGeneratorDelegate":21,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],187:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = asyncIterable;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/defineProperty"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/typeof"));

var _iterator = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol/iterator"));

var _symbol = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol"));

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _asyncGeneratorDelegate2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncGeneratorDelegate"));

function asyncify(_x) {
  return _asyncify.apply(this, arguments);
}

function _asyncify() {
  _asyncify = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(iterable) {
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.delegateYield((0, _asyncGeneratorDelegate2["default"])((0, _asyncIterator2["default"])(iterable), _awaitAsyncGenerator2["default"]), "t0", 1);

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _asyncify.apply(this, arguments);
}

var emptyArray = [];

function asyncIterable(asyncIterator) {
  if (asyncIterator == null) {
    return asyncify(emptyArray);
  } else if (asyncIterator[_symbol["default"].asyncIterator]) {
    return asyncIterator;
  } else if (asyncIterator[_iterator["default"]]) {
    asyncIterator = asyncify(asyncIterator)[_symbol["default"].asyncIterator]();
  } else if ((0, _typeof2["default"])(asyncIterator) !== 'object' || typeof asyncIterator.next !== 'function') {
    throw new Error("Expected to receive an async iterator of the form {next()}, but instead received: ".concat(asyncIterator));
  }

  return (0, _defineProperty2["default"])({}, _symbol["default"].asyncIterator, function () {
    return asyncIterator;
  });
}

module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol":15,"@babel/runtime-corejs2/core-js/symbol/iterator":16,"@babel/runtime-corejs2/helpers/asyncGeneratorDelegate":21,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/defineProperty":27,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/typeof":35,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],188:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedMap;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/promise"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _asyncGeneratorDelegate2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncGeneratorDelegate"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _asyncBatch = _interopRequireDefault(require("./async-batch"));

function map(_x, _x2, _x3) {
  return _map.apply(this, arguments);
}

function _map() {
  _map = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(concurrency, func, iterable) {
    var c, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, items, results;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            c = 0;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 3;
            _iterator = (0, _asyncIterator2["default"])((0, _asyncBatch["default"])(concurrency, iterable));

          case 5:
            _context.next = 7;
            return (0, _awaitAsyncGenerator2["default"])(_iterator.next());

          case 7:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 11;
            return (0, _awaitAsyncGenerator2["default"])(_step.value);

          case 11:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 21;
              break;
            }

            items = _value;
            _context.next = 16;
            return (0, _awaitAsyncGenerator2["default"])(_promise["default"].all(items.map(function (item) {
              return func(item, c++);
            })));

          case 16:
            results = _context.sent;
            return _context.delegateYield((0, _asyncGeneratorDelegate2["default"])((0, _asyncIterator2["default"])(results), _awaitAsyncGenerator2["default"]), "t0", 18);

          case 18:
            _iteratorNormalCompletion = true;
            _context.next = 5;
            break;

          case 21:
            _context.next = 27;
            break;

          case 23:
            _context.prev = 23;
            _context.t1 = _context["catch"](3);
            _didIteratorError = true;
            _iteratorError = _context.t1;

          case 27:
            _context.prev = 27;
            _context.prev = 28;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 32;
              break;
            }

            _context.next = 32;
            return (0, _awaitAsyncGenerator2["default"])(_iterator["return"]());

          case 32:
            _context.prev = 32;

            if (!_didIteratorError) {
              _context.next = 35;
              break;
            }

            throw _iteratorError;

          case 35:
            return _context.finish(32);

          case 36:
            return _context.finish(27);

          case 37:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3, 23, 27, 37], [28,, 32, 36]]);
  }));
  return _map.apply(this, arguments);
}

function curriedMap() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (args.length === 1) {
    return function (iterable) {
      return map(1, args[0], iterable);
    };
  } else if (args.length === 2 && typeof args[0] === 'number') {
    return function (iterable) {
      return map(args[0], args[1], iterable);
    };
  } else if (args.length === 2) {
    return map(1, args[0], args[1]);
  }

  return map(args[0], args[1], args[2]);
}

module.exports = exports["default"];
},{"./async-batch":167,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/promise":13,"@babel/runtime-corejs2/helpers/asyncGeneratorDelegate":21,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],189:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedAsyncMerge;
exports.asyncMergeByReadiness = asyncMergeByReadiness;
exports.asyncMergeByPosition = exports.asyncMergeByChance = exports.asyncMergeByComparison = void 0;

var _promise = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/promise"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncToGenerator"));

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _symbol = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

var _querablePromise = _interopRequireDefault(require("./internal/querable-promise"));

var _range = _interopRequireDefault(require("./range"));

var _merge = require("./merge");

function asyncMerge(_x, _x2) {
  return _asyncMerge.apply(this, arguments);
}

function _asyncMerge() {
  _asyncMerge = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(pickFunc, iterables) {
    var iters, numberOfExhausted, items, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, index, chosen, _ref, done, value, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, iter;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            iters = iterables.map(function (i) {
              return (0, _ensureAsyncIterable["default"])(i)[_symbol["default"].asyncIterator]();
            });
            numberOfExhausted = 0;
            items = new Array(iters.length);
            _context.prev = 3;

          case 4:
            if (!(iters.length !== numberOfExhausted)) {
              _context.next = 46;
              break;
            }

            // tries to add items to zipped wherever the index is not exhausted
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 8;

            for (_iterator = (0, _getIterator2["default"])((0, _range["default"])(iters.length)); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              index = _step.value;

              if (typeof items[index] === 'undefined') {
                items[index] = (0, _querablePromise["default"])(iters[index].next()); // promises should be quer-able
              }
            } // pick and return the item


            _context.next = 16;
            break;

          case 12:
            _context.prev = 12;
            _context.t0 = _context["catch"](8);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 16:
            _context.prev = 16;
            _context.prev = 17;

            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }

          case 19:
            _context.prev = 19;

            if (!_didIteratorError) {
              _context.next = 22;
              break;
            }

            throw _iteratorError;

          case 22:
            return _context.finish(19);

          case 23:
            return _context.finish(16);

          case 24:
            _context.next = 26;
            return (0, _awaitAsyncGenerator2["default"])(pickFunc(items));

          case 26:
            chosen = _context.sent;

            if (!(typeof items[chosen] === 'undefined')) {
              _context.next = 29;
              break;
            }

            throw new Error('async-merge: the sequence returned doesn\'t exist');

          case 29:
            if (!(items[chosen] === null)) {
              _context.next = 31;
              break;
            }

            throw new Error('async-merge: the sequence returned is exhausted');

          case 31:
            _context.next = 33;
            return (0, _awaitAsyncGenerator2["default"])(items[chosen]);

          case 33:
            _ref = _context.sent;
            done = _ref.done;
            value = _ref.value;

            if (!done) {
              _context.next = 41;
              break;
            }

            numberOfExhausted++;
            items[chosen] = null;
            _context.next = 44;
            break;

          case 41:
            _context.next = 43;
            return value;

          case 43:
            items[chosen] = undefined;

          case 44:
            _context.next = 4;
            break;

          case 46:
            _context.prev = 46;
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context.prev = 50;
            _iterator2 = (0, _getIterator2["default"])(iters);

          case 52:
            if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
              _context.next = 60;
              break;
            }

            iter = _step2.value;

            if (!(typeof iter["return"] === 'function')) {
              _context.next = 57;
              break;
            }

            _context.next = 57;
            return (0, _awaitAsyncGenerator2["default"])(iter["return"]());

          case 57:
            _iteratorNormalCompletion2 = true;
            _context.next = 52;
            break;

          case 60:
            _context.next = 66;
            break;

          case 62:
            _context.prev = 62;
            _context.t1 = _context["catch"](50);
            _didIteratorError2 = true;
            _iteratorError2 = _context.t1;

          case 66:
            _context.prev = 66;
            _context.prev = 67;

            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }

          case 69:
            _context.prev = 69;

            if (!_didIteratorError2) {
              _context.next = 72;
              break;
            }

            throw _iteratorError2;

          case 72:
            return _context.finish(69);

          case 73:
            return _context.finish(66);

          case 74:
            return _context.finish(46);

          case 75:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3,, 46, 75], [8, 12, 16, 24], [17,, 19, 23], [50, 62, 66, 74], [67,, 69, 73]]);
  }));
  return _asyncMerge.apply(this, arguments);
}

function curriedAsyncMerge(pickFunc, iterables) {
  if (arguments.length === 1) {
    return function (iterables) {
      return asyncMerge(pickFunc, iterables);
    };
  }

  return asyncMerge(pickFunc, iterables);
}

var makeAsync = function makeAsync(func) {
  return function (args) {
    var _func = func(args);

    return (
      /*#__PURE__*/
      function () {
        var _ref2 = (0, _asyncToGenerator2["default"])(
        /*#__PURE__*/
        _regenerator["default"].mark(function _callee2(promises) {
          var items;
          return _regenerator["default"].wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.next = 2;
                  return _promise["default"].all(promises);

                case 2:
                  items = _context2.sent;
                  return _context2.abrupt("return", _func(items));

                case 4:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2);
        }));

        return function (_x3) {
          return _ref2.apply(this, arguments);
        };
      }()
    );
  };
};

var asyncMergeByComparison = makeAsync(_merge.mergeByComparison);
exports.asyncMergeByComparison = asyncMergeByComparison;
var asyncMergeByChance = makeAsync(_merge.mergeByChance);
exports.asyncMergeByChance = asyncMergeByChance;
var asyncMergeByPosition = makeAsync(_merge.mergeByPosition);
exports.asyncMergeByPosition = asyncMergeByPosition;

var expire = function expire(ms) {
  return new _promise["default"](function (resolve, reject) {
    return setTimeout(function () {
      return reject(new Error('async-merge: no sequence is ready after the configured interval'));
    }, ms);
  });
};

function asyncMergeByReadiness(ms) {
  return (
    /*#__PURE__*/
    function () {
      var _asyncMergeByReadiness2 = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee3(promises) {
        var validPromises, index;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                validPromises = promises.filter(function (promise) {
                  return promise;
                }); // filter out exhausted iterables

                if (ms) {
                  validPromises.push(expire(ms));
                }

                _context3.next = 4;
                return _promise["default"].race(validPromises);

              case 4:
                index = 0;

              case 5:
                if (!(index < promises.length)) {
                  _context3.next = 13;
                  break;
                }

                if (!(promises[index] === null)) {
                  _context3.next = 8;
                  break;
                }

                return _context3.abrupt("continue", 10);

              case 8:
                if (promises[index].isPending()) {
                  _context3.next = 10;
                  break;
                }

                return _context3.abrupt("return", index);

              case 10:
                index++;
                _context3.next = 5;
                break;

              case 13:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      function _asyncMergeByReadiness(_x4) {
        return _asyncMergeByReadiness2.apply(this, arguments);
      }

      return _asyncMergeByReadiness;
    }()
  );
}
},{"./internal/ensure-async-iterable":233,"./internal/querable-promise":236,"./merge":242,"./range":247,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/promise":13,"@babel/runtime-corejs2/core-js/symbol":15,"@babel/runtime-corejs2/helpers/asyncToGenerator":23,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],190:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedPartition;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _symbol = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _dequeue = _interopRequireDefault(require("dequeue"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function partition(func, iter) {
  var satisfied = new _dequeue["default"]();
  var unsatisfied = new _dequeue["default"]();

  var iterator = (0, _ensureAsyncIterable["default"])(iter)[_symbol["default"].asyncIterator]();

  var exhausted = 0;

  function part(_x) {
    return _part.apply(this, arguments);
  }

  function _part() {
    _part = (0, _wrapAsyncGenerator2["default"])(
    /*#__PURE__*/
    _regenerator["default"].mark(function _callee(queue) {
      var _ref, value, done, chosen;

      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;

            case 1:
              if (!true) {
                _context.next = 25;
                break;
              }

            case 2:
              if (!queue.length) {
                _context.next = 7;
                break;
              }

              _context.next = 5;
              return queue.shift();

            case 5:
              _context.next = 2;
              break;

            case 7:
              _context.next = 9;
              return (0, _awaitAsyncGenerator2["default"])(iterator.next());

            case 9:
              _ref = _context.sent;
              value = _ref.value;
              done = _ref.done;

              if (!done) {
                _context.next = 14;
                break;
              }

              return _context.abrupt("break", 25);

            case 14:
              _context.next = 16;
              return (0, _awaitAsyncGenerator2["default"])(func(value));

            case 16:
              if (!_context.sent) {
                _context.next = 20;
                break;
              }

              _context.t0 = satisfied;
              _context.next = 21;
              break;

            case 20:
              _context.t0 = unsatisfied;

            case 21:
              chosen = _context.t0;
              chosen.push(value);
              _context.next = 1;
              break;

            case 25:
              _context.prev = 25;
              exhausted++;

              if (!(exhausted === 2)) {
                _context.next = 31;
                break;
              }

              if (!(typeof iterator["return"] === 'function')) {
                _context.next = 31;
                break;
              }

              _context.next = 31;
              return (0, _awaitAsyncGenerator2["default"])(iterator["return"]());

            case 31:
              return _context.finish(25);

            case 32:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[0,, 25, 32]]);
    }));
    return _part.apply(this, arguments);
  }

  return [part(satisfied), part(unsatisfied)];
}

function curriedPartition(func, iter) {
  if (typeof iter === 'undefined') {
    return function (iter) {
      return partition(func, iter);
    };
  }

  return partition(func, iter);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol":15,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37,"dequeue":162}],191:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedReduce;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _symbol = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol"));

var _iterator = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol/iterator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncToGenerator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function reduce(_x, _x2, _x3) {
  return _reduce.apply(this, arguments);
}

function _reduce() {
  _reduce = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(initial, func, iterable) {
    var c, acc, iterator, firstResult, result;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            c = 0;
            acc = initial;
            iterator = (0, _ensureAsyncIterable["default"])(iterable)[_symbol["default"].asyncIterator]();
            _context.prev = 3;

            if (!(initial === undefined)) {
              _context.next = 12;
              break;
            }

            _context.next = 7;
            return iterator.next();

          case 7:
            firstResult = _context.sent;

            if (!firstResult.done) {
              _context.next = 10;
              break;
            }

            throw new TypeError('Reduce of empty iterable with no initial value');

          case 10:
            acc = firstResult.value;
            c = 1;

          case 12:
            _context.next = 14;
            return iterator.next();

          case 14:
            if ((result = _context.sent).done) {
              _context.next = 20;
              break;
            }

            _context.next = 17;
            return func(acc, result.value, c++);

          case 17:
            acc = _context.sent;
            _context.next = 12;
            break;

          case 20:
            return _context.abrupt("return", acc);

          case 21:
            _context.prev = 21;

            if (!(typeof iterable["return"] === 'function')) {
              _context.next = 25;
              break;
            }

            _context.next = 25;
            return iterable["return"]();

          case 25:
            return _context.finish(21);

          case 26:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3,, 21, 26]]);
  }));
  return _reduce.apply(this, arguments);
}

function curriedReduce(initial, func, iterable) {
  // is this complete? has an iterable been specified? (func can never be iterable)
  //    is there an iterable that comes after func
  //    work backwards from there
  var hasIterable = false;

  if (arguments.length === 1) {
    func = initial;
    initial = undefined;
  } else if (arguments.length === 2 && (func == null || func[_iterator["default"]] || func[_symbol["default"].asyncIterator])) {
    iterable = func;
    func = initial;
    initial = undefined;
    hasIterable = true;
  } else if (arguments.length === 3) {
    hasIterable = true;
  }

  if (!hasIterable) {
    return function (iterable) {
      return reduce(initial, func, iterable);
    };
  }

  return reduce(initial, func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol":15,"@babel/runtime-corejs2/core-js/symbol/iterator":16,"@babel/runtime-corejs2/helpers/asyncToGenerator":23,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],192:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedRegexpExecIter;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _asyncGeneratorDelegate2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncGeneratorDelegate"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

var _regexpExec = _interopRequireDefault(require("./regexp-exec"));

function regexpExecIter(_x, _x2) {
  return _regexpExecIter.apply(this, arguments);
}

function _regexpExecIter() {
  _regexpExecIter = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(re, iterable) {
    var matches, buffer, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, chunk, lastIndex, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, match;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            buffer = '';
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 3;
            _iterator = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 5:
            _context.next = 7;
            return (0, _awaitAsyncGenerator2["default"])(_iterator.next());

          case 7:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 11;
            return (0, _awaitAsyncGenerator2["default"])(_step.value);

          case 11:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 54;
              break;
            }

            chunk = _value;

            if (!(chunk === '')) {
              _context.next = 16;
              break;
            }

            return _context.abrupt("continue", 51);

          case 16:
            lastIndex = 0;
            matches = [];
            buffer += chunk;
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context.prev = 22;
            _iterator2 = (0, _getIterator2["default"])((0, _regexpExec["default"])(re, buffer));

          case 24:
            if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
              _context.next = 36;
              break;
            }

            match = _step2.value;

            if (!(match[0] === '')) {
              _context.next = 28;
              break;
            }

            return _context.abrupt("continue", 33);

          case 28:
            lastIndex = re.lastIndex - match[0].length;
            matches.push(match);

            if (!(matches.length === 2)) {
              _context.next = 33;
              break;
            }

            _context.next = 33;
            return matches.shift();

          case 33:
            _iteratorNormalCompletion2 = true;
            _context.next = 24;
            break;

          case 36:
            _context.next = 42;
            break;

          case 38:
            _context.prev = 38;
            _context.t0 = _context["catch"](22);
            _didIteratorError2 = true;
            _iteratorError2 = _context.t0;

          case 42:
            _context.prev = 42;
            _context.prev = 43;

            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }

          case 45:
            _context.prev = 45;

            if (!_didIteratorError2) {
              _context.next = 48;
              break;
            }

            throw _iteratorError2;

          case 48:
            return _context.finish(45);

          case 49:
            return _context.finish(42);

          case 50:
            buffer = buffer.slice(lastIndex);

          case 51:
            _iteratorNormalCompletion = true;
            _context.next = 5;
            break;

          case 54:
            _context.next = 60;
            break;

          case 56:
            _context.prev = 56;
            _context.t1 = _context["catch"](3);
            _didIteratorError = true;
            _iteratorError = _context.t1;

          case 60:
            _context.prev = 60;
            _context.prev = 61;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 65;
              break;
            }

            _context.next = 65;
            return (0, _awaitAsyncGenerator2["default"])(_iterator["return"]());

          case 65:
            _context.prev = 65;

            if (!_didIteratorError) {
              _context.next = 68;
              break;
            }

            throw _iteratorError;

          case 68:
            return _context.finish(65);

          case 69:
            return _context.finish(60);

          case 70:
            if (!(matches && matches.length)) {
              _context.next = 72;
              break;
            }

            return _context.delegateYield((0, _asyncGeneratorDelegate2["default"])((0, _asyncIterator2["default"])(matches), _awaitAsyncGenerator2["default"]), "t2", 72);

          case 72:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3, 56, 60, 70], [22, 38, 42, 50], [43,, 45, 49], [61,, 65, 69]]);
  }));
  return _regexpExecIter.apply(this, arguments);
}

function curriedRegexpExecIter(re, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return regexpExecIter(re, iterable);
    };
  }

  return regexpExecIter(re, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"./regexp-exec":250,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncGeneratorDelegate":21,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],193:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedRegexpSplitIter;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _asyncGeneratorDelegate2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncGeneratorDelegate"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

var _regexpSplit = _interopRequireDefault(require("./regexp-split"));

function regexpSplitIter(_x, _x2) {
  return _regexpSplitIter.apply(this, arguments);
}

function _regexpSplitIter() {
  _regexpSplitIter = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(re, iterable) {
    var buffer, queue, mergeEmpty, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, chunk, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, strIter;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            buffer = '';
            mergeEmpty = false;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 4;
            _iterator = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 6:
            _context.next = 8;
            return (0, _awaitAsyncGenerator2["default"])(_iterator.next());

          case 8:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 12;
            return (0, _awaitAsyncGenerator2["default"])(_step.value);

          case 12:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 56;
              break;
            }

            chunk = _value;

            if (!(chunk === '')) {
              _context.next = 17;
              break;
            }

            return _context.abrupt("continue", 53);

          case 17:
            queue = [];
            buffer += chunk;
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context.prev = 22;
            _iterator2 = (0, _getIterator2["default"])((0, _regexpSplit["default"])(re, buffer));

          case 24:
            if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
              _context.next = 37;
              break;
            }

            strIter = _step2.value;

            if (!(mergeEmpty && strIter === '')) {
              _context.next = 29;
              break;
            }

            mergeEmpty = false;
            return _context.abrupt("continue", 34);

          case 29:
            mergeEmpty = false;
            queue.push(strIter);

            if (!(queue.length === 2)) {
              _context.next = 34;
              break;
            }

            _context.next = 34;
            return queue.shift();

          case 34:
            _iteratorNormalCompletion2 = true;
            _context.next = 24;
            break;

          case 37:
            _context.next = 43;
            break;

          case 39:
            _context.prev = 39;
            _context.t0 = _context["catch"](22);
            _didIteratorError2 = true;
            _iteratorError2 = _context.t0;

          case 43:
            _context.prev = 43;
            _context.prev = 44;

            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }

          case 46:
            _context.prev = 46;

            if (!_didIteratorError2) {
              _context.next = 49;
              break;
            }

            throw _iteratorError2;

          case 49:
            return _context.finish(46);

          case 50:
            return _context.finish(43);

          case 51:
            mergeEmpty = queue[queue.length - 1] === '';
            buffer = queue.join('');

          case 53:
            _iteratorNormalCompletion = true;
            _context.next = 6;
            break;

          case 56:
            _context.next = 62;
            break;

          case 58:
            _context.prev = 58;
            _context.t1 = _context["catch"](4);
            _didIteratorError = true;
            _iteratorError = _context.t1;

          case 62:
            _context.prev = 62;
            _context.prev = 63;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 67;
              break;
            }

            _context.next = 67;
            return (0, _awaitAsyncGenerator2["default"])(_iterator["return"]());

          case 67:
            _context.prev = 67;

            if (!_didIteratorError) {
              _context.next = 70;
              break;
            }

            throw _iteratorError;

          case 70:
            return _context.finish(67);

          case 71:
            return _context.finish(62);

          case 72:
            if (!(queue && queue.length)) {
              _context.next = 74;
              break;
            }

            return _context.delegateYield((0, _asyncGeneratorDelegate2["default"])((0, _asyncIterator2["default"])(queue), _awaitAsyncGenerator2["default"]), "t2", 74);

          case 74:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[4, 58, 62, 72], [22, 39, 43, 51], [44,, 46, 50], [63,, 67, 71]]);
  }));
  return _regexpSplitIter.apply(this, arguments);
}

function curriedRegexpSplitIter(re, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return regexpSplitIter(re, iterable);
    };
  }

  return regexpSplitIter(re, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"./regexp-split":252,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncGeneratorDelegate":21,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],194:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = size;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncToGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function size(_x) {
  return _size.apply(this, arguments);
}

function _size() {
  _size = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(iterable) {
    var size, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, _;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            size = 0; // eslint-disable-next-line

            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 3;
            _iterator = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 5:
            _context.next = 7;
            return _iterator.next();

          case 7:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 11;
            return _step.value;

          case 11:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 18;
              break;
            }

            _ = _value;
            size++;

          case 15:
            _iteratorNormalCompletion = true;
            _context.next = 5;
            break;

          case 18:
            _context.next = 24;
            break;

          case 20:
            _context.prev = 20;
            _context.t0 = _context["catch"](3);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 24:
            _context.prev = 24;
            _context.prev = 25;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 29;
              break;
            }

            _context.next = 29;
            return _iterator["return"]();

          case 29:
            _context.prev = 29;

            if (!_didIteratorError) {
              _context.next = 32;
              break;
            }

            throw _iteratorError;

          case 32:
            return _context.finish(29);

          case 33:
            return _context.finish(24);

          case 34:
            return _context.abrupt("return", size);

          case 35:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3, 20, 24, 34], [25,, 29, 33]]);
  }));
  return _size.apply(this, arguments);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/asyncToGenerator":23,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],195:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedSlice;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncToGenerator"));

var _asyncGeneratorDelegate2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncGeneratorDelegate"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _circularBuffer = _interopRequireDefault(require("./internal/circular-buffer"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function bufferedSlice(_x7, _x8, _x9, _x10) {
  return _bufferedSlice.apply(this, arguments);
}

function _bufferedSlice() {
  _bufferedSlice = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee3(iterable, start, end, step) {
    var bufferSize, buffer, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, item, newEnd;

    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            bufferSize = Math.abs(start);
            buffer = new _circularBuffer["default"](bufferSize);
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context3.prev = 4;
            _iterator = (0, _asyncIterator2["default"])(iterable);

          case 6:
            _context3.next = 8;
            return _iterator.next();

          case 8:
            _step = _context3.sent;
            _iteratorNormalCompletion = _step.done;
            _context3.next = 12;
            return _step.value;

          case 12:
            _value = _context3.sent;

            if (_iteratorNormalCompletion) {
              _context3.next = 19;
              break;
            }

            item = _value;
            buffer.push(item);

          case 16:
            _iteratorNormalCompletion = true;
            _context3.next = 6;
            break;

          case 19:
            _context3.next = 25;
            break;

          case 21:
            _context3.prev = 21;
            _context3.t0 = _context3["catch"](4);
            _didIteratorError = true;
            _iteratorError = _context3.t0;

          case 25:
            _context3.prev = 25;
            _context3.prev = 26;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context3.next = 30;
              break;
            }

            _context3.next = 30;
            return _iterator["return"]();

          case 30:
            _context3.prev = 30;

            if (!_didIteratorError) {
              _context3.next = 33;
              break;
            }

            throw _iteratorError;

          case 33:
            return _context3.finish(30);

          case 34:
            return _context3.finish(25);

          case 35:
            if (!(isFinite(end) && end > 0)) {
              _context3.next = 41;
              break;
            }

            newEnd = end - (buffer.counter - bufferSize);

            if (!(newEnd < 0)) {
              _context3.next = 39;
              break;
            }

            return _context3.abrupt("return", []);

          case 39:
            _context3.next = 42;
            break;

          case 41:
            newEnd = end;

          case 42:
            return _context3.abrupt("return", simpleSlice(buffer, 0, newEnd, step));

          case 43:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[4, 21, 25, 35], [26,, 30, 34]]);
  }));
  return _bufferedSlice.apply(this, arguments);
}

function simpleSlice(_x, _x2, _x3, _x4) {
  return _simpleSlice.apply(this, arguments);
}

function _simpleSlice() {
  _simpleSlice = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(iterable, start, end, step) {
    var currentPos, nextValidPos, bufferSize, buffer, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _value2, item;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            currentPos = 0;
            nextValidPos = start;
            bufferSize = Math.abs(end);

            if (end < 0) {
              buffer = new _circularBuffer["default"](bufferSize);
            }

            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _context.prev = 6;
            _iterator2 = (0, _asyncIterator2["default"])(iterable);

          case 8:
            _context.next = 10;
            return (0, _awaitAsyncGenerator2["default"])(_iterator2.next());

          case 10:
            _step2 = _context.sent;
            _iteratorNormalCompletion2 = _step2.done;
            _context.next = 14;
            return (0, _awaitAsyncGenerator2["default"])(_step2.value);

          case 14:
            _value2 = _context.sent;

            if (_iteratorNormalCompletion2) {
              _context.next = 31;
              break;
            }

            item = _value2;

            if (!buffer) {
              _context.next = 21;
              break;
            }

            item = buffer.push(item);

            if (!(buffer.counter <= bufferSize)) {
              _context.next = 21;
              break;
            }

            return _context.abrupt("continue", 28);

          case 21:
            if (!(currentPos >= end && end >= 0)) {
              _context.next = 23;
              break;
            }

            return _context.abrupt("break", 31);

          case 23:
            if (!(nextValidPos === currentPos)) {
              _context.next = 27;
              break;
            }

            _context.next = 26;
            return item;

          case 26:
            nextValidPos += step;

          case 27:
            currentPos++;

          case 28:
            _iteratorNormalCompletion2 = true;
            _context.next = 8;
            break;

          case 31:
            _context.next = 37;
            break;

          case 33:
            _context.prev = 33;
            _context.t0 = _context["catch"](6);
            _didIteratorError2 = true;
            _iteratorError2 = _context.t0;

          case 37:
            _context.prev = 37;
            _context.prev = 38;

            if (!(!_iteratorNormalCompletion2 && _iterator2["return"] != null)) {
              _context.next = 42;
              break;
            }

            _context.next = 42;
            return (0, _awaitAsyncGenerator2["default"])(_iterator2["return"]());

          case 42:
            _context.prev = 42;

            if (!_didIteratorError2) {
              _context.next = 45;
              break;
            }

            throw _iteratorError2;

          case 45:
            return _context.finish(42);

          case 46:
            return _context.finish(37);

          case 47:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[6, 33, 37, 47], [38,, 42, 46]]);
  }));
  return _simpleSlice.apply(this, arguments);
}

function slice(_x5, _x6) {
  return _slice.apply(this, arguments);
}

function _slice() {
  _slice = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee2(opts, iterable) {
    var start, step, end;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            opts = typeof opts === 'number' ? {
              end: opts,
              start: 0
            } : opts;
            step = typeof opts.step === 'undefined' ? 1 : opts.step;
            end = typeof opts.end === 'undefined' ? Infinity : opts.end;
            start = opts.start ? opts.start : 0;
            iterable = (0, _ensureAsyncIterable["default"])(iterable);

            if (!(step <= 0)) {
              _context2.next = 7;
              break;
            }

            throw new TypeError('Cannot slice with step <= 0');

          case 7:
            if (!(start >= 0)) {
              _context2.next = 11;
              break;
            }

            return _context2.delegateYield((0, _asyncGeneratorDelegate2["default"])((0, _asyncIterator2["default"])(simpleSlice(iterable, start, end, step)), _awaitAsyncGenerator2["default"]), "t0", 9);

          case 9:
            _context2.next = 19;
            break;

          case 11:
            _context2.t1 = _asyncGeneratorDelegate2["default"];
            _context2.t2 = _asyncIterator2["default"];
            _context2.next = 15;
            return (0, _awaitAsyncGenerator2["default"])(bufferedSlice(iterable, start, end, step));

          case 15:
            _context2.t3 = _context2.sent;
            _context2.t4 = (0, _context2.t2)(_context2.t3);
            _context2.t5 = _awaitAsyncGenerator2["default"];
            return _context2.delegateYield((0, _context2.t1)(_context2.t4, _context2.t5), "t6", 19);

          case 19:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _slice.apply(this, arguments);
}

function curriedSlice(opts, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return slice(opts, iterable);
    };
  }

  return slice(opts, iterable);
}

module.exports = exports["default"];
},{"./internal/circular-buffer":230,"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncGeneratorDelegate":21,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/asyncToGenerator":23,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],196:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedSome;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncToGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function some(_x, _x2) {
  return _some.apply(this, arguments);
}

function _some() {
  _some = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(func, iterable) {
    var c, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, item;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            c = 0;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 3;
            _iterator = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 5:
            _context.next = 7;
            return _iterator.next();

          case 7:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 11;
            return _step.value;

          case 11:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 21;
              break;
            }

            item = _value;
            _context.next = 16;
            return func(item, c++);

          case 16:
            if (!_context.sent) {
              _context.next = 18;
              break;
            }

            return _context.abrupt("return", true);

          case 18:
            _iteratorNormalCompletion = true;
            _context.next = 5;
            break;

          case 21:
            _context.next = 27;
            break;

          case 23:
            _context.prev = 23;
            _context.t0 = _context["catch"](3);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 27:
            _context.prev = 27;
            _context.prev = 28;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 32;
              break;
            }

            _context.next = 32;
            return _iterator["return"]();

          case 32:
            _context.prev = 32;

            if (!_didIteratorError) {
              _context.next = 35;
              break;
            }

            throw _iteratorError;

          case 35:
            return _context.finish(32);

          case 36:
            return _context.finish(27);

          case 37:
            return _context.abrupt("return", false);

          case 38:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3, 23, 27, 37], [28,, 32, 36]]);
  }));
  return _some.apply(this, arguments);
}

function curriedSome(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return some(func, iterable);
    };
  }

  return some(func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/asyncToGenerator":23,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],197:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _asyncRegexpSplitIter = _interopRequireDefault(require("./async-regexp-split-iter"));

var _default = (0, _asyncRegexpSplitIter["default"])(/(\r\n|[\n\v\f\r\x85\u2028\u2029])/g);

exports["default"] = _default;
module.exports = exports["default"];
},{"./async-regexp-split-iter":193,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],198:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedAsyncTakeSorted;

var _iterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol/iterator"));

var _symbol = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol"));

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _heap = _interopRequireDefault(require("little-ds-toolkit/lib/heap"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function asyncTakeSorted(_x, _x2, _x3) {
  return _asyncTakeSorted.apply(this, arguments);
}

function _asyncTakeSorted() {
  _asyncTakeSorted = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(number, comparator, iterable) {
    var heap, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, item, len, i;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            heap = new _heap["default"](comparator);
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 3;
            _iterator = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 5:
            _context.next = 7;
            return (0, _awaitAsyncGenerator2["default"])(_iterator.next());

          case 7:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 11;
            return (0, _awaitAsyncGenerator2["default"])(_step.value);

          case 11:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 19;
              break;
            }

            item = _value;
            heap.push(item);

            if (heap.size() > number) {
              heap.pop();
            }

          case 16:
            _iteratorNormalCompletion = true;
            _context.next = 5;
            break;

          case 19:
            _context.next = 25;
            break;

          case 21:
            _context.prev = 21;
            _context.t0 = _context["catch"](3);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 25:
            _context.prev = 25;
            _context.prev = 26;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 30;
              break;
            }

            _context.next = 30;
            return (0, _awaitAsyncGenerator2["default"])(_iterator["return"]());

          case 30:
            _context.prev = 30;

            if (!_didIteratorError) {
              _context.next = 33;
              break;
            }

            throw _iteratorError;

          case 33:
            return _context.finish(30);

          case 34:
            return _context.finish(25);

          case 35:
            len = heap.size();
            i = 0;

          case 37:
            if (!(i < len)) {
              _context.next = 43;
              break;
            }

            _context.next = 40;
            return heap.pop();

          case 40:
            i++;
            _context.next = 37;
            break;

          case 43:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3, 21, 25, 35], [26,, 30, 34]]);
  }));
  return _asyncTakeSorted.apply(this, arguments);
}

function curriedAsyncTakeSorted(number, comparator, iterable) {
  if (arguments.length === 2) {
    if (comparator[_symbol["default"].asyncIterator] || comparator[_iterator2["default"]]) {
      return asyncTakeSorted(number, undefined, comparator);
    } else {
      return function (iterable) {
        return asyncTakeSorted(number, comparator, iterable);
      };
    }
  } else if (arguments.length === 1) {
    return function (iterable) {
      return asyncTakeSorted(number, undefined, iterable);
    };
  }

  return asyncTakeSorted(number, comparator, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol":15,"@babel/runtime-corejs2/core-js/symbol/iterator":16,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37,"little-ds-toolkit/lib/heap":267}],199:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedTakeWhile;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function takeWhile(_x, _x2) {
  return _takeWhile.apply(this, arguments);
}

function _takeWhile() {
  _takeWhile = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(func, iterable) {
    var take, c, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, item;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            take = true;
            c = 0;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 4;
            _iterator = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 6:
            _context.next = 8;
            return (0, _awaitAsyncGenerator2["default"])(_iterator.next());

          case 8:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 12;
            return (0, _awaitAsyncGenerator2["default"])(_step.value);

          case 12:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 27;
              break;
            }

            item = _value;
            _context.next = 17;
            return (0, _awaitAsyncGenerator2["default"])(func(item, c++));

          case 17:
            take = _context.sent;

            if (!take) {
              _context.next = 23;
              break;
            }

            _context.next = 21;
            return item;

          case 21:
            _context.next = 24;
            break;

          case 23:
            return _context.abrupt("break", 27);

          case 24:
            _iteratorNormalCompletion = true;
            _context.next = 6;
            break;

          case 27:
            _context.next = 33;
            break;

          case 29:
            _context.prev = 29;
            _context.t0 = _context["catch"](4);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 33:
            _context.prev = 33;
            _context.prev = 34;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 38;
              break;
            }

            _context.next = 38;
            return (0, _awaitAsyncGenerator2["default"])(_iterator["return"]());

          case 38:
            _context.prev = 38;

            if (!_didIteratorError) {
              _context.next = 41;
              break;
            }

            throw _iteratorError;

          case 41:
            return _context.finish(38);

          case 42:
            return _context.finish(33);

          case 43:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[4, 29, 33, 43], [34,, 38, 42]]);
  }));
  return _takeWhile.apply(this, arguments);
}

function curriedTakeWhile(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return takeWhile(func, iterable);
    };
  }

  return takeWhile(func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],200:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedTap;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function tap(_x, _x2) {
  return _tap.apply(this, arguments);
}

function _tap() {
  _tap = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(func, iterable) {
    var c, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, item;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            c = 0;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 3;
            _iterator = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 5:
            _context.next = 7;
            return (0, _awaitAsyncGenerator2["default"])(_iterator.next());

          case 7:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 11;
            return (0, _awaitAsyncGenerator2["default"])(_step.value);

          case 11:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 21;
              break;
            }

            item = _value;
            _context.next = 16;
            return (0, _awaitAsyncGenerator2["default"])(func(item, c++));

          case 16:
            _context.next = 18;
            return item;

          case 18:
            _iteratorNormalCompletion = true;
            _context.next = 5;
            break;

          case 21:
            _context.next = 27;
            break;

          case 23:
            _context.prev = 23;
            _context.t0 = _context["catch"](3);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 27:
            _context.prev = 27;
            _context.prev = 28;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 32;
              break;
            }

            _context.next = 32;
            return (0, _awaitAsyncGenerator2["default"])(_iterator["return"]());

          case 32:
            _context.prev = 32;

            if (!_didIteratorError) {
              _context.next = 35;
              break;
            }

            throw _iteratorError;

          case 35:
            return _context.finish(32);

          case 36:
            return _context.finish(27);

          case 37:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3, 23, 27, 37], [28,, 32, 36]]);
  }));
  return _tap.apply(this, arguments);
}

function curriedTap(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return tap(func, iterable);
    };
  }

  return tap(func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],201:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = tee;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/promise"));

var _from = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/array/from"));

var _symbol = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _range = _interopRequireDefault(require("./range"));

var _map = _interopRequireDefault(require("./map"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

var _dequeue = _interopRequireDefault(require("dequeue"));

function tee(iterable, number) {
  number = number || 2;

  var iterator = (0, _ensureAsyncIterable["default"])(iterable)[_symbol["default"].asyncIterator]();

  var exhausted = 0;
  var arrays = (0, _from["default"])((0, _map["default"])(function () {
    return new _dequeue["default"]();
  }, (0, _range["default"])(number)));
  var done = false;

  function fetch() {
    return new _promise["default"](function (resolve, reject) {
      iterator.next().then(function (newItem) {
        if (newItem.done) {
          done = true;
          return resolve();
        } else {
          arrays.forEach(function (ar) {
            return ar.push(newItem.value);
          });
          return resolve();
        }
      })["catch"](function (err) {
        return reject(err);
      });
    });
  }

  function teeGen(_x) {
    return _teeGen.apply(this, arguments);
  }

  function _teeGen() {
    _teeGen = (0, _wrapAsyncGenerator2["default"])(
    /*#__PURE__*/
    _regenerator["default"].mark(function _callee(a) {
      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;

            case 1:
              if (!true) {
                _context.next = 15;
                break;
              }

              if (!a.length) {
                _context.next = 7;
                break;
              }

              _context.next = 5;
              return a.shift();

            case 5:
              _context.next = 13;
              break;

            case 7:
              if (!done) {
                _context.next = 11;
                break;
              }

              return _context.abrupt("return");

            case 11:
              _context.next = 13;
              return (0, _awaitAsyncGenerator2["default"])(fetch());

            case 13:
              _context.next = 1;
              break;

            case 15:
              _context.prev = 15;
              exhausted++;

              if (!(exhausted === number)) {
                _context.next = 21;
                break;
              }

              if (!(typeof iterator["return"] === 'function')) {
                _context.next = 21;
                break;
              }

              _context.next = 21;
              return (0, _awaitAsyncGenerator2["default"])(iterator["return"]());

            case 21:
              return _context.finish(15);

            case 22:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[0,, 15, 22]]);
    }));
    return _teeGen.apply(this, arguments);
  }

  return arrays.map(function (a) {
    return teeGen(a);
  });
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"./map":241,"./range":247,"@babel/runtime-corejs2/core-js/array/from":4,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/promise":13,"@babel/runtime-corejs2/core-js/symbol":15,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37,"dequeue":162}],202:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedAsyncThrottle;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _now = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/date/now"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

var _delay = _interopRequireDefault(require("./internal/delay"));

function asyncThrottle(_x, _x2) {
  return _asyncThrottle.apply(this, arguments);
}

function _asyncThrottle() {
  _asyncThrottle = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(ms, iterable) {
    var waitSince, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, item;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            waitSince = 0;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 3;
            _iterator = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 5:
            _context.next = 7;
            return (0, _awaitAsyncGenerator2["default"])(_iterator.next());

          case 7:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 11;
            return (0, _awaitAsyncGenerator2["default"])(_step.value);

          case 11:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 22;
              break;
            }

            item = _value;
            _context.next = 16;
            return (0, _awaitAsyncGenerator2["default"])((0, _delay["default"])(ms - ((0, _now["default"])() - waitSince)));

          case 16:
            waitSince = (0, _now["default"])();
            _context.next = 19;
            return item;

          case 19:
            _iteratorNormalCompletion = true;
            _context.next = 5;
            break;

          case 22:
            _context.next = 28;
            break;

          case 24:
            _context.prev = 24;
            _context.t0 = _context["catch"](3);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 28:
            _context.prev = 28;
            _context.prev = 29;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 33;
              break;
            }

            _context.next = 33;
            return (0, _awaitAsyncGenerator2["default"])(_iterator["return"]());

          case 33:
            _context.prev = 33;

            if (!_didIteratorError) {
              _context.next = 36;
              break;
            }

            throw _iteratorError;

          case 36:
            return _context.finish(33);

          case 37:
            return _context.finish(28);

          case 38:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3, 24, 28, 38], [29,, 33, 37]]);
  }));
  return _asyncThrottle.apply(this, arguments);
}

function curriedAsyncThrottle(ms, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return asyncThrottle(ms, iterable);
    };
  }

  return asyncThrottle(ms, iterable);
}

module.exports = exports["default"];
},{"./internal/delay":232,"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/date/now":6,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],203:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = asyncToArray;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncToGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function asyncToArray(_x) {
  return _asyncToArray.apply(this, arguments);
}

function _asyncToArray() {
  _asyncToArray = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(iterable) {
    var out, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, item;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            out = [];
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 3;
            _iterator = (0, _asyncIterator2["default"])((0, _ensureAsyncIterable["default"])(iterable));

          case 5:
            _context.next = 7;
            return _iterator.next();

          case 7:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 11;
            return _step.value;

          case 11:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 18;
              break;
            }

            item = _value;
            out.push(item);

          case 15:
            _iteratorNormalCompletion = true;
            _context.next = 5;
            break;

          case 18:
            _context.next = 24;
            break;

          case 20:
            _context.prev = 20;
            _context.t0 = _context["catch"](3);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 24:
            _context.prev = 24;
            _context.prev = 25;

            if (!(!_iteratorNormalCompletion && _iterator["return"] != null)) {
              _context.next = 29;
              break;
            }

            _context.next = 29;
            return _iterator["return"]();

          case 29:
            _context.prev = 29;

            if (!_didIteratorError) {
              _context.next = 32;
              break;
            }

            throw _iteratorError;

          case 32:
            return _context.finish(29);

          case 33:
            return _context.finish(24);

          case 34:
            return _context.abrupt("return", out);

          case 35:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[3, 20, 24, 34], [25,, 29, 33]]);
  }));
  return _asyncToArray.apply(this, arguments);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/asyncToGenerator":23,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],204:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _asyncZipLongest = _interopRequireDefault(require("./async-zip-longest"));

var _default = _asyncZipLongest["default"];
exports["default"] = _default;
module.exports = exports["default"];
},{"./async-zip-longest":205,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],205:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = zipLongest;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/promise"));

var _symbol = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

function zipLongest() {
  return _zipLongest.apply(this, arguments);
}

function _zipLongest() {
  _zipLongest = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee() {
    var _len,
        iterables,
        _key,
        iters,
        results,
        done,
        iter,
        _args = arguments;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            for (_len = _args.length, iterables = new Array(_len), _key = 0; _key < _len; _key++) {
              iterables[_key] = _args[_key];
            }

            iters = iterables.map(function (arg) {
              return (0, _ensureAsyncIterable["default"])(arg)[_symbol["default"].asyncIterator]();
            });
            _context.prev = 2;

          case 3:
            if (!true) {
              _context.next = 14;
              break;
            }

            _context.next = 6;
            return (0, _awaitAsyncGenerator2["default"])(_promise["default"].all(iters.map(function (iter) {
              return iter.next();
            })));

          case 6:
            results = _context.sent;
            done = results.every(function (r) {
              return r.done;
            });

            if (!done) {
              _context.next = 10;
              break;
            }

            return _context.abrupt("return");

          case 10:
            _context.next = 12;
            return results.map(function (r) {
              return r.done ? undefined : r.value;
            });

          case 12:
            _context.next = 3;
            break;

          case 14:
            _context.prev = 14;
            _context.t0 = _regenerator["default"].keys(iters);

          case 16:
            if ((_context.t1 = _context.t0()).done) {
              _context.next = 23;
              break;
            }

            iter = _context.t1.value;

            if (!(typeof iter["return"] === 'function')) {
              _context.next = 21;
              break;
            }

            _context.next = 21;
            return (0, _awaitAsyncGenerator2["default"])(iter["return"]());

          case 21:
            _context.next = 16;
            break;

          case 23:
            return _context.finish(14);

          case 24:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[2,, 14, 24]]);
  }));
  return _zipLongest.apply(this, arguments);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/promise":13,"@babel/runtime-corejs2/core-js/symbol":15,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],206:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = zip;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/promise"));

var _symbol = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _ensureAsyncIterable = _interopRequireDefault(require("./internal/ensure-async-iterable"));

var _map = _interopRequireDefault(require("./map"));

function zip() {
  return _zip.apply(this, arguments);
}

function _zip() {
  _zip = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee() {
    var _len,
        iterables,
        _key,
        iters,
        results,
        done,
        c,
        iter,
        _iter,
        _args = arguments;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            for (_len = _args.length, iterables = new Array(_len), _key = 0; _key < _len; _key++) {
              iterables[_key] = _args[_key];
            }

            iters = iterables.map(function (arg) {
              return (0, _ensureAsyncIterable["default"])(arg)[_symbol["default"].asyncIterator]();
            });
            _context.prev = 2;

          case 3:
            if (!true) {
              _context.next = 27;
              break;
            }

            _context.next = 6;
            return (0, _awaitAsyncGenerator2["default"])(_promise["default"].all((0, _map["default"])(function (iter) {
              return iter.next();
            }, iters)));

          case 6:
            results = _context.sent;
            done = results.some(function (r) {
              return r.done;
            });

            if (!done) {
              _context.next = 23;
              break;
            }

            c = 0; // clean up unfinished iterators

            _context.t0 = _regenerator["default"].keys(iters);

          case 11:
            if ((_context.t1 = _context.t0()).done) {
              _context.next = 22;
              break;
            }

            iter = _context.t1.value;

            if (!results[c].done) {
              _context.next = 16;
              break;
            }

            c++;
            return _context.abrupt("continue", 11);

          case 16:
            if (!(typeof iter["return"] === 'function')) {
              _context.next = 19;
              break;
            }

            _context.next = 19;
            return (0, _awaitAsyncGenerator2["default"])(iter["return"]());

          case 19:
            c++;
            _context.next = 11;
            break;

          case 22:
            return _context.abrupt("return");

          case 23:
            _context.next = 25;
            return results.map(function (r) {
              return r.value;
            });

          case 25:
            _context.next = 3;
            break;

          case 27:
            _context.prev = 27;
            _context.t2 = _regenerator["default"].keys(iters);

          case 29:
            if ((_context.t3 = _context.t2()).done) {
              _context.next = 36;
              break;
            }

            _iter = _context.t3.value;

            if (!(typeof _iter["return"] === 'function')) {
              _context.next = 34;
              break;
            }

            _context.next = 34;
            return (0, _awaitAsyncGenerator2["default"])(_iter["return"]());

          case 34:
            _context.next = 29;
            break;

          case 36:
            return _context.finish(27);

          case 37:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[2,, 27, 37]]);
  }));
  return _zip.apply(this, arguments);
}

module.exports = exports["default"];
},{"./internal/ensure-async-iterable":233,"./map":241,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/promise":13,"@babel/runtime-corejs2/core-js/symbol":15,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],207:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedBatch;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(batch);

function batch(number, iterable) {
  var batch, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item;

  return _regenerator["default"].wrap(function batch$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          batch = [];
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 4;
          _iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable));

        case 6:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 16;
            break;
          }

          item = _step.value;
          batch.push(item);

          if (!(batch.length === number)) {
            _context.next = 13;
            break;
          }

          _context.next = 12;
          return batch;

        case 12:
          batch = [];

        case 13:
          _iteratorNormalCompletion = true;
          _context.next = 6;
          break;

        case 16:
          _context.next = 22;
          break;

        case 18:
          _context.prev = 18;
          _context.t0 = _context["catch"](4);
          _didIteratorError = true;
          _iteratorError = _context.t0;

        case 22:
          _context.prev = 22;
          _context.prev = 23;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 25:
          _context.prev = 25;

          if (!_didIteratorError) {
            _context.next = 28;
            break;
          }

          throw _iteratorError;

        case 28:
          return _context.finish(25);

        case 29:
          return _context.finish(22);

        case 30:
          if (!batch.length) {
            _context.next = 33;
            break;
          }

          _context.next = 33;
          return batch;

        case 33:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[4, 18, 22, 30], [23,, 25, 29]]);
}

function curriedBatch(number, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return batch(number, iterable);
    };
  }

  return batch(number, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],208:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = chain;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(chain);

function chain() {
  var _len,
      arrayOfIter,
      _key,
      _i,
      _arrayOfIter,
      iterable,
      _args = arguments;

  return _regenerator["default"].wrap(function chain$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          for (_len = _args.length, arrayOfIter = new Array(_len), _key = 0; _key < _len; _key++) {
            arrayOfIter[_key] = _args[_key];
          }

          _i = 0, _arrayOfIter = arrayOfIter;

        case 2:
          if (!(_i < _arrayOfIter.length)) {
            _context.next = 8;
            break;
          }

          iterable = _arrayOfIter[_i];
          return _context.delegateYield((0, _ensureIterable["default"])(iterable), "t0", 5);

        case 5:
          _i++;
          _context.next = 2;
          break;

        case 8:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],209:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = combinationsWithReplacement;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/defineProperty"));

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/toConsumableArray"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _iterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol/iterator"));

var _from = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/array/from"));

var _map = _interopRequireDefault(require("./map"));

var _range = _interopRequireDefault(require("./range"));

var _product = _interopRequireDefault(require("./product"));

var _tee = _interopRequireDefault(require("./tee"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _math = require("./internal/math");

function isSorted(arr) {
  if (arr.length < 2) return true;

  for (var i = 1; i < arr.length; i++) {
    if (arr[i - 1] > arr[i]) {
      return false;
    }
  }

  return true;
}

function combinationsWithReplacement(iterable, r) {
  var _ref;

  var arr = (0, _from["default"])((0, _ensureIterable["default"])(iterable));
  var len = arr.length;
  r = typeof r === 'undefined' ? len : r;
  return _ref = {}, (0, _defineProperty2["default"])(_ref, _iterator2["default"],
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee() {
    var mapToIndex, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, indices;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            mapToIndex = (0, _map["default"])(function (i) {
              return arr[i];
            });
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 4;
            _iterator = (0, _getIterator2["default"])(_product["default"].apply(void 0, (0, _toConsumableArray2["default"])((0, _tee["default"])((0, _range["default"])(len), r))));

          case 6:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context.next = 14;
              break;
            }

            indices = _step.value;

            if (!isSorted(indices)) {
              _context.next = 11;
              break;
            }

            _context.next = 11;
            return (0, _from["default"])(mapToIndex(indices));

          case 11:
            _iteratorNormalCompletion = true;
            _context.next = 6;
            break;

          case 14:
            _context.next = 20;
            break;

          case 16:
            _context.prev = 16;
            _context.t0 = _context["catch"](4);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 20:
            _context.prev = 20;
            _context.prev = 21;

            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }

          case 23:
            _context.prev = 23;

            if (!_didIteratorError) {
              _context.next = 26;
              break;
            }

            throw _iteratorError;

          case 26:
            return _context.finish(23);

          case 27:
            return _context.finish(20);

          case 28:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[4, 16, 20, 28], [21,, 23, 27]]);
  })), (0, _defineProperty2["default"])(_ref, "getSize", function getSize() {
    return (0, _math.combinationsWithReplacementSize)(len, r);
  }), _ref;
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"./internal/math":235,"./map":241,"./product":246,"./range":247,"./tee":261,"@babel/runtime-corejs2/core-js/array/from":4,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol/iterator":16,"@babel/runtime-corejs2/helpers/defineProperty":27,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/toConsumableArray":34,"@babel/runtime-corejs2/regenerator":37}],210:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = combinations;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/defineProperty"));

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _iterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol/iterator"));

var _from = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/array/from"));

var _map = _interopRequireDefault(require("./map"));

var _range = _interopRequireDefault(require("./range"));

var _permutations = _interopRequireDefault(require("./permutations"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _math = require("./internal/math");

function isSorted(arr) {
  if (arr.length < 2) return true;

  for (var i = 1; i < arr.length; i++) {
    if (arr[i - 1] > arr[i]) {
      return false;
    }
  }

  return true;
}

function combinations(iterable, r) {
  var _ref;

  var arr = (0, _from["default"])((0, _ensureIterable["default"])(iterable));
  var len = arr.length;
  r = typeof r === 'undefined' ? len : r;
  return _ref = {}, (0, _defineProperty2["default"])(_ref, _iterator2["default"],
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee() {
    var mapToIndex, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, indices;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            mapToIndex = (0, _map["default"])(function (i) {
              return arr[i];
            });
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 4;
            _iterator = (0, _getIterator2["default"])((0, _permutations["default"])((0, _range["default"])(len), r));

          case 6:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context.next = 14;
              break;
            }

            indices = _step.value;

            if (!isSorted(indices)) {
              _context.next = 11;
              break;
            }

            _context.next = 11;
            return (0, _from["default"])(mapToIndex(indices));

          case 11:
            _iteratorNormalCompletion = true;
            _context.next = 6;
            break;

          case 14:
            _context.next = 20;
            break;

          case 16:
            _context.prev = 16;
            _context.t0 = _context["catch"](4);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 20:
            _context.prev = 20;
            _context.prev = 21;

            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }

          case 23:
            _context.prev = 23;

            if (!_didIteratorError) {
              _context.next = 26;
              break;
            }

            throw _iteratorError;

          case 26:
            return _context.finish(23);

          case 27:
            return _context.finish(20);

          case 28:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[4, 16, 20, 28], [21,, 23, 27]]);
  })), (0, _defineProperty2["default"])(_ref, "getSize", function getSize() {
    return (0, _math.combinationsSize)(len, r);
  }), _ref;
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"./internal/math":235,"./map":241,"./permutations":244,"./range":247,"@babel/runtime-corejs2/core-js/array/from":4,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol/iterator":16,"@babel/runtime-corejs2/helpers/defineProperty":27,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],211:[function(require,module,exports){
"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = compose;

function compose() {
  for (var _len = arguments.length, fns = new Array(_len), _key = 0; _key < _len; _key++) {
    fns[_key] = arguments[_key];
  }

  return fns.reduce(function (f, g) {
    return function () {
      return f(g.apply(void 0, arguments));
    };
  });
}

module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/object/define-property":10}],212:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = compress;

var _compose = _interopRequireDefault(require("./compose"));

var _zip = _interopRequireDefault(require("./zip"));

var _filter = _interopRequireDefault(require("./filter"));

var _map = _interopRequireDefault(require("./map"));

function compress() {
  return (0, _compose["default"])((0, _map["default"])(function (entry) {
    return entry[0];
  }), (0, _filter["default"])(function (entry) {
    return entry[1];
  }), function (iterable, compress) {
    return (0, _zip["default"])(iterable, compress);
  }).apply(void 0, arguments);
}

module.exports = exports["default"];
},{"./compose":211,"./filter":223,"./map":241,"./zip":266,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],213:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _chain = _interopRequireDefault(require("./chain"));

var _default = _chain["default"];
exports["default"] = _default;
module.exports = exports["default"];
},{"./chain":208,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],214:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = consume;

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

function consume(func, iterable) {
  if (!iterable) {
    return function (iterable) {
      return consume(func, iterable);
    };
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var item = _step.value;
      func(item);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],215:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

_Object$defineProperty(exports, "default", {
  enumerable: true,
  get: function get() {
    return _range["default"];
  }
});

var _range = _interopRequireDefault(require("./range"));

module.exports = exports["default"];
},{"./range":247,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],216:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedCursor;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _from = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/array/from"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _chain = _interopRequireDefault(require("./chain"));

var _repeat = _interopRequireDefault(require("./repeat"));

var _circularBuffer = _interopRequireDefault(require("./internal/circular-buffer"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(cursor);

function cursor(_ref, iterable) {
  var size, trailing, filler, circular, index, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _item;

  return _regenerator["default"].wrap(function cursor$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          size = _ref.size, trailing = _ref.trailing, filler = _ref.filler;
          circular = new _circularBuffer["default"](size);

          if (typeof filler !== 'undefined') {
            circular.array.fill(filler);
          }

          if (!trailing) {
            _context.next = 36;
            break;
          }

          index = 0;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 8;
          _iterator = (0, _getIterator2["default"])((0, _chain["default"])(iterable, (0, _repeat["default"])(filler, size - 1)));

        case 10:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 20;
            break;
          }

          item = _step.value;
          circular.push(item);

          if (!(index + 1 >= size)) {
            _context.next = 16;
            break;
          }

          _context.next = 16;
          return (0, _from["default"])(circular);

        case 16:
          index++;

        case 17:
          _iteratorNormalCompletion = true;
          _context.next = 10;
          break;

        case 20:
          _context.next = 26;
          break;

        case 22:
          _context.prev = 22;
          _context.t0 = _context["catch"](8);
          _didIteratorError = true;
          _iteratorError = _context.t0;

        case 26:
          _context.prev = 26;
          _context.prev = 27;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 29:
          _context.prev = 29;

          if (!_didIteratorError) {
            _context.next = 32;
            break;
          }

          throw _iteratorError;

        case 32:
          return _context.finish(29);

        case 33:
          return _context.finish(26);

        case 34:
          _context.next = 63;
          break;

        case 36:
          _iteratorNormalCompletion2 = true;
          _didIteratorError2 = false;
          _iteratorError2 = undefined;
          _context.prev = 39;
          _iterator2 = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable));

        case 41:
          if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
            _context.next = 49;
            break;
          }

          _item = _step2.value;
          circular.push(_item);
          _context.next = 46;
          return (0, _from["default"])(circular);

        case 46:
          _iteratorNormalCompletion2 = true;
          _context.next = 41;
          break;

        case 49:
          _context.next = 55;
          break;

        case 51:
          _context.prev = 51;
          _context.t1 = _context["catch"](39);
          _didIteratorError2 = true;
          _iteratorError2 = _context.t1;

        case 55:
          _context.prev = 55;
          _context.prev = 56;

          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }

        case 58:
          _context.prev = 58;

          if (!_didIteratorError2) {
            _context.next = 61;
            break;
          }

          throw _iteratorError2;

        case 61:
          return _context.finish(58);

        case 62:
          return _context.finish(55);

        case 63:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[8, 22, 26, 34], [27,, 29, 33], [39, 51, 55, 63], [56,, 58, 62]]);
}

function curriedCursor(size, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return cursor(size, iterable);
    };
  }

  return cursor(size, iterable);
}

module.exports = exports["default"];
},{"./chain":208,"./internal/circular-buffer":230,"./internal/ensure-iterable":234,"./repeat":253,"@babel/runtime-corejs2/core-js/array/from":4,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],217:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = cycle;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _isArray = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/array/is-array"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(cycle);

function cycle(iterable) {
  var copy, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item;

  return _regenerator["default"].wrap(function cycle$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(0, _isArray["default"])(iterable)) {
            _context.next = 7;
            break;
          }

        case 1:
          if (!true) {
            _context.next = 5;
            break;
          }

          return _context.delegateYield(iterable, "t0", 3);

        case 3:
          _context.next = 1;
          break;

        case 5:
          _context.next = 36;
          break;

        case 7:
          copy = [];
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 11;
          _iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable));

        case 13:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 21;
            break;
          }

          item = _step.value;
          copy.push(item);
          _context.next = 18;
          return item;

        case 18:
          _iteratorNormalCompletion = true;
          _context.next = 13;
          break;

        case 21:
          _context.next = 27;
          break;

        case 23:
          _context.prev = 23;
          _context.t1 = _context["catch"](11);
          _didIteratorError = true;
          _iteratorError = _context.t1;

        case 27:
          _context.prev = 27;
          _context.prev = 28;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 30:
          _context.prev = 30;

          if (!_didIteratorError) {
            _context.next = 33;
            break;
          }

          throw _iteratorError;

        case 33:
          return _context.finish(30);

        case 34:
          return _context.finish(27);

        case 35:
          return _context.delegateYield(cycle(copy), "t2", 36);

        case 36:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[11, 23, 27, 35], [28,, 30, 34]]);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/array/is-array":5,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],218:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedDropWhile;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(dropWhile);

function dropWhile(func, iterable) {
  var drop, c, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item;

  return _regenerator["default"].wrap(function dropWhile$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          drop = true;
          c = 0;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 5;
          _iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable));

        case 7:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 21;
            break;
          }

          item = _step.value;

          if (drop) {
            _context.next = 14;
            break;
          }

          _context.next = 12;
          return item;

        case 12:
          _context.next = 18;
          break;

        case 14:
          drop = func(item, c++);

          if (drop) {
            _context.next = 18;
            break;
          }

          _context.next = 18;
          return item;

        case 18:
          _iteratorNormalCompletion = true;
          _context.next = 7;
          break;

        case 21:
          _context.next = 27;
          break;

        case 23:
          _context.prev = 23;
          _context.t0 = _context["catch"](5);
          _didIteratorError = true;
          _iteratorError = _context.t0;

        case 27:
          _context.prev = 27;
          _context.prev = 28;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 30:
          _context.prev = 30;

          if (!_didIteratorError) {
            _context.next = 33;
            break;
          }

          throw _iteratorError;

        case 33:
          return _context.finish(30);

        case 34:
          return _context.finish(27);

        case 35:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[5, 23, 27, 35], [28,, 30, 34]]);
}

function curriedDropWhile(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return dropWhile(func, iterable);
    };
  }

  return dropWhile(func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],219:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = entries;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/typeof"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(entries);

var emptyArr = [];
var hasOwnProperty = Object.prototype.hasOwnProperty;

function entries(entriesable) {
  var key;
  return _regenerator["default"].wrap(function entries$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(entriesable == null)) {
            _context.next = 4;
            break;
          }

          return _context.abrupt("return", (0, _getIterator2["default"])(emptyArr));

        case 4:
          if (!(typeof entriesable.entries === 'function')) {
            _context.next = 8;
            break;
          }

          return _context.delegateYield(entriesable.entries(), "t0", 6);

        case 6:
          _context.next = 17;
          break;

        case 8:
          if (!((0, _typeof2["default"])(entriesable) === 'object')) {
            _context.next = 17;
            break;
          }

          _context.t1 = _regenerator["default"].keys(entriesable);

        case 10:
          if ((_context.t2 = _context.t1()).done) {
            _context.next = 17;
            break;
          }

          key = _context.t2.value;

          if (!hasOwnProperty.call(entriesable, key)) {
            _context.next = 15;
            break;
          }

          _context.next = 15;
          return [key, entriesable[key]];

        case 15:
          _context.next = 10;
          break;

        case 17:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}

module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/typeof":35,"@babel/runtime-corejs2/regenerator":37}],220:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = enumerate;

var _range = _interopRequireDefault(require("./range"));

var _zip = _interopRequireDefault(require("./zip"));

function enumerate(iterable) {
  var start = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  return (0, _zip["default"])((0, _range["default"])({
    start: start
  }), iterable);
}

module.exports = exports["default"];
},{"./range":247,"./zip":266,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],221:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedEvery;

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

function every(func, iterable) {
  var c = 0;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var item = _step.value;

      if (!func(item, c++)) {
        return false;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return true;
}

function curriedEvery(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return every(func, iterable);
    };
  }

  return every(func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],222:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = execute;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(execute);

function execute(func) {
  var _len,
      args,
      _key,
      _args = arguments;

  return _regenerator["default"].wrap(function execute$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          for (_len = _args.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = _args[_key];
          }

        case 1:
          if (!true) {
            _context.next = 6;
            break;
          }

          _context.next = 4;
          return func.apply(void 0, args);

        case 4:
          _context.next = 1;
          break;

        case 6:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}

module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],223:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedFilter;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(filter);

function filter(func, iterable) {
  var c, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item;

  return _regenerator["default"].wrap(function filter$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          c = 0;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 4;
          _iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable));

        case 6:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 14;
            break;
          }

          item = _step.value;

          if (!func(item, c++)) {
            _context.next = 11;
            break;
          }

          _context.next = 11;
          return item;

        case 11:
          _iteratorNormalCompletion = true;
          _context.next = 6;
          break;

        case 14:
          _context.next = 20;
          break;

        case 16:
          _context.prev = 16;
          _context.t0 = _context["catch"](4);
          _didIteratorError = true;
          _iteratorError = _context.t0;

        case 20:
          _context.prev = 20;
          _context.prev = 21;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 23:
          _context.prev = 23;

          if (!_didIteratorError) {
            _context.next = 26;
            break;
          }

          throw _iteratorError;

        case 26:
          return _context.finish(23);

        case 27:
          return _context.finish(20);

        case 28:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[4, 16, 20, 28], [21,, 23, 27]]);
}

function curriedFilter(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return filter(func, iterable);
    };
  }

  return filter(func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],224:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedFind;

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

function find(func, iterable) {
  var found = true;
  var c = 0;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var item = _step.value;
      found = func(item, c++);

      if (found) {
        return item;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return undefined;
}

function curriedFind(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return find(func, iterable);
    };
  }

  return find(func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],225:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = first;

var _from = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/array/from"));

var _slice = _interopRequireDefault(require("./slice"));

function first(iterable) {
  return (0, _from["default"])((0, _slice["default"])(1, iterable))[0];
}

module.exports = exports["default"];
},{"./slice":255,"@babel/runtime-corejs2/core-js/array/from":4,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],226:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedFlatMap;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _map = _interopRequireDefault(require("./map"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(flatMap);

function flatMap(func, iterable) {
  var mapIter, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item;

  return _regenerator["default"].wrap(function flatMap$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          mapIter = (0, _map["default"])(func);
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 4;
          _iterator = (0, _getIterator2["default"])(mapIter(iterable));

        case 6:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 12;
            break;
          }

          item = _step.value;
          return _context.delegateYield(item, "t0", 9);

        case 9:
          _iteratorNormalCompletion = true;
          _context.next = 6;
          break;

        case 12:
          _context.next = 18;
          break;

        case 14:
          _context.prev = 14;
          _context.t1 = _context["catch"](4);
          _didIteratorError = true;
          _iteratorError = _context.t1;

        case 18:
          _context.prev = 18;
          _context.prev = 19;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 21:
          _context.prev = 21;

          if (!_didIteratorError) {
            _context.next = 24;
            break;
          }

          throw _iteratorError;

        case 24:
          return _context.finish(21);

        case 25:
          return _context.finish(18);

        case 26:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[4, 14, 18, 26], [19,, 21, 25]]);
}

function curriedFlatMap(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return flatMap(func, iterable);
    };
  }

  return flatMap(func, iterable);
}

module.exports = exports["default"];
},{"./map":241,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],227:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedFlat;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _iterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol/iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var defaultShouldIFlat = function defaultShouldIFlat(depth) {
  if (typeof depth === 'function') {
    return depth;
  }

  if (typeof depth === 'number') {
    return function (currentDepth, iter) {
      return currentDepth <= depth && typeof iter[_iterator2["default"]] === 'function' && typeof iter !== 'string';
    };
  }

  throw new Error('flat: "depth" can be a function or a number');
};

function flat(shouldIFlat, iterable) {
  var _marked =
  /*#__PURE__*/
  _regenerator["default"].mark(_flat);

  function _flat(currentDepth, iterable) {
    var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, iter;

    return _regenerator["default"].wrap(function _flat$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!shouldIFlat(currentDepth, iterable)) {
              _context.next = 28;
              break;
            }

            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 4;
            _iterator = (0, _getIterator2["default"])(iterable);

          case 6:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context.next = 12;
              break;
            }

            iter = _step.value;
            return _context.delegateYield(_flat(currentDepth + 1, iter), "t0", 9);

          case 9:
            _iteratorNormalCompletion = true;
            _context.next = 6;
            break;

          case 12:
            _context.next = 18;
            break;

          case 14:
            _context.prev = 14;
            _context.t1 = _context["catch"](4);
            _didIteratorError = true;
            _iteratorError = _context.t1;

          case 18:
            _context.prev = 18;
            _context.prev = 19;

            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }

          case 21:
            _context.prev = 21;

            if (!_didIteratorError) {
              _context.next = 24;
              break;
            }

            throw _iteratorError;

          case 24:
            return _context.finish(21);

          case 25:
            return _context.finish(18);

          case 26:
            _context.next = 30;
            break;

          case 28:
            _context.next = 30;
            return iterable;

          case 30:
          case "end":
            return _context.stop();
        }
      }
    }, _marked, null, [[4, 14, 18, 26], [19,, 21, 25]]);
  }

  return _flat(0, (0, _ensureIterable["default"])(iterable));
}

function curriedFlat() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (args.length === 0) {
    return function (iterable) {
      return flat(defaultShouldIFlat(1), iterable);
    };
  } else if (args.length === 1) {
    if (typeof args[0][_iterator2["default"]] === 'function') {
      return flat(defaultShouldIFlat(1), args[0]);
    } else {
      return function (iterable) {
        return flat(defaultShouldIFlat(args[0]), iterable);
      };
    }
  } else {
    return flat(defaultShouldIFlat(args[0]), args[1]);
  }
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol/iterator":16,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],228:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedGroupBy;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _marked2 =
/*#__PURE__*/
_regenerator["default"].mark(groupBy);

function groupBy(key, iterable) {
  var _marked, iterator, currentItem, currentKey, previousKey, group;

  return _regenerator["default"].wrap(function groupBy$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          group = function _ref() {
            return _regenerator["default"].wrap(function group$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    if (!true) {
                      _context.next = 11;
                      break;
                    }

                    _context.next = 3;
                    return currentItem.value;

                  case 3:
                    currentItem = iterator.next();

                    if (!currentItem.done) {
                      _context.next = 6;
                      break;
                    }

                    return _context.abrupt("return");

                  case 6:
                    currentKey = key(currentItem.value);

                    if (!(previousKey !== currentKey)) {
                      _context.next = 9;
                      break;
                    }

                    return _context.abrupt("return");

                  case 9:
                    _context.next = 0;
                    break;

                  case 11:
                  case "end":
                    return _context.stop();
                }
              }
            }, _marked);
          };

          _marked =
          /*#__PURE__*/
          _regenerator["default"].mark(group);

          key = key || function (key) {
            return key;
          };

          iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable));
          ;
          _context2.prev = 5;
          currentItem = iterator.next();

        case 7:
          if (!true) {
            _context2.next = 20;
            break;
          }

          if (!currentItem.done) {
            _context2.next = 10;
            break;
          }

          return _context2.abrupt("return");

        case 10:
          currentKey = key(currentItem.value);

          if (!(previousKey !== currentKey)) {
            _context2.next = 17;
            break;
          }

          previousKey = currentKey;
          _context2.next = 15;
          return [currentKey, group()];

        case 15:
          _context2.next = 18;
          break;

        case 17:
          currentItem = iterator.next();

        case 18:
          _context2.next = 7;
          break;

        case 20:
          _context2.prev = 20;
          // calling close on the main iterable, closes the input iterable
          if (typeof iterator["return"] === 'function') iterator["return"]();
          return _context2.finish(20);

        case 23:
        case "end":
          return _context2.stop();
      }
    }
  }, _marked2, null, [[5,, 20, 23]]);
}

function curriedGroupBy(key, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return groupBy(key, iterable);
    };
  }

  return groupBy(key, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],229:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

_Object$defineProperty(exports, "batch", {
  enumerable: true,
  get: function get() {
    return _batch["default"];
  }
});

_Object$defineProperty(exports, "chain", {
  enumerable: true,
  get: function get() {
    return _chain["default"];
  }
});

_Object$defineProperty(exports, "concat", {
  enumerable: true,
  get: function get() {
    return _concat["default"];
  }
});

_Object$defineProperty(exports, "consume", {
  enumerable: true,
  get: function get() {
    return _consume["default"];
  }
});

_Object$defineProperty(exports, "combinationsWithReplacement", {
  enumerable: true,
  get: function get() {
    return _combinationsWithReplacement["default"];
  }
});

_Object$defineProperty(exports, "combinations", {
  enumerable: true,
  get: function get() {
    return _combinations["default"];
  }
});

_Object$defineProperty(exports, "compose", {
  enumerable: true,
  get: function get() {
    return _compose["default"];
  }
});

_Object$defineProperty(exports, "compress", {
  enumerable: true,
  get: function get() {
    return _compress["default"];
  }
});

_Object$defineProperty(exports, "count", {
  enumerable: true,
  get: function get() {
    return _count["default"];
  }
});

_Object$defineProperty(exports, "cursor", {
  enumerable: true,
  get: function get() {
    return _cursor["default"];
  }
});

_Object$defineProperty(exports, "cycle", {
  enumerable: true,
  get: function get() {
    return _cycle["default"];
  }
});

_Object$defineProperty(exports, "dropWhile", {
  enumerable: true,
  get: function get() {
    return _dropWhile["default"];
  }
});

_Object$defineProperty(exports, "entries", {
  enumerable: true,
  get: function get() {
    return _entries["default"];
  }
});

_Object$defineProperty(exports, "enumerate", {
  enumerable: true,
  get: function get() {
    return _enumerate["default"];
  }
});

_Object$defineProperty(exports, "every", {
  enumerable: true,
  get: function get() {
    return _every["default"];
  }
});

_Object$defineProperty(exports, "execute", {
  enumerable: true,
  get: function get() {
    return _execute["default"];
  }
});

_Object$defineProperty(exports, "filter", {
  enumerable: true,
  get: function get() {
    return _filter["default"];
  }
});

_Object$defineProperty(exports, "find", {
  enumerable: true,
  get: function get() {
    return _find["default"];
  }
});

_Object$defineProperty(exports, "first", {
  enumerable: true,
  get: function get() {
    return _first["default"];
  }
});

_Object$defineProperty(exports, "flat", {
  enumerable: true,
  get: function get() {
    return _flat["default"];
  }
});

_Object$defineProperty(exports, "flatMap", {
  enumerable: true,
  get: function get() {
    return _flatMap["default"];
  }
});

_Object$defineProperty(exports, "groupBy", {
  enumerable: true,
  get: function get() {
    return _groupBy["default"];
  }
});

_Object$defineProperty(exports, "interpose", {
  enumerable: true,
  get: function get() {
    return _interpose["default"];
  }
});

_Object$defineProperty(exports, "iterable", {
  enumerable: true,
  get: function get() {
    return _iterable["default"];
  }
});

_Object$defineProperty(exports, "keys", {
  enumerable: true,
  get: function get() {
    return _keys["default"];
  }
});

_Object$defineProperty(exports, "map", {
  enumerable: true,
  get: function get() {
    return _map["default"];
  }
});

_Object$defineProperty(exports, "merge", {
  enumerable: true,
  get: function get() {
    return _merge["default"];
  }
});

_Object$defineProperty(exports, "mergeByComparison", {
  enumerable: true,
  get: function get() {
    return _merge.mergeByComparison;
  }
});

_Object$defineProperty(exports, "mergeByChance", {
  enumerable: true,
  get: function get() {
    return _merge.mergeByChance;
  }
});

_Object$defineProperty(exports, "mergeByPosition", {
  enumerable: true,
  get: function get() {
    return _merge.mergeByPosition;
  }
});

_Object$defineProperty(exports, "partition", {
  enumerable: true,
  get: function get() {
    return _partition["default"];
  }
});

_Object$defineProperty(exports, "permutations", {
  enumerable: true,
  get: function get() {
    return _permutations["default"];
  }
});

_Object$defineProperty(exports, "pipe", {
  enumerable: true,
  get: function get() {
    return _pipe["default"];
  }
});

_Object$defineProperty(exports, "product", {
  enumerable: true,
  get: function get() {
    return _product["default"];
  }
});

_Object$defineProperty(exports, "range", {
  enumerable: true,
  get: function get() {
    return _range["default"];
  }
});

_Object$defineProperty(exports, "reduce", {
  enumerable: true,
  get: function get() {
    return _reduce["default"];
  }
});

_Object$defineProperty(exports, "regexpExec", {
  enumerable: true,
  get: function get() {
    return _regexpExec["default"];
  }
});

_Object$defineProperty(exports, "regexpSplit", {
  enumerable: true,
  get: function get() {
    return _regexpSplit["default"];
  }
});

_Object$defineProperty(exports, "regexpSplitIter", {
  enumerable: true,
  get: function get() {
    return _regexpSplitIter["default"];
  }
});

_Object$defineProperty(exports, "regexpExecIter", {
  enumerable: true,
  get: function get() {
    return _regexpExecIter["default"];
  }
});

_Object$defineProperty(exports, "splitLines", {
  enumerable: true,
  get: function get() {
    return _splitLines["default"];
  }
});

_Object$defineProperty(exports, "repeat", {
  enumerable: true,
  get: function get() {
    return _repeat["default"];
  }
});

_Object$defineProperty(exports, "size", {
  enumerable: true,
  get: function get() {
    return _size["default"];
  }
});

_Object$defineProperty(exports, "slice", {
  enumerable: true,
  get: function get() {
    return _slice["default"];
  }
});

_Object$defineProperty(exports, "some", {
  enumerable: true,
  get: function get() {
    return _some["default"];
  }
});

_Object$defineProperty(exports, "takeWhile", {
  enumerable: true,
  get: function get() {
    return _takeWhile["default"];
  }
});

_Object$defineProperty(exports, "tap", {
  enumerable: true,
  get: function get() {
    return _tap["default"];
  }
});

_Object$defineProperty(exports, "tee", {
  enumerable: true,
  get: function get() {
    return _tee["default"];
  }
});

_Object$defineProperty(exports, "takeSorted", {
  enumerable: true,
  get: function get() {
    return _takeSorted["default"];
  }
});

_Object$defineProperty(exports, "toArray", {
  enumerable: true,
  get: function get() {
    return _toArray["default"];
  }
});

_Object$defineProperty(exports, "values", {
  enumerable: true,
  get: function get() {
    return _values["default"];
  }
});

_Object$defineProperty(exports, "zipLongest", {
  enumerable: true,
  get: function get() {
    return _zipLongest["default"];
  }
});

_Object$defineProperty(exports, "zipAll", {
  enumerable: true,
  get: function get() {
    return _zipAll["default"];
  }
});

_Object$defineProperty(exports, "zip", {
  enumerable: true,
  get: function get() {
    return _zip["default"];
  }
});

_Object$defineProperty(exports, "iter", {
  enumerable: true,
  get: function get() {
    return _iter["default"];
  }
});

_Object$defineProperty(exports, "asyncBatch", {
  enumerable: true,
  get: function get() {
    return _asyncBatch["default"];
  }
});

_Object$defineProperty(exports, "asyncChain", {
  enumerable: true,
  get: function get() {
    return _asyncChain["default"];
  }
});

_Object$defineProperty(exports, "asyncConcat", {
  enumerable: true,
  get: function get() {
    return _asyncConcat["default"];
  }
});

_Object$defineProperty(exports, "asyncCompress", {
  enumerable: true,
  get: function get() {
    return _asyncCompress["default"];
  }
});

_Object$defineProperty(exports, "asyncConsume", {
  enumerable: true,
  get: function get() {
    return _asyncConsume["default"];
  }
});

_Object$defineProperty(exports, "asyncCycle", {
  enumerable: true,
  get: function get() {
    return _asyncCycle["default"];
  }
});

_Object$defineProperty(exports, "asyncCursor", {
  enumerable: true,
  get: function get() {
    return _asyncCursor["default"];
  }
});

_Object$defineProperty(exports, "asyncDropWhile", {
  enumerable: true,
  get: function get() {
    return _asyncDropWhile["default"];
  }
});

_Object$defineProperty(exports, "asyncEnumerate", {
  enumerable: true,
  get: function get() {
    return _asyncEnumerate["default"];
  }
});

_Object$defineProperty(exports, "asyncEvery", {
  enumerable: true,
  get: function get() {
    return _asyncEvery["default"];
  }
});

_Object$defineProperty(exports, "asyncExecute", {
  enumerable: true,
  get: function get() {
    return _asyncExecute["default"];
  }
});

_Object$defineProperty(exports, "asyncFilter", {
  enumerable: true,
  get: function get() {
    return _asyncFilter["default"];
  }
});

_Object$defineProperty(exports, "asyncFind", {
  enumerable: true,
  get: function get() {
    return _asyncFind["default"];
  }
});

_Object$defineProperty(exports, "asyncFirst", {
  enumerable: true,
  get: function get() {
    return _asyncFirst["default"];
  }
});

_Object$defineProperty(exports, "asyncFlat", {
  enumerable: true,
  get: function get() {
    return _asyncFlat["default"];
  }
});

_Object$defineProperty(exports, "asyncFlatMap", {
  enumerable: true,
  get: function get() {
    return _asyncFlatMap["default"];
  }
});

_Object$defineProperty(exports, "asyncGroupBy", {
  enumerable: true,
  get: function get() {
    return _asyncGroupBy["default"];
  }
});

_Object$defineProperty(exports, "asyncInterpose", {
  enumerable: true,
  get: function get() {
    return _asyncInterpose["default"];
  }
});

_Object$defineProperty(exports, "asyncIterable", {
  enumerable: true,
  get: function get() {
    return _asyncIterable["default"];
  }
});

_Object$defineProperty(exports, "asyncMap", {
  enumerable: true,
  get: function get() {
    return _asyncMap["default"];
  }
});

_Object$defineProperty(exports, "asyncMerge", {
  enumerable: true,
  get: function get() {
    return _asyncMerge["default"];
  }
});

_Object$defineProperty(exports, "asyncMergeByComparison", {
  enumerable: true,
  get: function get() {
    return _asyncMerge.asyncMergeByComparison;
  }
});

_Object$defineProperty(exports, "asyncMergeByChance", {
  enumerable: true,
  get: function get() {
    return _asyncMerge.asyncMergeByChance;
  }
});

_Object$defineProperty(exports, "asyncMergeByPosition", {
  enumerable: true,
  get: function get() {
    return _asyncMerge.asyncMergeByPosition;
  }
});

_Object$defineProperty(exports, "asyncMergeByReadiness", {
  enumerable: true,
  get: function get() {
    return _asyncMerge.asyncMergeByReadiness;
  }
});

_Object$defineProperty(exports, "asyncPartition", {
  enumerable: true,
  get: function get() {
    return _asyncPartition["default"];
  }
});

_Object$defineProperty(exports, "asyncReduce", {
  enumerable: true,
  get: function get() {
    return _asyncReduce["default"];
  }
});

_Object$defineProperty(exports, "asyncSize", {
  enumerable: true,
  get: function get() {
    return _asyncSize["default"];
  }
});

_Object$defineProperty(exports, "asyncSlice", {
  enumerable: true,
  get: function get() {
    return _asyncSlice["default"];
  }
});

_Object$defineProperty(exports, "asyncSome", {
  enumerable: true,
  get: function get() {
    return _asyncSome["default"];
  }
});

_Object$defineProperty(exports, "asyncTakeWhile", {
  enumerable: true,
  get: function get() {
    return _asyncTakeWhile["default"];
  }
});

_Object$defineProperty(exports, "asyncTap", {
  enumerable: true,
  get: function get() {
    return _asyncTap["default"];
  }
});

_Object$defineProperty(exports, "asyncTee", {
  enumerable: true,
  get: function get() {
    return _asyncTee["default"];
  }
});

_Object$defineProperty(exports, "asyncToArray", {
  enumerable: true,
  get: function get() {
    return _asyncToArray["default"];
  }
});

_Object$defineProperty(exports, "asyncTakeSorted", {
  enumerable: true,
  get: function get() {
    return _asyncTakeSorted["default"];
  }
});

_Object$defineProperty(exports, "asyncZipLongest", {
  enumerable: true,
  get: function get() {
    return _asyncZipLongest["default"];
  }
});

_Object$defineProperty(exports, "asyncZipAll", {
  enumerable: true,
  get: function get() {
    return _asyncZipAll["default"];
  }
});

_Object$defineProperty(exports, "asyncZip", {
  enumerable: true,
  get: function get() {
    return _asyncZip["default"];
  }
});

_Object$defineProperty(exports, "asyncRegexpSplitIter", {
  enumerable: true,
  get: function get() {
    return _asyncRegexpSplitIter["default"];
  }
});

_Object$defineProperty(exports, "asyncRegexpExecIter", {
  enumerable: true,
  get: function get() {
    return _asyncRegexpExecIter["default"];
  }
});

_Object$defineProperty(exports, "asyncSplitLines", {
  enumerable: true,
  get: function get() {
    return _asyncSplitLines["default"];
  }
});

_Object$defineProperty(exports, "asyncBuffer", {
  enumerable: true,
  get: function get() {
    return _asyncBuffer["default"];
  }
});

_Object$defineProperty(exports, "asyncThrottle", {
  enumerable: true,
  get: function get() {
    return _asyncThrottle["default"];
  }
});

_Object$defineProperty(exports, "asyncIter", {
  enumerable: true,
  get: function get() {
    return _asyncIter["default"];
  }
});

var _batch = _interopRequireDefault(require("./batch"));

var _chain = _interopRequireDefault(require("./chain"));

var _concat = _interopRequireDefault(require("./concat"));

var _consume = _interopRequireDefault(require("./consume"));

var _combinationsWithReplacement = _interopRequireDefault(require("./combinations-with-replacement"));

var _combinations = _interopRequireDefault(require("./combinations"));

var _compose = _interopRequireDefault(require("./compose"));

var _compress = _interopRequireDefault(require("./compress"));

var _count = _interopRequireDefault(require("./count"));

var _cursor = _interopRequireDefault(require("./cursor"));

var _cycle = _interopRequireDefault(require("./cycle"));

var _dropWhile = _interopRequireDefault(require("./drop-while"));

var _entries = _interopRequireDefault(require("./entries"));

var _enumerate = _interopRequireDefault(require("./enumerate"));

var _every = _interopRequireDefault(require("./every"));

var _execute = _interopRequireDefault(require("./execute"));

var _filter = _interopRequireDefault(require("./filter"));

var _find = _interopRequireDefault(require("./find"));

var _first = _interopRequireDefault(require("./first"));

var _flat = _interopRequireDefault(require("./flat"));

var _flatMap = _interopRequireDefault(require("./flat-map"));

var _groupBy = _interopRequireDefault(require("./group-by"));

var _interpose = _interopRequireDefault(require("./interpose"));

var _iterable = _interopRequireDefault(require("./iterable"));

var _keys = _interopRequireDefault(require("./keys"));

var _map = _interopRequireDefault(require("./map"));

var _merge = _interopRequireDefault(require("./merge"));

var _partition = _interopRequireDefault(require("./partition"));

var _permutations = _interopRequireDefault(require("./permutations"));

var _pipe = _interopRequireDefault(require("./pipe"));

var _product = _interopRequireDefault(require("./product"));

var _range = _interopRequireDefault(require("./range"));

var _reduce = _interopRequireDefault(require("./reduce"));

var _regexpExec = _interopRequireDefault(require("./regexp-exec"));

var _regexpSplit = _interopRequireDefault(require("./regexp-split"));

var _regexpSplitIter = _interopRequireDefault(require("./regexp-split-iter"));

var _regexpExecIter = _interopRequireDefault(require("./regexp-exec-iter"));

var _splitLines = _interopRequireDefault(require("./split-lines"));

var _repeat = _interopRequireDefault(require("./repeat"));

var _size = _interopRequireDefault(require("./size"));

var _slice = _interopRequireDefault(require("./slice"));

var _some = _interopRequireDefault(require("./some"));

var _takeWhile = _interopRequireDefault(require("./take-while"));

var _tap = _interopRequireDefault(require("./tap"));

var _tee = _interopRequireDefault(require("./tee"));

var _takeSorted = _interopRequireDefault(require("./take-sorted"));

var _toArray = _interopRequireDefault(require("./to-array"));

var _values = _interopRequireDefault(require("./values"));

var _zipLongest = _interopRequireDefault(require("./zip-longest"));

var _zipAll = _interopRequireDefault(require("./zip-all"));

var _zip = _interopRequireDefault(require("./zip"));

var _iter = _interopRequireDefault(require("./iter"));

var _asyncBatch = _interopRequireDefault(require("./async-batch"));

var _asyncChain = _interopRequireDefault(require("./async-chain"));

var _asyncConcat = _interopRequireDefault(require("./async-concat"));

var _asyncCompress = _interopRequireDefault(require("./async-compress"));

var _asyncConsume = _interopRequireDefault(require("./async-consume"));

var _asyncCycle = _interopRequireDefault(require("./async-cycle"));

var _asyncCursor = _interopRequireDefault(require("./async-cursor"));

var _asyncDropWhile = _interopRequireDefault(require("./async-drop-while"));

var _asyncEnumerate = _interopRequireDefault(require("./async-enumerate"));

var _asyncEvery = _interopRequireDefault(require("./async-every"));

var _asyncExecute = _interopRequireDefault(require("./async-execute"));

var _asyncFilter = _interopRequireDefault(require("./async-filter"));

var _asyncFind = _interopRequireDefault(require("./async-find"));

var _asyncFirst = _interopRequireDefault(require("./async-first"));

var _asyncFlat = _interopRequireDefault(require("./async-flat"));

var _asyncFlatMap = _interopRequireDefault(require("./async-flat-map"));

var _asyncGroupBy = _interopRequireDefault(require("./async-group-by"));

var _asyncInterpose = _interopRequireDefault(require("./async-interpose"));

var _asyncIterable = _interopRequireDefault(require("./async-iterable"));

var _asyncMap = _interopRequireDefault(require("./async-map"));

var _asyncMerge = _interopRequireDefault(require("./async-merge"));

var _asyncPartition = _interopRequireDefault(require("./async-partition"));

var _asyncReduce = _interopRequireDefault(require("./async-reduce"));

var _asyncSize = _interopRequireDefault(require("./async-size"));

var _asyncSlice = _interopRequireDefault(require("./async-slice"));

var _asyncSome = _interopRequireDefault(require("./async-some"));

var _asyncTakeWhile = _interopRequireDefault(require("./async-take-while"));

var _asyncTap = _interopRequireDefault(require("./async-tap"));

var _asyncTee = _interopRequireDefault(require("./async-tee"));

var _asyncToArray = _interopRequireDefault(require("./async-to-array"));

var _asyncTakeSorted = _interopRequireDefault(require("./async-take-sorted"));

var _asyncZipLongest = _interopRequireDefault(require("./async-zip-longest"));

var _asyncZipAll = _interopRequireDefault(require("./async-zip-all"));

var _asyncZip = _interopRequireDefault(require("./async-zip"));

var _asyncRegexpSplitIter = _interopRequireDefault(require("./async-regexp-split-iter"));

var _asyncRegexpExecIter = _interopRequireDefault(require("./async-regexp-exec-iter"));

var _asyncSplitLines = _interopRequireDefault(require("./async-split-lines"));

var _asyncBuffer = _interopRequireDefault(require("./async-buffer"));

var _asyncThrottle = _interopRequireDefault(require("./async-throttle"));

var _asyncIter = _interopRequireDefault(require("./async-iter"));
},{"./async-batch":167,"./async-buffer":168,"./async-chain":169,"./async-compress":170,"./async-concat":171,"./async-consume":172,"./async-cursor":173,"./async-cycle":174,"./async-drop-while":175,"./async-enumerate":176,"./async-every":177,"./async-execute":178,"./async-filter":179,"./async-find":180,"./async-first":181,"./async-flat":183,"./async-flat-map":182,"./async-group-by":184,"./async-interpose":185,"./async-iter":186,"./async-iterable":187,"./async-map":188,"./async-merge":189,"./async-partition":190,"./async-reduce":191,"./async-regexp-exec-iter":192,"./async-regexp-split-iter":193,"./async-size":194,"./async-slice":195,"./async-some":196,"./async-split-lines":197,"./async-take-sorted":198,"./async-take-while":199,"./async-tap":200,"./async-tee":201,"./async-throttle":202,"./async-to-array":203,"./async-zip":206,"./async-zip-all":204,"./async-zip-longest":205,"./batch":207,"./chain":208,"./combinations":210,"./combinations-with-replacement":209,"./compose":211,"./compress":212,"./concat":213,"./consume":214,"./count":215,"./cursor":216,"./cycle":217,"./drop-while":218,"./entries":219,"./enumerate":220,"./every":221,"./execute":222,"./filter":223,"./find":224,"./first":225,"./flat":227,"./flat-map":226,"./group-by":228,"./interpose":237,"./iter":238,"./iterable":239,"./keys":240,"./map":241,"./merge":242,"./partition":243,"./permutations":244,"./pipe":245,"./product":246,"./range":247,"./reduce":248,"./regexp-exec":250,"./regexp-exec-iter":249,"./regexp-split":252,"./regexp-split-iter":251,"./repeat":253,"./size":254,"./slice":255,"./some":256,"./split-lines":257,"./take-sorted":258,"./take-while":259,"./tap":260,"./tee":261,"./to-array":262,"./values":263,"./zip":266,"./zip-all":264,"./zip-longest":265,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],230:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _iterator = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol/iterator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/createClass"));

var CircularBuffer =
/*#__PURE__*/
function () {
  function CircularBuffer(size) {
    (0, _classCallCheck2["default"])(this, CircularBuffer);
    this.array = new Array(size);
    this._size = size;
    this.counter = 0;
  }

  (0, _createClass2["default"])(CircularBuffer, [{
    key: "push",
    value: function push(newItem) {
      this.counter++;
      var index = this.counter % this._size;
      var currentItem = this.array[index];
      this.array[index] = newItem;
      return currentItem;
    }
  }, {
    key: _iterator["default"],
    value:
    /*#__PURE__*/
    _regenerator["default"].mark(function value() {
      var counter, i;
      return _regenerator["default"].wrap(function value$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              counter = this.counter;
              i = 0;

            case 2:
              if (!(i < this._size)) {
                _context.next = 9;
                break;
              }

              counter++;
              _context.next = 6;
              return this.array[counter % this._size];

            case 6:
              i++;
              _context.next = 2;
              break;

            case 9:
            case "end":
              return _context.stop();
          }
        }
      }, value, this);
    })
  }]);
  return CircularBuffer;
}();

exports["default"] = CircularBuffer;
module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol/iterator":16,"@babel/runtime-corejs2/helpers/classCallCheck":25,"@babel/runtime-corejs2/helpers/createClass":26,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],231:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = cloneRegexp;

var _keys = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/keys"));

var flagMap = {
  global: 'g',
  ignoreCase: 'i',
  multiline: 'm',
  dotAll: 's',
  sticky: 'y',
  unicode: 'u'
};

function cloneRegexp(regex) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var flags = (0, _keys["default"])(flagMap).map(function (flag) {
    var flagValue = typeof options[flag] === 'boolean' ? options[flag] : regex[flag];
    return flagValue ? flagMap[flag] : '';
  }).join('');
  var clonedRegexp = new RegExp(regex.source, flags);
  return clonedRegexp;
}

module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/object/keys":12,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],232:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = delay;

var _promise = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/promise"));

function delay(ms, output) {
  if (ms <= 0) {
    return output instanceof Error ? _promise["default"].reject(output) : _promise["default"].resolve(output);
  }

  return new _promise["default"](function (resolve, reject) {
    return setTimeout(function () {
      if (output instanceof Error) {
        reject(output);
      } else {
        resolve(output);
      }
    }, ms);
  });
}

module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/promise":13,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],233:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = ensureAsyncIterable;

var _symbol = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol"));

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/wrapAsyncGenerator"));

var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/awaitAsyncGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncIterator"));

var _asyncGeneratorDelegate2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/asyncGeneratorDelegate"));

var _ensureIterable = _interopRequireDefault(require("./ensure-iterable"));

function asyncify(_x) {
  return _asyncify.apply(this, arguments);
} // forceWrap is used whenever I call "next" multiple times without waiting the promises to be fulfilled.
// this should work on generator objects created using generator functions
// http://tc39.github.io/proposal-async-iteration/#table-internal-slots-of-asyncgenerator-instances
// but it might not work if you create a generator object manually


function _asyncify() {
  _asyncify = (0, _wrapAsyncGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(iterable) {
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.delegateYield((0, _asyncGeneratorDelegate2["default"])((0, _asyncIterator2["default"])(iterable), _awaitAsyncGenerator2["default"]), "t0", 1);

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _asyncify.apply(this, arguments);
}

function ensureAsyncIterable(i) {
  var forceWrap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (i && i[_symbol["default"].asyncIterator] && forceWrap) {
    return asyncify(i);
  } else if (i && i[_symbol["default"].asyncIterator]) {
    return i;
  } else {
    return asyncify((0, _ensureIterable["default"])(i));
  }
}

module.exports = exports["default"];
},{"./ensure-iterable":234,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol":15,"@babel/runtime-corejs2/helpers/asyncGeneratorDelegate":21,"@babel/runtime-corejs2/helpers/asyncIterator":22,"@babel/runtime-corejs2/helpers/awaitAsyncGenerator":24,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/wrapAsyncGenerator":36,"@babel/runtime-corejs2/regenerator":37}],234:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = ensureIterable;

var _iterator = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol/iterator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var emptyArr = [];

function ensureIterable(i) {
  if (i == null) {
    return (0, _getIterator2["default"])(emptyArr);
  } else if (!i[_iterator["default"]]) {
    if (typeof i.next === 'function') {
      throw new TypeError('Iterators are not supported arguments to iter-tools. You must wrap them using the `iterable` method.');
    }

    throw new TypeError('The argument is not an iterable or null');
  }

  return i;
}

module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol/iterator":16,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],235:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.factorial = factorial;
exports.permutationsSize = permutationsSize;
exports.combinationsSize = combinationsSize;
exports.combinationsWithReplacementSize = combinationsWithReplacementSize;

var _map = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/map"));

var factorialCache = new _map["default"]();
var toBigInt;

try {
  toBigInt = BigInt(1) && function (n) {
    return BigInt(n);
  }; // eslint-disable-line

} catch (e) {
  toBigInt = function toBigInt(n) {
    return n;
  };
}

function factorial(n) {
  if (n === 0 || n === 1) return toBigInt(1);

  if (!factorialCache.has(n)) {
    factorialCache.set(n, toBigInt(n) * toBigInt(factorial(n - 1)));
  }

  return factorialCache.get(n);
}

function permutationsSize(len, r) {
  if (len === 0 || r === 0 || r > len) return 0;
  return Number(factorial(len) / factorial(len - r));
}

function combinationsSize(len, r) {
  if (len === 0 || r === 0 || r > len) return 0;
  return Number(factorial(len) / (factorial(r) * factorial(len - r)));
}

function combinationsWithReplacementSize(len, r) {
  if (len === 0 || r === 0 || r > len) return 0;
  return Number(factorial(len + r - 1) / (factorial(r) * factorial(len - 1)));
}
},{"@babel/runtime-corejs2/core-js/map":9,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],236:[function(require,module,exports){
"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = querablePromise;
var PENDING = 'pending';
var REJECTED = 'rejected';
var FULFILLED = 'fulfilled';

function querablePromise(promise) {
  // Don't modify any promise that has been already modified.
  if (promise.isPending) return promise;
  var state = PENDING; // Observe the promise, saving the fulfillment in a closure scope.

  var result = promise.then(function (v) {
    state = FULFILLED;
    return v;
  }, function (e) {
    state = REJECTED;
    throw e;
  });

  result.isFulfilled = function () {
    return state === FULFILLED;
  };

  result.isPending = function () {
    return state === PENDING;
  };

  result.isRejected = function () {
    return state === REJECTED;
  };

  return result;
}

module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/object/define-property":10}],237:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedInterpose;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(interpose);

function interpose(interposeItem, iterable) {
  var first, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item;

  return _regenerator["default"].wrap(function interpose$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          first = true;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 4;
          _iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable));

        case 6:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 17;
            break;
          }

          item = _step.value;

          if (first) {
            _context.next = 11;
            break;
          }

          _context.next = 11;
          return interposeItem;

        case 11:
          _context.next = 13;
          return item;

        case 13:
          first = false;

        case 14:
          _iteratorNormalCompletion = true;
          _context.next = 6;
          break;

        case 17:
          _context.next = 23;
          break;

        case 19:
          _context.prev = 19;
          _context.t0 = _context["catch"](4);
          _didIteratorError = true;
          _iteratorError = _context.t0;

        case 23:
          _context.prev = 23;
          _context.prev = 24;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 26:
          _context.prev = 26;

          if (!_didIteratorError) {
            _context.next = 29;
            break;
          }

          throw _iteratorError;

        case 29:
          return _context.finish(26);

        case 30:
          return _context.finish(23);

        case 31:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[4, 19, 23, 31], [24,, 26, 30]]);
}

function curriedInterpose(interposeItem, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return interpose(interposeItem, iterable);
    };
  }

  return interpose(interposeItem, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],238:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = iter;
exports.silence = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/typeof"));

var _iterator = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol/iterator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var deprecationWarning = 'iter() is deprecated! It is probably safe to simply remove the call.';
var warnedDeprecation = false;

var silence = function silence() {
  return warnedDeprecation = true;
};

exports.silence = silence;
var emptyArr = [];

function iter(iterable) {
  !warnedDeprecation && console.warn(deprecationWarning);
  warnedDeprecation = true;

  if (iterable == null) {
    return (0, _getIterator2["default"])(emptyArr);
  } else if (iterable[_iterator["default"]]) {
    return (0, _getIterator2["default"])(iterable);
  } else if (typeof iterable === 'function') {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    return iter(iterable.apply(void 0, args));
  } else if ((0, _typeof2["default"])(iterable) === 'object') {
    if (typeof iterable.next === 'function') {
      throw new Error('Iterators are not supported arguments to iter.');
    } else {
      throw new Error('Objects are no longer supported arguments to iter. Please use the entries function.');
    }
  }

  throw new Error('The argument is not a generator function or an iterable');
}
},{"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol/iterator":16,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/typeof":35}],239:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = iterable;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/defineProperty"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/typeof"));

var _iterator = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol/iterator"));

var emptyArray = [];

function iterable(iterator) {
  if (iterator == null) {
    return emptyArray;
  } else if (iterator[_iterator["default"]]) {
    return iterator;
  } else if ((0, _typeof2["default"])(iterator) !== 'object' || typeof iterator.next !== 'function') {
    throw new Error("Expected to receive an iterator of the form {next()}, but instead received: ".concat(iterator));
  }

  return (0, _defineProperty2["default"])({}, _iterator["default"], function () {
    return iterator;
  });
}

module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol/iterator":16,"@babel/runtime-corejs2/helpers/defineProperty":27,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/typeof":35}],240:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = keys;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/typeof"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(keys);

var emptyArr = [];
var hasOwnProperty = Object.prototype.hasOwnProperty;

function keys(keysable) {
  var key;
  return _regenerator["default"].wrap(function keys$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(keysable == null)) {
            _context.next = 4;
            break;
          }

          return _context.abrupt("return", (0, _getIterator2["default"])(emptyArr));

        case 4:
          if (!(typeof keysable.keys === 'function')) {
            _context.next = 8;
            break;
          }

          return _context.delegateYield(keysable.keys(), "t0", 6);

        case 6:
          _context.next = 17;
          break;

        case 8:
          if (!((0, _typeof2["default"])(keysable) === 'object')) {
            _context.next = 17;
            break;
          }

          _context.t1 = _regenerator["default"].keys(keysable);

        case 10:
          if ((_context.t2 = _context.t1()).done) {
            _context.next = 17;
            break;
          }

          key = _context.t2.value;

          if (!hasOwnProperty.call(keysable, key)) {
            _context.next = 15;
            break;
          }

          _context.next = 15;
          return key;

        case 15:
          _context.next = 10;
          break;

        case 17:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}

module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/typeof":35,"@babel/runtime-corejs2/regenerator":37}],241:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedMap;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(map);

function map(func, iterable) {
  var c, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item;

  return _regenerator["default"].wrap(function map$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          c = 0;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 4;
          _iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable));

        case 6:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 13;
            break;
          }

          item = _step.value;
          _context.next = 10;
          return func(item, c++);

        case 10:
          _iteratorNormalCompletion = true;
          _context.next = 6;
          break;

        case 13:
          _context.next = 19;
          break;

        case 15:
          _context.prev = 15;
          _context.t0 = _context["catch"](4);
          _didIteratorError = true;
          _iteratorError = _context.t0;

        case 19:
          _context.prev = 19;
          _context.prev = 20;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 22:
          _context.prev = 22;

          if (!_didIteratorError) {
            _context.next = 25;
            break;
          }

          throw _iteratorError;

        case 25:
          return _context.finish(22);

        case 26:
          return _context.finish(19);

        case 27:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[4, 15, 19, 27], [20,, 22, 26]]);
}

function curriedMap(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return map(func, iterable);
    };
  }

  return map(func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],242:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedMerge;
exports.mergeByComparison = mergeByComparison;
exports.mergeByChance = mergeByChance;
exports.mergeByPosition = mergeByPosition;

var _typeof2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/typeof"));

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _range = _interopRequireDefault(require("./range"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(merge);

function merge(pickFunc, iterables) {
  var iters, numberOfExhausted, items, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, index, chosen, _items$chosen, done, value, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, iter;

  return _regenerator["default"].wrap(function merge$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          iters = iterables.map(function (i) {
            return (0, _getIterator2["default"])((0, _ensureIterable["default"])(i));
          });
          numberOfExhausted = 0;
          items = new Array(iterables.length);
          _context.prev = 3;

        case 4:
          if (!(iters.length !== numberOfExhausted)) {
            _context.next = 40;
            break;
          }

          // tries to add items to zipped wherever the index is not exhausted
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 8;

          for (_iterator = (0, _getIterator2["default"])((0, _range["default"])(iters.length)); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            index = _step.value;

            if (typeof items[index] === 'undefined') {
              items[index] = iters[index].next();
            }
          } // pick and return the item


          _context.next = 16;
          break;

        case 12:
          _context.prev = 12;
          _context.t0 = _context["catch"](8);
          _didIteratorError = true;
          _iteratorError = _context.t0;

        case 16:
          _context.prev = 16;
          _context.prev = 17;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 19:
          _context.prev = 19;

          if (!_didIteratorError) {
            _context.next = 22;
            break;
          }

          throw _iteratorError;

        case 22:
          return _context.finish(19);

        case 23:
          return _context.finish(16);

        case 24:
          chosen = pickFunc(items);

          if (!(typeof items[chosen] === 'undefined')) {
            _context.next = 27;
            break;
          }

          throw new Error('the sequence returned doesn\'t exist');

        case 27:
          if (!(items[chosen] === null)) {
            _context.next = 29;
            break;
          }

          throw new Error('the sequence returned is exhausted');

        case 29:
          _items$chosen = items[chosen], done = _items$chosen.done, value = _items$chosen.value;

          if (!done) {
            _context.next = 35;
            break;
          }

          numberOfExhausted++;
          items[chosen] = null;
          _context.next = 38;
          break;

        case 35:
          _context.next = 37;
          return value;

        case 37:
          items[chosen] = undefined;

        case 38:
          _context.next = 4;
          break;

        case 40:
          _context.prev = 40;
          _iteratorNormalCompletion2 = true;
          _didIteratorError2 = false;
          _iteratorError2 = undefined;
          _context.prev = 44;

          for (_iterator2 = (0, _getIterator2["default"])(iters); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            iter = _step2.value;
            if (typeof iter["return"] === 'function') iter["return"]();
          }

          _context.next = 52;
          break;

        case 48:
          _context.prev = 48;
          _context.t1 = _context["catch"](44);
          _didIteratorError2 = true;
          _iteratorError2 = _context.t1;

        case 52:
          _context.prev = 52;
          _context.prev = 53;

          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }

        case 55:
          _context.prev = 55;

          if (!_didIteratorError2) {
            _context.next = 58;
            break;
          }

          throw _iteratorError2;

        case 58:
          return _context.finish(55);

        case 59:
          return _context.finish(52);

        case 60:
          return _context.finish(40);

        case 61:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[3,, 40, 61], [8, 12, 16, 24], [17,, 19, 23], [44, 48, 52, 60], [53,, 55, 59]]);
}

function curriedMerge(pickFunc, iterables) {
  if (arguments.length === 1) {
    return function (iterables) {
      return merge(pickFunc, iterables);
    };
  }

  return merge(pickFunc, iterables);
}
/* default compare */


var toString = function toString(obj) {
  if (obj === null) return 'null';
  if (typeof obj === 'boolean' || typeof obj === 'number') return obj.toString();
  if (typeof obj === 'string') return obj;
  if ((0, _typeof2["default"])(obj) === 'symbol') throw new TypeError();
  return obj.toString();
};

var defaultCompare = function defaultCompare(x, y) {
  if (x === undefined && y === undefined) return 0;
  if (x === undefined) return 1;
  if (y === undefined) return -1;
  var xString = toString(x);
  var yString = toString(y);
  if (xString < yString) return -1;
  if (xString > yString) return 1;
  return 0;
};
/*
 helpers
*/


function mergeByComparison() {
  var comparator = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultCompare;
  return function _mergeByComparison(items) {
    if (items.length === 0) return;
    return items.map(function (item, index) {
      return {
        index: index,
        item: item
      };
    }).filter(function (decoratedItem) {
      return !!decoratedItem.item;
    }).sort(function (a, b) {
      return comparator(a.item.value, b.item.value);
    })[0].index;
  };
}

function mergeByChance() {
  var weights = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  return function _mergeByChance(items) {
    if (items.length === 0) return;
    var validItems = items.map(function (item, index) {
      return {
        index: index,
        item: item,
        weight: weights[index] ? weights[index] : 1
      };
    }).filter(function (decoratedItem) {
      return !!decoratedItem.item;
    });
    var totalWeight = validItems.reduce(function (out, current) {
      return out + current.weight;
    }, 0);
    var draw = Math.random() * totalWeight;
    var currentWeight = 0;

    for (var i = 0; i < validItems.length; i++) {
      if (draw >= currentWeight && draw < currentWeight + validItems[i].weight) {
        return validItems[i].index;
      } else {
        currentWeight += validItems[i].weight;
      }
    }
  };
}

function mergeByPosition() {
  var step = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
  var current = -step;
  return function _mergeByPosition(items) {
    current = (current + step) % items.length;

    while (items[current] === null) {
      current = (current + 1) % items.length;
    }

    return current;
  };
}
},{"./internal/ensure-iterable":234,"./range":247,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/typeof":35,"@babel/runtime-corejs2/regenerator":37}],243:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedPartition;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _dequeue = _interopRequireDefault(require("dequeue"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

function partition(func, iter) {
  var _marked =
  /*#__PURE__*/
  _regenerator["default"].mark(part);

  var satisfied = new _dequeue["default"]();
  var unsatisfied = new _dequeue["default"]();
  var iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iter));
  var exhausted = 0;

  function part(queue) {
    var _iterator$next, value, done, chosen;

    return _regenerator["default"].wrap(function part$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

          case 1:
            if (!true) {
              _context.next = 14;
              break;
            }

          case 2:
            if (!queue.length) {
              _context.next = 7;
              break;
            }

            _context.next = 5;
            return queue.shift();

          case 5:
            _context.next = 2;
            break;

          case 7:
            _iterator$next = iterator.next(), value = _iterator$next.value, done = _iterator$next.done;

            if (!done) {
              _context.next = 10;
              break;
            }

            return _context.abrupt("break", 14);

          case 10:
            chosen = func(value) ? satisfied : unsatisfied;
            chosen.push(value);
            _context.next = 1;
            break;

          case 14:
            _context.prev = 14;
            exhausted++;

            if (exhausted === 2) {
              if (typeof iterator["return"] === 'function') iterator["return"]();
            }

            return _context.finish(14);

          case 18:
          case "end":
            return _context.stop();
        }
      }
    }, _marked, null, [[0,, 14, 18]]);
  }

  return [part(satisfied), part(unsatisfied)];
}

function curriedPartition(func, iter) {
  if (typeof iter === 'undefined') {
    return function (iter) {
      return partition(func, iter);
    };
  }

  return partition(func, iter);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37,"dequeue":162}],244:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = permutations;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/defineProperty"));

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _set = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/set"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/toConsumableArray"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _iterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol/iterator"));

var _from = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/array/from"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _math = require("./internal/math");

var _map = _interopRequireDefault(require("./map"));

var _range = _interopRequireDefault(require("./range"));

var _tee = _interopRequireDefault(require("./tee"));

var _product = _interopRequireDefault(require("./product"));

function permutations(iterable, r) {
  var _ref;

  var arr = (0, _from["default"])((0, _ensureIterable["default"])(iterable));
  var len = arr.length;
  r = typeof r === 'undefined' ? len : r;
  return _ref = {}, (0, _defineProperty2["default"])(_ref, _iterator2["default"],
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee() {
    var mapToIndex, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, indices;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(r > len)) {
              _context.next = 2;
              break;
            }

            return _context.abrupt("return");

          case 2:
            mapToIndex = (0, _map["default"])(function (i) {
              return arr[i];
            });
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 6;
            _iterator = (0, _getIterator2["default"])(_product["default"].apply(void 0, (0, _toConsumableArray2["default"])((0, _tee["default"])((0, _range["default"])(len), r))));

          case 8:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context.next = 16;
              break;
            }

            indices = _step.value;

            if (!(new _set["default"](indices).size === r)) {
              _context.next = 13;
              break;
            }

            _context.next = 13;
            return (0, _from["default"])(mapToIndex(indices));

          case 13:
            _iteratorNormalCompletion = true;
            _context.next = 8;
            break;

          case 16:
            _context.next = 22;
            break;

          case 18:
            _context.prev = 18;
            _context.t0 = _context["catch"](6);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 22:
            _context.prev = 22;
            _context.prev = 23;

            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }

          case 25:
            _context.prev = 25;

            if (!_didIteratorError) {
              _context.next = 28;
              break;
            }

            throw _iteratorError;

          case 28:
            return _context.finish(25);

          case 29:
            return _context.finish(22);

          case 30:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[6, 18, 22, 30], [23,, 25, 29]]);
  })), (0, _defineProperty2["default"])(_ref, "getSize", function getSize() {
    return (0, _math.permutationsSize)(len, r);
  }), _ref;
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"./internal/math":235,"./map":241,"./product":246,"./range":247,"./tee":261,"@babel/runtime-corejs2/core-js/array/from":4,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/set":14,"@babel/runtime-corejs2/core-js/symbol/iterator":16,"@babel/runtime-corejs2/helpers/defineProperty":27,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/toConsumableArray":34,"@babel/runtime-corejs2/regenerator":37}],245:[function(require,module,exports){
"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = pipe;

function pipe(value) {
  for (var _len = arguments.length, fns = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    fns[_key - 1] = arguments[_key];
  }

  return fns.reduce(function (value, fn) {
    return fn(value);
  }, value);
}

module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/object/define-property":10}],246:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = product;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/defineProperty"));

var _iterator4 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol/iterator"));

var _from = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/array/from"));

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(multiply),
    _marked2 =
/*#__PURE__*/
_regenerator["default"].mark(empty);

function multiply(iterable1, iterable2) {
  var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item1, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, item2;

  return _regenerator["default"].wrap(function multiply$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 3;
          _iterator = (0, _getIterator2["default"])(iterable1);

        case 5:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 36;
            break;
          }

          item1 = _step.value;
          _iteratorNormalCompletion2 = true;
          _didIteratorError2 = false;
          _iteratorError2 = undefined;
          _context.prev = 10;
          _iterator2 = (0, _getIterator2["default"])(iterable2);

        case 12:
          if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
            _context.next = 19;
            break;
          }

          item2 = _step2.value;
          _context.next = 16;
          return item1.concat(item2);

        case 16:
          _iteratorNormalCompletion2 = true;
          _context.next = 12;
          break;

        case 19:
          _context.next = 25;
          break;

        case 21:
          _context.prev = 21;
          _context.t0 = _context["catch"](10);
          _didIteratorError2 = true;
          _iteratorError2 = _context.t0;

        case 25:
          _context.prev = 25;
          _context.prev = 26;

          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }

        case 28:
          _context.prev = 28;

          if (!_didIteratorError2) {
            _context.next = 31;
            break;
          }

          throw _iteratorError2;

        case 31:
          return _context.finish(28);

        case 32:
          return _context.finish(25);

        case 33:
          _iteratorNormalCompletion = true;
          _context.next = 5;
          break;

        case 36:
          _context.next = 42;
          break;

        case 38:
          _context.prev = 38;
          _context.t1 = _context["catch"](3);
          _didIteratorError = true;
          _iteratorError = _context.t1;

        case 42:
          _context.prev = 42;
          _context.prev = 43;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 45:
          _context.prev = 45;

          if (!_didIteratorError) {
            _context.next = 48;
            break;
          }

          throw _iteratorError;

        case 48:
          return _context.finish(45);

        case 49:
          return _context.finish(42);

        case 50:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[3, 38, 42, 50], [10, 21, 25, 33], [26,, 28, 32], [43,, 45, 49]]);
}

function empty() {
  return _regenerator["default"].wrap(function empty$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
        case "end":
          return _context2.stop();
      }
    }
  }, _marked2);
}

function product() {
  var _ref;

  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var iters = args.map(function (i) {
    return (0, _from["default"])((0, _ensureIterable["default"])(i));
  });
  return _ref = {}, (0, _defineProperty2["default"])(_ref, _iterator4["default"], function () {
    if (iters.length === 0) return empty();
    var currentIter = [[]];
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = (0, _getIterator2["default"])(iters), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var it = _step3.value;
        currentIter = multiply(currentIter, it);
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
          _iterator3["return"]();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    return currentIter;
  }), (0, _defineProperty2["default"])(_ref, "getSize", function getSize() {
    if (iters.length === 0) return 0;
    var lengths = iters.map(function (iter) {
      return iter.length;
    });
    return lengths.reduce(function (acc, value) {
      return acc * value;
    }, 1);
  }), _ref;
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/array/from":4,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol/iterator":16,"@babel/runtime-corejs2/helpers/defineProperty":27,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],247:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = range;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/typeof"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(range);

function range(opts) {
  var start, step, end, i;
  return _regenerator["default"].wrap(function range$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          opts = typeof opts === 'number' ? {
            end: opts,
            start: 0
          } : (0, _typeof2["default"])(opts) === 'object' ? opts : {};
          step = typeof opts.step === 'undefined' ? 1 : opts.step;
          end = typeof opts.end === 'undefined' ? step > 0 ? Infinity : -Infinity : opts.end;
          start = opts.start ? opts.start : 0;
          i = start;

        case 5:
          if (!(step > 0 ? i < end : i > end)) {
            _context.next = 11;
            break;
          }

          _context.next = 8;
          return i;

        case 8:
          i += step;
          _context.next = 5;
          break;

        case 11:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}

module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/typeof":35,"@babel/runtime-corejs2/regenerator":37}],248:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedReduce;

var _iterator = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol/iterator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

function reduce(initial, func, iterable) {
  var c = 0;
  var acc = initial;
  var iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable));

  try {
    if (initial === undefined) {
      var firstResult = iterator.next();

      if (firstResult.done) {
        throw new Error('Cannot reduce: no initial value specified and iterable was empty');
      }

      acc = firstResult.value;
      c = 1;
    }

    var result;

    while (!(result = iterator.next()).done) {
      acc = func(acc, result.value, c++);
    }

    return acc;
  } finally {
    // close the iterable in case of exceptions
    if (typeof iterable["return"] === 'function') iterable["return"]();
  }
}

function curriedReduce(initial, func, iterable) {
  // is this complete? has an iterable been specified? (func can never be iterable)
  //    is there an iterable that comes after func
  //    work backwards from there
  var hasIterable = false;

  if (arguments.length === 1) {
    func = initial;
    initial = undefined;
  } else if (arguments.length === 2 && (func == null || func[_iterator["default"]])) {
    iterable = func;
    func = initial;
    initial = undefined;
    hasIterable = true;
  } else if (arguments.length === 3) {
    hasIterable = true;
  }

  if (!hasIterable) {
    return function (iterable) {
      return reduce(initial, func, iterable);
    };
  }

  return reduce(initial, func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol/iterator":16,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],249:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedRegexpExecIter;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _regexpExec = _interopRequireDefault(require("./regexp-exec"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(regexpExecIter);

function regexpExecIter(re, iterable) {
  var matches, buffer, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, chunk, lastIndex, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, match;

  return _regenerator["default"].wrap(function regexpExecIter$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          buffer = '';
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 4;
          _iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable));

        case 6:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 48;
            break;
          }

          chunk = _step.value;

          if (!(chunk === '')) {
            _context.next = 10;
            break;
          }

          return _context.abrupt("continue", 45);

        case 10:
          lastIndex = 0;
          matches = [];
          buffer += chunk;
          _iteratorNormalCompletion2 = true;
          _didIteratorError2 = false;
          _iteratorError2 = undefined;
          _context.prev = 16;
          _iterator2 = (0, _getIterator2["default"])((0, _regexpExec["default"])(re, buffer));

        case 18:
          if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
            _context.next = 30;
            break;
          }

          match = _step2.value;

          if (!(match[0] === '')) {
            _context.next = 22;
            break;
          }

          return _context.abrupt("continue", 27);

        case 22:
          lastIndex = re.lastIndex - match[0].length;
          matches.push(match);

          if (!(matches.length === 2)) {
            _context.next = 27;
            break;
          }

          _context.next = 27;
          return matches.shift();

        case 27:
          _iteratorNormalCompletion2 = true;
          _context.next = 18;
          break;

        case 30:
          _context.next = 36;
          break;

        case 32:
          _context.prev = 32;
          _context.t0 = _context["catch"](16);
          _didIteratorError2 = true;
          _iteratorError2 = _context.t0;

        case 36:
          _context.prev = 36;
          _context.prev = 37;

          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }

        case 39:
          _context.prev = 39;

          if (!_didIteratorError2) {
            _context.next = 42;
            break;
          }

          throw _iteratorError2;

        case 42:
          return _context.finish(39);

        case 43:
          return _context.finish(36);

        case 44:
          buffer = buffer.slice(lastIndex);

        case 45:
          _iteratorNormalCompletion = true;
          _context.next = 6;
          break;

        case 48:
          _context.next = 54;
          break;

        case 50:
          _context.prev = 50;
          _context.t1 = _context["catch"](4);
          _didIteratorError = true;
          _iteratorError = _context.t1;

        case 54:
          _context.prev = 54;
          _context.prev = 55;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 57:
          _context.prev = 57;

          if (!_didIteratorError) {
            _context.next = 60;
            break;
          }

          throw _iteratorError;

        case 60:
          return _context.finish(57);

        case 61:
          return _context.finish(54);

        case 62:
          if (!(matches && matches.length)) {
            _context.next = 64;
            break;
          }

          return _context.delegateYield(matches, "t2", 64);

        case 64:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[4, 50, 54, 62], [16, 32, 36, 44], [37,, 39, 43], [55,, 57, 61]]);
}

function curriedRegexpExecIter(re, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return regexpExecIter(re, iterable);
    };
  }

  return regexpExecIter(re, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"./regexp-exec":250,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],250:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedRegexpExec;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _cloneRegexp = _interopRequireDefault(require("./internal/clone-regexp"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(regexpExec);

function regexpExec(re, str) {
  var match;
  return _regenerator["default"].wrap(function regexpExec$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(typeof str !== 'string')) {
            _context.next = 2;
            break;
          }

          throw new Error('regexpExec: it should take a string');

        case 2:
          if (!((match = re.exec(str)) !== null)) {
            _context.next = 7;
            break;
          }

          _context.next = 5;
          return match;

        case 5:
          _context.next = 2;
          break;

        case 7:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}

function curriedRegexpExec(re, str) {
  if (!re) {
    throw new Error('A RegExp string or instance must be passed to regexpExec.');
  }

  if (typeof re === 'string') {
    re = new RegExp(re, 'g');
  } else if (!re.sticky && !re.global) {
    re = (0, _cloneRegexp["default"])(re, {
      global: true
    });
  }

  if (arguments.length === 1) {
    return function (str) {
      return regexpExec(re, str);
    };
  }

  return regexpExec(re, str);
}

module.exports = exports["default"];
},{"./internal/clone-regexp":231,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],251:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedRegexpSplitIter;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _regexpSplit = _interopRequireDefault(require("./regexp-split"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(regexpSplitIter);

function regexpSplitIter(re, iterable) {
  var buffer, queue, mergeEmpty, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, chunk, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, strIter;

  return _regenerator["default"].wrap(function regexpSplitIter$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          buffer = '';
          mergeEmpty = false;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 5;
          _iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable));

        case 7:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 50;
            break;
          }

          chunk = _step.value;

          if (!(chunk === '')) {
            _context.next = 11;
            break;
          }

          return _context.abrupt("continue", 47);

        case 11:
          queue = [];
          buffer += chunk;
          _iteratorNormalCompletion2 = true;
          _didIteratorError2 = false;
          _iteratorError2 = undefined;
          _context.prev = 16;
          _iterator2 = (0, _getIterator2["default"])((0, _regexpSplit["default"])(re, buffer));

        case 18:
          if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
            _context.next = 31;
            break;
          }

          strIter = _step2.value;

          if (!(mergeEmpty && strIter === '')) {
            _context.next = 23;
            break;
          }

          mergeEmpty = false;
          return _context.abrupt("continue", 28);

        case 23:
          mergeEmpty = false;
          queue.push(strIter);

          if (!(queue.length === 2)) {
            _context.next = 28;
            break;
          }

          _context.next = 28;
          return queue.shift();

        case 28:
          _iteratorNormalCompletion2 = true;
          _context.next = 18;
          break;

        case 31:
          _context.next = 37;
          break;

        case 33:
          _context.prev = 33;
          _context.t0 = _context["catch"](16);
          _didIteratorError2 = true;
          _iteratorError2 = _context.t0;

        case 37:
          _context.prev = 37;
          _context.prev = 38;

          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }

        case 40:
          _context.prev = 40;

          if (!_didIteratorError2) {
            _context.next = 43;
            break;
          }

          throw _iteratorError2;

        case 43:
          return _context.finish(40);

        case 44:
          return _context.finish(37);

        case 45:
          mergeEmpty = queue[queue.length - 1] === '';
          buffer = queue.join('');

        case 47:
          _iteratorNormalCompletion = true;
          _context.next = 7;
          break;

        case 50:
          _context.next = 56;
          break;

        case 52:
          _context.prev = 52;
          _context.t1 = _context["catch"](5);
          _didIteratorError = true;
          _iteratorError = _context.t1;

        case 56:
          _context.prev = 56;
          _context.prev = 57;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 59:
          _context.prev = 59;

          if (!_didIteratorError) {
            _context.next = 62;
            break;
          }

          throw _iteratorError;

        case 62:
          return _context.finish(59);

        case 63:
          return _context.finish(56);

        case 64:
          if (!(queue && queue.length)) {
            _context.next = 66;
            break;
          }

          return _context.delegateYield(queue, "t2", 66);

        case 66:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[5, 52, 56, 64], [16, 33, 37, 45], [38,, 40, 44], [57,, 59, 63]]);
}

function curriedRegexpSplitIter(re, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return regexpSplitIter(re, iterable);
    };
  }

  return regexpSplitIter(re, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"./regexp-split":252,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],252:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedRegexpSplit;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _cloneRegexp = _interopRequireDefault(require("./internal/clone-regexp"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(regexpSplit);

function regexpSplit(re, str) {
  var i, match, part;
  return _regenerator["default"].wrap(function regexpSplit$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(typeof str !== 'string')) {
            _context.next = 2;
            break;
          }

          throw new Error('regexpSplit: it should take a string');

        case 2:
          if (re) {
            _context.next = 5;
            break;
          }

          return _context.delegateYield(str, "t0", 4);

        case 4:
          return _context.abrupt("return");

        case 5:
          i = 0;

        case 6:
          if (!(match = re.exec(str))) {
            _context.next = 17;
            break;
          }

          // eslint-disable-line no-cond-assign
          part = str.slice(i, re.lastIndex - match[0].length);
          _context.next = 10;
          return part;

        case 10:
          if (!(i === 0 && re.lastIndex === 0 && match[0].length === 0)) {
            _context.next = 12;
            break;
          }

          return _context.abrupt("break", 17);

        case 12:
          if (re.global) {
            _context.next = 14;
            break;
          }

          return _context.abrupt("break", 17);

        case 14:
          i = re.lastIndex;
          _context.next = 6;
          break;

        case 17:
          _context.next = 19;
          return str.slice(i);

        case 19:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}

function curriedRegexpSplit(re, str) {
  if (re && typeof re === 'string') {
    re = new RegExp(re, 'g');
  } else if (re && !re.global) {
    re = (0, _cloneRegexp["default"])(re, {
      global: true
    });
  }

  if (arguments.length === 1) {
    return function (str) {
      return regexpSplit(re, str);
    };
  }

  return regexpSplit(re, str);
}

module.exports = exports["default"];
},{"./internal/clone-regexp":231,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],253:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = repeat;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(repeat);

function repeat(obj) {
  var times,
      _args = arguments;
  return _regenerator["default"].wrap(function repeat$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          times = _args.length > 1 && _args[1] !== undefined ? _args[1] : Infinity;

        case 1:
          if (!times--) {
            _context.next = 6;
            break;
          }

          _context.next = 4;
          return obj;

        case 4:
          _context.next = 1;
          break;

        case 6:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}

module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],254:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = size;

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _set = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/set"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/map"));

var _isArray = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/array/is-array"));

var _getPrototypeOf = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/get-prototype-of"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var TypedArrayProto = (0, _getPrototypeOf["default"])(Int8Array);

function size(iterable) {
  if (iterable == null) return 0;
  if ((0, _isArray["default"])(iterable)) return iterable.length;
  if (iterable instanceof _map["default"] || iterable instanceof _set["default"]) return iterable.size;
  if ((0, _getPrototypeOf["default"])(iterable) === TypedArrayProto) return iterable.length;
  var size = 0; // eslint-disable-next-line

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _ = _step.value;
      size++;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return size;
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/array/is-array":5,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/map":9,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/object/get-prototype-of":11,"@babel/runtime-corejs2/core-js/set":14,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],255:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedSlice;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _circularBuffer = _interopRequireDefault(require("./internal/circular-buffer"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(simpleSlice),
    _marked2 =
/*#__PURE__*/
_regenerator["default"].mark(slice);

function bufferedSlice(iterable, start, end, step) {
  var bufferSize = Math.abs(start);
  var buffer = new _circularBuffer["default"](bufferSize);
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator2["default"])(iterable), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var item = _step.value;
      buffer.push(item);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var newEnd;

  if (isFinite(end) && end > 0) {
    newEnd = end - (buffer.counter - bufferSize);
    if (newEnd < 0) return [];
  } else {
    newEnd = end;
  }

  return simpleSlice(buffer, 0, newEnd, step);
}

function simpleSlice(iterable, start, end, step) {
  var currentPos, nextValidPos, bufferSize, buffer, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, item;

  return _regenerator["default"].wrap(function simpleSlice$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          currentPos = 0;
          nextValidPos = start;
          bufferSize = Math.abs(end);

          if (end < 0) {
            buffer = new _circularBuffer["default"](bufferSize);
          }

          _iteratorNormalCompletion2 = true;
          _didIteratorError2 = false;
          _iteratorError2 = undefined;
          _context.prev = 7;
          _iterator2 = (0, _getIterator2["default"])(iterable);

        case 9:
          if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
            _context.next = 25;
            break;
          }

          item = _step2.value;

          if (!buffer) {
            _context.next = 15;
            break;
          }

          item = buffer.push(item);

          if (!(buffer.counter <= bufferSize)) {
            _context.next = 15;
            break;
          }

          return _context.abrupt("continue", 22);

        case 15:
          if (!(currentPos >= end && end >= 0)) {
            _context.next = 17;
            break;
          }

          return _context.abrupt("break", 25);

        case 17:
          if (!(nextValidPos === currentPos)) {
            _context.next = 21;
            break;
          }

          _context.next = 20;
          return item;

        case 20:
          nextValidPos += step;

        case 21:
          currentPos++;

        case 22:
          _iteratorNormalCompletion2 = true;
          _context.next = 9;
          break;

        case 25:
          _context.next = 31;
          break;

        case 27:
          _context.prev = 27;
          _context.t0 = _context["catch"](7);
          _didIteratorError2 = true;
          _iteratorError2 = _context.t0;

        case 31:
          _context.prev = 31;
          _context.prev = 32;

          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }

        case 34:
          _context.prev = 34;

          if (!_didIteratorError2) {
            _context.next = 37;
            break;
          }

          throw _iteratorError2;

        case 37:
          return _context.finish(34);

        case 38:
          return _context.finish(31);

        case 39:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[7, 27, 31, 39], [32,, 34, 38]]);
}

function slice(opts, iterable) {
  var start, step, end;
  return _regenerator["default"].wrap(function slice$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          opts = typeof opts === 'number' ? {
            end: opts,
            start: 0
          } : opts;
          step = typeof opts.step === 'undefined' ? 1 : opts.step;
          end = typeof opts.end === 'undefined' ? Infinity : opts.end;
          start = opts.start ? opts.start : 0;
          iterable = (0, _ensureIterable["default"])(iterable);

          if (!(step <= 0)) {
            _context2.next = 7;
            break;
          }

          throw new TypeError('Cannot slice with step <= 0');

        case 7:
          if (!(start >= 0)) {
            _context2.next = 11;
            break;
          }

          return _context2.delegateYield(simpleSlice(iterable, start, end, step), "t0", 9);

        case 9:
          _context2.next = 12;
          break;

        case 11:
          return _context2.delegateYield(bufferedSlice(iterable, start, end, step), "t1", 12);

        case 12:
        case "end":
          return _context2.stop();
      }
    }
  }, _marked2);
}

function curriedSlice(opts, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return slice(opts, iterable);
    };
  }

  return slice(opts, iterable);
}

module.exports = exports["default"];
},{"./internal/circular-buffer":230,"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],256:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedSome;

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

function some(func, iterable) {
  var c = 0;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var item = _step.value;

      if (func(item, c++)) {
        return true;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return false;
}

function curriedSome(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return some(func, iterable);
    };
  }

  return some(func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],257:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _regexpSplitIter = _interopRequireDefault(require("./regexp-split-iter"));

var _default = (0, _regexpSplitIter["default"])(/(\r\n|[\n\v\f\r\x85\u2028\u2029])/g);

exports["default"] = _default;
module.exports = exports["default"];
},{"./regexp-split-iter":251,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],258:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedTakeSorted;

var _iterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/symbol/iterator"));

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _heap = _interopRequireDefault(require("little-ds-toolkit/lib/heap"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(takeSorted);

function takeSorted(number, comparator, iterable) {
  var heap, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item, len, i;

  return _regenerator["default"].wrap(function takeSorted$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          heap = new _heap["default"](comparator);
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 4;

          for (_iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable)); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            item = _step.value;
            heap.push(item);

            if (heap.size() > number) {
              heap.pop();
            }
          }

          _context.next = 12;
          break;

        case 8:
          _context.prev = 8;
          _context.t0 = _context["catch"](4);
          _didIteratorError = true;
          _iteratorError = _context.t0;

        case 12:
          _context.prev = 12;
          _context.prev = 13;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 15:
          _context.prev = 15;

          if (!_didIteratorError) {
            _context.next = 18;
            break;
          }

          throw _iteratorError;

        case 18:
          return _context.finish(15);

        case 19:
          return _context.finish(12);

        case 20:
          len = heap.size();
          i = 0;

        case 22:
          if (!(i < len)) {
            _context.next = 28;
            break;
          }

          _context.next = 25;
          return heap.pop();

        case 25:
          i++;
          _context.next = 22;
          break;

        case 28:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[4, 8, 12, 20], [13,, 15, 19]]);
}

function curriedTakeSorted(number, comparator, iterable) {
  if (arguments.length === 2) {
    if (comparator[_iterator2["default"]]) {
      return takeSorted(number, undefined, comparator);
    } else {
      return function (iterable) {
        return takeSorted(number, comparator, iterable);
      };
    }
  } else if (arguments.length === 1) {
    return function (iterable) {
      return takeSorted(number, undefined, iterable);
    };
  }

  return takeSorted(number, comparator, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/core-js/symbol/iterator":16,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37,"little-ds-toolkit/lib/heap":267}],259:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedTakeWhile;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(takeWhile);

function takeWhile(func, i) {
  var take, c, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item;

  return _regenerator["default"].wrap(function takeWhile$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          take = true;
          c = 0;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 5;
          _iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(i));

        case 7:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 19;
            break;
          }

          item = _step.value;
          take = func(item, c++);

          if (!take) {
            _context.next = 15;
            break;
          }

          _context.next = 13;
          return item;

        case 13:
          _context.next = 16;
          break;

        case 15:
          return _context.abrupt("break", 19);

        case 16:
          _iteratorNormalCompletion = true;
          _context.next = 7;
          break;

        case 19:
          _context.next = 25;
          break;

        case 21:
          _context.prev = 21;
          _context.t0 = _context["catch"](5);
          _didIteratorError = true;
          _iteratorError = _context.t0;

        case 25:
          _context.prev = 25;
          _context.prev = 26;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 28:
          _context.prev = 28;

          if (!_didIteratorError) {
            _context.next = 31;
            break;
          }

          throw _iteratorError;

        case 31:
          return _context.finish(28);

        case 32:
          return _context.finish(25);

        case 33:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[5, 21, 25, 33], [26,, 28, 32]]);
}

function curriedTakeWhile(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return takeWhile(func, iterable);
    };
  }

  return takeWhile(func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],260:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = curriedTap;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(tap);

function tap(func, iterable) {
  var c, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item;

  return _regenerator["default"].wrap(function tap$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          c = 0;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 4;
          _iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable));

        case 6:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 14;
            break;
          }

          item = _step.value;
          func(item, c++);
          _context.next = 11;
          return item;

        case 11:
          _iteratorNormalCompletion = true;
          _context.next = 6;
          break;

        case 14:
          _context.next = 20;
          break;

        case 16:
          _context.prev = 16;
          _context.t0 = _context["catch"](4);
          _didIteratorError = true;
          _iteratorError = _context.t0;

        case 20:
          _context.prev = 20;
          _context.prev = 21;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 23:
          _context.prev = 23;

          if (!_didIteratorError) {
            _context.next = 26;
            break;
          }

          throw _iteratorError;

        case 26:
          return _context.finish(23);

        case 27:
          return _context.finish(20);

        case 28:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[4, 16, 20, 28], [21,, 23, 27]]);
}

function curriedTap(func, iterable) {
  if (arguments.length === 1) {
    return function (iterable) {
      return tap(func, iterable);
    };
  }

  return tap(func, iterable);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],261:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = tee;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _from = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/array/from"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _range = _interopRequireDefault(require("./range"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _dequeue = _interopRequireDefault(require("dequeue"));

function tee(iterable, number) {
  var _marked =
  /*#__PURE__*/
  _regenerator["default"].mark(teeGen);

  number = number || 2;
  var iterator = (0, _getIterator2["default"])((0, _ensureIterable["default"])(iterable));
  var exhausted = 0;
  var arrays = (0, _from["default"])((0, _range["default"])(number)).map(function () {
    return new _dequeue["default"]();
  });
  var done = false;

  function fetch() {
    var newItem = iterator.next();

    if (newItem.done) {
      done = true;
    } else {
      arrays.forEach(function (ar) {
        return ar.push(newItem.value);
      });
    }
  }

  function teeGen(a) {
    return _regenerator["default"].wrap(function teeGen$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

          case 1:
            if (!true) {
              _context.next = 14;
              break;
            }

            if (!a.length) {
              _context.next = 7;
              break;
            }

            _context.next = 5;
            return a.shift();

          case 5:
            _context.next = 12;
            break;

          case 7:
            if (!done) {
              _context.next = 11;
              break;
            }

            return _context.abrupt("return");

          case 11:
            fetch();

          case 12:
            _context.next = 1;
            break;

          case 14:
            _context.prev = 14;
            exhausted++;

            if (exhausted === number) {
              if (typeof iterator["return"] === 'function') iterator["return"]();
            }

            return _context.finish(14);

          case 18:
          case "end":
            return _context.stop();
        }
      }
    }, _marked, null, [[0,, 14, 18]]);
  }

  return arrays.map(function (a) {
    return teeGen(a);
  });
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"./range":247,"@babel/runtime-corejs2/core-js/array/from":4,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37,"dequeue":162}],262:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = toArray;

var _from = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/array/from"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

function toArray(iterable) {
  return (0, _from["default"])((0, _ensureIterable["default"])(iterable));
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/array/from":4,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],263:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = values;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/typeof"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(values);

var emptyArr = [];
var hasOwnProperty = Object.prototype.hasOwnProperty;

function values(valuesable) {
  var key;
  return _regenerator["default"].wrap(function values$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(valuesable == null)) {
            _context.next = 4;
            break;
          }

          return _context.abrupt("return", (0, _getIterator2["default"])(emptyArr));

        case 4:
          if (!(typeof valuesable.values === 'function')) {
            _context.next = 8;
            break;
          }

          return _context.delegateYield(valuesable.values(), "t0", 6);

        case 6:
          _context.next = 17;
          break;

        case 8:
          if (!((0, _typeof2["default"])(valuesable) === 'object')) {
            _context.next = 17;
            break;
          }

          _context.t1 = _regenerator["default"].keys(valuesable);

        case 10:
          if ((_context.t2 = _context.t1()).done) {
            _context.next = 17;
            break;
          }

          key = _context.t2.value;

          if (!hasOwnProperty.call(valuesable, key)) {
            _context.next = 15;
            break;
          }

          _context.next = 15;
          return valuesable[key];

        case 15:
          _context.next = 10;
          break;

        case 17:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}

module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/helpers/typeof":35,"@babel/runtime-corejs2/regenerator":37}],264:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _zipLongest = _interopRequireDefault(require("./zip-longest"));

var _default = _zipLongest["default"];
exports["default"] = _default;
module.exports = exports["default"];
},{"./zip-longest":265,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28}],265:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = zipLongest;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(zipLongest);

function zipLongest() {
  var _len,
      iterables,
      _key,
      iters,
      numberOfExhausted,
      zipped,
      i,
      _iteratorNormalCompletion,
      _didIteratorError,
      _iteratorError,
      _iterator,
      _step,
      iter,
      _iter$next,
      done,
      value,
      _iteratorNormalCompletion2,
      _didIteratorError2,
      _iteratorError2,
      _iterator2,
      _step2,
      _iter,
      _args = arguments;

  return _regenerator["default"].wrap(function zipLongest$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          for (_len = _args.length, iterables = new Array(_len), _key = 0; _key < _len; _key++) {
            iterables[_key] = _args[_key];
          }

          iters = iterables.map(function (i) {
            return (0, _getIterator2["default"])((0, _ensureIterable["default"])(i));
          });
          _context.prev = 2;

        case 3:
          if (!true) {
            _context.next = 32;
            break;
          }

          numberOfExhausted = 0;
          zipped = new Array(iterables.length);
          i = 0;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 10;

          for (_iterator = (0, _getIterator2["default"])(iters); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            iter = _step.value;
            _iter$next = iter.next(), done = _iter$next.done, value = _iter$next.value;

            if (done) {
              numberOfExhausted++;
            }

            zipped[i++] = done ? undefined : value;
          }

          _context.next = 18;
          break;

        case 14:
          _context.prev = 14;
          _context.t0 = _context["catch"](10);
          _didIteratorError = true;
          _iteratorError = _context.t0;

        case 18:
          _context.prev = 18;
          _context.prev = 19;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 21:
          _context.prev = 21;

          if (!_didIteratorError) {
            _context.next = 24;
            break;
          }

          throw _iteratorError;

        case 24:
          return _context.finish(21);

        case 25:
          return _context.finish(18);

        case 26:
          if (!(iters.length === numberOfExhausted)) {
            _context.next = 28;
            break;
          }

          return _context.abrupt("return");

        case 28:
          _context.next = 30;
          return zipped;

        case 30:
          _context.next = 3;
          break;

        case 32:
          _context.prev = 32;
          _iteratorNormalCompletion2 = true;
          _didIteratorError2 = false;
          _iteratorError2 = undefined;
          _context.prev = 36;

          for (_iterator2 = (0, _getIterator2["default"])(iters); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            _iter = _step2.value;
            if (typeof _iter["return"] === 'function') _iter["return"]();
          }

          _context.next = 44;
          break;

        case 40:
          _context.prev = 40;
          _context.t1 = _context["catch"](36);
          _didIteratorError2 = true;
          _iteratorError2 = _context.t1;

        case 44:
          _context.prev = 44;
          _context.prev = 45;

          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }

        case 47:
          _context.prev = 47;

          if (!_didIteratorError2) {
            _context.next = 50;
            break;
          }

          throw _iteratorError2;

        case 50:
          return _context.finish(47);

        case 51:
          return _context.finish(44);

        case 52:
          return _context.finish(32);

        case 53:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[2,, 32, 53], [10, 14, 18, 26], [19,, 21, 25], [36, 40, 44, 52], [45,, 47, 51]]);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],266:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = zip;

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs2/regenerator"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _ensureIterable = _interopRequireDefault(require("./internal/ensure-iterable"));

var _marked =
/*#__PURE__*/
_regenerator["default"].mark(zip);

function closeIterators(iters, except) {
  var c = 0;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator2["default"])(iters), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var iter = _step.value;

      if (c === except) {
        c++;
        continue;
      }

      if (typeof iter["return"] === 'function') iter["return"]();
      c++;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}

function zip() {
  var _len,
      iterables,
      _key,
      iters,
      zipped,
      i,
      c,
      _iteratorNormalCompletion2,
      _didIteratorError2,
      _iteratorError2,
      _iterator2,
      _step2,
      iter,
      _iter$next,
      done,
      value,
      _args = arguments;

  return _regenerator["default"].wrap(function zip$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          for (_len = _args.length, iterables = new Array(_len), _key = 0; _key < _len; _key++) {
            iterables[_key] = _args[_key];
          }

          iters = iterables.map(function (i) {
            return (0, _getIterator2["default"])((0, _ensureIterable["default"])(i));
          });
          _context.prev = 2;

        case 3:
          if (!true) {
            _context.next = 41;
            break;
          }

          zipped = new Array(iterables.length);
          i = 0;
          c = 0;
          _iteratorNormalCompletion2 = true;
          _didIteratorError2 = false;
          _iteratorError2 = undefined;
          _context.prev = 10;
          _iterator2 = (0, _getIterator2["default"])(iters);

        case 12:
          if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
            _context.next = 23;
            break;
          }

          iter = _step2.value;
          _iter$next = iter.next(), done = _iter$next.done, value = _iter$next.value;

          if (!done) {
            _context.next = 18;
            break;
          }

          closeIterators(iters, c); // clean up unfinished iterators

          return _context.abrupt("return");

        case 18:
          c++;
          zipped[i++] = value;

        case 20:
          _iteratorNormalCompletion2 = true;
          _context.next = 12;
          break;

        case 23:
          _context.next = 29;
          break;

        case 25:
          _context.prev = 25;
          _context.t0 = _context["catch"](10);
          _didIteratorError2 = true;
          _iteratorError2 = _context.t0;

        case 29:
          _context.prev = 29;
          _context.prev = 30;

          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }

        case 32:
          _context.prev = 32;

          if (!_didIteratorError2) {
            _context.next = 35;
            break;
          }

          throw _iteratorError2;

        case 35:
          return _context.finish(32);

        case 36:
          return _context.finish(29);

        case 37:
          _context.next = 39;
          return zipped;

        case 39:
          _context.next = 3;
          break;

        case 41:
          _context.prev = 41;
          closeIterators(iters);
          return _context.finish(41);

        case 44:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, null, [[2,, 41, 44], [10, 25, 29, 37], [30,, 32, 36]]);
}

module.exports = exports["default"];
},{"./internal/ensure-iterable":234,"@babel/runtime-corejs2/core-js/get-iterator":7,"@babel/runtime-corejs2/core-js/object/define-property":10,"@babel/runtime-corejs2/helpers/interopRequireDefault":28,"@babel/runtime-corejs2/regenerator":37}],267:[function(require,module,exports){
function Heap (comp, onMove) {
  this.comp = comp || function (a, b) {
    if (a > b) {
      return 1
    } else if (a < b) {
      return -1
    } else {
      return 0
    }
  }
  this.data = []
  this.onMove = onMove
}

Heap.getParentIndex = function (i) {
  var parent = i % 2 ? (i - 1) / 2 : Math.floor((i - 1) / 2)
  return parent >= 0 ? parent : undefined
}

Heap.getChild1Index = function (i) {
  return 2 * i + 1
}

Heap.getChild2Index = function (i) {
  return 2 * i + 2
}

Heap.prototype._swap = function (x, y) {
  var tmp = this.data[x]
  if (this.onMove) {
    this.onMove(this.data[x], y, x)
    this.onMove(this.data[y], x, y)
  }
  this.data[x] = this.data[y]
  this.data[y] = tmp
}

Heap.prototype._bubbleUp = function bubbleUp (i) {
  var parentIndex
  var data = this.data
  var comp = this.comp
  while (i > 0) {
    parentIndex = Heap.getParentIndex(i)
    if (comp(data[i], data[parentIndex]) < 0) {
      this._swap(i, parentIndex)
      i = parentIndex
    } else {
      return i
    }
  }
}

Heap.prototype._heapify = function heapify (i) {
  var data = this.data
  var comp = this.comp

  var child1Index = Heap.getChild1Index(i)
  var child2Index = Heap.getChild2Index(i)
  var child1isSmaller = data[child1Index] !== undefined ? comp(data[child1Index], data[i]) < 0 : false
  var child2isSmaller = data[child2Index] !== undefined ? comp(data[child2Index], data[i]) < 0 : false
  if (child1isSmaller && child2isSmaller) {
    if (comp(data[child1Index], data[child2Index]) < 0) {
      this._swap(child1Index, i)
      return child1Index
    } else {
      this._swap(child2Index, i)
      return child2Index
    }
  } else if (child1isSmaller) {
    this._swap(child1Index, i)
    return child1Index
  } else if (child2isSmaller) {
    this._swap(child2Index, i)
    return child2Index
  } else {
    return null
  }
}

Heap.prototype._bubbleDown = function bubbleDown (i) {
  var len = this.data.length
  while (i !== null && i < len) {
    i = this._heapify(i)
  }
}

Heap.prototype.buildHeap = function (items) {
  this.data = items
  for (var i = this.data.length / 2; i >= 0; i--) {
    this._heapify(i)
  }
}

Heap.prototype.pushAll = function (items) {
  for (var i = 0; i < items.length; i++) {
    this.push(items[i])
  }
}

Heap.prototype.push = function (item) {
  this.data.push(item)
  if (this.onMove) {
    this.onMove(this.data[this.data.length - 1], this.data.length - 1)
  }
  this._bubbleUp(this.data.length - 1)
}

Heap.prototype.peek = function () {
  return this.data[0]
}

Heap.prototype.pop = function () {
  if (this.data.length === 0) return
  var root = this.data[0]
  if (root === undefined) return
  if (this.onMove) {
    this.onMove(this.data[0], undefined, 0)
  }

  var last = this.data.pop()

  if (this.data.length !== 0) {
    this.data[0] = last
    if (this.onMove) {
      this.onMove(this.data[0], 0)
    }
    this._bubbleDown(0)
  }
  return root
}

Heap.prototype.popAll = function () {
  var out = []
  while (this.size()) {
    out.push(this.pop())
  }
  return out
}

Heap.prototype.size = function () {
  return this.data.length
}

Heap.prototype.indexOf = function (value) {
  var n
  var i = -1

  if (typeof value === 'function') {
    for (n = 0; n < this.data.length; n++) {
      if (value(this.data[n])) {
        i = n
        break
      }
    }
  } else {
    i = this.data.indexOf(value)
  }
  return i
}

Heap.prototype.remove = function (value) {
  var i = this.indexOf(value)
  return this.removeIndex(i)
}

Heap.prototype.get = function (i) {
  return this.data[i]
}

Heap.prototype.removeIndex = function (i) {
  var last
  if (i === -1) return
  if (this.onMove) {
    this.onMove(this.data[i], undefined, i)
  }
  if (i === this.data.length - 1) {
    last = this.data.pop()
    return last
  }

  this._swap(i, this.data.length - 1)

  last = this.data.pop()

  if (this.data.length > 1) {
    this._bubbleUp(i)
    this._bubbleDown(i)
  }
  return last
}

Heap.prototype.replaceIndex = function (i, value) {
  var last
  if (i === -1) return
  if (this.onMove) {
    this.onMove(this.data[i], undefined, i)
  }
  this.data.push(value)

  this._swap(i, this.data.length - 1)

  last = this.data.pop()

  if (this.data.length > 1) {
    this._bubbleUp(i)
    this._bubbleDown(i)
  }
  return last
}

Heap.prototype.toArray = function () {
  return this.data.slice(0)
}

module.exports = Heap

},{}],268:[function(require,module,exports){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
  typeof module === "object" ? module.exports : {}
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}

},{}],269:[function(require,module,exports){
// FK-TODO: rename this file
// FK-TODO: refactor code in this file

const SymSpell = require('./index')
// const dictionaryPath = './dictionaries/frequency_dictionary_en_82_765.txt' // for spelling correction (genuine English words)
// const bigramPath = './dictionaries/frequency_bigramdictionary_en_243_342.txt'

function createSymSpell(maxEditDistance) {
    const prefixLength = 7;
    const symSpell = new SymSpell(maxEditDistance, prefixLength);

    // await symSpell.loadDictionary(dictionaryPath, 0, 1)
    // await symSpell.loadBigramDictionary(bigramPath, 0, 2)
    return symSpell;
}

const maxEditDistance = 2;
const symSpell = createSymSpell(maxEditDistance);

function lookup(word) {
    return symSpell.lookup(word, SymSpell.Verbosity.ALL, maxEditDistance, { includeUnknown: true })
}

module.exports = {
    symSpell: symSpell,
    lookup: lookup
};

},{"./index":3}],270:[function(require,module,exports){
arguments[4][145][0].apply(exports,arguments)
},{"dup":145}],271:[function(require,module,exports){
(function (global){(function (){
'use strict';

var objectAssign = require('object.assign/polyfill')();

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:
// NB: The URL to the CommonJS spec is kept just for tradition.
//     node-assert has evolved a lot since then, both in API and behavior.

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

// Expose a strict only variant of assert
function strict(value, message) {
  if (!value) fail(value, true, message, '==', strict);
}
assert.strict = objectAssign(strict, assert, {
  equal: assert.strictEqual,
  deepEqual: assert.deepStrictEqual,
  notEqual: assert.notStrictEqual,
  notDeepEqual: assert.notDeepStrictEqual
});
assert.strict.strict = assert.strict;

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"object.assign/polyfill":288,"util/":274}],272:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],273:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],274:[function(require,module,exports){
(function (process,global){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":273,"_process":289,"inherits":272}],275:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var callBind = require('./');

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

},{"./":276,"get-intrinsic":279}],276:[function(require,module,exports){
'use strict';

var bind = require('function-bind');
var GetIntrinsic = require('get-intrinsic');

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
var $max = GetIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(bind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}

},{"function-bind":278,"get-intrinsic":279}],277:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var toStr = Object.prototype.toString;
var max = Math.max;
var funcType = '[object Function]';

var concatty = function concatty(a, b) {
    var arr = [];

    for (var i = 0; i < a.length; i += 1) {
        arr[i] = a[i];
    }
    for (var j = 0; j < b.length; j += 1) {
        arr[j + a.length] = b[j];
    }

    return arr;
};

var slicy = function slicy(arrLike, offset) {
    var arr = [];
    for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
        arr[j] = arrLike[i];
    }
    return arr;
};

var joiny = function (arr, joiner) {
    var str = '';
    for (var i = 0; i < arr.length; i += 1) {
        str += arr[i];
        if (i + 1 < arr.length) {
            str += joiner;
        }
    }
    return str;
};

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.apply(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slicy(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                concatty(args, arguments)
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        }
        return target.apply(
            that,
            concatty(args, arguments)
        );

    };

    var boundLength = max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs[i] = '$' + i;
    }

    bound = Function('binder', 'return function (' + joiny(boundArgs, ',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],278:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":277}],279:[function(require,module,exports){
'use strict';

var undefined;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = require('has-symbols')();
var hasProto = require('has-proto')();

var getProto = Object.getPrototypeOf || (
	hasProto
		? function (x) { return x.__proto__; } // eslint-disable-line no-proto
		: null
);

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' || !getProto ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined : BigInt64Array,
	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined : BigUint64Array,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols || !getProto ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols || !getProto ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols && getProto ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

if (getProto) {
	try {
		null.error; // eslint-disable-line no-unused-expressions
	} catch (e) {
		// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
		var errorProto = getProto(getProto(e));
		INTRINSICS['%Error.prototype%'] = errorProto;
	}
}

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen && getProto) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = require('function-bind');
var hasOwn = require('has');
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);
var $exec = bind.call(Function.call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	if ($exec(/^%?[^%]*%?$/, name) === null) {
		throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
	}
	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

},{"function-bind":278,"has":283,"has-proto":280,"has-symbols":281}],280:[function(require,module,exports){
'use strict';

var test = {
	foo: {}
};

var $Object = Object;

module.exports = function hasProto() {
	return { __proto__: test }.foo === test.foo && !({ __proto__: null } instanceof $Object);
};

},{}],281:[function(require,module,exports){
'use strict';

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = require('./shams');

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

},{"./shams":282}],282:[function(require,module,exports){
'use strict';

/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

},{}],283:[function(require,module,exports){
'use strict';

var hasOwnProperty = {}.hasOwnProperty;
var call = Function.prototype.call;

module.exports = call.bind ? call.bind(hasOwnProperty) : function (O, P) {
  return call.call(hasOwnProperty, O, P);
};

},{}],284:[function(require,module,exports){
'use strict';

var keysShim;
if (!Object.keys) {
	// modified from https://github.com/es-shims/es5-shim
	var has = Object.prototype.hasOwnProperty;
	var toStr = Object.prototype.toString;
	var isArgs = require('./isArguments'); // eslint-disable-line global-require
	var isEnumerable = Object.prototype.propertyIsEnumerable;
	var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
	var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
	var dontEnums = [
		'toString',
		'toLocaleString',
		'valueOf',
		'hasOwnProperty',
		'isPrototypeOf',
		'propertyIsEnumerable',
		'constructor'
	];
	var equalsConstructorPrototype = function (o) {
		var ctor = o.constructor;
		return ctor && ctor.prototype === o;
	};
	var excludedKeys = {
		$applicationCache: true,
		$console: true,
		$external: true,
		$frame: true,
		$frameElement: true,
		$frames: true,
		$innerHeight: true,
		$innerWidth: true,
		$onmozfullscreenchange: true,
		$onmozfullscreenerror: true,
		$outerHeight: true,
		$outerWidth: true,
		$pageXOffset: true,
		$pageYOffset: true,
		$parent: true,
		$scrollLeft: true,
		$scrollTop: true,
		$scrollX: true,
		$scrollY: true,
		$self: true,
		$webkitIndexedDB: true,
		$webkitStorageInfo: true,
		$window: true
	};
	var hasAutomationEqualityBug = (function () {
		/* global window */
		if (typeof window === 'undefined') { return false; }
		for (var k in window) {
			try {
				if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
					try {
						equalsConstructorPrototype(window[k]);
					} catch (e) {
						return true;
					}
				}
			} catch (e) {
				return true;
			}
		}
		return false;
	}());
	var equalsConstructorPrototypeIfNotBuggy = function (o) {
		/* global window */
		if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
			return equalsConstructorPrototype(o);
		}
		try {
			return equalsConstructorPrototype(o);
		} catch (e) {
			return false;
		}
	};

	keysShim = function keys(object) {
		var isObject = object !== null && typeof object === 'object';
		var isFunction = toStr.call(object) === '[object Function]';
		var isArguments = isArgs(object);
		var isString = isObject && toStr.call(object) === '[object String]';
		var theKeys = [];

		if (!isObject && !isFunction && !isArguments) {
			throw new TypeError('Object.keys called on a non-object');
		}

		var skipProto = hasProtoEnumBug && isFunction;
		if (isString && object.length > 0 && !has.call(object, 0)) {
			for (var i = 0; i < object.length; ++i) {
				theKeys.push(String(i));
			}
		}

		if (isArguments && object.length > 0) {
			for (var j = 0; j < object.length; ++j) {
				theKeys.push(String(j));
			}
		} else {
			for (var name in object) {
				if (!(skipProto && name === 'prototype') && has.call(object, name)) {
					theKeys.push(String(name));
				}
			}
		}

		if (hasDontEnumBug) {
			var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

			for (var k = 0; k < dontEnums.length; ++k) {
				if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
					theKeys.push(dontEnums[k]);
				}
			}
		}
		return theKeys;
	};
}
module.exports = keysShim;

},{"./isArguments":286}],285:[function(require,module,exports){
'use strict';

var slice = Array.prototype.slice;
var isArgs = require('./isArguments');

var origKeys = Object.keys;
var keysShim = origKeys ? function keys(o) { return origKeys(o); } : require('./implementation');

var originalKeys = Object.keys;

keysShim.shim = function shimObjectKeys() {
	if (Object.keys) {
		var keysWorksWithArguments = (function () {
			// Safari 5.0 bug
			var args = Object.keys(arguments);
			return args && args.length === arguments.length;
		}(1, 2));
		if (!keysWorksWithArguments) {
			Object.keys = function keys(object) { // eslint-disable-line func-name-matching
				if (isArgs(object)) {
					return originalKeys(slice.call(object));
				}
				return originalKeys(object);
			};
		}
	} else {
		Object.keys = keysShim;
	}
	return Object.keys || keysShim;
};

module.exports = keysShim;

},{"./implementation":284,"./isArguments":286}],286:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;

module.exports = function isArguments(value) {
	var str = toStr.call(value);
	var isArgs = str === '[object Arguments]';
	if (!isArgs) {
		isArgs = str !== '[object Array]' &&
			value !== null &&
			typeof value === 'object' &&
			typeof value.length === 'number' &&
			value.length >= 0 &&
			toStr.call(value.callee) === '[object Function]';
	}
	return isArgs;
};

},{}],287:[function(require,module,exports){
'use strict';

// modified from https://github.com/es-shims/es6-shim
var objectKeys = require('object-keys');
var hasSymbols = require('has-symbols/shams')();
var callBound = require('call-bind/callBound');
var toObject = Object;
var $push = callBound('Array.prototype.push');
var $propIsEnumerable = callBound('Object.prototype.propertyIsEnumerable');
var originalGetSymbols = hasSymbols ? Object.getOwnPropertySymbols : null;

// eslint-disable-next-line no-unused-vars
module.exports = function assign(target, source1) {
	if (target == null) { throw new TypeError('target must be an object'); }
	var to = toObject(target); // step 1
	if (arguments.length === 1) {
		return to; // step 2
	}
	for (var s = 1; s < arguments.length; ++s) {
		var from = toObject(arguments[s]); // step 3.a.i

		// step 3.a.ii:
		var keys = objectKeys(from);
		var getSymbols = hasSymbols && (Object.getOwnPropertySymbols || originalGetSymbols);
		if (getSymbols) {
			var syms = getSymbols(from);
			for (var j = 0; j < syms.length; ++j) {
				var key = syms[j];
				if ($propIsEnumerable(from, key)) {
					$push(keys, key);
				}
			}
		}

		// step 3.a.iii:
		for (var i = 0; i < keys.length; ++i) {
			var nextKey = keys[i];
			if ($propIsEnumerable(from, nextKey)) { // step 3.a.iii.2
				var propValue = from[nextKey]; // step 3.a.iii.2.a
				to[nextKey] = propValue; // step 3.a.iii.2.b
			}
		}
	}

	return to; // step 4
};

},{"call-bind/callBound":275,"has-symbols/shams":282,"object-keys":285}],288:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

var lacksProperEnumerationOrder = function () {
	if (!Object.assign) {
		return false;
	}
	/*
	 * v8, specifically in node 4.x, has a bug with incorrect property enumeration order
	 * note: this does not detect the bug unless there's 20 characters
	 */
	var str = 'abcdefghijklmnopqrst';
	var letters = str.split('');
	var map = {};
	for (var i = 0; i < letters.length; ++i) {
		map[letters[i]] = letters[i];
	}
	var obj = Object.assign({}, map);
	var actual = '';
	for (var k in obj) {
		actual += k;
	}
	return str !== actual;
};

var assignHasPendingExceptions = function () {
	if (!Object.assign || !Object.preventExtensions) {
		return false;
	}
	/*
	 * Firefox 37 still has "pending exception" logic in its Object.assign implementation,
	 * which is 72% slower than our shim, and Firefox 40's native implementation.
	 */
	var thrower = Object.preventExtensions({ 1: 2 });
	try {
		Object.assign(thrower, 'xy');
	} catch (e) {
		return thrower[1] === 'y';
	}
	return false;
};

module.exports = function getPolyfill() {
	if (!Object.assign) {
		return implementation;
	}
	if (lacksProperEnumerationOrder()) {
		return implementation;
	}
	if (assignHasPendingExceptions()) {
		return implementation;
	}
	return Object.assign;
};

},{"./implementation":287}],289:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[269])(269)
});
