
def _jupyter_nbextension_paths():
    return [{
        "section": "notebook",
        "src": "nbextension/static",
        "dest": "finos-perspective-jupyterlab",
        "require": "finos-perspective-jupyterlab/index"
    }]