import { useState, useCallback, useEffect, useRef } from 'react'
import './Calculator.css'

function formatWithCommas(str) {
  if (str === 'Error') return str
  const num = str.replace('-', '')
  const parts = num.split('.')
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const formatted = parts.length > 1 ? intPart + '.' + parts[1] : intPart
  return str.startsWith('-') ? '-' + formatted : formatted
}

function getDisplayFontSize(text) {
  const len = text.length
  if (len <= 10) return null // use CSS default
  if (len <= 13) return '42px'
  if (len <= 16) return '34px'
  return '28px'
}

function Calculator() {
  const [displayValue, setDisplayValue] = useState('0')
  const [displayError, setDisplayError] = useState(false)
  const [activeOperator, setActiveOperator] = useState(null)
  const stateRef = useRef({
    currentValue: '0',
    previousValue: null,
    operator: null,
    shouldResetDisplay: false,
    lastAnswer: null,
  })
  const pressedKeyRef = useRef(null)
  const [, forceRender] = useState(0)
  const displayTapRef = useRef({ lastTap: 0 })
  const equalsLongPressRef = useRef(null)

  const updateDisplay = useCallback((val) => {
    let str = String(val)
    // Allow longer strings now — font will shrink instead of truncating
    if (str.length > 16) {
      let num = parseFloat(val)
      str = num.toExponential(4)
      if (str.length > 16) {
        setDisplayValue('Error')
        setDisplayError(true)
        setTimeout(() => setDisplayError(false), 1000)
        return
      }
    }
    setDisplayValue(str)
  }, [])

  const flashError = useCallback(() => {
    setDisplayValue('Error')
    setDisplayError(true)
    setTimeout(() => setDisplayError(false), 1000)
  }, [])

  const calculate = useCallback(() => {
    const s = stateRef.current
    const a = s.previousValue
    const b = parseFloat(s.currentValue)
    let result

    switch (s.operator) {
      case '+': result = a + b; break
      case '−': result = a - b; break
      case '×': result = a * b; break
      case '÷':
        if (b === 0) {
          flashError()
          s.shouldResetDisplay = true
          s.currentValue = '0'
          return
        }
        result = a / b
        break
      default: return
    }

    if (!isFinite(result)) {
      flashError()
      s.currentValue = '0'
      s.shouldResetDisplay = true
      return
    }

    result = parseFloat(result.toPrecision(10))
    const resultStr = String(result)
    s.currentValue = resultStr
    s.previousValue = result
    s.lastAnswer = resultStr
    s.shouldResetDisplay = true
    updateDisplay(resultStr)
  }, [flashError, updateDisplay])

  const pressKey = useCallback((key) => {
    const s = stateRef.current

    if (key >= '0' && key <= '9') {
      if (s.currentValue === '0' || s.shouldResetDisplay) {
        s.currentValue = key
        s.shouldResetDisplay = false
      } else {
        if (s.currentValue.replace('.', '').replace('-', '').length >= 10) return
        s.currentValue += key
      }
      updateDisplay(s.currentValue)
      return
    }

    if (key === '.') {
      if (s.shouldResetDisplay) {
        s.currentValue = '0.'
        s.shouldResetDisplay = false
      } else if (!s.currentValue.includes('.')) {
        s.currentValue += '.'
      }
      updateDisplay(s.currentValue)
      return
    }

    if (key === '←') {
      if (s.shouldResetDisplay || s.currentValue === '0') return
      if (s.currentValue.length === 1 || (s.currentValue.length === 2 && s.currentValue[0] === '-')) {
        s.currentValue = '0'
      } else {
        s.currentValue = s.currentValue.slice(0, -1)
      }
      updateDisplay(s.currentValue)
      return
    }

    if (key === 'AC') {
      s.currentValue = '0'
      s.previousValue = null
      s.operator = null
      s.shouldResetDisplay = false
      setActiveOperator(null)
      updateDisplay('0')
      return
    }

    if (key === '%') {
      const val = parseFloat(s.currentValue)
      const result = val / 100
      s.currentValue = String(result)
      s.shouldResetDisplay = true
      updateDisplay(s.currentValue)
      return
    }

    if (key === '÷' || key === '×' || key === '−' || key === '+') {
      if (s.operator && !s.shouldResetDisplay) {
        calculate()
      }
      s.previousValue = parseFloat(s.currentValue)
      s.operator = key
      s.shouldResetDisplay = true
      setActiveOperator(key)
      return
    }

    if (key === '=') {
      if (!s.operator) return
      // Haptic feedback on equals only
      if (navigator.vibrate) navigator.vibrate(10)
      calculate()
      s.operator = null
      setActiveOperator(null)
    }
  }, [calculate, updateDisplay])

  const animateKey = useCallback((keyId) => {
    pressedKeyRef.current = keyId
    forceRender(n => n + 1)
    setTimeout(() => {
      pressedKeyRef.current = null
      forceRender(n => n + 1)
    }, 120)
  }, [])

  const handlePress = useCallback((key, keyId) => {
    animateKey(keyId)
    pressKey(key)
  }, [animateKey, pressKey])

  // Last answer recall: double-tap display
  const handleDisplayDoubleTap = useCallback(() => {
    const now = Date.now()
    const last = displayTapRef.current.lastTap
    displayTapRef.current.lastTap = now
    if (now - last < 350) {
      const s = stateRef.current
      if (s.lastAnswer !== null) {
        s.currentValue = s.lastAnswer
        s.shouldResetDisplay = true
        updateDisplay(s.lastAnswer)
      }
    }
  }, [updateDisplay])

  // Last answer recall: long-press equals
  const handleEqualsPointerDown = useCallback(() => {
    equalsLongPressRef.current = setTimeout(() => {
      const s = stateRef.current
      if (s.lastAnswer !== null) {
        s.currentValue = s.lastAnswer
        s.shouldResetDisplay = true
        updateDisplay(s.lastAnswer)
      }
    }, 500)
    handlePress('=', 'key-=')
  }, [handlePress, updateDisplay])

  const handleEqualsPointerUp = useCallback(() => {
    if (equalsLongPressRef.current) {
      clearTimeout(equalsLongPressRef.current)
      equalsLongPressRef.current = null
    }
  }, [])

  // Keyboard support
  useEffect(() => {
    const keyMap = {
      '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
      '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
      '.': '.', 'Enter': '=', '=': '=',
      '+': '+', '-': '−', '*': '×', '/': '÷',
      'Escape': 'AC', 'Backspace': '←', '%': '%',
    }
    const handler = (e) => {
      if (keyMap[e.key]) {
        e.preventDefault()
        const mapped = keyMap[e.key]
        animateKey(`key-${mapped}`)
        pressKey(mapped)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [animateKey, pressKey])

  const isPressed = (keyId) => pressedKeyRef.current === keyId

  // Format display value with commas
  const formattedDisplay = formatWithCommas(displayValue)
  const fontSize = getDisplayFontSize(formattedDisplay)

  return (
    <div className="calculator">
      {/* Display Section */}
      <div className="display-section">
        <div className="display-window" onPointerDown={handleDisplayDoubleTap}>
          <div className="scanline" />
          <div className="display-ghost">8888888888.</div>
          <div
            className={`display-text${displayError ? ' error' : ''}`}
            style={fontSize ? { fontSize } : undefined}
          >
            {formattedDisplay}
          </div>
        </div>
      </div>

      {/* Keypad */}
      <div className="keypad">
        {/* Row 1: ← AC % --- (menu) */}
        <button
          className={`key key-fn${isPressed('key-←') ? ' pressed' : ''}`}
          onPointerDown={() => handlePress('←', 'key-←')}
        >
          ←
        </button>
        <button
          className={`key key-fn${isPressed('key-AC') ? ' pressed' : ''}`}
          onPointerDown={() => handlePress('AC', 'key-AC')}
        >
          C/AC
        </button>
        <button
          className={`key key-fn${isPressed('key-%') ? ' pressed' : ''}`}
          onPointerDown={() => handlePress('%', 'key-%')}
        >
          %
        </button>
        <button
          className="key key-menu"
          disabled
        >
          ―――
        </button>

        {/* Row 2: 7 8 9 ÷ */}
        {['7', '8', '9'].map(n => (
          <button
            key={n}
            className={`key key-digit${isPressed(`key-${n}`) ? ' pressed' : ''}`}
            onPointerDown={() => handlePress(n, `key-${n}`)}
          >
            {n}
          </button>
        ))}
        <button
          className={`key key-operator${activeOperator === '÷' ? ' active' : ''}${isPressed('key-÷') ? ' pressed' : ''}`}
          onPointerDown={() => handlePress('÷', 'key-÷')}
        >
          ÷
        </button>

        {/* Row 3: 4 5 6 × */}
        {['4', '5', '6'].map(n => (
          <button
            key={n}
            className={`key key-digit${isPressed(`key-${n}`) ? ' pressed' : ''}`}
            onPointerDown={() => handlePress(n, `key-${n}`)}
          >
            {n}
          </button>
        ))}
        <button
          className={`key key-operator${activeOperator === '×' ? ' active' : ''}${isPressed('key-×') ? ' pressed' : ''}`}
          onPointerDown={() => handlePress('×', 'key-×')}
        >
          ×
        </button>

        {/* Row 4: 1 2 3 − */}
        {['1', '2', '3'].map(n => (
          <button
            key={n}
            className={`key key-digit${isPressed(`key-${n}`) ? ' pressed' : ''}`}
            onPointerDown={() => handlePress(n, `key-${n}`)}
          >
            {n}
          </button>
        ))}
        <button
          className={`key key-operator${activeOperator === '−' ? ' active' : ''}${isPressed('key-−') ? ' pressed' : ''}`}
          onPointerDown={() => handlePress('−', 'key-−')}
        >
          −
        </button>

        {/* Row 5: 0 (span 2) . + */}
        <button
          className={`key key-digit key-zero${isPressed('key-0') ? ' pressed' : ''}`}
          onPointerDown={() => handlePress('0', 'key-0')}
        >
          0
        </button>
        <button
          className={`key key-digit${isPressed('key-.') ? ' pressed' : ''}`}
          onPointerDown={() => handlePress('.', 'key-.')}
        >
          .
        </button>
        <button
          className={`key key-operator${activeOperator === '+' ? ' active' : ''}${isPressed('key-+') ? ' pressed' : ''}`}
          onPointerDown={() => handlePress('+', 'key-+')}
        >
          +
        </button>

        {/* Row 6: = (spans full width) */}
        <button
          className={`key key-equals${isPressed('key-=') ? ' pressed' : ''}`}
          onPointerDown={handleEqualsPointerDown}
          onPointerUp={handleEqualsPointerUp}
          onPointerLeave={handleEqualsPointerUp}
        >
          =
        </button>
      </div>
    </div>
  )
}

export default Calculator
