function basicColors( colorsList = [ { name: 'red', value: 'red' }, { name: 'green', value: 'green' }, { name: 'blue', value: 'blue' } ] )
{
    const colors = [
        colorsList
            .map( color => `\t<style> .${ color.name } {color:${ color.value }} </style>\n` )
            .join( '' ),
        colorsList
            .map( color => `.. role:: ${ color.name }\n\n` )
            .join( '' )
    ].join( '\n' )

    return `${ colors ? '.. raw:: html\n\n' + colors + '\n' : ''}`
}

function commentFile( file_label, comment )
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
        
        const underscoredTitle = Array.from( { length: title.length }, () => '-' ).join( '' )

        const description = comment.breakDown.description
            ? comment.breakDown.description
                .map( comment => comment.varValue )
                .filter( comment => comment.length > 0 )
                .join( `\n\n\t${ tab }` )
            : ''
        
        const strFmt = ( param =>
        {
            let retStr = ''

            if( param.varType ) retStr += ' :blue:\`{ ' + param.varType + ' }\`'

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
                        `*${ key }*` +
                        `${strFmt( param )}`
                } ).join( '\n\n' )
            } ).join( '\n\n' )

        const returns = comment.breakDown.returns
            ? comment.breakDown.returns
                .map( comment => {
                    return '' +
                        `\t${ tab }` +
                        `*Returns*` +
                        [
                            `${ comment.varType ? ' :blue:\`{ ' + comment.varType + ' }\`' : '' }`,
                            `${ comment.varName ? ' ' + comment.varName : '' }`,
                            `${ comment.varValue ? ' ' + comment.varValue : '' }`
                        ].filter( item => item.length > 0 ).join( ' ' )
                } ).join( '\n' )
            : ''

        return '' +
        `${
            title
                ? _tab === 0
                    ? tab + title + '\n' + tab + underscoredTitle + '\n\n'
                    // : tab + '\`\`' + title + '\`\`\n\n'
                    : tab + '**' + title + '**\n\n'
                : ''
        }` +
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

    

    return basicColors() +
        `${ path ? '.. _' + path.replaceAll( /(\/|\\)/g, '_') + ':\n\n' : '' }` +
        `${ file_label.replaceAll( /(\/|\\)/g, '/' ) }\n${ Array.from( { length: file_label.length }, () => '=' ).join( '' ) }\n\n` +
        recursiveBuild( comment )
}

function initialIndexFile( args )
{
    let retStr = `` +
    `.. _${ args.dir }:\n\n` +
    basicColors()

    const welcome = `Welcome Page For Documentation`
    const welcomeUnderline = `${ Array.from( { length: welcome.length }, () => '=' ).join( '' ) }`

    const description = args?.parentArgs?.indexDescription
        ? args.parentArgs.indexDescription
        : args?.parentArgs?.sphinx?.sphinx_designs
            ? `Documentation for: :blue:\`${ args.parentArgs.source }\`\n\tBuilt Using: Sphinx Design`
            : `Documentation for: :blue:\`${ args.parentArgs.source }\`\n\tBuilt Using: Sphinx`

    retStr += `${ welcome }\n${ welcomeUnderline }\n\n${ description }\n\n`

    if( args.discDirs.length > 0 )
    {
        retStr += args.discDirs.map( dir =>
        {
            return `.. toctree::\n\t:hidden:\n\t:glob:\n\n` +
            `\t${ dir.replaceAll( /(\/|\\)/g, '/' ) }/index\n`
        } ).join( '\n' )

        if( args?.parentArgs?.sphinx?.sphinx_designs )
        {
            args.discDirs.forEach( dir =>
            {
                retStr += `\n` +
                `.. card::\n` +
                `\t:link-type: any\n` +
                `\t:link: ${ dir.replaceAll( /(\/|\\)/g, '/' ) }\n\n` +
                `\t${ dir.replaceAll( /(\/|\\)/g, '/' ) }\n`
            } )
        }
        else
        {
            args.discDirs.forEach( dir =>
            {
                retStr += `\n- See :ref:\`${ dir.replaceAll( /(\/|\\)/g, '/' ) }\`\n`
            } )
        }
    }

    return retStr
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

        if( args?.sphinx?.sphinx_designs )
        {
            args.discDirs.forEach( dir =>
            {
                retStr += `\n` +
                `.. card::\n` +
                `\t:link-type: any\n` +
                `\t:link: ${ dir.replaceAll( /(\/|\\)/g, '/' ) }\n\n` +
                `\t${ dir.replaceAll( /(\/|\\)/g, '/' ) }\n`
            } )
        }
        else
        {
            args.discDirs.forEach( dir =>
            {
                retStr += `\n- See :ref:\`${ dir.replaceAll( /(\/|\\)/g, '/' ) }\`\n`
            } )
        }
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
    initialIndexFile,
    indexFile,
    confPy,
    makeBat,
    makeFile
} 