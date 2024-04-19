class CountryProvider {

    // FK-TODO: rename defaultValue to defaultCountry
    static getCountry({ urlSearchParams, timeZone, defaultValue }) {
        const searchParam = 'country';
        if (urlSearchParams.has(searchParam)) {
            return urlSearchParams.get(searchParam);
        }
        const country = TimeZone2CountryConverter.timeZone2Country(timeZone);
        return country !== undefined ? country : defaultValue;
    }
}