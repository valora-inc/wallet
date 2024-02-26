import { spawn } from 'child_process'
import * as $ from 'shelljs'
import yargs from 'yargs'

$.config.fatal = true

/*
set -x

#ls -l ~/.android/avd # not yet there
avdmanager create avd --force --name Pixel_API_30_AOSP_x86_64 --package "system-images;android-30;default;x86_64" --device pixel
ls -l ~/.android/avd

INI_LOCATION=~/.android/avd/Pixel_API_30_AOSP_x86_64.ini
cat $INI_LOCATION

echo "hw.cpu.ncore=1" >> $INI_LOCATION
echo "hw.ramSize=4096" >> $INI_LOCATION
echo "hw.sdCard=yes" >> $INI_LOCATION
echo "sdcard.size=1000M" >> $INI_LOCATION

cat $INI_LOCATION

emulator -avd Pixel_API_30_AOSP_x86_64 -no-window -gpu swiftshader_indirect -noaudio -no-boot-anim &
echo "Waiting for device to be ready..."
# Source: https://android.stackexchange.com/a/83747
adb wait-for-device
A=$(adb shell getprop sys.boot_completed | tr -d '\r')
while [ "$A" != "1" ]; do
        sleep 2
        A=$(adb shell getprop sys.boot_completed | tr -d '\r')
done
*/

const argv = yargs(process.argv.slice(2))
  .options({
    image: {
      type: 'string',
      demandOption: true,
    },
    emulatorName: {
      type: 'string',
      demandOption: true,
    },
  })
  .parseSync()

const { image, emulatorName } = argv

$.exec(`sdkmanager "${image}"`)
$.exec(`avdmanager create avd --force --name ${emulatorName} --package "${image}" --device pixel`)

const iniLocation = `~/.android/avd/${emulatorName}.ini`
$.echo('hw.cpu.ncore=1').toEnd(iniLocation)
$.echo('hw.ramSize=4096').toEnd(iniLocation)
$.echo('hw.sdCard=yes').toEnd(iniLocation)
$.echo('sdcard.size=1000M').toEnd(iniLocation)

const child = spawn(
  `emulator -avd ${emulatorName} -no-window -gpu swiftshader_indirect -noaudio -no-boot-anim`,
  // { stdio: 'inherit' }
  { shell: true }
)
if (!child) {
  throw new Error('Failed to start the emulator')
}

child.stdout!.on('data', function (data) {
  console.log('Child data: ' + data)
})
child.stderr!.on('data', function (data) {
  console.log(data)
})
child.on('error', function () {
  console.log('Failed to start child.')
})
child.on('close', function (code) {
  console.log('Child process exited with code ' + code)
})
child.stdout!.on('end', function () {
  console.log('Finished collecting data chunks.')
})

$.echo(`Emulator started! ${child.pid}`)

// emuChild.stdout!.on('data', function (data) {
//   console.log(data)
// })
// emuChild.stderr!.on('data', function (data) {
//   console.log(data)
// })

$.echo('Waiting for device to be ready...')
$.exec('adb wait-for-device')
let a = $.exec("adb shell getprop sys.boot_completed | tr -d '\\r'", { silent: true }).stdout
while (a !== '1') {
  $.echo('Waiting for device to be ready...')
  $.exec('sleep 2')
  a = $.exec("adb shell getprop sys.boot_completed | tr -d '\\r'", { silent: true }).stdout
}

/*
# Install test butler
# Download test butler
curl -f -o ~/test-butler-2.2.1.apk https://repo1.maven.org/maven2/com/linkedin/testbutler/test-butler-app/2.2.1/test-butler-app-2.2.1.apk
adb install -r ~/test-butler-2.2.1.apk
echo "Installation compelete! Launching the TestButler background service..."
# Launch the test butler background service!
adb shell am startservice com.linkedin.android.testbutler/com.linkedin.android.testbutler.ButlerService
# Check that service is launched
until [ `adb shell ps | grep butler | wc -l` -gt 0 ]
do
  sleep 3
done

echo "Background service running! Saving snapshot..."
adb emu avd snapshot save ci_boot

echo "Snapshot saved! Killing emulator..."
killall qemu-system-x86_64-headless

# Wait until the emulator is off
until [ `adb devices | grep emulator | wc -l` -gt 0 ]
do
  sleep 3
done
*/

$.exec(
  `curl -f -o ~/test-butler-2.2.1.apk https://repo1.maven.org/maven2/com/linkedin/testbutler/test-butler-app/2.2.1/test-butler-app-2.2.1.apk`
)
$.exec('adb install -r ~/test-butler-2.2.1.apk')
$.echo('Installation complete! Launching the TestButler background service...')
$.exec(
  'adb shell am startservice com.linkedin.android.testbutler/com.linkedin.android.testbutler.ButlerService'
)
// Check that service is launched
$.exec('until [ `adb shell ps | grep butler | wc -l` -gt 0 ]; do sleep 3; done')

$.echo('Background service running! Saving snapshot...')
$.exec('adb emu avd snapshot save ci_boot')
$.echo('Snapshot saved! Killing emulator...')
$.exec('killall qemu-system-x86_64-headless')

// Wait until the emulator is off
$.exec('until [ `adb devices | grep emulator | wc -l` -gt 0 ]; do sleep 3; done')
