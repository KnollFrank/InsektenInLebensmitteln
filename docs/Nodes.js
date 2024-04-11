class Nodes {

    static getNodeNamed(nodes, name) {
        return Utils.getOnlyElement([...nodes].filter(node => node.getName() === name));
    }

    static getNodeHavingDisplayName(nodes, displayName) {
        return Utils.getOnlyElement([...nodes].filter(node => node.getDisplayName() === displayName));
    }
}