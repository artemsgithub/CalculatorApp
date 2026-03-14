import { useState, useCallback, useEffect, useRef } from 'react'
import './Calculator.css'

function Calculator() {
  const [displayValue, setDisplayValue] = useState('0')
  const [displayError, setDisplayError] = useState(false)
  const stateRef = useRef({
    currentValue: '0',
    previousValue: null,
    operator: null,
    shouldResetDisplay: false,
  })
  const pressedKeyRef = useRef(null)
  const [, forceRender] = useState(0)

  const updateDisplay = useCallback((val) => {
    let str = String(val)
    if (str.length > 9) {
      let num = parseFloat(val)
      str = num.toExponential(3)
      if (str.length > 9) {
        setDisplayValue('E')
        setDisplayError(true)
        setTimeout(() => setDisplayError(false), 1000)
        return
      }
    }
    setDisplayValue(str)
  }, [])

  const flashError = useCallback(() => {
    setDisplayValue('E')
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

    result = parseFloat(result.toPrecision(8))
    const resultStr = String(result)
    s.currentValue = resultStr
    s.previousValue = result
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
        if (s.currentValue.replace('.', '').replace('-', '').length >= 8) return
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

    if (key === 'CE') {
      s.currentValue = '0'
      s.shouldResetDisplay = false
      updateDisplay('0')
      return
    }

    if (key === 'C') {
      s.currentValue = '0'
      s.previousValue = null
      s.operator = null
      s.shouldResetDisplay = false
      updateDisplay('0')
      return
    }

    if (key === '÷' || key === '×' || key === '−' || key === '+') {
      if (s.operator && !s.shouldResetDisplay) {
        calculate()
      }
      s.previousValue = parseFloat(s.currentValue)
      s.operator = key
      s.shouldResetDisplay = true
      return
    }

    if (key === '=') {
      if (!s.operator) return
      calculate()
      s.operator = null
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

  // Keyboard support
  useEffect(() => {
    const keyMap = {
      '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
      '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
      '.': '.', 'Enter': '=', '=': '=',
      '+': '+', '-': '−', '*': '×', '/': '÷',
      'Escape': 'C', 'Delete': 'CE', 'Backspace': 'CE',
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

  return (
    <div className="scene">
      <div className="table-reflection" />
      <div className="calculator">
        {/* Display Section */}
        <div className="display-housing">
          <div className="brand-row">
            <div className="ti-logo">
              <span className="ti-star">★</span>
              <span className="brand-name">Texas Instruments</span>
            </div>
            <span className="model-badge">Datamath</span>
          </div>
          <div className="display-window">
            <div className="scanline" />
            <div className="display-ghost">88888888.</div>
            <div className={`display-text${displayError ? ' error' : ''}`}>
              {displayValue}
            </div>
          </div>
        </div>

        {/* Keypad Panel */}
        <div className="keypad-panel">
          {/* Function row: CE, ÷, ×, C */}
          <div className="fn-row">
            <button
              className={`key key-fn${isPressed('key-CE') ? ' pressed' : ''}`}
              onPointerDown={() => handlePress('CE', 'key-CE')}
            >
              CE
            </button>
            <button
              className={`key key-white key-op${isPressed('key-÷') ? ' pressed' : ''}`}
              onPointerDown={() => handlePress('÷', 'key-÷')}
            >
              ÷
            </button>
            <button
              className={`key key-white key-op${isPressed('key-×') ? ' pressed' : ''}`}
              onPointerDown={() => handlePress('×', 'key-×')}
            >
              ×
            </button>
            <button
              className={`key key-fn${isPressed('key-C') ? ' pressed' : ''}`}
              onPointerDown={() => handlePress('C', 'key-C')}
            >
              C
            </button>
          </div>

          <div className="row-divider" />

          {/* Main grid */}
          <div className="num-grid">
            {/* Row 1 */}
            {['7', '8', '9'].map(n => (
              <button
                key={n}
                className={`key key-white${isPressed(`key-${n}`) ? ' pressed' : ''}`}
                onPointerDown={() => handlePress(n, `key-${n}`)}
              >
                {n}
              </button>
            ))}
            <button
              className={`key key-white key-minus${isPressed('key-−') ? ' pressed' : ''}`}
              onPointerDown={() => handlePress('−', 'key-−')}
            >
              −
            </button>

            {/* Row 2 */}
            {['4', '5', '6'].map(n => (
              <button
                key={n}
                className={`key key-white${isPressed(`key-${n}`) ? ' pressed' : ''}`}
                onPointerDown={() => handlePress(n, `key-${n}`)}
              >
                {n}
              </button>
            ))}
            <button
              className={`key key-white${isPressed('key-+') ? ' pressed' : ''}`}
              onPointerDown={() => handlePress('+', 'key-+')}
            >
              +
            </button>

            {/* Row 3 */}
            {['1', '2', '3'].map(n => (
              <button
                key={n}
                className={`key key-white${isPressed(`key-${n}`) ? ' pressed' : ''}`}
                onPointerDown={() => handlePress(n, `key-${n}`)}
              >
                {n}
              </button>
            ))}
            <button
              className={`key key-orange key-equals${isPressed('key-=') ? ' pressed' : ''}`}
              onPointerDown={() => handlePress('=', 'key-=')}
            >
              =
            </button>

            {/* Row 4 */}
            <button
              className={`key key-white key-zero${isPressed('key-0') ? ' pressed' : ''}`}
              onPointerDown={() => handlePress('0', 'key-0')}
            >
              0
            </button>
            <button
              className={`key key-white${isPressed('key-.') ? ' pressed' : ''}`}
              onPointerDown={() => handlePress('.', 'key-.')}
            >
              .
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calculator
