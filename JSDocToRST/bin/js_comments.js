const fs = require( 'fs' )
const namingConventionsTest = require( './namingConventionsTest' )
const commentParseTest = require( './commentParseTest' )
const helpers = require( './helper_funcs' )

class javascript_file_comments
{
    noBrackets = [
        'description',
    ]
    noVarNames = [
        'description',
        'returns',
    ]

    constructor( { file_str=null, file_path=null } )
    {
        this.file_str = file_str !== null ? file_str : fs.readFileSync( file_path, 'utf8' )
        
        this.comments = this.getComments( this.file_str )
        this.commentBreakdowns = this.comments.map( comment => this.parseComments( comment ) )
        this.functions = this.comments.map( func_def => this.getFunctions( func_def ) )
        this.commentHeaders = this.comments.map( func_def => this.getCommentingWhat( func_def ) )
        this.finalComments = this.sortComments()

        // console.log( 'Comments:', this.comments )
        // console.log( 'Comment Breakdowns:', this.commentBreakdowns )
        // console.log( 'Functions:', this.functions )
        // console.log( 'Headers:', this.commentHeaders )
        // console.log( 'Final Comments:', this.finalComments )
    }

    getComments(text) {
        let regex = /\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\//g

        return [ ...text.matchAll( regex ) ]
    }

    getCommentingWhat( func_def )
    {
        const start = func_def.index + func_def[ 0 ].length+1
        const end = this.getLevel( func_def.input, start, '(' )
        // console.log( 'Commenting:\n\n', func_def.input.slice( start, end ) )

        let format = func_def.input.slice( start, end )
            .replaceAll( '(', ' ( ' )
            .replaceAll( ')', ' ) ' )
            .replaceAll( '{', ' { ' )
            .replaceAll( '}', ' } ' )
            .replaceAll( '[', ' [ ' )
            .replaceAll( ']', ' ] ' )
            .replaceAll( '\n', ' ' )
            .replaceAll( '\t', ' ')
            .replaceAll( '\r', ' ')
            .split( ' ' )
            .map( item => item.trim() )
            .filter( item => item.length > 0 )
        
        // console.log( 'Format: ', format )

        let commentingWhat = {
            export:false,
            default:false,
            async:false,
            caller:{
                type:undefined,
                name:undefined
            },
            params:undefined
        }

        let i = 0
        let breakFlag = false
        while( i < format.length && !breakFlag )
        {
            switch( format[ i ] )
            {
                case 'export':
                    commentingWhat.export = true
                    break

                case 'default':
                    commentingWhat.default = true
                    break

                case 'async':
                    commentingWhat.async = true
                    break
                
                case 'const':
                    commentingWhat.caller.type = 'Const'
                    commentingWhat.caller.name = format[ i+1 ]
                    i += 2
                    break
                
                case 'function':
                    if( commentingWhat.caller.type === undefined )
                    {
                        commentingWhat.caller.type = 'Function'
                        commentingWhat.caller.name = format[ i+1 ]
                        i += 2
                    }
                    break

                default:
                    if( format[ i ].startsWith( '(' ) )
                    {
                        breakFlag = true
                    }
                    if( format[ i ].startsWith( 'useEffect' ) || format[ i ].startsWith( 'React.useEffect' ) )
                    {
                        breakFlag = true
                        commentingWhat.caller.type = 'useEffect'
                        i++

                        let j = format.length
                        while( j >= 0 )
                        {
                            j--
                        }
                    }
                    break
            }
            i++
        }
        return commentingWhat
    }

    getFunctions( comment )
    {
        const start = comment.index + comment[ 0 ].length+1
        const end = this.getLevel( comment.input, start )

        return {
            start: start,
            end: end,
            _function: comment.input.slice( start, end )
        }
    }

    getLevel( text, start, following = '{' )
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

