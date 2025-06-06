
export type BASE_TYPE = string | number | boolean;

export interface Command {
    id: string;
    parameters: BASE_TYPE[];
    execute(): void;
    before(): BASE_TYPE[];
}

export abstract class CommandImpl implements Command {
    abstract id: string;
    parameters: BASE_TYPE[];
    abstract requiredParameters: number;

    constructor(...parameters: BASE_TYPE[]) {
        this.parameters = parameters;
    }

    checkParameters() {
        for (let i = 0; i < this.requiredParameters; i++) {
            if (this.parameters[i] == undefined) {
                throw new CommandMissingParameterError(i);
            }
        }
        if (!this.validParameters(...this.parameters)) {
            throw new CommandInvalidParametersError(this.parameters);
        }
    }

    execute() {
        this.checkParameters();
        this.executeWithParameters(...this.parameters);
    }

    executionError(message?: string) {
        throw new CommandExecutionError(this.id, this.parameters, message);
    }

    abstract validParameters(...parameters: BASE_TYPE[]): boolean;

    abstract executeWithParameters(...parameters: BASE_TYPE[]): void;

    before(): BASE_TYPE[] {
        return ['command.' + this.id, ...this.parameters];
    }

    toString(): string {
        return JSON.stringify([this.id, ...this.parameters]);
    }

    fromString(value: string) {
        const values = JSON.parse(value);
        this.id = values[0];
        this.parameters = values.slice(1);
    }
}

export class CommandUnknownError extends Error {
    id: string;

    constructor(id: string, message?: string, options?: ErrorOptions) {
        super(message, options)
        this.id = id;
    }
}

export class CommandExecutionError extends Error {
    id: string;
    parameters: BASE_TYPE[];

    constructor(id: string, parameters: BASE_TYPE[], message?: string, options?: ErrorOptions) {
        super(message, options)
        this.id = id;
        this.parameters = parameters;
    }
}

export class CommandMissingParameterError extends Error {
    parameter: number;

    constructor(parameter: number, message?: string, options?: ErrorOptions) {
        super(message, options)
        this.parameter = parameter;
    }
}

export class CommandInvalidParametersError extends Error {
    parameters: BASE_TYPE[];

    constructor(parameters: BASE_TYPE[], message?: string, options?: ErrorOptions) {
        super(message, options)
        this.parameters = parameters;
    }
}