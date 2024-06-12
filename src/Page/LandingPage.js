import React from 'react'

/**
 * @path src/Page
 * @description LandingPage
 * 
 * @param { String } a - Useless Variable
 * 
 * @returns {JSX.Element}
 */
export function LandingPage() {

    /**
     * @description Prints "LandingPage"
     * @watching { None }
     */
    React.useEffect( () =>
    {
        console.log( "LandingPage" )
    } )

    return (
        <div>
            LandingPage
        </div>
    )
}