import fetch from 'node-fetch'

export async function callCloudFunction(functionName: string, data: {} = {}) {
  // Not sure how to contruct this url properly. Followed what was written here: https://stackoverflow.com/questions/42784000/calling-a-cloud-function-from-another-cloud-function
  // let url = `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/${functionName}`
  // Uncomment to test locally
  let url = `http://localhost:5000/${process.env.GCLOUD_PROJECT}/us-central1/${functionName}`

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}
