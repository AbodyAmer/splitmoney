const amount = 38.20

const people = 6

console.log(amount / people)
// console.log((amount / people).toFixed(2))

let remaining = amount
console.log("::",remaining)
for (let i = 0; i < people; i++) {
    if (parseFloat(remaining).toFixed(2) > parseFloat((amount / people).toFixed(2))) {
        console.log('bigger')
        remaining = parseFloat(remaining) - parseFloat((amount / people).toFixed(2))
        console.log(parseFloat((amount / people).toFixed(2)))
    } else if (parseFloat(remaining.toFixed(2))  === parseFloat((amount / people).toFixed(2))) {
        console.log('equal')
        remaining = parseFloat(remaining) - parseFloat((amount / people).toFixed(2))
        console.log(parseFloat((amount / people).toFixed(2)))
    } else {
        console.log('less', parseFloat(remaining).toFixed(2) , parseFloat((amount / people).toFixed(2)))
        remaining = parseFloat(remaining) - parseFloat((amount / people).toFixed(2))
        console.log(parseFloat((amount / people).toFixed(2) - 0.01))
    }

}