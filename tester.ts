/**
 * MakeCode Calliope Tester
 * ========================
 * Advances through tests one-by-one.
 * Triggers: press ENTER in serial terminal  OR  press Button A on the board.
 *
 * Category coverage (add more below):
 *   [x] basic
 *   [x] input
 *   [x] music
 *   [x] led
 *   [x] loops
 *   [x] logic
 *   [x] variables
 *   [x] math
 *   [x] motors
 *   [x] arrays
 *   [x] text
 *   [x] pins
 *   [x] serial
 *   [x] game
 *   [x] images
 */

// ---------------------------------------------------------------------------
// Mini test framework
// ---------------------------------------------------------------------------

let _testNames: string[] = []
let _testFns: Array<() => void> = []
let _testCategories: string[] = []       // category name per test
let _categoryStarts: number[] = []       // test index where each category begins
let _categoryLabels: string[] = []       // ordered category names
let _testIndex = 0
let _running = false
let _currentCategory = ""

function addCategory(name: string): void {
    _currentCategory = name
    _categoryStarts.push(_testFns.length)
    _categoryLabels.push(name)
}

function addTest(name: string, fn: () => void): void {
    _testNames.push(name)
    _testFns.push(fn)
    _testCategories.push(_currentCategory)
}

function printSeparator(): void {
    serial.writeLine("--------------------------------------------------")
}

function advance(): void {
    if (_running) return          // debounce: ignore while a test is executing
    if (_testIndex >= _testFns.length) {
        serial.writeLine("=== All tests finished! Press reset to restart. ===")
        basic.showString("OK")
        return
    }

    _running = true
    printSeparator()
    serial.writeLine(
        "Test " + (_testIndex + 1) + " / " + _testFns.length
        + "  [" + _testCategories[_testIndex] + "]  " + _testNames[_testIndex]
    )
    serial.writeLine("Running...")

    _testFns[_testIndex]()          // execute the test
    _testIndex++

    if (_testIndex < _testFns.length) {
        serial.writeLine("Done. Press ENTER / A to advance, B to repeat, A+B to skip category.")
    } else {
        serial.writeLine("Last test done!")
        serial.writeLine("=== All tests finished! Press reset to restart. ===")
        basic.showString("OK")
    }
    _running = false
}

// ---------------------------------------------------------------------------
// Triggers
// ---------------------------------------------------------------------------

// Serial input handler - ENTER advances, a number (1-based) jumps to that category
function jumpToCategory(catIndex: number): void {
    if (catIndex < 0 || catIndex >= _categoryLabels.length) {
        serial.writeLine("Invalid category. Type 1-" + _categoryLabels.length + " or ENTER to advance.")
        return
    }
    _testIndex = _categoryStarts[catIndex]
    printSeparator()
    serial.writeLine(">> Jumped to category " + (catIndex + 1) + ": " + _categoryLabels[catIndex])
    serial.writeLine("Press ENTER / A to run first test.")
}

serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    let raw = serial.readUntil(serial.delimiters(Delimiters.NewLine)).trim()
    // strip trailing \r if present
    if (raw.length > 0 && raw.charCodeAt(raw.length - 1) === 13) {
        raw = raw.slice(0, raw.length - 1)
    }
    let num = parseInt(raw)
    if (raw.length > 0 && !isNaN(num)) {
        jumpToCategory(num - 1)   // user types 1-based
    } else {
        advance()
    }
})

// Button A on board → advance (standalone / no PC needed)
input.onButtonPressed(Button.A, function () {
    advance()
})

// Button B on board → repeat the current test
function repeat(): void {
    if (_running) return
    if (_testIndex === 0) {
        serial.writeLine("No test has run yet.")
        return
    }
    _running = true
    let i = _testIndex - 1
    printSeparator()
    serial.writeLine(
        "REPEAT Test " + (i + 1) + " / " + _testFns.length
        + "  [" + _testCategories[i] + "]  " + _testNames[i]
    )
    serial.writeLine("Running...")
    _testFns[i]()
    serial.writeLine("Done. Press ENTER / A to advance, B to repeat, A+B to skip category.")
    _running = false
}

