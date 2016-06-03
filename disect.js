const async = require('async')
// range = [[min_index, value], [max_index, value]]

module.exports = findIncrements

function findIncrements(min, max, getValue, cb){

  getRange(min, max, function(err, range){
    if (err) return cb(err)
    iterateOverRange(range, cb)
  })

  function getRange(min, max, cb){
    async.parallel([
      getValue.bind(null, min),
      getValue.bind(null, max),
    ], function(err, results){
      if (err) return cb(err)
      var range = [
        [min,results[0]],
        [max,results[1]],
      ]
      cb(null, range)
    })
  }

  function spanOfRange(range){
    var span = range[1][1]-range[0][1]
    return span
  }

  function lengthOfRange(range){
    var span = range[1][0]-range[0][0]
    return span
  }

  function iterateOverRange(range, cb){
    var min = range[0][0]
    var max = range[1][0]
    var span = spanOfRange(range)
    var length = lengthOfRange(range)
    // console.log('span, length:', [min, max], span, length)
    if (span > 1 && length >= 2) {
      // bisect both sides
      var middle = min + Math.floor((max-min) / 2)
      var work = []
      if (middle !== min) {
        work.push(findIncrements.bind(null, min, middle, getValue))
      }
      if (middle !== max) {
        work.push(findIncrements.bind(null, middle, max, getValue))
      }
      // console.log('bisect both sides - start', [min, max], middle)
      async.parallel(work, function(err, results){
        var combinedResults = []
        combinedResults = combinedResults.concat(results[0])
        combinedResults = combinedResults.concat(results[1])
        // console.log('bisect both sides - end:', [min, max], middle, combinedResults)
        cb(null, combinedResults)
      })
    } else if (span > 0) {
      // search for the change point
      var target = range[1][1]
      // console.log('search for change - start:', [min, max], target)
      searchRange(min, max, target, getValue, function(err, result){
        // console.log('search for change - end:', [min, max], target, result)
        cb(null, [result])
      })
    } else {
      // nothing to see here
      // console.log('zero range', [min, max])
      cb(null, [])
    }
  }

  function searchRange(min, max, target, getValue, cb) {

    process.nextTick(iterate)

    function iterate () {
      // last step
      if (min+1 >= max) {
        test(min, function(err, result) {
          if (err) return cb(err)
          if (result) {
            cb(null, min)
          } else {
            cb(null, max)
          }
        })
      // bisect step
      } else {
        currentIndex = min + Math.floor((max-min) / 2)
        test(currentIndex, function(err, result) {
          if (err) return cb(err)
          if (result) {
            max = currentIndex
          } else {
            min = currentIndex
          }
          iterate()
        })
      }
    }

    function test(index, cb) {
      getValue(index, function (err, value) {
        if (err) return cb(err)
        var result = (value >= target)
        cb(null, result)
      })
    }
    
  }

}