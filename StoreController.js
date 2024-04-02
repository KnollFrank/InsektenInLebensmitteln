class StoreController {

    static ALL_STORES = 'All Stores';

    static configure({ storeSelectElement, stores, selectedStore, onStoreSelected }) {
        SelectController.configure(
            {
                elementSelectElement: storeSelectElement,
                elements: stores,
                selectedElement: selectedStore,
                onElementSelected: onStoreSelected
            });
    }
}
