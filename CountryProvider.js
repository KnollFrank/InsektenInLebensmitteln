class CountryProvider {

    static getCountry({ urlSearchParams, searchParam, timeZone, defaultCountry }) {
        if (urlSearchParams.has(searchParam)) {
            return urlSearchParams.get(searchParam);
        }
        const country = TimeZone2CountryConverter.timeZone2Country(timeZone);
        return country !== undefined ? country : defaultCountry;
    }
}