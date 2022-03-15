const debug = require('debug')('tradle:eth-tx-finder:disect')
const noop = () => {}

async function findIncrements (min, max, getValue, progressCb) {
  progressCb = progressCb || noop
  const range = await getRange(min, max, getValue)
  if (debug.enabled) debug(`using range ${range.min} (${range.minValue}) ~ ${range.max} (${range.maxValue}) (span=${range.span}, length=${range.length})`)
  return iterateOverRange(range, getValue, progressCb)
}

async function iterateOverRange (range, getValue, progressCb) {
  const { min, max, span, length } = range

  if (span === 0) {
    debug('No sides to disect', min, max)
    return []
  }

  if (span > 1 && length > 1) {
    // more than one change across than one space:
    // bisect both sides

    const middle = min + Math.floor((max - min) / 2)
    debug('bisecting both sides', min, middle, max)
    return [
      ...await findIncrements(min, middle, getValue, progressCb),
      ...await findIncrements(middle, max, getValue, progressCb)
    ]
  }

  // at least one change in any amount of space:
  // search for the change point
  const target = range.maxValue
  debug('bisecting one side', min, max, target)
  const result = await searchRange(min, max, target, getValue)
  progressCb(result)
  return [result]
}

async function searchRange (min, max, target, getValue) {
  const isOutSideRange = async (index) => {
    const value = await getValue(index)
    return value >= target
  }

  while (min < max - 1) {
    // bisect step
    const currentIndex = min + Math.floor((max - min) / 2)
    if (await isOutSideRange(currentIndex)) {
      max = currentIndex
    } else {
      min = currentIndex
    }
  }

  return await isOutSideRange(min) ? min : max
}

async function getRange (min, max, getValue) {
  // Serial execution as parallel may cause bugs
  debug('getRange(min/max): ', min, max)
  const minValue = await getValue(min)
  const maxValue = await getValue(max)
  return {
    min,
    max,
    minValue,
    maxValue,
    span: maxValue - minValue,
    length: max - min
  }
}

module.exports = findIncrements
