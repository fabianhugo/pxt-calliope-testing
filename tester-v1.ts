/**
 * MakeCode Calliope Mini v1 Tester
 * A / ENTER = next   B = repeat last
 * Categories: basic, input, music, led, motors, pins
 */

let _fns: Array<() => void> = []
let _catStarts: number[] = []
let _catLabels: string[] = []
let _idx = 0
let _busy = false
let _lastCat = -1

function addCat(name: string): void {
    _catStarts.push(_fns.length)
    _catLabels.push(name)
}

function addTest(fn: () => void): void {
    _fns.push(fn)
}

function run(): void {
    if (_busy || _idx >= _fns.length) return
    _busy = true
    let ci = 0
    for (let i = _catStarts.length - 1; i >= 0; i--) {
        if (_idx >= _catStarts[i]) { ci = i; break }
    }
    if (ci !== _lastCat) {
        serial.writeLine(_catLabels[ci])
        _lastCat = ci
    }
    serial.writeLine("#" + (_idx + 1))
    _fns[_idx]()
    _idx++
    _busy = false
}

function rep(): void {
    if (_busy || _idx === 0) return
    _busy = true
    serial.writeLine("REPEAT #" + _idx)
    _fns[_idx - 1]()
    _busy = false
}

input.onButtonPressed(Button.A, function () { run() })
input.onButtonPressed(Button.B, function () { rep() })
serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    serial.readUntil(serial.delimiters(Delimiters.NewLine))
    run()
})

// ---------------------------------------------------------------------------
// CATEGORY: basic
// ---------------------------------------------------------------------------

addCat("basic")

addTest(function () {
    basic.showNumber(42, 70)
})

addTest(function () {
    basic.showString("ABC", 70)
})

addTest(function () {
    basic.showLeds(`
        . # . # .
        . # . # .
        . . . . .
        # . . . #
        . # # # .
    `)
})

addTest(function () {
    basic.showIcon(IconNames.Sad, 70)
    basic.pause(1000)
})

addTest(function () {
    basic.setLedColor(0xff0000)
    basic.pause(500)
    serial.writeLine("setLedColor red")
})

addTest(function () {
    basic.turnRgbLedOff()
    basic.pause(300)
    serial.writeLine("turnRgbLedOff")
})

addTest(function () {
    basic.clearScreen()
    basic.pause(300)
    serial.writeLine("clearScreen")
})

// ---------------------------------------------------------------------------
// CATEGORY: input
// ---------------------------------------------------------------------------

addCat("input")

addTest(function () {
    serial.writeLine("t:" + input.temperature())
})

addTest(function () {
    serial.writeLine("l:" + input.lightLevel())
})

addTest(function () {
    serial.writeLine("hdg:" + input.compassHeading())
})

addTest(function () {
    let x = input.acceleration(Dimension.X)
    let y = input.acceleration(Dimension.Y)
    let z = input.acceleration(Dimension.Z)
    serial.writeLine("X:" + x + " Y:" + y + " Z:" + z)
})

addTest(function () {
    serial.writeLine("str:" + input.acceleration(Dimension.Strength))
})

addTest(function () {
    serial.writeLine("p:" + input.rotation(Rotation.Pitch) + " r:" + input.rotation(Rotation.Roll))
})

addTest(function () {
    let mx = input.magneticForce(Dimension.X)
    let my = input.magneticForce(Dimension.Y)
    let mz = input.magneticForce(Dimension.Z)
    serial.writeLine("mX:" + mx + " mY:" + my + " mZ:" + mz)
})

addTest(function () {
    serial.writeLine("t:" + input.runningTime())
})

addTest(function () {
    serial.writeLine("shake 5s...")
    let detected = false
    input.onGesture(Gesture.Shake, function () {
        detected = true
        serial.writeLine("shook!")
        basic.showIcon(IconNames.Yes)
        basic.pause(500)
        basic.clearScreen()
    })
    basic.pause(5000)
    if (!detected) serial.writeLine("No shake.")
})

// ---------------------------------------------------------------------------
// CATEGORY: music
// ---------------------------------------------------------------------------

addCat("music")

addTest(function () {
    music.playTone(440, 500)
    serial.writeLine("440 Hz 500ms")
})

addTest(function () {
    music.ringTone(880)
    basic.pause(500)
    music.rest(500)
    serial.writeLine("ringTone 880 + rest")
})

addTest(function () {
    music.playMelody(music.builtInMelody(Melodies.Baddy).join(" "), 120)
    basic.pause(3000)
    serial.writeLine("melody Baddy")
})

