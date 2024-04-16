class Synonyms {

    static findAllMatches(synonyms, haystack) {
        const matchesList = synonyms.map(synonym => synonym.findAllMatches(haystack));
        const matches = Utils.concatArrays(matchesList);
        return matches;
    }
}