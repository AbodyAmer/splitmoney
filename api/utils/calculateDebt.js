const calculateDebt = (belewZero, aboveZero) => {
    const owe = []
    for (let i = 0; i < belewZero.length; i++) {
      let remaining = belewZero[i].balance
      for (let j = 0; j < aboveZero.length; j++) {
        if (remaining === 0) {
          continue
        } else {
          if (Math.abs(remaining) > aboveZero[j].balance) {
            //owe.push(`${belewZero[i].name} should pay ${Math.abs(aboveZero[j].balance)} to ${aboveZero[j].name}`)
            owe.push({
              shoulPay: {
                _id: belewZero[i]._id,
                name: belewZero[i].name
              },
              shouldReceive: {
                _id: aboveZero[j]._id,
                name: aboveZero[j].name
              },
              amount: parseFloat(Math.abs(aboveZero[j].balance).toFixed(2))
            })
            remaining = remaining + aboveZero[j].balance
            aboveZero[j].balance = 0
          }
          else if (Math.abs(remaining) < aboveZero[j].balance) {
            // owe.push(`${belewZero[i].name} should pay ${Math.abs(remaining)} to ${aboveZero[j].name}`)
            owe.push({
              shoulPay: {
                _id: belewZero[i]._id,
                name: belewZero[i].name
              },
              shouldReceive: {
                _id: aboveZero[j]._id,
                name: aboveZero[j].name
              },
              amount: parseFloat(Math.abs(remaining).toFixed(2))
            })
            aboveZero[j].balance = aboveZero[j].balance - parseFloat(Math.abs(remaining).toFixed(2))
            remaining = 0
          } else {
            owe.push({
              shoulPay: {
                _id: belewZero[i]._id,
                name: belewZero[i].name
              },
              shouldReceive: {
                _id: aboveZero[j]._id,
                name: aboveZero[j].name
              },
              amount: parseFloat(Math.abs(aboveZero[j].balance).toFixed(2))
            })
            remaining = 0
            aboveZero[j].balance = 0
          }
        }
        belewZero[i].balance = 0
      }
    }
    return owe
}

export default calculateDebt
