const singleLineComments = `
/**
 * @description Prints "test"
 * continued description
 * @param {number} a
 * @param { string} b No Dash Comment
 * @param {string } c - Dash Comment
 * @param { String | JSX.Element } d
 */
export default function test( a, b, c ) {
    console.log( 'test' )
}
`

const notSuppported = `
/**
 * @description Prints "test"
 * continued description
 * @param {number} a
 * @param { string} b No Dash Comment
 * @param {string } c - Dash Comment
 * @param { String | JSX.Element } d
 * /
export default function test( a, b, c ) {
    console.log( 'test' )
}
`

module.exports = {
    singleLineComments,
    notSuppported
}