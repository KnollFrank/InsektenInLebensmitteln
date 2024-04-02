class CountryController {

    static ALL_COUNTRIES = 'All Countries';

    static configure({ countrySelectElement, countries, selectedCountry, onCountrySelected }) {
        SelectController.configure(
            {
                elementSelectElement: countrySelectElement,
                elements: countries,
                selectedElement: selectedCountry,
                onElementSelected: onCountrySelected
            });
    }
}