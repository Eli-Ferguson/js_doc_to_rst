#! /usr/bin/env node

const fs = require( 'fs' )
const path = require( 'path' )

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
        this.files = load_files( this.args.source, this.args.fileTypes )
        console.log( 'Files:', this.files )

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

        // this.commentObjs.forEach( obj => console.log( JSON.stringify( prettyPrint( obj ), null, 2 ) ) )

        this.create_dirs()
        this.create_comment_files()
    }

    create_dirs()
    {
        this.commentObjs.forEach( obj =>
        {
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
            fs.writeFileSync(
                file_path,
                defaultTemplates.commentFile( obj ),
                'utf8'
            )
        } )
    }
}

new JSDocToRST()