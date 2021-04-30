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
    await page.waitForTimeout(1000);
    const viewer = await page.$(".jp-OutputArea-output perspective-viewer:not([updating])");
    await viewer.evaluate(async viewer => await viewer.flush());
    return viewer;
};

utils.with_jupyterlab(process.env.__JUPYTERLAB_PORT__, () => {
    describe.jupyter(
        () => {
            beforeAll(() => {
                /**
                 * For some reason, the first load of the Jupyter page always
                 * results in a white screen that refuses to load any further,
                 * and subsequent loads are successful.
                 */
                test.jupyterlab("Setup", [], async () => {});
            });

            test.jupyterlab("Loads a table", [["table = perspective.Table(arrow_data)\nw =perspective.PerspectiveWidget(table)"], ["w"]], async page => {
                const viewer = await default_body(page);
                const size = await viewer.evaluate(async viewer => {
                    console.log(viewer);
                    return await viewer.table.size();
                });
                expect(size).toEqual(5);
            });

            test.jupyterlab(
                "Loads an indexed table",
                [["data = {'a': [1, 2, 3, 4], 'b': ['a', 'b', 'a', 'b']}"], ["table = perspective.Table(data, index='b')\nperspective.PerspectiveWidget(table)"]],
                async page => {
                    const viewer = await default_body(page);
                    const size = await viewer.evaluate(async viewer => {
                        return await viewer.table.size();
                    });
                    expect(size).toEqual(2);
                }
            );

            test.jupyterlab("Loads an arrow", [["perspective.PerspectiveWidget(arrow_data)"]], async page => {
                const viewer = await default_body(page);
                const size = await viewer.evaluate(async viewer => {
                    return await viewer.table.size();
                });
                expect(size).toEqual(5);
            });

            test.jupyterlab("Loads a dataset with index", [["data = {'a': [1, 2, 3, 4], 'b': ['a', 'b', 'a', 'b']}"], ["perspective.PerspectiveWidget(data, index='b')"]], async page => {
                const viewer = await default_body(page);
                const size = await viewer.evaluate(async viewer => {
                    return await viewer.table.size();
                });
                expect(size).toEqual(2);
            });

            test.jupyterlab("Loads a dataset with limit", [["data = {'a': [1, 2, 3, 4], 'b': ['a', 'b', 'a', 'b']}"], ["perspective.PerspectiveWidget(data, limit=1)"]], async page => {
                const viewer = await default_body(page);
                const size = await viewer.evaluate(async viewer => {
                    return await viewer.table.size();
                });
                expect(size).toEqual(1);
            });

            test.jupyterlab("Sets columns", [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.columns = ['i8', 'f64']"]], async page => {
                const viewer = await default_body(page);
                const columns = await viewer.evaluate(viewer => {
                    return JSON.parse(viewer.getAttribute("columns"));
                });
                expect(columns).toEqual(["i8", "f64"]);
            });

            test.jupyterlab("Sets row pivots", [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.row_pivots = ['datetime', 'str']"]], async page => {
                const viewer = await default_body(page);
                const pivots = await viewer.evaluate(viewer => {
                    return JSON.parse(viewer.getAttribute("row-pivots"));
                });
                expect(pivots).toEqual(["datetime", "str"]);
            });

            test.jupyterlab("Sets column pivots", [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.column_pivots = ['str']"]], async page => {
                const viewer = await default_body(page);
                const pivots = await viewer.evaluate(viewer => {
                    return JSON.parse(viewer.getAttribute("column-pivots"));
                });
                expect(pivots).toEqual(["str"]);
            });

            test.jupyterlab(
                "Sets row and column pivots",
                [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.row_pivots = ['datetime']"], ["w.column_pivots = ['str']"]],
                async page => {
                    const viewer = await default_body(page);
                    const config = await viewer.evaluate(viewer => viewer.save());
                    expect(config["row-pivots"]).toEqual(["datetime"]);
                    expect(config["column-pivots"]).toEqual(["str"]);
                }
            );

            test.jupyterlab(
                "Sets aggregates",
                [
                    ["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"],
                    ["w"],
                    ["w.aggregates = {'datetime': 'last'}"],
                    ["w.columns = ['datetime']"],
                    ["w.row_pivots = ['str']"]
                ],
                async page => {
                    const viewer = await default_body(page);
                    const config = await viewer.evaluate(viewer => viewer.save());
                    expect(config["aggregates"]).toEqual({
                        datetime: "last"
                    });
                }
            );

            test.jupyterlab("Sets filters", [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.filters = [['bool', '==', True]]"]], async page => {
                const viewer = await default_body(page);
                const config = await viewer.evaluate(viewer => viewer.save());
                expect(config["filters"]).toEqual([["bool", "==", true]]);
            });

            test.jupyterlab("Sets sort", [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.sort = [['datetime', 'desc']]"]], async page => {
                const viewer = await default_body(page);
                const config = await viewer.evaluate(viewer => viewer.save());
                expect(config["sort"]).toEqual([["datetime", "desc"]]);
            });

            test.jupyterlab("Resets", [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table, row_pivots=['str'])"], ["w"], ["w.reset()"]], async page => {
                const viewer = await default_body(page);
                const config = await viewer.evaluate(viewer => viewer.save());
                expect(config["row-pivots"]).toEqual(null);
            });

            test.jupyterlab(
                "Restores",
                [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.restore(columns=['date'], sort=[['i64', 'desc']], row_pivots=['str'])"]],
                async page => {
                    const viewer = await default_body(page);
                    const config = await viewer.evaluate(viewer => viewer.save());
                    expect(config["columns"]).toEqual(["date"]);
                    expect(config["row-pivots"]).toEqual(["str"]);
                    expect(config["sort"]).toEqual([["i64", "desc"]]);
                }
            );

            test.jupyterlab(
                "Reads updates",
                [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.row_pivots = ['datetime', 'str']\n", "table.update(arrow_data)"]],
                async page => {
                    const viewer = await default_body(page);
                    const size = await viewer.evaluate(async viewer => await viewer.table.size());
                    expect(size).toEqual(10);
                }
            );
        },
        {name: "Simple", reload_page: false, root: path.join(__dirname, "..", "..")}
    );
});
