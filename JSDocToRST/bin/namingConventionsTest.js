const functions = `
/** */
function test_1(){}
/** */
function test_2() {}
/** */
function test_3 (){}
/** */
function test_4 () {}

/** */
async function test_1(){}
/** */
async function test_2() {}
/** */
async function test_3 (){}
/** */
async function test_4 () {}

/** */
export function test_1(){}
/** */
export function test_2() {}
/** */
export function test_3 (){}
/** */
export function test_4 () {}

/** */
export default function test_1(){}
/** */
export default function test_2() {}
/** */
export default function test_3 (){}
/** */
export default function test_4 () {}

/** */
export async function test_1(){}
/** */
export async function test_2() {}
/** */
export async function test_3 (){}
/** */
export async function test_4 () {}

/** */
export default async function test_1(){}
/** */
export default async function test_2() {}
/** */
export default async function test_3 (){}
/** */
export default async function test_4 () {}
`
const consts = `
/** */
export const test_1 = () => {}
/** */
export const test_2 = async () => {}
/** */
const test_3 = function(){}
`

const useEffects = `
/** */
React.useEffect(()=>test_1)
/** */
React.useEffect( () => test_1() )
/** */
React.useEffect( () => { test_1 } )
/** */
React.useEffect( () => { test_1() } )
`

const testFileExample = `
import React from 'react'

/**
 * @path src/Page
 * @description LandingPage
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

    /**
     * @description Prints "LandingPage"
     * @watching { None }
     */
    React.useEffect( () =>
    {
        console.log( "LandingPage" )
    }, [] )

    /**
     * @description Prints "LandingPage"
     * @watching { None }
     */
    React.useEffect( () =>
    {
        console.log( "LandingPage" )
    }, [ test ] )

    return (
        <div>
            LandingPage
        </div>
    )
}
`

const notSupported = `
/** */
export const test_1 = null
`

module.exports = {
    functions,
    consts,
    useEffects,
    testFileExample,
    notSupported
}