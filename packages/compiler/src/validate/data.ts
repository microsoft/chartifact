import { DataSourceBase, Variable } from "@microsoft/chartifact-schema";
import { validateVariableID } from "./common.js";
import { validateTransforms } from "./transforms.js";


export function validateDataSourceBase(ds: DataSourceBase) {
    const errors: string[] = [];
    if (!ds.dataSourceName) {
        errors.push('Data source must have a dataSourceName');
    }
    return errors;
}

export function validateDataSource(dataSource: DataSourceBase, variables: Variable[], otherDataSources: DataSourceBase[]): string[] {
    const errors: string[] = validateDataSourceBase(dataSource);

    //ensure it has a dataSourceName
    if (!dataSource.dataSourceName) {
        errors.push('Data source must have a dataSourceName');
        return errors;
    }

    //validate the dataSourceName as valid variableId
    const idErrors = validateVariableID(dataSource.dataSourceName);
    if (idErrors.length > 0) {
        errors.push(...idErrors);
    }

    //may not end with "-selected"
    if (dataSource.dataSourceName.endsWith('-selected')) {
        errors.push('Data source name may not end with "-selected"');
    }

    //check for collision with variable names
    const existingVariable = variables?.find((v) => v.variableId === dataSource.dataSourceName);
    if (existingVariable) {
        errors.push(`Data source with dataSourceName ${dataSource.dataSourceName} collides with variable name.`);
    }

    //check for collision with other data sources
    const existingDataSource = otherDataSources.find((ds) => dataSource.dataSourceName === ds.dataSourceName);
    if (existingDataSource) {
        errors.push(`Data source with dataSourceName ${dataSource.dataSourceName} already exists.`);
    }

    //check transformations
    errors.push(...validateTransforms(dataSource.dataFrameTransformations));

    return errors;
}
