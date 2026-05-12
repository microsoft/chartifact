// Stub for @modelcontextprotocol/sdk/validation/ajv-provider
// Aliased in vite.bundle.config.js to avoid pulling ajv into the browser bundle.
// We use zod schemas via McpServer.tool(), so the AJV validator path is never executed.
export class AjvJsonSchemaValidator {
    constructor() {}
    getValidator() {
        return (input) => ({ valid: true, data: input, errorMessage: undefined });
    }
}
