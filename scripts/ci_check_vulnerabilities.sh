#!/bin/bash

# workaround for missing feature
# https://github.com/yarnpkg/yarn/issues/6669

set -u

set +e
output=$(yarn audit --json --groups dependencies --level high)
result=$?
set -e

if [ $result -eq 0 ]; then
	# everything is fine
	exit 0
fi

if [ -f yarn-audit-known-issues ] && echo "$output" | grep auditAdvisory | diff -q yarn-audit-known-issues - > /dev/null 2>&1; then
	echo
	echo Ignorning known vulnerabilities
	exit 0
fi

echo
echo Security vulnerabilities were found that were not ignored.
echo See https://github.com/valora-inc/wallet/tree/main/WALLET.md#vulnerabilities-found-in-dependencies
echo
echo "$output" | grep auditAdvisory | jq

exit "$result"