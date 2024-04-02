class SelectController {

    static configure({ elementSelectElement, elements, selectedElement, onElementSelected }) {
        SelectController.#setOnElementSelectedListener(elementSelectElement, onElementSelected);
        SelectController.#addOptions(elementSelectElement, selectedElement, elements)
    }

    static #setOnElementSelectedListener(elementSelectElement, onElementSelected) {
        elementSelectElement.addEventListener(
            'change',
            event => {
                const element = event.target.value;
                onElementSelected(element);
            });
    }

    static #addOptions(elementSelectElement, selectedElement, elements) {
        for (const element of elements) {
            elementSelectElement.add(SelectController.#getElementOption(selectedElement, element));
        }
    }

    static #getElementOption(selectedElement, element) {
        return element === selectedElement ?
            new Option(element, element, true, true) :
            new Option(element, element);
    }
}