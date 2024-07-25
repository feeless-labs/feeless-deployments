import { Task } from '@src';
export type GaugeAdderDeployment = {
    PreviousGaugeAdder: string;
    GaugeController: string;
};
declare const _default: {
    GaugeController: Task;
    mainnet: {
        PreviousGaugeAdder: string;
    };
    goerli: {
        PreviousGaugeAdder: string;
    };
};
export default _default;
