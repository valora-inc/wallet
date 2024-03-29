#!/usr/bin/env bash

set -euo pipefail

if ! [ -x "$(command -v jq)" ]; then
  echo "Error: jq is not installed." >&2
  exit 1
fi

cd "$(dirname "${BASH_SOURCE[0]}")"

filter='paths | join(".") | [(input_filename | gsub(".*/|\\.json$";"")), .] | join("/")'

en_keys=$(jq -r "$filter" ../base/base/*.json | sort)
de_keys=$(jq -r "$filter" ../base/de/*.json | sort)
es_keys=$(jq -r "$filter" ../locales/es-419/*.json | sort)
pt_keys=$(jq -r "$filter" ../locales/pt-BR/*.json | sort)

diff -u <(echo "$en_keys") <(echo "$es_keys")
diff -u <(echo "$en_keys") <(echo "$pt_keys")