input.onButtonPressed(Button.B, function () {
    repeat()
})

// Button A+B → skip to the first test of the next category
function skipCategory(): void {
    if (_running) return
    if (_testIndex >= _testFns.length) return
    let currentCat = _testCategories[_testIndex]
    // find first test that belongs to a different (later) category
    let next = _testIndex + 1
    while (next < _testFns.length && _testCategories[next] === currentCat) {
        next++
    }
    if (next >= _testFns.length) {
        serial.writeLine("Already in the last category.")
        return
    }
    _testIndex = next
    printSeparator()
    serial.writeLine(">> Skipped to category: " + _testCategories[_testIndex])
    serial.writeLine("Press ENTER / A to run first test, B to repeat, A+B to skip again.")
}

input.onButtonPressed(Button.AB, function () {
    skipCategory()
})

// ---------------------------------------------------------------------------
// CATEGORY: basic
// ---------------------------------------------------------------------------

addCategory("basic")
addTest("basic.showNumber(42)", function () {
    basic.showNumber(42, 70)
})

addTest("basic.showString('ABC')", function () {
    basic.showString("ABC", 70)
})

addTest("basic.showLeds (Happy face)", function () {
    basic.showLeds(`
        . # . # .
        . # . # .
        . . . . .
        # . . . #
        . # # # .
    `)
})

addTest("basic.showIcon(Sad)", function () {
    basic.showIcon(IconNames.Sad, 70)
    basic.pause(1000)
})


addTest("basic.setLedColors - 3 RGB LEDs (yellow / red / green)", function () {
    basic.setLedColors(0xffff00, 0xff0000, basic.rgb(0, 255, 0))
    basic.pause(500)
})

addTest("basic.setLedColor - single RGB LED (red)", function () {
    basic.setLedColor(0xff0000)
    basic.pause(500)
})

addTest("basic.turnRgbLedOff - clear all RGB LEDs", function () {
    basic.turnRgbLedOff()
    basic.pause(500)
    serial.writeLine("RGB LEDs should be off now.")
})

addTest("basic.clearScreen()", function () {
    basic.clearScreen()
    basic.pause(500)
    serial.writeLine("Screen should be blank now.")
})

// ---------------------------------------------------------------------------
// CATEGORY: input
// ---------------------------------------------------------------------------

addCategory("input")
addTest("input.temperature() - read chip temperature", function () {
    let temp = input.temperature()
    serial.writeLine("Temperature: " + temp + " deg")
})

addTest("input.lightLevel() - read ambient light (0-255)", function () {
    let light = input.lightLevel()
    serial.writeLine("Light level: " + light)
})

addTest("input.compassHeading() - read compass (0-359 deg)", function () {
    let heading = input.compassHeading()
    serial.writeLine("Compass heading: " + heading + " deg")
})

addTest("input.acceleration X/Y/Z", function () {
    let x = input.acceleration(Dimension.X)
    let y = input.acceleration(Dimension.Y)
    let z = input.acceleration(Dimension.Z)
    serial.writeLine("Accel X: " + x + "  Y: " + y + "  Z: " + z)
})

addTest("input.acceleration Strength", function () {
    let s = input.acceleration(Dimension.Strength)
    serial.writeLine("Accel strength: " + s)
})

addTest("input.rotation Pitch/Roll", function () {
    let pitch = input.rotation(Rotation.Pitch)
    let roll = input.rotation(Rotation.Roll)
    serial.writeLine("Pitch: " + pitch + "  Roll: " + roll)
})

