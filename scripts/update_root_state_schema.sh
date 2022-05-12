#!/usr/bin/env bash
set -euo pipefail

# ========================================
# Generate the root state schema from the RootState TS type
# ========================================

root_state_schema="test/RootStateSchema.json"

typescript-json-schema ./tsconfig.json RootState --include src/redux/reducers.ts --ignoreErrors --required --noExtraProps > "$root_state_schema"

if git diff --exit-code "$root_state_schema"; then
  echo "$root_state_schema is up to date"
  exit 0
fi

echo -e "$root_state_schema has been updated. Please review the changes, add the necessary redux migration and commit the changes.\nSee https://github.com/valora-inc/wallet/tree/main/WALLET.md#redux-state-migration"
