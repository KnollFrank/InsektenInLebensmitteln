class TextNormalizer {

    static removeHyphenFromCompoundWords(text) {
        return TextNormalizer.#replaceAll(
            {
                text: text,
                regexp: /- /,
                replacement: ''
            });
    }

    static #replaceAll({ text, regexp, replacement }) {
        let normalizedTextIndex2TextIndex =
            Utils.range(
                {
                    start: 0,
                    stop: text.length - 1
                });

        while (text.match(regexp)) {
            text = text.replace(
                regexp,
                (match, offset) => {
                    normalizedTextIndex2TextIndex.splice(offset, match.length);
                    return replacement;
                });
        }

        return {
            normalizedText: text,
            normalizedTextIndex2TextIndex: normalizedTextIndex2TextIndex
        };
    }
}