class UIUtils {

    static createLink({ href, text }) {
        const link = document.createElement('a');
        link.setAttribute('href', href);
        link.setAttribute('target', "_blank");
        link.appendChild(document.createTextNode(text));
        return link;
    }

    static createElementHavingClass(elementName, clazz) {
        const element = document.createElement(elementName);
        element.classList.add(clazz);
        return element;
    }

    static createDiv() {
        return document.createElement('div');
    }

    static clearChildrenOf(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }

    static instantiateTemplate(templateId) {
        return document.getElementById(templateId).content.firstElementChild.cloneNode(true);
    }

    static setVisible(element, visible) {
        element.style.display = visible ? "block" : "none";
    }

    static asHtmlUL(elements) {
        return `<ul>${UIUtils.#asHtmlLIs(elements)}</ul>`;
    }

    static #asHtmlLIs(elements) {
        return elements
            .map(element => `<li>${element}</li>`)
            .join('');
    }
}
