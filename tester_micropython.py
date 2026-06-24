"""
Calliope / micro:bit MicroPython tester
======================================

Advances through small smoke tests one by one.

Controls:
  A   = next test
  B   = repeat current test
  A+B = skip to next category

This script targets MicroPython boards that expose microbit-style APIs such as
display, buttons, accelerometer, compass, music, pins, and print output.
"""

from calliopemini import *
import music


TESTS = []
TEST_NAMES = []
TEST_CATEGORIES = []
CATEGORY_STARTS = []
CATEGORY_LABELS = []
CURRENT_CATEGORY = ""

TEST_INDEX = 0
RUNNING = False


def add_category(name):
    global CURRENT_CATEGORY
    CURRENT_CATEGORY = name
    CATEGORY_STARTS.append(len(TESTS))
    CATEGORY_LABELS.append(name)


def add_test(name, fn):
    TEST_NAMES.append(name)
    TESTS.append(fn)
    TEST_CATEGORIES.append(CURRENT_CATEGORY)


def separator():
    print("-" * 50)


def clear_screen():
    try:
        display.clear()
    except Exception:
        pass


def show_ok():
    try:
        display.show(Image.YES)
    except Exception:
        pass


def advance():
    global TEST_INDEX, RUNNING
    if RUNNING:
        return
    if TEST_INDEX >= len(TESTS):
        print("=== All tests finished. Reset to restart. ===")
        show_ok()
        return

    RUNNING = True
    separator()
    print(
        "Test {}/{} [{}] {}".format(
            TEST_INDEX + 1,
            len(TESTS),
            TEST_CATEGORIES[TEST_INDEX],
            TEST_NAMES[TEST_INDEX],
        )
    )
    print("Running...")

    TESTS[TEST_INDEX]()
    TEST_INDEX += 1

    if TEST_INDEX < len(TESTS):
        print("Done. A=next, B=repeat, A+B=skip category.")
    else:
        print("Last test done!")
        print("=== All tests finished. Reset to restart. ===")
        show_ok()

    RUNNING = False


def repeat():
    global RUNNING
    if RUNNING or TEST_INDEX == 0:
        return

    RUNNING = True
    i = TEST_INDEX - 1
    separator()
    print(
        "REPEAT Test {}/{} [{}] {}".format(
            i + 1,
            len(TESTS),
            TEST_CATEGORIES[i],
            TEST_NAMES[i],
        )
    )
    print("Running...")
    TESTS[i]()
    print("Done. A=next, B=repeat, A+B=skip category.")
    RUNNING = False


def skip_category():
    global TEST_INDEX, RUNNING
    if RUNNING or TEST_INDEX >= len(TESTS):
        return

    current_cat = TEST_CATEGORIES[TEST_INDEX]
    next_index = TEST_INDEX + 1
    while next_index < len(TESTS) and TEST_CATEGORIES[next_index] == current_cat:
        next_index += 1

    if next_index >= len(TESTS):
        print("Already in the last category.")
        return

    TEST_INDEX = next_index
    separator()
    print(">> Skipped to category: {}".format(TEST_CATEGORIES[TEST_INDEX]))
    print("A=run, B=repeat, A+B=skip again.")


def wait_for_buttons():
    while True:
        a_pressed = button_a.is_pressed()
        b_pressed = button_b.is_pressed()

        if a_pressed and b_pressed:
            sleep(120)
            if button_a.is_pressed() and button_b.is_pressed():
                skip_category()
                while button_a.is_pressed() or button_b.is_pressed():
                    sleep(5)
                return
        elif a_pressed:
            sleep(120)
            if button_a.is_pressed() and not button_b.is_pressed():
                advance()
                while button_a.is_pressed() or button_b.is_pressed():
                    sleep(5)
                return
        elif b_pressed:
            sleep(120)
            if button_b.is_pressed() and not button_a.is_pressed():
                repeat()
                while button_a.is_pressed() or button_b.is_pressed():
                    sleep(5)
                return

        sleep(5)


def safe_pause(ms):
    sleep(ms)


# ---------------------------------------------------------------------------
# CATEGORY: basic
# ---------------------------------------------------------------------------

add_category("basic")


def test_basic_show_number():
    display.scroll("42")


add_test("basic.show_number(42)", test_basic_show_number)