addTest("input.magneticForce X/Y/Z", function () {
    let mx = input.magneticForce(Dimension.X)
    let my = input.magneticForce(Dimension.Y)
    let mz = input.magneticForce(Dimension.Z)
    serial.writeLine("Mag X: " + mx + "  Y: " + my + "  Z: " + mz)
})

addTest("input.runningTime() - ms since start", function () {
    let t = input.runningTime()
    serial.writeLine("Running time: " + t + " ms")
})

addTest("input.onGesture Shake - shake the board now!", function () {
    serial.writeLine("Shake the Calliope within 5 seconds...")
    let detected = false
    input.onGesture(Gesture.Shake, function () {
        detected = true
        serial.writeLine("Shake detected!")
        basic.showIcon(IconNames.Yes)
        basic.pause(500)
        basic.clearScreen()
    })
    basic.pause(5000)
    if (!detected) {
        serial.writeLine("No shake detected within 5 s.")
    }
})

// ---------------------------------------------------------------------------
// CATEGORY: music
// ---------------------------------------------------------------------------

addCategory("music")

addTest("music.playTone - single tone (440 Hz, 500 ms), show note frequencies", function () {
    music.playTone(440, 500)
    serial.writeLine("Played 440 Hz for 500 ms.")
    serial.writeLine("C4: " + music.noteFrequency(Note.C))
    serial.writeLine("A4: " + music.noteFrequency(Note.A))
    serial.writeLine("G4: " + music.noteFrequency(Note.G))
})

addTest("music.ringTone / rest - ring then silence", function () {
    music.ringTone(880)
    basic.pause(500)
    music.rest(500)
    serial.writeLine("Rang 880 Hz, then rested 500 ms.")
})

addTest("music.playMelody - built-in melody", function () {
    music.playMelody(music.builtInMelody(Melodies.Baddy).join(" "), 120)
    serial.writeLine("Playing melody at 120 BPM.")
    basic.pause(3000)
})

addTest("music.tempo - read and change BPM", function () {
    let bpm = music.tempo()
    serial.writeLine("Current BPM: " + bpm)
    music.setTempo(200)
    serial.writeLine("Set BPM to 200.")
    music.playTone(Note.C, music.beat(BeatFraction.Quarter))
    music.setTempo(bpm)
    serial.writeLine("Restored BPM to: " + bpm)
})

addTest("music.changeTempoBy - relative BPM change", function () {
    let bpm = music.tempo()
    music.changeTempoBy(40)
    serial.writeLine("Tempo +40 -> " + music.tempo() + " BPM")
    music.playTone(Note.E, music.beat(BeatFraction.Quarter))
    music.setTempo(bpm)
    serial.writeLine("Restored BPM to: " + bpm)
})

// ---------------------------------------------------------------------------
// CATEGORY: pins
// ---------------------------------------------------------------------------

addCategory("pins")

addTest("pins - digitalWritePin toggle all pins P0-C20 (not C5, C11 (Buttons)) 3x", function () {
    let pinIds = [
        DigitalPin.P0, DigitalPin.P1, DigitalPin.P2, DigitalPin.P3,
        DigitalPin.C4, DigitalPin.C6, DigitalPin.C7,
        DigitalPin.C8, DigitalPin.C9, DigitalPin.C10,
        DigitalPin.C12, DigitalPin.C13, DigitalPin.C14, DigitalPin.C15,
        DigitalPin.C16, DigitalPin.C17, DigitalPin.C18, DigitalPin.P19,
        DigitalPin.P20
    ]
    led.enable(false)
    serial.writeLine("Toggling all pins 5 times...")
    for (let n = 0; n < 5; n++) {
        for (let i = 0; i < pinIds.length; i++) {
            pins.digitalWritePin(pinIds[i], 0)
        }
        basic.pause(500)
        for (let i = 0; i < pinIds.length; i++) {
            pins.digitalWritePin(pinIds[i], 1)
        }
        basic.pause(500)
    }
    
    
    led.enable(true)
    // restore button handlers after overriding with led.enable
    serial.writeLine("Pin toggle done.")
})

