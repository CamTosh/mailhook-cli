"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
function loadConfig() {
    const configPath = node_path_1.default.join(process.cwd(), "config.json");
    if (!node_fs_1.default.existsSync(configPath)) {
        throw new Error("config.json not found in current directory");
    }
    try {
        const configFile = node_fs_1.default.readFileSync(configPath, "utf8");
        const parsedConfig = JSON.parse(configFile);
        if (!Array.isArray(parsedConfig.mailhook)) {
            throw new Error("Invalid config format: mailhook must be an array");
        }
        return parsedConfig;
    }
    catch (error) {
        throw new Error(`Error loading config.json: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
exports.loadConfig = loadConfig;
