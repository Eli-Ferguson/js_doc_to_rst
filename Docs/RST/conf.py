# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options. For a full
# list see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------

project = 'JS Doc To RST'
copyright = '2024, Eli Ferguson'
author = 'Eli Ferguson'

# The full version, including alpha/beta/rc tags
release = '0.0.1'

# -- General configuration ---------------------------------------------------

extensions = [
    'sphinx_design'
]

templates_path = ['__templates']
exclude_patterns = []

# -- Options for HTML output -------------------------------------------------

html_theme = 'pydata_sphinx_theme'
html_theme_options = {
    "github_url": "https://github.com/Eli-Ferguson/js_doc_to_rst",
    "search_bar_text": "Search The Docs",
    "show_prev_next": True,
    "secondary_sidebar_items": [
        "page-toc",
        # "edit-this-page",
        # "sourcelink"
    ],
    "footer_start": [
        # "copyright",
        # "sphinx-version"
    ],
    "footer_end": [
        "copyright"
        # "theme-version"
    ],
    "collapse_navigation": True,
    "show_nav_level": -1,
    "navigation_depth": -1
}

html_static_path = ['__static']
html_css_files = [
    'css/default.css',
]