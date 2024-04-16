class SpellingCorrector {

    constructor() {
        // FK-TODO: synchronize frequencyByWord partly with UnwantedIngredientsFinderFactory.getSynonyms(), neglect short words like E120
        const frequencyByWord = {
            "Zutaten": 1,
            "Schildlaus": 1,
            "Karmin": 1,
            "Schellack": 1,
            "Tenebrio": 1,
            "molitor": 1,
            "Mehlkäfer": 1,
            "Mehlwurm": 1,
            "Mehlwürmer": 1,
            "Locusta": 1,
            "migratoria": 1,
            "Wanderheuschrecke": 1,
            "Acheta": 1,
            "domesticus": 1,
            "Hausgrille": 1,
            "Alphitobius": 1,
            "diaperinus": 1,
            "Buffalowurm": 1,
            "Buffalowürmer": 1,
            "Getreideschimmelkäfer": 1,
        };
        for (const [word, frequency] of Object.entries(frequencyByWord)) {
            symSpell.symSpell.createDictionaryEntry(word, frequency);
        }
    }

    correctText(text) {
        let correctedText = '';
        let _text = '';
        let correctedTextIndex2TextIndex = [];
        for (const part of this.#splitIntoParts(text)) {
            const {
                correctedText: correctedText4Part,
                correctedTextIndex2TextIndex: correctedTextIndex2TextIndex4Part
            } = this.correctWordWithinString(part);
            correctedTextIndex2TextIndex =
                correctedTextIndex2TextIndex.concat(
                    this.#addAddendToTextIndexes(
                        correctedTextIndex2TextIndex4Part,
                        _text.length));
            correctedText += correctedText4Part;
            _text += part;
        }

        return {
            correctedText: correctedText,
            correctedTextIndex2TextIndex: correctedTextIndex2TextIndex
        }
    }

    correctWordWithinString(text) {
        const prefixWordSuffix = WordWithinTextFinder.findWordWithinText(text);
        return prefixWordSuffix !== null ?
            this.#correctPrefixWordSuffix(prefixWordSuffix) :
            {
                correctedText: text,
                correctedTextIndex2TextIndex:
                    Utils.range(
                        {
                            start: 0,
                            stop: text.length - 1
                        })
            };
    }

    #correctPrefixWordSuffix(prefixWordSuffix) {
        const correctedWord = this.#correctWord(prefixWordSuffix.word);
        return {
            correctedText: prefixWordSuffix.prefix + correctedWord + prefixWordSuffix.suffix,
            correctedTextIndex2TextIndex:
                Utils.concatArrays([
                    Utils.range(
                        {
                            start: 0,
                            stop: prefixWordSuffix.prefix.length - 1
                        }),
                    Array(Math.trunc(correctedWord.length / 2)).fill(prefixWordSuffix.prefix.length),
                    Array(correctedWord.length - Math.trunc(correctedWord.length / 2)).fill(prefixWordSuffix.prefix.length + prefixWordSuffix.word.length - 1),
                    Utils.range(
                        {
                            start: prefixWordSuffix.prefix.length + prefixWordSuffix.word.length,
                            stop: prefixWordSuffix.prefix.length + prefixWordSuffix.word.length + prefixWordSuffix.suffix.length - 1
                        })
                ])
        }
    }

    #correctWord(word) {
        return symSpell.lookup(word)[0].term;
    }

    #splitIntoParts(str) {
        return str.split(/(\s+)/);
    }

    #addAddendToTextIndexes(correctedTextIndex2TextIndex, addend) {
        return correctedTextIndex2TextIndex.map(
            textIndex =>
                textIndex === undefined ?
                    undefined :
                    textIndex + addend);
    }
}