addTest(function () {
    let bpm = music.tempo()
    serial.writeLine("bpm: " + bpm)
    music.setTempo(200)
    music.playTone(Note.C, music.beat(BeatFraction.Quarter))
    music.changeTempoBy(-40)
    music.playTone(Note.E, music.beat(BeatFraction.Quarter))
    music.setTempo(bpm)
})

// ---------------------------------------------------------------------------
// CATEGORY: led
// ---------------------------------------------------------------------------

addCat("led")

addTest(function () {
    basic.clearScreen()
    led.plot(2, 2)
    basic.pause(500)
    led.unplot(2, 2)
})

addTest(function () {
    basic.clearScreen()
    led.toggle(0, 0)
    basic.pause(500)
    led.toggle(0, 0)
})

addTest(function () {
    basic.clearScreen()
    led.plot(1, 1)
    serial.writeLine("point(1,1)=" + led.point(1, 1) + " point(3,3)=" + led.point(3, 3))
    basic.clearScreen()
})

addTest(function () {
    basic.showIcon(IconNames.Heart)
    led.setBrightness(60)
    basic.pause(800)
    led.setBrightness(255)
    basic.pause(800)
    basic.clearScreen()
    serial.writeLine("brightness ok")
})

// ---------------------------------------------------------------------------
// CATEGORY: motors
// ---------------------------------------------------------------------------

addCat("motors")

addTest(function () {
    motors.dualMotorPower(Motor.M0, 50)
    motors.dualMotorPower(Motor.M1, -50)
    serial.writeLine("M0+ M1-")
})

addTest(function () {
    motors.dualMotorPower(Motor.M0_M1, 0)
    serial.writeLine("stopMotors")
})

addTest(function () {
    for (let spd = 0; spd <= 100; spd += 25) {
        motors.dualMotorPower(Motor.M0_M1, spd)
        serial.writeLine("spd " + spd)
        basic.pause(300)
    }
    for (let spd = 100; spd >= 0; spd -= 25) {
        motors.dualMotorPower(Motor.M0_M1, spd)
        basic.pause(300)
    }
    motors.dualMotorPower(Motor.M0_M1, 0)
    serial.writeLine("ramp done")
})

// ---------------------------------------------------------------------------
// CATEGORY: pins
// ---------------------------------------------------------------------------

addCat("pins")

let pinIds = [
    DigitalPin.P0, DigitalPin.P1, DigitalPin.P2, DigitalPin.P3,
    DigitalPin.C4, DigitalPin.C5, DigitalPin.C6, DigitalPin.C7,
    DigitalPin.C8, DigitalPin.C9, DigitalPin.C10, DigitalPin.C11,
    DigitalPin.C12, DigitalPin.C13, DigitalPin.C14, DigitalPin.C15,
    DigitalPin.C16, DigitalPin.C17, DigitalPin.C18
]
addTest(function () {
    
    
    serial.writeLine("toggle 3x")
    for (let rep = 0; rep < 3; rep++) {
        for (let pi = 0; pi < pinIds.length; pi++) {
            pins.digitalWritePin(pinIds[pi], 0)
        }
        basic.pause(1000)
        for (let pi = 0; pi < pinIds.length; pi++) {
            pins.digitalWritePin(pinIds[pi], 1)
        }
        basic.pause(1000)
    }
})

addTest(function () {
    serial.writeLine("P0 digitalRead: " + pins.digitalReadPin(DigitalPin.P0))
})

addTest(function () {


    for (let i = 0; i < pinIds.length; i++) {
        pins.analogWritePin(pinIds[i], 512)
        basic.pause(150)
        pins.analogWritePin(pinIds[i], 0)
    }
    serial.writeLine("PWM done")
})

addTest(function () {
    let aIds = [AnalogPin.P0, AnalogPin.P1, AnalogPin.P2,
        AnalogPin.C4, AnalogPin.C10, AnalogPin.C16, AnalogPin.C18]
    for (let i = 0; i < aIds.length; i++) {
        serial.writeLine(i + ": " + pins.analogReadPin(aIds[i]))
    }
})

addTest(function () {
    pins.servoWritePin(AnalogPin.P0, 90)
    basic.pause(600)
    pins.analogWritePin(AnalogPin.P0, 0)
    serial.writeLine("sv ok")
})

// ---------------------------------------------------------------------------
// Startup banner
// ---------------------------------------------------------------------------

basic.clearScreen()
serial.writeLine("v1 " + _fns.length + " tests. A=run B=rep")
