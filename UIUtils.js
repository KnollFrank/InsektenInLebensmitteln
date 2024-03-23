class UIUtils {

    // FK-TODO: use a <template> in index.html
    static createHeading(text) {
        const heading = document.createElement('h2');
        heading.appendChild(document.createTextNode(text));
        return heading;
    }

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

    static clearChildrenOf(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }

    static instantiateTemplate(templateId) {
        return document.getElementById(templateId).content.firstElementChild.cloneNode(true);
    }

    static show(element) {
        element.style.display = "block";
    }

    static hide(element) {
        element.style.display = "none";
    }
}
