#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ Error: .env file not found at $ENV_FILE${NC}"
  exit 1
fi

STRIPE_SECRET_KEY=$(grep "^STRIPE_SECRET_KEY=" "$ENV_FILE" | cut -d '=' -f 2- | tr -d '"' | tr -d "'")

if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo -e "${RED}❌ Error: STRIPE_SECRET_KEY not found in .env${NC}"
  exit 1
fi

echo -e "${BLUE}STRIPE_SECRET_KEY loaded from .env${NC}"

# trying to get domain from ngrok API
DOMAIN=""
echo -e "${YELLOW}Checking for running ngrok...${NC}"

NGROK_RESPONSE=$(curl -s -m 2 http://localhost:4040/api/tunnels 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$NGROK_RESPONSE" ]; then

  # parse ngrok response to find the HTTPS tunnel URL
  DOMAIN=$(echo "$NGROK_RESPONSE" | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d '"' -f 4 | sed 's|https://||')
  
  if [ -n "$DOMAIN" ]; then
    echo -e "${GREEN}✅ Found ngrok domain: ${BLUE}$DOMAIN${NC}"
  fi
fi

if [ -z "$DOMAIN" ]; then
  echo -e "${YELLOW}⚠️  ngrok not detected or no HTTPS tunnel found${NC}"
  echo -e "${YELLOW}Please enter your domain manually:${NC}"
  read -p "Enter domain (e.g., c11c-77-75-145-153.ngrok-free.app): " DOMAIN
  
  if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Error: Domain cannot be empty${NC}"
    exit 1
  fi
fi

echo ""
echo -e "${BLUE}Registering domain with Stripe...${NC}"
echo -e "${BLUE}Domain: ${YELLOW}$DOMAIN${NC}"
echo ""

RESPONSE=$(curl -s -X POST https://api.stripe.com/v1/payment_method_domains \
  -u "$STRIPE_SECRET_KEY": \
  -d "domain_name=$DOMAIN")

if echo "$RESPONSE" | grep -q '"error"'; then
  ERROR_MESSAGE=$(echo "$RESPONSE" | grep -o '"message":"[^"]*' | head -1 | cut -d '"' -f 4)
  echo -e "${RED}❌ Error registering domain: $ERROR_MESSAGE${NC}"
  exit 1
fi

if command -v jq &> /dev/null; then
  DOMAIN_ID=$(echo "$RESPONSE" | jq -r '.id')
  CREATED=$(echo "$RESPONSE" | jq -r '.created')
  ENABLED=$(echo "$RESPONSE" | jq -r '.enabled')
else
  DOMAIN_ID=$(echo "$RESPONSE" | grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*' | head -1 | grep -o '"[^"]*$' | tr -d '"')
  CREATED=$(echo "$RESPONSE" | grep -o '"created"[[:space:]]*:[[:space:]]*[0-9]*' | head -1 | grep -o '[0-9]*$')
  ENABLED=$(echo "$RESPONSE" | grep -o '"enabled"[[:space:]]*:[[:space:]]*[a-z]*' | head -1 | grep -o '[a-z]*$')
fi

if [ -z "$DOMAIN_ID" ]; then
  echo -e "${RED}❌ Failed to parse Stripe response${NC}"
  echo "$RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Domain successfully registered!${NC}"
echo ""
echo -e "  Domain ID:    ${BLUE}$DOMAIN_ID${NC}"
echo -e "  Domain Name:  ${BLUE}$DOMAIN${NC}"
echo -e "  Status:       ${BLUE}$STATUS${NC}"
echo -e "  Created:      ${BLUE}$(date -d @$CREATED 2>/dev/null || echo $CREATED)${NC}"
echo ""
echo -e "${GREEN}Apple Pay and other payment methods are now enabled for $DOMAIN${NC}"