function zip(...arr)
{
    return Array.from({ length: Math.max(...arr.map(a => a.length)) }, (_, i) => arr.map(a => a[i]))
}

module.exports = {
    zip:zip
}