import { Task } from '@src';
export type GaugeAdderDeployment = {
    GaugeController: string;
    AuthorizerAdaptorEntrypoint: string;
};
declare const _default: {
    AuthorizerAdaptorEntrypoint: Task;
    iotatestnet: {
        GaugeController: Task;
    };
    goerli: {
        GaugeController: Task;
    };
    sepolia: {
        GaugeController: Task;
    };
};
export default _default;
