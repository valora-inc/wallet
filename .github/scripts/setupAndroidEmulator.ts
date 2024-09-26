import { spawn } from 'child_process'
import * as $ from 'shelljs'
import yargs from 'yargs'

$.config.fatal = true

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

$.exec(`sdkmanager "${image}" "emulator"`)
$.exec(`avdmanager create avd --force --name ${emulatorName} --package "${image}" --device pixel`)

const iniLocation = `~/.android/avd/${emulatorName}.ini`
$.echo('hw.cpu.ncore=1').toEnd(iniLocation)
$.echo('hw.ramSize=4096').toEnd(iniLocation)
$.echo('hw.sdCard=yes').toEnd(iniLocation)
$.echo('sdcard.size=1000M').toEnd(iniLocation)

const child = spawn(
  `emulator -avd ${emulatorName} -no-window -gpu swiftshader_indirect -noaudio -no-boot-anim -writable-system`,
  { detached: true, stdio: 'inherit', shell: true }
)

$.echo(`Emulator started, pid: ${child.pid}`)

$.echo('Waiting for device to be ready...')
$.exec('adb wait-for-device')
while ($.exec('adb shell getprop sys.boot_completed', { silent: true }).stdout.trim() !== '1') {
  $.echo('Waiting for device to be ready...')
  $.exec('sleep 2')
}

$.exec(
  `curl -f -o ~/test-butler-2.2.1.apk https://repo1.maven.org/maven2/com/linkedin/testbutler/test-butler-app/2.2.1/test-butler-app-2.2.1.apk`
)
$.exec('adb install -r ~/test-butler-2.2.1.apk')
$.echo('Installation complete! Launching the TestButler background service...')
$.exec(
  'adb shell am startservice com.linkedin.android.testbutler/com.linkedin.android.testbutler.ButlerService'
)
// Check the service is launched
$.exec('until [ `adb shell ps | grep butler | wc -l` -gt 0 ]; do sleep 3; done')
$.echo('Background service running!')

// Update root CA certificates
$.echo('Updating root CA cerificates...')
$.exec(
  'wget -O android-ca.tar.gz https://android.googlesource.com/platform/system/ca-certificates/+archive/refs/heads/main/files.tar.gz'
)
$.exec('mkdir cacerts')
$.exec('tar -xzvf android-ca.tar.gz -C cacerts/')
$.exec('adb root')
$.exec('adb remount')
$.exec('adb push ~/.android/cacerts /system/etc/security/cacerts')

$.echo('Saving snapshot...')
$.exec('adb emu avd snapshot save ci_boot')
$.echo('Snapshot saved! Killing emulator...')
child.kill()

// Wait until the emulator is off
$.exec('until [ `adb devices | grep emulator | wc -l` -gt 0 ]; do sleep 3; done')
