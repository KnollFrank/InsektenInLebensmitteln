class Synonym {

    name;
    patterns;
    url;

    constructor(name, patterns, url) {
        this.name = name;
        this.patterns = patterns;
        this.url = url;
    }

    findAllMatches(haystack) {
        return Patterns.findAllMatches(this.patterns, haystack);
    }
}