def test_basic_show_string():
    display.scroll("ABC")


add_test("basic.show_string('ABC')", test_basic_show_string)


def test_basic_show_icon():
    display.show(Image.HAPPY)
    safe_pause(800)


add_test("display.show(Image.HAPPY)", test_basic_show_icon)


def test_basic_clear_screen():
    clear_screen()
    print("Screen should be blank now.")


add_test("display.clear()", test_basic_clear_screen)


# ---------------------------------------------------------------------------
# CATEGORY: input
# ---------------------------------------------------------------------------

add_category("input")


def test_temperature():
    print("Temperature: {} C".format(temperature()))


add_test("temperature()", test_temperature)


def test_light_level():
    print("Light level: {}".format(display.read_light_level()))


add_test("display.read_light_level()", test_light_level)


def test_compass_heading():
    try:
        compass.calibrate()
        print("Compass heading: {}".format(compass.heading()))
    except Exception as exc:
        print("Compass unavailable: {}".format(exc))


add_test("compass.heading()", test_compass_heading)


def test_acceleration_xyz():
    print(
        "Accel x:{} y:{} z:{}".format(
            accelerometer.get_x(),
            accelerometer.get_y(),
            accelerometer.get_z(),
        )
    )


add_test("accelerometer.get_x/get_y/get_z", test_acceleration_xyz)


def test_running_time():
    print("Running time: {} ms".format(running_time()))


add_test("running_time()", test_running_time)


def test_shake_gesture():
    print("Shake the board now (5 s)...")
    detected = False
    start = running_time()
    while running_time() - start < 5000:
        try:
            if accelerometer.current_gesture() == "shake":
                detected = True
                break
        except Exception:
            break
        safe_pause(50)

    if detected:
        print("Shake detected!")
        display.show(Image.YES)
        safe_pause(500)
        clear_screen()
    else:
        print("No shake detected within 5 s.")


add_test("shake gesture", test_shake_gesture)


# ---------------------------------------------------------------------------
# CATEGORY: music
# ---------------------------------------------------------------------------

add_category("music")


def test_music_tone():
    music.pitch(440, 500)
    print("Played 440 Hz for 500 ms.")


add_test("music.pitch(440, 500)", test_music_tone)


def test_music_builtin_melody():
    try:
        music.play(music.BA_DING)
        print("Played built-in BA_DING melody.")
    except Exception as exc:
        print("Music melody unavailable: {}".format(exc))


add_test("music.play(music.BA_DING)", test_music_builtin_melody)


# ---------------------------------------------------------------------------
# CATEGORY: led
# ---------------------------------------------------------------------------

add_category("led")


def test_led_plot_unplot():
    clear_screen()
    display.set_pixel(2, 2, 9)
    safe_pause(500)
    display.set_pixel(2, 2, 0)


add_test("display.set_pixel plot/unplot", test_led_plot_unplot)


def test_led_get_pixel():
    clear_screen()
    display.set_pixel(1, 1, 9)
    print("(1,1) brightness: {}".format(display.get_pixel(1, 1)))
    print("(3,3) brightness: {}".format(display.get_pixel(3, 3)))
    clear_screen()


add_test("display.get_pixel()", test_led_get_pixel)


def test_led_scroll_stop():
    display.scroll("ABCDEFGHIJ", delay=80, wait=False)
    safe_pause(400)
    clear_screen()
    print("Animation stopped mid-scroll.")


add_test("display.scroll stop", test_led_scroll_stop)


# ---------------------------------------------------------------------------
# CATEGORY: pins
# ---------------------------------------------------------------------------

add_category("pins")


def test_pin_digital_write():
    pins = [pin0, pin1, pin2, pin3]
    print("Toggling P0-P3.")
    for _ in range(3):
        for pin in pins:
            pin.write_digital(0)
        safe_pause(300)
        for pin in pins:
            pin.write_digital(1)
        safe_pause(300)
    print("Pin toggle done.")


add_test("pin.write_digital()", test_pin_digital_write)


def test_pin_digital_read():
    print("P0 digital read: {}".format(pin0.read_digital()))


add_test("pin0.read_digital()", test_pin_digital_read)