addTest("pins - digitalReadPin P0", function () {
    let val = pins.digitalReadPin(DigitalPin.P0)
    serial.writeLine("P0 digital read: " + val + "  (0 or 1)")
})

addTest("pins - analogWritePin all pins P0-C20 (not C5, C11 (Buttons)) (PWM 512 then 0)", function () {
    let awpinIds = [
    DigitalPin.P0, DigitalPin.P1, DigitalPin.P2, DigitalPin.P3,
    ]
    led.enable(false)
    serial.writeLine("analog write 950 on P0-P3 (~95% PWM, should be dim, then off) 5 times...")
    for (let index = 0; index < 5; index++) {
        for (let i = 0; i <= awpinIds.length - 1; i++) {
            pins.analogWritePin(awpinIds[i], 950)
        }
        basic.pause(500)
        for (let j = 0; j <= awpinIds.length - 1; j++) {
            pins.digitalWritePin(awpinIds[j], 1)
        }
        basic.pause(500)
    }
    led.enable(true)
    serial.writeLine("All analog writes done.")


})

addTest("pins - analogReadPin all analog pins", function () {
    let aNames = ["P0", "P1", "P2", "C4", "C10", "C16", "C18"]
    let aIds = [AnalogPin.P0, AnalogPin.P1, AnalogPin.P2, AnalogPin.C4, AnalogPin.C10, AnalogPin.C16, AnalogPin.C18]
    for (let i = 0; i < aIds.length; i++) {
        let val = pins.analogReadPin(aIds[i])
        serial.writeLine(aNames[i] + " analog read: " + val + "  (0-1023)")
    }
})

addTest("pins - servoWritePin P0 (90 deg)", function () {
    pins.servoWritePin(AnalogPin.P0, 90)
    serial.writeLine("P0 servo set to 90 deg")
    basic.pause(1000)
    pins.servoWritePin(AnalogPin.P0, 150)
    serial.writeLine("P0 servo set to 150 deg")
    basic.pause(1000)
})

// ---------------------------------------------------------------------------
// CATEGORY: led
// ---------------------------------------------------------------------------

addCategory("led")

addTest("led.plot / unplot - single pixel", function () {
    basic.clearScreen()
    led.plot(2, 2)
    basic.pause(500)
    serial.writeLine("Center pixel should be ON.")
    basic.pause(500)
    led.unplot(2, 2)
    serial.writeLine("Center pixel should be OFF.")
    basic.pause(300)
})

addTest("led.toggle - toggle pixel", function () {
    basic.clearScreen()
    led.toggle(0, 0)
    basic.pause(500)
    serial.writeLine("Top-left pixel ON.")
    led.toggle(0, 0)
    basic.pause(500)
    serial.writeLine("Top-left pixel OFF.")
})

addTest("led.point - read pixel state", function () {
    basic.clearScreen()
    led.plot(1, 1)
    let on = led.point(1, 1)
    let off = led.point(3, 3)
    serial.writeLine("(1,1) plotted - point returns: " + on + "  (expected true)")
    serial.writeLine("(3,3) empty  - point returns: " + off + "  (expected false)")
    basic.pause(500)
    basic.clearScreen()
})

addTest("led.brightness - set to 100 then 255", function () {
    basic.showIcon(IconNames.Heart)
    led.setBrightness(100)
    serial.writeLine("Brightness 100 - heart dim")
    basic.pause(1000)
    led.setBrightness(255)
    serial.writeLine("Brightness 255 - heart bright")
    basic.pause(1000)
    basic.clearScreen()
})

addTest("led.stopAnimation - stop scrolling text mid-way", function () {
    control.inBackground(function () {
        basic.showString("ABCDEFGHIJ", 80)
    })
    basic.pause(400)
    led.stopAnimation()
    serial.writeLine("Animation stopped mid-scroll.")
    basic.pause(300)
    basic.clearScreen()
})


