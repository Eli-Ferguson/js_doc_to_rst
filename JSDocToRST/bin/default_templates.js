function commentFile( file_path, comment )
{
    // console.log( 'Comment:\n', JSON.stringify( comment, null, 2 ), '\n' )
    function recursiveBuild( comment, _tab = 0 )
    {
        const tab = '\t'.repeat( _tab )

        const title = '' +
            `${ comment.headers.export ? 'Export ' : '' }` +
            `${ comment.headers.default ? 'Default ' : '' }` +
            `${ comment.headers.async ? 'Async ' : '' }` +
            `${
                [ comment.headers.caller.type, comment.headers.caller.name ]
                .filter( item => { return item && item.length > 0 } )
                .join( ' ' )
            }`

        const description = comment.breakDown.description
            ? comment.breakDown.description
                .map( comment => comment.varValue )
                .filter( comment => comment.length > 0 )
                .join( `\n\n\t${ tab }` )
            : ''
        
        const strFmt = ( param =>
        {
            let retStr = ''

            if( param.varType ) retStr += ' { ' + param.varType + ' }'

            if( param.varName && param.varValue ) retStr += ' ' + param.varName + ' - ' + param.varValue
            else if( param.varName && !param.varValue) retStr += ' ' + param.varName
            else if( !param.varName && param.varValue ) retStr += ' ' + param.varValue

            return retStr
        } )

        const others = Object.keys( comment.breakDown )
            .filter( key => ![ 'path', 'description', 'returns' ].includes( key ) )
            .map( key => {
                return comment.breakDown[ key ].map( param => {
                    return '' +
                        `\t${ tab }` +
                        `@${ key }` +
                        `${strFmt( param )}`
                } )
            } ).join( '\n\n' )

        const returns = comment.breakDown.returns
            ? comment.breakDown.returns
                .map( comment => {
                    return '' +
                        `\t${ tab }` +
                        `@returns` +
                        [
                            `${ comment.varType ? ' { ' + comment.varType + ' }' : '' }`,
                            `${ comment.varName ? ' ' + comment.varName : '' }`,
                            `${ comment.varValue ? ' ' + comment.varValue : '' }`
                        ].filter( item => item.length > 0 ).join( ' ' )
                } ).join( '\n' )
            : ''

        return '' +
        `${ title ? tab + title + ' ()\n\n' : '' }` +
        `${ description ? '\t' + tab + description + '\n\n' : '' }` +
        `${ others ? others + '\n\n' : '' }` +
        `${ returns ? returns + '\n\n' : '' }` +
        comment.inner
            .map( inner => recursiveBuild( inner, _tab + 1 ) )
            .filter( item => item && item.trim().length > 0 )
            .join( '\n\n' )
    }

    const path = comment.main || comment.alt_path
        ?`${ comment.main ? comment.main : comment.alt_path  }`
        : ''
    
    const file_label = file_path.slice( 0, -9 ).replaceAll( /(\/|\\)/g, '/' )

    return `` +
        `${ path ? '.. _' + path.replaceAll( '/', '_') + ':\n\n' : '' }` +
        `${ file_label }\n${ Array.from( { length: file_label.length }, () => '=' ).join( '' ) }\n\n` +
        `.. toctree::\n\t:hidden:\n\n` +
        recursiveBuild( comment )
}

function indexFile( args )
{
    let retStr = `` +
    `.. _${ args.dir }:\n\n` +
    `${ args.dir }\n` +
    `${ Array.from( { length: args.dir.length }, () => '=' ).join( '' ) }\n\n` +
    `${ args.hasFiles ? '.. toctree::\n\t:hidden:\n\t:glob:\n\n\t*\n\n' : '' }`

    if( args.discDirs.length > 0 )
    {
        retStr += `.. toctree::\n\t:hidden:\n\t:glob:\n\n`
        args.discDirs.forEach( dir =>
        {
            retStr += `\t${ dir.replaceAll( /(\/|\\)/g, '/' ) }/index\n`
        } )
    }

    return retStr
}

function confPy( args )
{
    return `
# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = '${ args.project ? args.project : 'Default' }'
copyright = '${ args.copyright ? args.copyright : '2024, Author' }'
author = '${ args.author ? args.author : 'Author' }'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = []

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']



# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'alabaster'
html_static_path = ['_static']
html_theme_options = {}
html_sidebars = {
    '**': ['globaltoc.html', 'searchbox.html']
}`
}

function makeBat()
{
    return `
@ECHO OFF

pushd %~dp0

REM Command file for Sphinx documentation

if "%SPHINXBUILD%" == "" (
	set SPHINXBUILD=sphinx-build
)
set SOURCEDIR=.
set BUILDDIR=_build

%SPHINXBUILD% >NUL 2>NUL
if errorlevel 9009 (
	echo.
	echo.The 'sphinx-build' command was not found. Make sure you have Sphinx
	echo.installed, then set the SPHINXBUILD environment variable to point
	echo.to the full path of the 'sphinx-build' executable. Alternatively you
	echo.may add the Sphinx directory to PATH.
	echo.
	echo.If you don't have Sphinx installed, grab it from
	echo.https://www.sphinx-doc.org/
	exit /b 1
)

if "%1" == "" goto help

%SPHINXBUILD% -M %1 %SOURCEDIR% %BUILDDIR% %SPHINXOPTS% %O%
goto end

:help
%SPHINXBUILD% -M help %SOURCEDIR% %BUILDDIR% %SPHINXOPTS% %O%

:end
popd
`
}

function makeFile()
{
    return `
# Minimal makefile for Sphinx documentation
#

# You can set these variables from the command line, and also
# from the environment for the first two.
SPHINXOPTS    ?=
SPHINXBUILD   ?= sphinx-build
SOURCEDIR     = .
BUILDDIR      = _build

# Put it first so that "make" without argument is like "make help".
help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

.PHONY: help Makefile

# Catch-all target: route all unknown targets to Sphinx using the new
# "make mode" option.  $(O) is meant as a shortcut for $(SPHINXOPTS).
%: Makefile
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)
`
}

module.exports = {
    commentFile,
    indexFile,
    confPy,
    makeBat,
    makeFile
} 