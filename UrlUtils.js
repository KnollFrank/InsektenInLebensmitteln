class UrlUtils {

    static isValidUrl(urlString) {
        try {
            new URL(urlString);
            return true;
        }
        catch (_) {
            return false;
        }
    }

    static getSearchParam(urlParams, searchParam, defaultValue) {
        return urlParams.has(searchParam) ?
            urlParams.get(searchParam) :
            defaultValue;
    }

    static isSearchParamNO(urlParams, searchParam) {
        return UrlUtils.getSearchParam(urlParams, searchParam, 'YES').toUpperCase() == 'NO';
    }

    static loadPage(location) {
        window.location = location;
    }
}