// ---------------------------------------------------------------------------
// CATEGORY: loops
// ---------------------------------------------------------------------------

addCategory("loops")

addTest("loops - repeat N times (for loop)", function () {
    let sum = 0
    for (let i = 0; i < 5; i++) {
        sum += i
    }
    serial.writeLine("Sum 0..4 = " + sum + "  (expected 10)")
})

addTest("loops - while with condition", function () {
    let n = 1
    while (n < 100) {
        n = n * 2
    }
    serial.writeLine("First power of 2 >= 100: " + n + "  (expected 128)")
})

addTest("loops - break out of loop", function () {
    let found = -1
    for (let i = 0; i < 10; i++) {
        if (i === 6) {
            found = i
            break
        }
    }
    serial.writeLine("Break at i=6, found: " + found + "  (expected 6)")
})

addTest("loops - continue (skip odd numbers)", function () {
    let evens = ""
    for (let i = 0; i < 8; i++) {
        if (i % 2 !== 0) continue
        evens += i + " "
    }
    serial.writeLine("Evens: " + evens + "  (expected 0 2 4 6)")
})

// ---------------------------------------------------------------------------
// CATEGORY: logic
// ---------------------------------------------------------------------------

addCategory("logic")

addTest("logic - AND (&&)", function () {
    let a = true && true
    let b = true && false
    serial.writeLine("true && true = " + a + "  (expected true)")
    serial.writeLine("true && false = " + b + "  (expected false)")
})

addTest("logic - OR (||)", function () {
    let a = false || true
    let b = false || false
    serial.writeLine("false || true = " + a + "  (expected true)")
    serial.writeLine("false || false = " + b + "  (expected false)")
})

addTest("logic - NOT (!)", function () {
    let a = !true
    let b = !false
    serial.writeLine("!true = " + a + "  (expected false)")
    serial.writeLine("!false = " + b + "  (expected true)")
})

addTest("logic - else if chain", function () {
    let score = 72
    let grade = ""
    if (score >= 90) { grade = "A" }
    else if (score >= 80) { grade = "B" }
    else if (score >= 70) { grade = "C" }
    else { grade = "F" }
    serial.writeLine("Score 72 -> grade: " + grade + "  (expected C)")
})

// ---------------------------------------------------------------------------
// CATEGORY: variables
// ---------------------------------------------------------------------------

addCategory("variables")

addTest("variables - number, string, boolean smoke test", function () {
    let n = 42
    let s = "hello"
    let b = true
    serial.writeLine("number: " + n + "  (expected 42)")
    serial.writeLine("string: " + s + "  (expected hello)")
    serial.writeLine("boolean: " + b + "  (expected true)")
})

// ---------------------------------------------------------------------------
// CATEGORY: math
// ---------------------------------------------------------------------------

addCategory("math")

addTest("math - abs / sqrt / round / floor / ceil / min / max / randint / arithmetic", function () {
    serial.writeLine("abs(-7) = " + Math.abs(-7) + "  (expected 7)")
    serial.writeLine("sqrt(144) = " + Math.sqrt(144) + "  (expected 12)")
    serial.writeLine("round(3.6) = " + Math.round(3.6) + "  (expected 4)")
    serial.writeLine("floor(3.9) = " + Math.floor(3.9) + "  (expected 3)")
    serial.writeLine("ceil(3.1) = " + Math.ceil(3.1) + "  (expected 4)")
    serial.writeLine("min(4,9) = " + Math.min(4, 9) + "  (expected 4)")
    serial.writeLine("max(4,9) = " + Math.max(4, 9) + "  (expected 9)")
    serial.writeLine("7+3=" + (7+3) + " 7-3=" + (7-3) + " 7*3=" + (7*3) + " 7/2=" + (7/2) + " 7%3=" + (7%3))
    let allInRange = true
    let nums = ""
    for (let i = 0; i < 10; i++) {
        let r = randint(1, 6)
        nums += r + " "
        if (r < 1 || r > 6) { allInRange = false }
    }
    serial.writeLine("10 rolls: " + nums)
    serial.writeLine("All in range 1-6: " + allInRange + "  (expected true)")
})