def test_pin_analog_write():
    print("Analog write P0-P3.")
    for _ in range(3):
        for pin in [pin0, pin1, pin2, pin3]:
            pin.write_analog(950)
        safe_pause(300)
        for pin in [pin0, pin1, pin2, pin3]:
            pin.write_digital(0)
        safe_pause(300)


add_test("pin.write_analog()", test_pin_analog_write)


def test_pin_analog_read():
    print("P0 analog read: {}".format(pin0.read_analog()))
    print("P1 analog read: {}".format(pin1.read_analog()))
    print("P2 analog read: {}".format(pin2.read_analog()))


add_test("pin.read_analog()", test_pin_analog_read)


# ---------------------------------------------------------------------------
# CATEGORY: loops
# ---------------------------------------------------------------------------

add_category("loops")


def test_for_loop():
    total = 0
    for i in range(5):
        total += i
    print("Sum 0..4 = {} (expected 10)".format(total))


add_test("for loop", test_for_loop)


def test_while_loop():
    value = 1
    while value < 100:
        value *= 2
    print("First power of 2 >= 100: {} (expected 128)".format(value))


add_test("while loop", test_while_loop)


def test_break_loop():
    found = -1
    for i in range(10):
        if i == 6:
            found = i
            break
    print("Break at i=6, found: {} (expected 6)".format(found))


add_test("break", test_break_loop)


def test_continue_loop():
    evens = []
    for i in range(8):
        if i % 2 != 0:
            continue
        evens.append(str(i))
    print("Evens: {} (expected 0 2 4 6)".format(" ".join(evens)))


add_test("continue", test_continue_loop)


# ---------------------------------------------------------------------------
# CATEGORY: logic
# ---------------------------------------------------------------------------

add_category("logic")


def test_and_operator():
    print("true and true = {} (expected True)".format(True and True))
    print("true and false = {} (expected False)".format(True and False))


add_test("AND", test_and_operator)


def test_or_operator():
    print("false or true = {} (expected True)".format(False or True))
    print("false or false = {} (expected False)".format(False or False))


add_test("OR", test_or_operator)


def test_not_operator():
    print("not true = {} (expected False)".format(not True))
    print("not false = {} (expected True)".format(not False))


add_test("NOT", test_not_operator)


def test_else_if_chain():
    score = 72
    if score >= 90:
        grade = "A"
    elif score >= 80:
        grade = "B"
    elif score >= 70:
        grade = "C"
    else:
        grade = "F"
    print("Score 72 -> grade: {} (expected C)".format(grade))


add_test("else if chain", test_else_if_chain)


# ---------------------------------------------------------------------------
# CATEGORY: variables
# ---------------------------------------------------------------------------

add_category("variables")


def test_variables_smoke():
    number_value = 42
    string_value = "hello"
    boolean_value = True
    print("number: {} (expected 42)".format(number_value))
    print("string: {} (expected hello)".format(string_value))
    print("boolean: {} (expected True)".format(boolean_value))


add_test("number / string / boolean smoke test", test_variables_smoke)


# ---------------------------------------------------------------------------
# CATEGORY: math
# ---------------------------------------------------------------------------

add_category("math")


