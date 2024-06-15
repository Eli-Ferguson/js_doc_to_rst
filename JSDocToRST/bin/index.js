#! /usr/bin/env node

const fs = require( 'fs' )
const path = require( 'path' )
const { execSync } = require('child_process')

const javascript_file_comments = require( './js_comments' )

const defaultTemplates = require( './default_templates' )

function load_files( curr_path, fileTypes, files=[] )
{
    fs.readdirSync( curr_path ).forEach( file =>
    {
        const new_path = path.join( curr_path, file )
        if ( fs.statSync( new_path ).isDirectory() )
        {
            load_files( new_path, fileTypes, files )
        }
        else
        {
            if( fileTypes.includes( file.split( '.' ).pop() ) )
            {
                files.push( new_path )
            }
        }
    } )
    return files
}

function prettyPrint( obj )
{
    const func_def = obj.function
    delete func_def._function

    return {
        file_path: obj.main ? obj.main : obj.alt_path,
        breakdown: obj.breakDown,
        function: func_def,
        headers: obj.headers,
        inner: obj.inner.map( inner => prettyPrint( inner ) )
    }
}

/**
 * @description Gets args for js_doc_to_rst
 * @returns { Object } Args
 */
function get_args()
{
    // Default args for js_doc_to_rst
    let defaultArgs = {
        source:null,
        output:null,
        fileTypes:[ "js" ],
        configPath:null,
        verbose:0
    }

    // Convert possible args to default arg names
    const translateArgs = {
        // source:
        source:'source',
        src:'source',
        s:'source',
        // output:
        output:'output',
        dest:'output',
        destination:'output',
        o:'output',
        d:'output',
        // fileTypes:
        fileTypes:'fileTypes',
        ft:'fileTypes',
        // configPath:
        c:'configPath',
        config:'configPath',
        // verbose:
        v:'verbose',
        verbose:'verbose'
    }

    // Parse args with yargs and delete unnecessary args
    const parseArgs = require( 'yargs' ).argv
    delete parseArgs._
    delete parseArgs.$0

    // Set config path if it exists
    if( parseArgs?.c !== undefined ) defaultArgs.configPath = parseArgs.c
    else if( parseArgs?.config !== undefined ) defaultArgs.configPath = parseArgs.config

    // Load config file if it exists
    let allArgs = defaultArgs.configPath !== null
        ? { ...parseArgs, ...require( path.resolve( defaultArgs.configPath ) ) }
        : parseArgs
    
    // Set default args based on parsed args
    for( let arg in allArgs )
    {
        if( arg in translateArgs )
        {
            defaultArgs[ translateArgs[ arg ] ] = allArgs[ arg ]
        }
        else
        {
            defaultArgs[ arg ] = allArgs[ arg ]
        }
    }

    return defaultArgs
}

class JSDocToRST
{
    constructor()
    {
        this.args = get_args()
        try
        {
            this.files = load_files( this.args.source, this.args.fileTypes )
            if( this.args.verbose > 1 ) console.log( 'Files:', this.files )

            this.commentObjs = []

            this.files.forEach( file_path =>
            {
                const new_comment = new javascript_file_comments( { file_path:file_path } )

                if( new_comment.comments.length === 0 ) return

                new_comment.finalComments.map( finalComment =>
                {
                    this.commentObjs.push(
                        finalComment.main
                            ? finalComment
                            : { ...finalComment, alt_path:path.join( file_path, '..' ).replaceAll( '\\', '/' ) }
                    )
                } )
            } )

            if( this.args.verbose > 1 ) this.commentObjs.forEach( obj => console.log( JSON.stringify( prettyPrint( obj ), null, 2 ) ) )
        }
        catch( error )
        {
            throw new Error( `Failed During Comment Generation:\n${ error }` )
        }

        try{
            this.create_dirs()
            this.create_comment_files()
            this.create_index_files()
        }
        catch( error )
        {
            throw new Error( `Failed During File Creation:\n${ error }` )
        }

        try{
            if( this.args?.sphinx?.enable && this.args?.sphinx?.output )
            {
                this.create_sphinx_files()
                this.run_sphinx_build()
            }
        }
        catch( error )
        {
            throw new Error( `Failed During Sphinx Build:\n${ error }` )
        }

        console.log( `\nSuccessfully Generated Documentation: ${ this.args.output }` )
    }