// ---------------------------------------------------------------------------
// CATEGORY: motors
// ---------------------------------------------------------------------------


addCategory("motors")

addTest("motors - M0 forward 50% M1 backward 50%", function () {
    serial.writeLine("M0 forward 50%, M1 backward 50%")
    motors.dualMotorPower(Motor.M0, 50)
    motors.dualMotorPower(Motor.M1, -50)
})

addTest("motors - stopMotors stops both", function () {
    serial.writeLine("Stopping both motors.")
    motors.dualMotorPower(Motor.M0_M1, 0)
    serial.writeLine("Both motors should be off now.")
})


addTest("motors - speed ramp up/down M0 and M1", function () {
    serial.writeLine("Ramping M0 and M1: 0 -> 100 -> 0")
    for (let spd = 0; spd <= 100; spd += 20) {
        motors.dualMotorPower(Motor.M0_M1, spd)
        serial.writeLine("Speed: " + spd)
        basic.pause(300)
    }
    for (let spd = 100; spd >= 0; spd -= 20) {
        motors.dualMotorPower(Motor.M0_M1, spd)
        serial.writeLine("Speed: " + spd)
        basic.pause(300)
    }
    motors.dualMotorPower(Motor.M0_M1, 0)
    serial.writeLine("Ramp done.")
})




// ---------------------------------------------------------------------------
// CATEGORY: arrays
// ---------------------------------------------------------------------------

addCategory("arrays")

addTest("arrays - push / pop / indexOf / reverse / splice", function () {
    let arr: number[] = []
    arr.push(10)
    arr.push(20)
    arr.push(30)
    serial.writeLine("Length: " + arr.length + "  (expected 3)")
    serial.writeLine("[0]: " + arr[0] + "  [2]: " + arr[2] + "  (expected 10, 30)")
    let val = arr.pop()
    serial.writeLine("Popped: " + val + "  (expected 30)  length now: " + arr.length + "  (expected 2)")
    let arr2 = [10, 20, 30, 40]
    serial.writeLine("indexOf(30): " + arr2.indexOf(30) + "  (expected 2)")
    serial.writeLine("indexOf(99): " + arr2.indexOf(99) + "  (expected -1)")
    let arr3 = [1, 2, 3, 4]
    arr3.reverse()
    serial.writeLine("Reversed: " + arr3.join(" ") + "  (expected 4 3 2 1)")
    let arr4 = [1, 2, 3, 4, 5]
    arr4.splice(2, 1)
    serial.writeLine("After splice(2,1): " + arr4.join(" ") + "  (expected 1 2 4 5)")
})

// ---------------------------------------------------------------------------
// CATEGORY: text
// ---------------------------------------------------------------------------

addCategory("text")

addTest("text - length / charAt / indexOf / substr / case / split / parseInt", function () {
    let s = "Calliope"
    serial.writeLine("length: " + s.length + "  (expected 8)")
    serial.writeLine("charAt(0): " + s.charAt(0) + "  (expected C)")
    serial.writeLine("charAt(4): " + s.charAt(4) + "  (expected i)")
    let s2 = "Hello World"
    serial.writeLine("indexOf('World'): " + s2.indexOf("World") + "  (expected 6)")
    serial.writeLine("indexOf('xyz'): " + s2.indexOf("xyz") + "  (expected -1)")
    let s3 = "MakeCode"
    serial.writeLine("substr(0,4): " + s3.substr(0, 4) + "  (expected Make)")
    serial.writeLine("slice(4): " + s3.slice(4) + "  (expected Code)")
    serial.writeLine("upper: " + s3.toUpperCase() + "  (expected MAKECODE)")
    serial.writeLine("lower: " + s3.toLowerCase() + "  (expected makecode)")
    let parts = "1,2,3,4".split(",")
    serial.writeLine("split length: " + parts.length + "  (expected 4)")
    serial.writeLine("join('-'): " + parts.join("-") + "  (expected 1-2-3-4)")
    serial.writeLine("parseInt('42'): " + parseInt("42") + "  (expected 42)")
    serial.writeLine("parseFloat('3.14'): " + parseFloat("3.14") + "  (expected 3.14)")
})


