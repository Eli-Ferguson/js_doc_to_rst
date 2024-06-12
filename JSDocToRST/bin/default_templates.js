function commentFile( comment )
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

    return `` +
        `${ path ? '.. _' + path.replaceAll( '/', '_') + ':\n\n' : '' }` +
        `.. toctree::\n\t:hidden:\n\n` +
        recursiveBuild( comment )
}

module.exports = {
    commentFile
} 