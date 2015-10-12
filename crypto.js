
var crypto = require('crypto')
var count = 0
crypto.randomBytes = function (size) {
  console.warn('WARNING: generating insecure psuedorandom number of size ' + size)
  var random
  var i = 0
  var arr = new Buffer(size)
  while (i < size) {
    random = mathRandom() * Number.MAX_VALUE
    do {
      arr[i++] = Math.min(random % 257, 255)
      random /= 257 | 0
    } while (random > 256)
  }

  return arr
}

function mathRandom () {
  console.log('times called', ++count)
  return Math.random()
}
