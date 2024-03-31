class UnaryFunctionCache {

    #unaryFunction;
    #arg;
    #result;

    constructor(unaryFunction) {
        this.#unaryFunction = unaryFunction;
        this.#arg = null;
        this.#result = null;
    }

    invoke(arg) {
        if (this.#arg !== arg) {
            this.#arg = arg;
            this.#result = this.#unaryFunction(arg);
        }
        return this.#result;
    }
}