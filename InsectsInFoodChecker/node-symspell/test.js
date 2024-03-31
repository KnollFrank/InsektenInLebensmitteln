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
