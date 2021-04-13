/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const fs = require("fs");
const path = require("path");
const {promisify} = require("util");
const rimraf = require("rimraf");
const exec = promisify(require("child_process").exec);
const notebook_template = require("./notebook_template.json");

const DIST_ROOT = path.join(__dirname, "..", "..", "dist", "umd");
const TEST_CONFIG_ROOT = path.join(__dirname, "..", "config", "jupyter");

const remove_jupyter_artifacts = () => {
    rimraf(path.join(TEST_CONFIG_ROOT, "lab"), () => {});
    rimraf(path.join(DIST_ROOT, ".ipynb_checkpoints"), () => {});
};

// Add Jupyterlab-specific bindings to the global Jest objects
describe.jupyter = (body, {name, root} = {}) => {
    if (!root) throw new Error("Jupyter tests require a test root!");

    // Remove the automatically generated workspaces directory, as it
    // will try to redirect single-document URLs to the last URL opened.
    beforeEach(remove_jupyter_artifacts);
    afterAll(remove_jupyter_artifacts);

    // URL is null because each test.capture_jupyterlab will have its own
    // unique notebook generated.
    return describe.page(null, body, {reload_page: false, name: name, root: root});
};

test.capture_jupyterlab = (name, cells, body, args = {}) => {
    const notebook_name = `${name.replace(/[ \.']/g, "_")}.ipynb`;
    const notebook_path = path.join(DIST_ROOT, notebook_name);

    // deepcopy the notebook template so we are not modifying a shared object
    const nb = JSON.parse(JSON.stringify(notebook_template));

    // import perspective, set up test data etc.
    nb["cells"] = [
        {
            cell_type: "code",
            execution_count: null,
            metadata: {},
            outputs: [],
            source: ["import perspective\n", "import pandas as pd\n", "import numpy as np\n", "arrow_data = None\n", "with open('test.arrow', 'rb') as arrow: \n    arrow_data = arrow.read()"]
        }
    ];

    // Cells defined in the test as an array of arrays - each inner array
    // is a new cell to be added to the notebook.
    for (const cell of cells) {
        nb["cells"].push({
            cell_type: "code",
            execution_count: null,
            metadata: {},
            outputs: [],
            source: cell
        });
    }

    // Write the notebook to dist/umd
    fs.writeFileSync(notebook_path, JSON.stringify(nb));

    args = Object.assign(args, {
        jupyter: true,
        wait_for_update: false,
        fail_on_errors: false,
        url: `doc/tree/${notebook_name}`
    });

    test.capture(name, body, args);
};

module.exports = {
    get_jupyter_token: async () => {
        const result = await exec("jupyter server list");
        if (result.stdout === "Currently running servers:") {
            throw new Error("[get_jupyter_token] Jupyter servers not running!");
        }
        const servers = result.stdout.split("\n").slice(1);

        for (const server of servers) {
            let data = server.split("::");
            let url = data[0];
            let path = data[1];

            if (path.includes("perspective-jupyterlab/dist/umd")) {
                const token = url.trim().split("?token=");
                return token[token.length - 1].trim();
            }
        }
    },
    restart_kernel: async page => {
        await page.waitForSelector(".p-Widget", {visible: true});
        await page.waitForSelector(".jp-NotebookPanel-toolbar");
        await page.click(".jp-NotebookPanel-toolbar .jp-Button[title='Restart the kernel']");
    },
    execute_cell: async page => {
        await page.waitForSelector(".p-Widget", {visible: true});
        await page.waitForSelector(".jp-NotebookPanel-toolbar");
        await page.click(".jp-NotebookPanel-toolbar .jp-Button[title='Run the selected cells and advance']");
    },
    execute_all_cells: async page => {
        await page.waitForSelector(".p-Widget", {visible: true});
        await page.waitForSelector(".jp-NotebookPanel-toolbar", {visible: true});

        // give jlab a second to render - otherwise the attempts to click will
        // be flaky and work erratically.
        await page.waitForTimeout(1000);

        await page.click(".jp-NotebookPanel-toolbar .jp-Button[title='Restart the kernel, then re-run the whole notebook']");
        await page.waitForSelector(".jp-Dialog-content", {visible: true});
        await page.click(".jp-Dialog-content button.jp-mod-accept");
        await page.evaluate(() => (document.scrollTop = 0));
    }
};
