/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
module.exports = async function() {
    // execute the standard globalTeardown.js
    const teardown = require(`@finos/perspective-test/src/js/globalTeardown.js`);
    await teardown();

    global.JUPYTERLAB_PROC.kill("SIGKILL");
};
