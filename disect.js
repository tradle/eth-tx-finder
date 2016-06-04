const async = require('async')
// range = [[min_index, value], [max_index, value]]

module.exports = findIncrements

/*

currently using async.series b/c the other way is returning incorrect results for some reason...

*/

function findIncrements(min, max, getValue, progressCb, completeCb){

  getRange(min, max, function(err, range){
    if (err) return cb(err)
    iterateOverRange(range, progressCb, completeCb)
  })

  function getRange(min, max, cb){
    async.series([
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

  function iterateOverRange(range, progressCb, completeCb){
    var min = range[0][0]
    var max = range[1][0]
    var span = spanOfRange(range)
    var length = lengthOfRange(range)
    // console.log('span, length:', [min, max], span, length)
  
    // more than one change across than one space:
    // bisect both sides
    if (span > 1 && length > 1) {

      var middle = min + Math.floor((max-min) / 2)
      var work = []
      if (middle !== min) {
        work.push(findIncrements.bind(null, min, middle, getValue, progressCb))
      }
      if (middle !== max) {
        work.push(findIncrements.bind(null, middle, max, getValue, progressCb))
      }
      // console.log('bisect both sides - start', [min, max], middle)
      async.series(work, function(err, results){
        var combinedResults = []
        combinedResults = combinedResults.concat(results[0])
        combinedResults = combinedResults.concat(results[1])
        // console.log('bisect both sides - end:', [min, max], middle, combinedResults)
        completeCb(null, combinedResults)
      })

    // at least one change in any amount of space:
    // search for the change point
    } else if (span > 0) {

      var target = range[1][1]
      // console.log('search for change - start:', [min, max], target)
      searchRange(min, max, target, getValue, function(err, result){
        console.log('search for change - end:', [min, max], target, result)
        progressCb(result)
        completeCb(null, [result])
      })

    // no changes in range:
    // nothing to see here - abort
    } else {

      // console.log('zero range', [min, max])
      completeCb(null, [])

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