// ---------------------------------------------------------------------------
// CATEGORY: serial
// ---------------------------------------------------------------------------

addCategory("serial")

addTest("serial - writeLine / writeNumber / writeValue / writeString", function () {
    serial.writeLine("writeLine: hello")
    serial.writeNumber(42)
    serial.writeLine("")
    serial.writeValue("temperature", input.temperature())
    serial.writeString("writeString: ")
    serial.writeString("A")
    serial.writeString("B")
    serial.writeString("C")
    serial.writeLine("")
    serial.writeLine("Expected last line: writeString: ABC")
})

// ---------------------------------------------------------------------------
// CATEGORY: game
// ---------------------------------------------------------------------------

addCategory("game")

addTest("game - score / life / sprite", function () {
    game.setScore(0)
    game.addScore(5)
    game.addScore(3)
    serial.writeLine("Score: " + game.score() + "  (expected 8)")
    game.setLife(3)
    game.removeLife(1)
    serial.writeLine("Life after removeLife(1): " + game.life() + "  (expected 2)")
    let s = game.createSprite(2, 2)
    s.move(1)
    serial.writeLine("Sprite x after move(1): " + s.get(LedSpriteProperty.X) + "  (expected 3)")
    s.set(LedSpriteProperty.Brightness, 128)
    basic.pause(500)
    s.delete()
    basic.clearScreen()
})

// ---------------------------------------------------------------------------
// CATEGORY: images
// ---------------------------------------------------------------------------

addCategory("images")

addTest("images - create and show image", function () {
    let img = images.createImage(`
        # . # . #
        . # . # .
        # . # . #
        . # . # .
        # . # . #
    `)
    img.showImage(0)
    basic.pause(800)
    basic.clearScreen()
    serial.writeLine("Checkerboard image shown.")
})

addTest("images - createBigImage and scroll", function () {
    let img = images.createBigImage(`
        # # # # # . . . . .
        # . . . # . # # # .
        # # # # # . # . # .
        # . # . . . # # # .
        # . . # . . . . . .
    `)
    img.scrollImage(1, 100)
    basic.pause(1200)
    basic.clearScreen()
    serial.writeLine("Big image scrolled.")
})

addTest("images - image pixel read/write", function () {
    let img = images.createImage(`
        . . . . .
        . . . . .
        . . . . .
        . . . . .
        . . . . .
    `)
    img.setPixelBrightness(2, 2, 255)
    let b = img.pixelBrightness(2, 2)
    serial.writeLine("Pixel (2,2) brightness: " + b + "  (expected 255)")
})


// ---------------------------------------------------------------------------
// Startup banner
// ---------------------------------------------------------------------------

basic.clearScreen()
serial.writeLine("==================================================")
serial.writeLine("  MakeCode Calliope Tester - ready")
serial.writeLine("  " + _testFns.length + " tests loaded in " + _categoryLabels.length + " categories")
serial.writeLine("")
serial.writeLine("  Type a category number + ENTER to jump there,")
serial.writeLine("  or just press ENTER / Button A to begin.")
serial.writeLine("")
for (let ci = 0; ci < _categoryLabels.length; ci++) {
    serial.writeLine("  " + (ci + 1) + ". " + _categoryLabels[ci])
}
serial.writeLine("==================================================")
