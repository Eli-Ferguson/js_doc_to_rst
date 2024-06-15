import React from 'react'

import NavBar from '../Page/Components/NavBar'

/**
 * @path src/Page
 * @description LandingPage
 * 
 * @param { String } a - Useless Variable
 * 
 * @returns {JSX.Element}
 */
export function LandingPage()
{
    /**
     * @description Prints "LandingPage"
     * @watching { None }
     */
    React.useEffect( () =>
    {
        console.log( "LandingPage" )
    } )

    return (
        <>
            <NavBar />
            <div>
                LandingPage
            </div>
        </>
    )
}