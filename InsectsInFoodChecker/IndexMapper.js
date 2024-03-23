class IndexMapper {

    static combineIndexMappings(indexMapping1, indexMapping2) {
        return indexMapping2.map(
            index =>
                index === undefined ?
                    undefined :
                    indexMapping1[index]);
    }
}