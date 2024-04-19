class URLSearchParamsProvider {

    static hasAllCountryStoreCategory(urlSearchParams) {
        return urlSearchParams.has('country') && urlSearchParams.has('store') && urlSearchParams.has('category');
    }

    static getCountryStoreCategory(urlSearchParams) {
        return {
            country: CountryProvider.getCountry(
                {
                    urlSearchParams: urlSearchParams,
                    searchParam: 'country',
                    timeZone: TimeZoneProvider.getUserTimeZone(),
                    defaultCountry: CountryController.ALL_COUNTRIES
                }),
            store: UrlUtils.getSearchParam(urlSearchParams, 'store', StoreController.ALL_STORES),
            category: UrlUtils.getSearchParam(urlSearchParams, 'category', 'Groceries')
        };
    }
}