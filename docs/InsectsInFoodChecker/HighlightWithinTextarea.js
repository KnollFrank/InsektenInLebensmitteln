class HighlightWithinTextarea {

    #textAreaElement;
    #getMatchesAndIndexMapper;

    constructor(textAreaElement, getMatchesAndIndexMapper) {
        this.#textAreaElement = textAreaElement;
        this.#getMatchesAndIndexMapper = getMatchesAndIndexMapper;
    }

    initialize() {
        this.#textAreaElement.highlightWithinTextarea(
            {
                highlight: input => {
                    const { matches, indexMapper } = this.#getMatchesAndIndexMapper(input);
                    return this.#getRanges2Highlight(matches, indexMapper);
                }
            });
    }

    update() {
        this.#textAreaElement.highlightWithinTextarea('update');
    }

    #getRanges2Highlight(matches, indexMapper) {
        return matches.map(match => this.#getRange2Highlight(match, indexMapper));
    }

    #getRange2Highlight(match, indexMapper) {
        return [
            indexMapper[match.startIndex],
            indexMapper[this.#getEndIndex(match)] + 1
        ];
    }

    #getEndIndex(match) {
        return match.startIndex + match.matchedStr.length - 1;
    }
}