def test_math_ops():
    print("abs(-7) = {} (expected 7)".format(abs(-7)))
    print("sqrt(144) = {} (expected 12)".format(int(144 ** 0.5)))
    print("round(3.6) = {} (expected 4)".format(round(3.6)))
    print("floor(3.9) = {} (expected 3)".format(int(3.9)))
    print("ceil(3.1) = {} (expected 4)".format(int(-(-3.1 // 1))))
    print("min(4, 9) = {} (expected 4)".format(min(4, 9)))
    print("max(4, 9) = {} (expected 9)".format(max(4, 9)))
    print("7+3={} 7-3={} 7*3={} 7/2={} 7%3={}".format(7 + 3, 7 - 3, 7 * 3, 7 / 2, 7 % 3))
    all_in_range = True
    nums = []
    for _ in range(10):
        value = random(1, 6)
        nums.append(str(value))
        if value < 1 or value > 6:
            all_in_range = False
    print("10 rolls: {}".format(" ".join(nums)))
    print("All in range 1-6: {} (expected True)".format(all_in_range))


add_test("math ops / random", test_math_ops)


# ---------------------------------------------------------------------------
# CATEGORY: arrays
# ---------------------------------------------------------------------------

add_category("arrays")


def test_arrays():
    arr = []
    arr.append(10)
    arr.append(20)
    arr.append(30)
    print("Length: {} (expected 3)".format(len(arr)))
    print("[0]: {} [2]: {} (expected 10, 30)".format(arr[0], arr[2]))
    popped = arr.pop()
    print("Popped: {} (expected 30) length now: {} (expected 2)".format(popped, len(arr)))
    arr2 = [10, 20, 30, 40]
    print("indexOf(30): {} (expected 2)".format(arr2.index(30)))
    print("indexOf(99): {} (expected -1)".format(arr2.index(99) if 99 in arr2 else -1))
    arr3 = [1, 2, 3, 4]
    arr3.reverse()
    print("Reversed: {} (expected 4 3 2 1)".format(" ".join([str(x) for x in arr3])))
    arr4 = [1, 2, 3, 4, 5]
    del arr4[2]
    print("After delete index 2: {} (expected 1 2 4 5)".format(" ".join([str(x) for x in arr4])))


add_test("push / pop / indexOf / reverse / splice-like", test_arrays)


# ---------------------------------------------------------------------------
# CATEGORY: text
# ---------------------------------------------------------------------------

add_category("text")


def test_text():
    s = "Calliope"
    print("length: {} (expected 8)".format(len(s)))
    print("charAt(0): {} (expected C)".format(s[0]))
    print("charAt(4): {} (expected i)".format(s[4]))
    s2 = "Hello World"
    print("indexOf('World'): {} (expected 6)".format(s2.find("World")))
    print("indexOf('xyz'): {} (expected -1)".format(s2.find("xyz")))
    s3 = "MakeCode"
    print("slice(0,4): {} (expected Make)".format(s3[0:4]))
    print("slice(4): {} (expected Code)".format(s3[4:]))
    print("upper: {} (expected MAKECODE)".format(s3.upper()))
    print("lower: {} (expected makecode)".format(s3.lower()))
    parts = "1,2,3,4".split(",")
    print("split length: {} (expected 4)".format(len(parts)))
    print("join('-'): {} (expected 1-2-3-4)".format("-".join(parts)))
    print("int('42'): {} (expected 42)".format(int("42")))
    print("float('3.14'): {} (expected 3.14)".format(float("3.14")))


add_test("string ops", test_text)


# ---------------------------------------------------------------------------
# CATEGORY: serial
# ---------------------------------------------------------------------------

add_category("serial")


def test_serial():
    print("writeLine: hello")
    print("temperature: {}".format(temperature()))
    print("writeString: ABC")


add_test("print / serial output", test_serial)


# ---------------------------------------------------------------------------
# CATEGORY: images
# ---------------------------------------------------------------------------

add_category("images")


def test_images():
    img = Image("""
    #.#.#
    .#.#.
    #.#.#
    .#.#.
    #.#.#
    """)
    display.show(img)
    safe_pause(800)
    clear_screen()
    print("Checkerboard image shown.")


add_test("Image(...) + display.show", test_images)


def test_big_image_scroll():
    img = Image("""
    # # # # # . . . . .
    # . . . # . # # # .
    # # # # # . # . # .
    # . # . . . # # # .
    # . . # . . . . . .
    """)
    display.scroll(img, delay=100)
    clear_screen()
    print("Big image scrolled.")


add_test("Image scroll", test_big_image_scroll)


def test_image_pixel_read_write():
    img = Image(5, 5)
    img.set_pixel(2, 2, 9)
    print("Pixel (2,2) brightness: {} (expected 9)".format(img.get_pixel(2, 2)))


add_test("image pixel read/write", test_image_pixel_read_write)


# ---------------------------------------------------------------------------
# Startup banner
# ---------------------------------------------------------------------------

clear_screen()
print("==================================================")
print("  Calliope / micro:bit MicroPython Tester - ready")
print("  {} tests loaded in {} categories".format(len(TESTS), len(CATEGORY_LABELS)))
print("")
print("  Press A for next test, B to repeat, A+B to skip category.")
print("")
for index in range(len(CATEGORY_LABELS)):
    print("  {}. {}".format(index + 1, CATEGORY_LABELS[index]))
print("==================================================")

while True:
    wait_for_buttons()
