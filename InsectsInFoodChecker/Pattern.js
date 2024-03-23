class Pattern {

    name;
    regexp;

    constructor(name, regexp) {
        this.name = name;
        this.regexp = regexp;
    }

    findAllMatches(haystack) {
        return Array.from(
            haystack.matchAll(this.regexp),
            match => ({
                pattern: this.name,
                matchedStr: match[0],
                startIndex: match.index,
            }));
    }
}
