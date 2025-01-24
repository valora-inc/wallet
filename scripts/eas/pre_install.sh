set -e

echo Installing Google Cloud SDK...
curl https://sdk.cloud.google.com > gcloud_install.sh
bash gcloud_install.sh --disable-prompts

echo Adding Google Cloud SDK to PATH...
export PATH="$PATH:$HOME/google-cloud-sdk/bin"
echo PATH is: $PATH

echo Saving PATH for future steps...
set-env PATH "$PATH"

echo Verifying gcloud installation...
gcloud --version

echo Authenticating with Google Cloud...
gcloud auth activate-service-account --key-file="$GOOGLE_CLOUD_SERVICE_ACCOUNT"
