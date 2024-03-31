class CountryController {

    static ALL_COUNTRIES = 'All Countries';

    static configure({ countrySelectElement, countries, selectedCountry, onCountrySelected }) {
        CountryController.#setOnCountrySelectedListener(countrySelectElement, onCountrySelected);
        CountryController.#addCountryOptions(countrySelectElement, selectedCountry, countries)
    }

    static #setOnCountrySelectedListener(countrySelectElement, onCountrySelected) {
        countrySelectElement.addEventListener(
            'change',
            event => {
                const country = event.target.value;
                onCountrySelected(country);
            });
    }

    static #addCountryOptions(countrySelectElement, selectedCountry, countries) {
        for (const country of countries) {
            countrySelectElement.add(CountryController.#getCountryOption(selectedCountry, country));
        }
    }

    static #getCountryOption(selectedCountry, country) {
        return country === selectedCountry ?
            new Option(country, country, true, true) :
            new Option(country, country);
    }
}