/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");
const utils = require("@finos/perspective-test");
const {execute_all_cells} = require("./utils");

const default_body = async page => {
    await execute_all_cells(page);
    await page.waitForSelector(".jp-OutputArea-output perspective-viewer:not([updating])");
    const viewer = await page.$(".jp-OutputArea-output perspective-viewer:not([updating])");
    await page.evaluate(element => element.scrollIntoView(), viewer);
    await page.waitForSelector(".jp-OutputArea-output perspective-viewer:not([updating])");
    await page.waitForTimeout(1000);
};

utils.with_jupyterlab(process.env.__JUPYTERLAB_PORT__, () => {
    describe.jupyter(
        () => {
            test.capture_jupyterlab("Loads a table", [["table = perspective.Table(arrow_data)\nperspective.PerspectiveWidget(table)"]], default_body);

            test.capture_jupyterlab("Loads an indexed table", [["table = perspective.Table(arrow_data, index='i32')\nperspective.PerspectiveWidget(table)"]], default_body);

            test.capture_jupyterlab("Loads a simple dataset", [["perspective.PerspectiveWidget({'a': [1, 2, 3, 4]})"]], default_body);

            test.capture_jupyterlab("Loads an arrow", ["perspective.PerspectiveWidget(arrow_data)"], default_body);

            test.capture_jupyterlab("Loads an arrow, indexed", ["perspective.PerspectiveWidget(arrow_data, index='i64')"], default_body);

            test.capture_jupyterlab("Loads an arrow, limit", ["perspective.PerspectiveWidget(arrow_data, limit=2)"], default_body);

            test.capture_jupyterlab("Sets columns", [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.columns = ['i8', 'f64']"]], default_body);

            test.capture_jupyterlab(
                "Sets row pivots",
                [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.row_pivots = ['datetime', 'str']"]],
                default_body
            );

            test.capture_jupyterlab(
                "Sets column pivots",
                [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.column_pivots = ['str']"]],
                default_body
            );

            test.capture_jupyterlab(
                "Sets row and column pivots",
                [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.row_pivots = ['datetime']"], ["w.column_pivots = ['str']"]],
                default_body
            );

            test.capture_jupyterlab(
                "Sets aggregates",
                [
                    ["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"],
                    ["w"],
                    ["w.aggregates = {'datetime': 'last'}"],
                    ["w.columns = ['datetime']"],
                    ["w.row_pivots = ['str']"]
                ],
                default_body
            );

            test.capture_jupyterlab(
                "Sets filters",
                [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.filters = [['bool', '==', True]]"]],
                default_body
            );

            test.capture_jupyterlab(
                "Sets sort",
                [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.columns = ['datetime', 'f64']\n"], "w.sort = [['datetime', 'desc']]"],
                default_body
            );

            test.capture_jupyterlab("Resets", [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.columns = ['str']"], ["w.reset()"]], default_body);

            test.capture_jupyterlab(
                "Restores config",
                [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.restore(columns=['date'], sort=[['i64', 'desc']], row_pivots=['str'])"]],
                default_body
            );

            test.capture_jupyterlab(
                "Reads updates",
                [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.row_pivots = ['datetime', 'str']\n", "table.update(arrow_data)"]],
                default_body
            );
        },
        {name: "Simple", reload_page: false, root: path.join(__dirname, "..", "..")}
    );
});
