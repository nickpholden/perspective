/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const path = require("path");
const {request} = require("http");
const {spawn} = require("child_process");

const ROOT = path.join(__dirname, "..", "..", "..", "..", "..");
const PACKAGE_ROOT = path.join(__dirname, "..", "..", "..");

const wait_for_jlab = async function() {
    let loaded = false;

    while (!loaded) {
        const req = request(`http://localhost:${process.env.__JUPYTERLAB_PORT__}`).end();
        req.on("error", () => console.error);
        req.on("response", () => {
            loaded = true;
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
};

module.exports = async function() {
    // link and install the local jupyterlab plugin
    //require(`${ROOT}/scripts/jlab_link`);

    process.env.JUPYTER_CONFIG_DIR = path.join(PACKAGE_ROOT, "test", "config", "jupyter");
    console.log(process.env.JUPYTER_CONFIG_DIR);

    // start jupyterlab with a root to dist/umd where the notebooks will be.
    process.chdir(path.join(PACKAGE_ROOT, "dist", "umd"));

    global.JUPYTERLAB_PROC = spawn("jupyter", ["lab", "--no-browser", `--port=${process.env.__JUPYTERLAB_PORT__}`, `--config=${process.env.JUPYTER_CONFIG_DIR}/jupyter_notebook_config.json`], {
        env: {
            ...process.env,
            PYTHONPATH: path.join(ROOT, "python", "perspective")
        }
    });

    const kill_jupyterlab = () => {
        console.log("killing jlab");
        global.JUPYTERLAB_PROC.kill("SIGKILL");
    };

    // Kill the child process if the parent is interrupted
    process.on("SIGINT", kill_jupyterlab);
    process.on("SIGABRT", kill_jupyterlab);

    // execute the standard globalSetup.js which will set up the
    // Puppeteer browser instance.
    const setup = require(`@finos/perspective-test/src/js/globalSetup.js`);
    await setup();

    // wait for Jupyter to start
    await wait_for_jlab();
};
