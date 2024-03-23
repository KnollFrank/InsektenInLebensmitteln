class WordWithinTextFinder {

    static #pattern = /([()\[\],.;\s]*)([^()\[\],.;\s]+)([()\[\],.;\s]*)/;

    static findWordWithinText(text) {
        const match = text.match(WordWithinTextFinder.#pattern);
        return match !== null ?
            {
                prefix: match[1],
                word: match[2],
                suffix: match[3]
            } :
            null;
    }
}