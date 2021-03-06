/******************************************************************************
 *
 * Copyright (c) 2021, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const orig = require("./plugin.config");
const path = require("path");
const nodeExternals = require("webpack-node-externals");
const PerspectivePlugin = require("@finos/perspective-webpack-plugin");
const exp = { ...orig };

exp.entry = {
  index: "./src/ts/extension.ts",
};

exp.output = {
  filename: "[name].js",
  libraryTarget: "amd",
  path: path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "python",
    "perspective",
    "perspective",
    "nbextension",
    "static"
  ),
};

exp.resolve.modules = [
  path.resolve(__dirname, "../../../../node_modules"),
  path.resolve(__dirname, "../../node_modules"),
  "node_modules",
];

exp.externals = [
  "@jupyterlab",
  "@lumino",
  "@jupyter-widgets",
];

module.exports = exp;
