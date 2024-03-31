class Utils {

    static jsonArray2Str(jsonArray) {
        return jsonArray.join(', ');
    }

    static getOnlyElement(ts) {
        const arrayOfTs = [...ts];
        if (arrayOfTs.length !== 1) {
            throw new Error(ts.toString());
        }
        const [onlyElement] = arrayOfTs;
        return onlyElement;
    }

    static filterSet(set, predicate) {
        return new Set([...set].filter(predicate));
    }

    static union(sets) {
        return sets.reduce(
            (union, set) => new Set([...union, ...set]),
            new Set());
    }

    static intersection(set1, set2) {
        return new Set([...set1].filter(x => set2.has(x)));
    }

    static isEmpty(set) {
        return set.size == 0;
    }

    static compareStrsIgnoreCase(str1, str2) {
        str1 = str1.toUpperCase();
        str2 = str2.toUpperCase();
        if (str1 < str2) {
            return -1;
        }
        if (str1 > str2) {
            return 1;
        }
        return 0;
    }

    static range({ start, stop }) {
        return Array.from(
            { length: (stop - start) + 1 },
            (_, index) => start + index);
    }

    static concatArrays(arrays) {
        return [].concat(...arrays);
    }
}