    parseComments( commentObj )
    {
        let commentStr = commentObj[ 0 ].slice( 3, -2 )

        let i = 0
        while( i < commentStr.length )
        {
            if( commentStr[ i ] === '@' ) break
            i++
        }
        commentStr = commentStr.slice( i )

        i = commentStr.length - 1 
        while( i > 0 )
        {
            if( ![ '\n', '\t', '\r', ' ' ].includes( commentStr[ i ] ) ) { i++; break }
            i--
        }

        commentStr = commentStr.slice( 0, i )

        let commentLines = commentStr
            .replaceAll( /(?:\r)?\n\s*\*/g, '\n' )
            .replaceAll( '@', '\n@' )
            .split( '\n' )
            .map( item => item.trim() )
            .filter( item => item !== '' )
        
        // Initialize an array to hold each comment breakdown
        let commentBreakdown = {};

        // Regex pattern to capture the parts
        const regex = /^\s*@\s*(\w+)\s*\{\s*([^}]+?)\s*\}\s*(\w+)(?:\s*-\s*)?(.*)$/
        const regexOptionalDesc = /^\s*@\s*(\w+)\s*\{\s*([^}]+?)\s*\}\s*(?:\w+)?$/
        const descriptionRegex = /^\s*@(\w+)\s*(.*)\s*$/

        //TODO: Actually set lastType
        let lastType = undefined
        // Process each line to extract the comments
        for (let line of commentLines) {
            if (line.startsWith('@')) {
                // Create a new comment breakdown object
                let breakDown = {
                    varType: undefined,
                    varName: undefined,
                    varValue: undefined,
                }

                // Execute the regex pattern on the line
                let match = line.match( regex )
                if( match )
                {
                    breakDown.varType = match[ 2 ].trim()
                    breakDown.varName = match[ 3 ].trim()
                    breakDown.varValue = match[ 4 ] ? match[ 4 ].trim() : undefined

                    if( commentBreakdown[ match[ 1 ].trim() ] ) commentBreakdown[ match[ 1 ].trim() ].push( breakDown )
                    else commentBreakdown[ match[ 1 ].trim() ] = [ breakDown ]
                    continue
                }
                
                match = line.match( regexOptionalDesc )
                if( match )
                {
                    breakDown.varType = match[ 2 ].trim()
                    breakDown.varValue = match[ 3 ] ? match[ 3 ].trim() : undefined

                    if( commentBreakdown[ match[ 1 ].trim() ] ) commentBreakdown[ match[ 1 ].trim() ].push( breakDown )
                    else commentBreakdown[ match[ 1 ].trim() ] = [ breakDown ]
                    continue
                }

                match = line.match( descriptionRegex )
                if( match )
                {
                    breakDown.varValue = match[ 2 ].trim()

                    if( commentBreakdown[ match[ 1 ].trim() ] ) commentBreakdown[ match[ 1 ].trim() ].push( breakDown )
                    else commentBreakdown[ match[ 1 ].trim() ] = [ breakDown ]
                    continue
                }
            }
            else if( lastType !== undefined )
            {
                // If the line does not start with '@' and there is a previous entry, append to varValue
                let lastComment = commentBreakdowns[ lastType ].pop()
                if( lastComment.varValue )
                {
                    lastComment.varValue += ` ${ line.trim() }`
                }
                else
                {
                    lastComment.varValue = line.trim()
                }

                commentBreakdowns[ lastType ].push( lastComment )
            }
        }

        return commentBreakdown
    }

    sortComments()
    {
        function hasPath( breakDown )
        {
            if( 'path' in breakDown )
            {
                console.assert( breakDown[ 'path' ].length === 1, 'Path not defined or multiple definitions' )
                return breakDown[ 'path' ][ 0 ].varValue
            }
            else return false
        }

        function buildNestedList(start, end, commentList)
        {
            let i = 0
            let curr_list = []

            while( i < commentList.length )
            {
                let currentComment = commentList[ i ]
                if( currentComment[3].start >= start && currentComment[3].end <= end )
                {
                    let inner = buildNestedList( currentComment[3].start, currentComment[3].end, commentList.slice( i + 1 ) )
                    curr_list.push(
                        {
                            comment: currentComment[0],
                            breakDown: currentComment[1],
                            headers: currentComment[2],
                            function: currentComment[3],
                            inner: inner,
                        }
                    )
                    i += inner.length + 1
                }
                else
                {
                    i++
                }
            }

            return curr_list
        }

        let zipped = helpers.zip( this.comments, this.commentBreakdowns, this.commentHeaders, this.functions )

        return buildNestedList( -Infinity, Infinity, zipped ).map( item =>
        {
            return { ...item, main: hasPath( item.breakDown ), alt_path:undefined }
        } )
    }
}

// new javascript_file_comments( { file_str:commentParseTest.singleLineComments } )
// new javascript_file_comments( { file_str:namingConventionsTest.consts } )
// new javascript_file_comments( { file_str:namingConventionsTest.functions } )
// new javascript_file_comments( { file_str:namingConventionsTest.useEffects } )
// new javascript_file_comments( { file_str:namingConventionsTest.testFileExample } )

module.exports = javascript_file_comments