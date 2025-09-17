import { Spec as VegaSpec } from "vega-typings";
import { TopLevelSpec as VegaLiteSpec } from 'vega-lite'
import { GenericHConcatSpec, GenericVConcatSpec } from "vega-lite/types_unstable/spec/concat.js";
import { GenericLayerSpec } from "vega-lite/types_unstable/spec/layer.js";

export function validateVegaChart(_spec: object): string[] {
    const errors: string[] = [];
    const spec = _spec as VegaSpec;
    // validate that the spec is a valid Vega spec
    return errors;
}

export function validateVegaLite(_spec: object): string[] {
    const errors: string[] = [];
    const spec = _spec as VegaLiteSpec;
    // validate that the spec is a valid Vega-Lite spec
    if (!spec.data) {
        errors.push(`Vega-Lite chart is missing data`);
    }
    // const inlineData = chart.spec.data as InlineData;
    // if (inlineData.values) {
    //     //make sure that '{"expr":' does not appear in stringified JSON of values
    //     if (JSON.stringify(inlineData.values).includes('{"expr":')) {
    //         return `Vega-Lite chart may not contain an expression in the data values, use a transform instead.`;
    //     }
    // }

    return errors;
}

export function validateVegaLiteByComparison(specTemplate: VegaLiteSpec, spec: VegaLiteSpec): string[] {
    const noLayerOrConcatMsg = 'You may NOT use layer, hconcat, or vconcat in this chart, please use the template and only make minimal changes.';

    const errors: string[] = [];
    // ensure that hconcat is consistent between the spec and the template
    if ((spec as GenericHConcatSpec<any>).hconcat && !(specTemplate as GenericHConcatSpec<any>).hconcat) {
        errors.push(noLayerOrConcatMsg);
    } else if (!(spec as GenericHConcatSpec<any>).hconcat && (specTemplate as GenericHConcatSpec<any>).hconcat) {
        errors.push('You must use hconcat in this chart.');
    }
    // ensure that vconcat is consistent between the spec and the template
    if ((spec as GenericVConcatSpec<any>).vconcat && !(specTemplate as GenericVConcatSpec<any>).vconcat) {
        errors.push(noLayerOrConcatMsg);
    } else if (!(spec as GenericVConcatSpec<any>).vconcat && (specTemplate as GenericVConcatSpec<any>).vconcat) {
        errors.push('You must use vconcat in this chart.');
    }
    // ensure that layer is consistent between the spec and the template
    if ((spec as GenericLayerSpec<any>).layer && !(specTemplate as GenericLayerSpec<any>).layer) {
        errors.push(noLayerOrConcatMsg);
    } else if (!(spec as GenericLayerSpec<any>).layer && (specTemplate as GenericLayerSpec<any>).layer) {
        errors.push('You must use layer in this chart.');
    }
    
    return errors;
}