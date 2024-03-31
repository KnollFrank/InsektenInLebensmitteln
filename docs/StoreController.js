// FK-TODO: DRY with CountryController
class StoreController {

    static ALL_STORES = 'All Stores';

    static configure({ storeSelectElement, stores, selectedStore, onStoreSelected }) {
        StoreController.#setOnStoreSelectedListener(storeSelectElement, onStoreSelected);
        StoreController.#addStoreOptions(storeSelectElement, selectedStore, stores)
    }

    static #setOnStoreSelectedListener(storeSelectElement, onStoreSelected) {
        storeSelectElement.addEventListener(
            'change',
            event => {
                const store = event.target.value;
                onStoreSelected(store);
            });
    }

    static #addStoreOptions(storeSelectElement, selectedStore, stores) {
        for (const store of stores) {
            storeSelectElement.add(StoreController.#getStoreOption(selectedStore, store));
        }
    }

    static #getStoreOption(selectedStore, store) {
        return store === selectedStore ?
            new Option(store, store, true, true) :
            new Option(store, store);
    }
}