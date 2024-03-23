class Patterns {

    #patterns;

    constructor(patterns) {
        this.#patterns = patterns;
    }

    findAllMatches(haystack) {
        const matchesList = this.#patterns.map(pattern => pattern.findAllMatches(haystack));
        const matches = Utils.concatArrays(matchesList);
        return matches;
    }
}