#! /usr/bin/env node

const fs = require( 'fs' )
const path = require( 'path' )

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

class javascript_file_comments
{
    constructor( file_path )
    {
        this.file_str = fs.readFileSync( file_path, 'utf8' )
        
        // this.comments = this.getComments( this.file_str ).map( comment => comment[ 0 ] )
        this.comments = this.getComments( this.file_str )
        this.functions = this.getFunctions( this.file_str )

        this.comments.forEach( func_def =>
        {
            const start = func_def.index + func_def[ 0 ].length+2
            const level = this.get_level( func_def.input, start )
            console.log( func_def.input.slice( start, level ) )
        } )
    }

    getComments(text) {
        let regex = /\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\//g

        return [ ...text.matchAll( regex ) ]
    }

    getFunctions(text) {
        let regex = /function\s+([^\s(]+)/g

        return [ ...text.matchAll( regex ) ]
    }

    get_level( text, start, following = '{' )
    {
        text = text.slice( start )
        let end = 0
        let i = 0
        let started = false
        while( i < text.length && end >= 0 )
        {
            if( started && end === 0 ) break 
            if( [ '{', '(', '[' ].includes( text.charAt( i ) ) )
            {
                end++
                if( text.charAt( i ) === following ) started = true
            }
            if( [ '}', ')', ']' ].includes( text.charAt( i ) ) ) end--
            i++
        }
        return i + start
    }
}

class JSDocToRST
{
    constructor()
    {
        this.args = get_args()
        this.files = load_files( this.args.source, this.args.fileTypes )
        console.log( 'Files:', this.files )

        this.files.forEach( file_path =>
        {
            const new_comment = new javascript_file_comments( file_path )
            // console.log( 'Comments:', new_comment.comments )
            // console.log( 'Functions:', new_comment.functions )
        } )
    }
}

new JSDocToRST()