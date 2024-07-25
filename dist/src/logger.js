"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const chalk_1 = __importDefault(require("chalk"));
const DEFAULTS = {
    verbose: false,
    silent: true,
};
class Logger {
    static setDefaults(silent, verbose) {
        DEFAULTS.silent = silent;
        DEFAULTS.verbose = verbose;
    }
    constructor(actor = '', color = 'white') {
        this.actor = actor;
        this.color = color;
    }
    info(msg) {
        if (!DEFAULTS.verbose)
            return;
        this.log(msg, '️  ', 'white');
    }
    success(msg) {
        this.log(msg, '✅', 'green');
    }
    warn(msg, error) {
        this.log(msg, '⚠️ ', 'yellow');
        if (error)
            console.error(error);
    }
    error(msg, error) {
        this.log(msg, '🚨', 'red');
        if (error)
            console.error(error);
    }
    log(msg, emoji, color = 'white') {
        if (DEFAULTS.silent)
            return;
        let formattedMessage = chalk_1.default.keyword(color)(`${emoji}  ${msg}`);
        if (DEFAULTS.verbose) {
            const formattedPrefix = chalk_1.default.keyword(this.color)(`[${this.actor}]`);
            formattedMessage = `${formattedPrefix} ${formattedMessage}`;
        }
        console.error(formattedMessage);
    }
}
exports.Logger = Logger;
exports.default = new Logger();
