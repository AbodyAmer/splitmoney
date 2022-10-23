const { sum } = require('ramda')

const x = 38
const y = 9

// # divide x by y and round to 2 decimals
const res_z = parseFloat((x/y).toFixed(2))
// # make a list that contains y times res_z
const res_list = new Array(y).fill(res_z)

const res_diff = parseFloat((x - sum(res_list)).toFixed(2))
console.log(res_diff)


res_list[0] = res_list[0] + res_diff
console.log(res_list.map(r => parseFloat((r).toFixed(2))))
console.log(parseFloat(sum(res_list).toFixed(2)))
// # check how much the sum of the list elements deviates from x
// res_diff <- x - sum(res_list)
// // # take 1 element of the list and add the difference res_diff to it 
// res_list[1] <- res_list[1] + res_diff

// cat("division: ", x, "/", y, " = ", x/y, "\n")
// cat("parts: ", res_list, "\n")
// cat("sum of parts: ", sum(res_list))