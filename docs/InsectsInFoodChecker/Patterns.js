class Patterns {

    static findAllMatches(patterns, haystack) {
        const matchesList = patterns.map(pattern => pattern.findAllMatches(haystack));
        const matches = Utils.concatArrays(matchesList);
        return matches;
    }
}