#!/bin/bash

# Configure and run the agent
./config.sh --unattended \
  --url "$ADO_ORG_URL" \
  --auth pat \
  --token "$AZP_TOKEN" \
  --pool "$AZP_POOL" \
  --agent "$AZP_AGENT_NAME" \
  --replace \
  --acceptTeeEula \
  --work "_work"

# Run the agent
./run.sh