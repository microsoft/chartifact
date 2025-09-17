import { FilterTransform, Transforms } from "vega";

export function validateTransforms(dataFrameTransformations: Transforms[]) {
    const errors: string[] = [];
    //check transformations
    if (dataFrameTransformations) {
        if (!Array.isArray(dataFrameTransformations)) {
            errors.push('Data source dataFrameTransformations must be an array');
        } else {
            dataFrameTransformations.forEach((t, index) => {
                const transformErrors = validateTransform(t);
                if (transformErrors.length > 0) {
                    errors.push(`Transform ${index} has the following errors: ${transformErrors.join(', ')}`);
                }
            });
        }
    }
    return errors;
}

export function validateTransform(transform: Transforms) {
    const errors: string[] = [];
    //check transformations
    if (transform) {
        if (typeof transform !== 'object') {
            errors.push('Transform must be an object');
        } else {
            //check for valid transformation type
            if (!transform.type) {
                errors.push('Transform must have a type');
            } else {
                //TODO validate against Vega transformation types
                switch (transform.type) {
                    case 'aggregate': {
                        //TODO validate aggregate transform
                        break;
                    }
                    case 'bin': {
                        //TODO validate bin transform
                        break;
                    }
                    case 'collect': {
                        // TODO validate collect transform
                        break;
                    }
                    case 'contour': {
                        // TODO validate contour transform
                        break;
                    }
                    case 'countpattern': {
                        // TODO validate countpattern transform
                        break;
                    }
                    case 'cross': {
                        // TODO validate cross transform
                        break;
                    }
                    case 'crossfilter': {
                        // TODO validate crossfilter transform
                        break;
                    }
                    case 'density': {
                        // TODO validate density transform
                        break;
                    }
                    case 'dotbin': {
                        // TODO validate dotbin transform
                        break;
                    }
                    case 'extent': {
                        // TODO validate extent transform
                        break;
                    }
                    case 'filter': {
                        const t = transform as FilterTransform;
                        if (!t.expr) {
                            errors.push('Filter transform must have an expr property');
                        }
                        break;
                    }
                    case 'flatten': {
                        // TODO validate flatten transform
                        break;
                    }
                    case 'fold': {
                        // TODO validate fold transform
                        break;
                    }
                    case 'force': {
                        // TODO validate force transform
                        break;
                    }
                    case 'formula': {
                        // TODO validate formula transform
                        break;
                    }
                    case 'geojson': {
                        // TODO validate geojson transform
                        break;
                    }
                    case 'geopath': {
                        // TODO validate geopath transform
                        break;
                    }
                    case 'geopoint': {
                        // TODO validate geopoint transform
                        break;
                    }
                    case 'geoshape': {
                        // TODO validate geoshape transform
                        break;
                    }
                    case 'graticule': {
                        // TODO validate graticule transform
                        break;
                    }
                    case 'heatmap': {
                        // TODO validate heatmap transform
                        break;
                    }
                    case 'identifier': {
                        // TODO validate identifier transform
                        break;
                    }
                    case 'impute': {
                        // TODO validate impute transform
                        break;
                    }
                    case 'isocontour': {
                        // TODO validate isocontour transform
                        break;
                    }
                    case 'joinaggregate': {
                        // TODO validate joinaggregate transform
                        break;
                    }
                    case 'kde': {
                        // TODO validate kde transform
                        break;
                    }
                    case 'kde2d': {
                        // TODO validate kde2d transform
                        break;
                    }
                    case 'label': {
                        // TODO validate label transform
                        break;
                    }
                    case 'linkpath': {
                        // TODO validate linkpath transform
                        break;
                    }
                    case 'loess': {
                        // TODO validate loess transform
                        break;
                    }
                    case 'lookup': {
                        // TODO validate lookup transform
                        break;
                    }
                    case 'nest': {
                        // TODO validate nest transform
                        break;
                    }
                    case 'pack': {
                        // TODO validate pack transform
                        break;
                    }
                    case 'partition': {
                        // TODO validate partition transform
                        break;
                    }
                    case 'pie': {
                        // TODO validate pie transform
                        break;
                    }
                    case 'pivot': {
                        // TODO validate pivot transform
                        break;
                    }
                    case 'project': {
                        // TODO validate project transform
                        break;
                    }
                    case 'quantile': {
                        // TODO validate quantile transform
                        break;
                    }
                    case 'regression': {
                        // TODO validate regression transform
                        break;
                    }
                    case 'resolvefilter': {
                        // TODO validate resolvefilter transform
                        break;
                    }
                    case 'sample': {
                        // TODO validate sample transform
                        break;
                    }
                    case 'sequence': {
                        // TODO validate sequence transform
                        break;
                    }
                    case 'stack': {
                        // TODO validate stack transform
                        break;
                    }
                    case 'stratify': {
                        // TODO validate stratify transform
                        break;
                    }
                    case 'timeunit': {
                        // TODO validate timeunit transform
                        break;
                    }
                    case 'tree': {
                        // TODO validate tree transform
                        break;
                    }
                    case 'treelinks': {
                        // TODO validate treelinks transform
                        break;
                    }
                    case 'treemap': {
                        // TODO validate treemap transform
                        break;
                    }
                    case 'voronoi': {
                        // TODO validate voronoi transform
                        break;
                    }
                    case 'window': {
                        // TODO validate window transform
                        break;
                    }
                    case 'wordcloud': {
                        // TODO validate wordcloud transform
                        break;
                    }
                    default: {
                        const t= transform as any;
                        errors.push(`Unknown transform type: ${t.type}`);
                    }
                }
            }
        }
    }
    return errors;
}
