// webpack.config.js (ESM mód)
import path from "path";
import webpack from "webpack";
import nodeExternals from "webpack-node-externals";
import { fileURLToPath } from "url";
import CopyWebpackPlugin from "copy-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: webpack.Configuration = {
    mode: (process.env.NODE_ENV as 'development' | 'production') || 'development',
    target: "node",
    entry: "./src/index.ts",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "main.js", // ESM kimenet

        module: true, // <-- fontos
    },
    experiments: {
        outputModule: true, // <-- fontos
    },
    externals: [
        nodeExternals({
            importType: "module", // <-- externálok ESM importtal
            allowlist: []
        }),
    ],
    externalsType: "module",
    resolve: { extensions: [".ts", ".js"] },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: "ts-loader",
                exclude: [
                    /node_modules/,
                ],
                options: { transpileOnly: true },
            },
        ],
    },
    optimization: {
        sideEffects: false,
        concatenateModules: false,
        minimize: false,
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: ".env",             // forrás
                    to: "",               // cél (dist/.env)
                    noErrorOnMissing: true,   // ha nincs .env, ne dobjon hibát
                },
            ],
        }),
    ],
};
export default config;