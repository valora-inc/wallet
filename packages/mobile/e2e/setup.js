beforeAll(async () => {
  await device.launchApp({
    permissions: { notifications: 'YES', contacts: 'YES' },
  })
})
