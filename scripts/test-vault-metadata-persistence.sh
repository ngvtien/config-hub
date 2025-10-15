#!/bin/bash
# Test script to demonstrate Vault KV2 metadata persistence
# This shows that metadata survives when certificate data is replaced

set -e

echo "🔐 Vault KV2 Metadata Persistence Test"
echo "========================================"
echo ""

# Configuration
SECRET_PATH="kv-v2/test/certs/demo-server"
DATA_PATH="test/certs/demo-server"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "📝 Step 1: Create initial certificate with metadata"
echo "---------------------------------------------------"

# Create initial certificate (Version 1)
vault kv put ${SECRET_PATH} \
  thumbprint="OLD_CERT_ABC123" \
  definition="-----BEGIN CERTIFICATE----- OLD CERT DATA -----END CERTIFICATE-----" \
  password="oldpassword"

echo -e "${GREEN}✓ Created certificate version 1${NC}"
echo ""

# Set metadata (relationships)
vault kv metadata put ${SECRET_PATH} \
  custom_metadata='{
    "cert_type": "server",
    "cert_name": "DemoServerCert",
    "signed_by_path": "kv-v2/test/certs/intermediate-ca",
    "signed_by_key": "intermediate-ca",
    "trusts_path": "kv-v2/test/certs/root-ca",
    "trusts_key": "root-ca",
    "chain_id": "production-chain",
    "owner": "platform-team",
    "created_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'

echo -e "${GREEN}✓ Set metadata with relationships${NC}"
echo ""

# Show initial state
echo "📊 Initial State:"
echo "----------------"
echo -e "${YELLOW}Certificate Data (Version 1):${NC}"
vault kv get -format=json ${SECRET_PATH} | jq -r '.data.data'
echo ""
echo -e "${YELLOW}Metadata (Relationships):${NC}"
vault kv metadata get -format=json ${SECRET_PATH} | jq -r '.data.custom_metadata'
echo ""

read -p "Press Enter to continue to certificate renewal..."
echo ""

echo "🔄 Step 2: Renew certificate (replace data)"
echo "-------------------------------------------"

# Renew certificate (Version 2) - NEW thumbprint and definition
vault kv put ${SECRET_PATH} \
  thumbprint="NEW_CERT_XYZ789" \
  definition="-----BEGIN CERTIFICATE----- NEW CERT DATA (RENEWED) -----END CERTIFICATE-----" \
  password="newpassword"

echo -e "${GREEN}✓ Renewed certificate (created version 2)${NC}"
echo ""

# Show new state
echo "📊 After Renewal:"
echo "----------------"
echo -e "${YELLOW}Certificate Data (Version 2 - Latest):${NC}"
vault kv get -format=json ${SECRET_PATH} | jq -r '.data.data'
echo ""
echo -e "${YELLOW}Metadata (Should still have relationships):${NC}"
vault kv metadata get -format=json ${SECRET_PATH} | jq -r '.data.custom_metadata'
echo ""

# Verify metadata persistence
METADATA_EXISTS=$(vault kv metadata get -format=json ${SECRET_PATH} | jq -r '.data.custom_metadata.signed_by_path')

if [ "$METADATA_EXISTS" != "null" ] && [ "$METADATA_EXISTS" != "" ]; then
  echo -e "${GREEN}✅ SUCCESS: Metadata (relationships) PERSISTED after certificate renewal!${NC}"
else
  echo -e "${RED}❌ FAILED: Metadata was lost!${NC}"
  exit 1
fi
echo ""

read -p "Press Enter to continue to version comparison..."
echo ""

echo "📜 Step 3: Compare versions"
echo "---------------------------"

echo -e "${YELLOW}Version 1 (Old Certificate):${NC}"
vault kv get -version=1 -format=json ${SECRET_PATH} | jq -r '.data.data'
echo ""

echo -e "${YELLOW}Version 2 (New Certificate):${NC}"
vault kv get -version=2 -format=json ${SECRET_PATH} | jq -r '.data.data'
echo ""

echo -e "${YELLOW}Metadata (Same for both versions):${NC}"
vault kv metadata get -format=json ${SECRET_PATH} | jq -r '.data.custom_metadata'
echo ""

echo -e "${GREEN}✅ Both versions share the same metadata!${NC}"
echo ""

read -p "Press Enter to continue to soft delete test..."
echo ""

echo "🗑️  Step 4: Test soft delete"
echo "----------------------------"

# Soft delete latest version
vault kv delete ${SECRET_PATH}
echo -e "${GREEN}✓ Soft deleted version 2${NC}"
echo ""

echo -e "${YELLOW}Metadata after soft delete:${NC}"
vault kv metadata get -format=json ${SECRET_PATH} | jq -r '.data.custom_metadata'
echo ""

METADATA_AFTER_DELETE=$(vault kv metadata get -format=json ${SECRET_PATH} | jq -r '.data.custom_metadata.signed_by_path')

if [ "$METADATA_AFTER_DELETE" != "null" ] && [ "$METADATA_AFTER_DELETE" != "" ]; then
  echo -e "${GREEN}✅ SUCCESS: Metadata SURVIVED soft delete!${NC}"
else
  echo -e "${RED}❌ FAILED: Metadata was lost!${NC}"
  exit 1
fi
echo ""

# Undelete
vault kv undelete -versions=2 ${SECRET_PATH}
echo -e "${GREEN}✓ Undeleted version 2${NC}"
echo ""

read -p "Press Enter to clean up..."
echo ""

echo "🧹 Step 5: Cleanup"
echo "-----------------"

# Hard delete (destroys everything)
vault kv metadata delete ${SECRET_PATH}
echo -e "${GREEN}✓ Cleaned up test data${NC}"
echo ""

echo "🎉 Test Complete!"
echo "================="
echo ""
echo "Summary:"
echo "--------"
echo "✅ Metadata persists when certificate data is replaced (renewed)"
echo "✅ Metadata persists across multiple versions"
echo "✅ Metadata survives soft delete"
echo "✅ Relationships are NOT lost during certificate renewal"
echo ""
echo "⚠️  Only 'vault kv metadata delete' destroys metadata"
echo ""
