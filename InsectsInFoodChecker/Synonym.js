class Synonym {

    name;
    patterns;

    constructor(name, patterns) {
        this.name = name;
        this.patterns = patterns;
    }

    findAllMatches(haystack) {
        return Patterns.findAllMatches(this.patterns, haystack);
    }
}