    create_dirs()
    {
        this.commentObjs.forEach( obj =>
        {
            console.log( obj.main, obj.alt_path )
            obj.main
                ? fs.mkdirSync( path.join( this.args.output, obj.main ), { recursive:true } )
                : fs.mkdirSync( path.join( this.args.output, obj.alt_path ), { recursive:true } )
        } )
    }

    create_comment_files()
    {
        this.commentObjs.forEach( obj =>
        {
            const file_path = path.join(
                this.args.output,
                ( obj.main ? obj.main : obj.alt_path ),
                ( obj.headers.caller.name ? obj.headers.caller.name : obj.headers.caller.type ) + '_file.rst'
            )
            console.log( file_path )
            fs.writeFileSync(
                file_path,
                defaultTemplates.commentFile(
                    obj.headers.caller.name ? obj.headers.caller.name : obj.headers.caller.type,
                    obj
                ),
                'utf8'
            )
        } )
    }

    create_index_files()
    {
        function walkDir( dir, args )
        {
            let hasFiles = false
            let hasIndex = false
            let discDirs = []
            fs.readdirSync( dir ).forEach( file =>
            {
                const filePath = path.join( dir, file )
        
                if ( fs.statSync( filePath ).isDirectory() )
                {
                    if( file.startsWith( '__' ) ) return
                    walkDir( filePath, args )
                    discDirs.push( file )
                }
                else if( file === 'index.rst' ) hasIndex = true
                else hasFiles = true
            } )


            if( !hasIndex )
            {
                fs.writeFileSync(
                    path.join( dir, 'index.rst' ),
                    dir === args.output
                        ?
                        defaultTemplates.initialIndexFile(
                            {
                                dir: dir.split( path.sep ).pop(),
                                discDirs: discDirs,
                                hasFiles: hasFiles,
                                parentArgs: args
                            }
                        )
                        :
                        defaultTemplates.indexFile(
                            {
                                dir: dir.split( path.sep ).pop(),
                                discDirs: discDirs,
                                hasFiles: hasFiles,
                                parentArgs: args
                            }
                        ),
                    'utf8'
                )
            }
        }

        walkDir( this.args.output, this.args )
    }

    create_sphinx_files()
    {
        // check if conf.py exists in args.output folder

        if(
            !fs.existsSync( path.join( this.args.output, 'conf.py' ) )
            || !fs.existsSync( path.join( this.args.output, 'make.bat' ) )
            ||!fs.existsSync( path.join( this.args.output, 'Makefile' ) )
        )
        {
            if( this.args.verbose ) console.log( '\nMissing Sphinx Files:' )
        
            if( !fs.existsSync( path.join( this.args.output, 'conf.py' ) ) )
            {
                if( this.args.verbose ) console.log( '\tCreating conf.py...' )
                fs.writeFileSync(
                    path.join( this.args.output, 'conf.py' ),
                    defaultTemplates.confPy( this.args.sphinx ),
                    'utf8'
                )
            }

            if( !fs.existsSync( path.join( this.args.output, 'make.bat' ) ) )
            {
                if( this.args.verbose ) console.log( '\tCreating make.bat...' )
                fs.writeFileSync(
                    path.join( this.args.output, 'make.bat' ),
                    defaultTemplates.makeBat( this.args.sphinx ),
                    'utf8'
                )
            }

            if( !fs.existsSync( path.join( this.args.output, 'Makefile' ) ) )
            {
                if( this.args.verbose ) console.log( '\tCreating Makefile...' )
                fs.writeFileSync(
                    path.join( this.args.output, 'Makefile' ),
                    defaultTemplates.makeFile( this.args.sphinx ),
                    'utf8'
                )
            }

            if( this.args.verbose ) console.log( '\n' )
        }
    }

    run_sphinx_build() {

        let command = ''

        // Check if a Conda environment was provided
        if ( this.args.sphinx?.conda_env)
        {
            if ( process.platform === 'win32' ) command += `call activate ${ this.args.sphinx.conda_env } && ` // On Windows
            else command += `source activate ${ this.args.sphinx.conda_env } && ` // On Unix-like systems (Linux, macOS)
        }
        command += `sphinx-build -b html ${ path.resolve( this.args.output ) } ${ path.resolve( this.args.sphinx.output ) }`

        if( this.args.verbose ) console.log( `\nRunning Sphinx Build: ${ command }` )
        execSync( command, { stdio: this.args.verbose ? 'inherit' : 'pipe' } )
    }
}

new JSDocToRST()